<?php
/**
 * Class for reCAPTCHA integration.
 *
 * @package Newspack
 */

namespace Newspack;

use Error;

defined( 'ABSPATH' ) || exit;

/**
 * Class for reCAPTCHA integration.
 */
final class Recaptcha {
	const SCRIPT_HANDLE      = 'newspack-recaptcha';
	const SCRIPT_HANDLE_API  = 'newspack-recaptcha-api';
	const OPTIONS_PREFIX     = 'newspack_recaptcha_';
	const SUPPORTED_VERSIONS = [ 'v3', 'v2_invisible' ]; // Note: add 'v2_checkbox' here and in the Connections UI to add support for the Checkbox flavor of reCAPTCHA v2.

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'register_scripts' ] );
		\add_action( 'newspack_newsletters_subscribe_block_before_email_field', [ __CLASS__, 'render_recaptcha_v2_container' ] );

		// Add reCAPTCHA to the Woo checkout form.
		\add_action( 'woocommerce_review_order_before_submit', [ __CLASS__, 'add_recaptcha_v2_to_checkout' ] );
		\add_action( 'woocommerce_checkout_after_customer_details', [ __CLASS__, 'add_recaptcha_v3_to_checkout' ] );

		// Verify reCAPTCHA on checkout submission.
		\add_action( 'woocommerce_checkout_process', [ __CLASS__, 'verify_recaptcha_on_checkout' ] );
	}

	/**
	 * Register API endpoints.
	 */
	public static function register_api_endpoints() {
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/recaptcha',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_settings' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/recaptcha',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_settings' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'use_captcha' => [
						'required'          => false,
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
					'site_key'    => [
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					],
					'site_secret' => [
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					],
					'version'     => [
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					],
					'threshold'   => [
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
	}

	/**
	 * Get the reCAPTCHA script URL.
	 *
	 * @return string
	 */
	public static function get_script_url() {
		$base_url = 'https://www.google.com/recaptcha/api.js';
		if ( self::can_use_captcha( 'v2' ) ) {
			return \add_query_arg(
				[
					'render' => 'explicit',
				],
				$base_url
			);
		}
		if ( self::can_use_captcha( 'v3' ) ) {
			return \add_query_arg(
				[ 'render' => self::get_site_key() ],
				$base_url
			);
		}
		return '';
	}

	/**
	 * Register the reCAPTCHA script.
	 */
	public static function register_scripts() {
		// Styles only apply to the visible v2 widgets.
		if ( self::can_use_captcha( 'v2' ) ) {
			\wp_enqueue_style(
				self::SCRIPT_HANDLE,
				Newspack::plugin_url() . '/dist/other-scripts/recaptcha.css',
				[],
				NEWSPACK_PLUGIN_VERSION
			);
		}

		if ( self::can_use_captcha() ) {
			// Enqueue the reCAPTCHA API from Google's servers.
			// Note: version arg Must be null to avoid the &ver param being read as part of the reCAPTCHA site key.
			\wp_register_script(
				self::SCRIPT_HANDLE_API,
				\esc_url( self::get_script_url() ), // The Google API script.
				[],
				null, // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
				false
			);
			\wp_script_add_data( self::SCRIPT_HANDLE_API, 'async', true );
			\wp_script_add_data( self::SCRIPT_HANDLE_API, 'defer', true );

			\wp_enqueue_script(
				self::SCRIPT_HANDLE,
				Newspack::plugin_url() . '/dist/other-scripts/recaptcha.js',
				[ self::SCRIPT_HANDLE_API ],
				NEWSPACK_PLUGIN_VERSION,
				true
			);
			\wp_script_add_data( self::SCRIPT_HANDLE, 'async', true );
			\wp_script_add_data( self::SCRIPT_HANDLE, 'defer', true );

			\wp_localize_script(
				self::SCRIPT_HANDLE,
				'newspack_recaptcha_data',
				[
					'site_key' => self::get_site_key(),
					'version'  => self::get_setting( 'version' ),
					'api_url'  => \esc_url( self::get_script_url() ), // The Google API script.
				]
			);
		}
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @return bool|WP_Error
	 */
	public static function api_permissions_check() {
		if ( ! \current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				\esc_html__( 'You cannot use this resource.', 'newspack' ),
				[
					'status' => 403,
				]
			);
		}
		return true;
	}

	/**
	 * Get global reCAPTCHA settings and default values.
	 *
	 * @return mixed[] Global reCAPTCHA default values keyed by option name.
	 */
	public static function get_settings_config() {
		return [
			'use_captcha' => false,
			'site_key'    => '',
			'site_secret' => '',
			'threshold'   => 0.5,
			'version'     => 'v3',
		];
	}

	/**
	 * Get settings via REST API.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_get_settings() {
		return \rest_ensure_response( self::get_settings() );
	}

	/**
	 * Update settings via API.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response containing the settings list.
	 */
	public static function api_update_settings( $request ) {
		return \rest_ensure_response( self::update_settings( $request->get_params() ) );
	}

	/**
	 * Get all reCAPTCHA settings.
	 *
	 * @return mixed[] Global reCAPTCHA settings keyed by option name.
	 */
	public static function get_settings() {
		$config   = self::get_settings_config();
		$settings = [];
		foreach ( $config as $key => $default_value ) {
			$settings[ $key ] = self::get_setting( $key );
		}

		// Migrate reCAPTCHA settings from Stripe wizard, for more generalized usage.
		if ( ! $settings['use_captcha'] && empty( $settings['site_key'] ) && empty( $settings['site_secret'] ) ) {
			$stripe_settings = Stripe_Connection::get_stripe_data();
			if ( ! empty( $stripe_settings['useCaptcha'] ) && ! empty( $stripe_settings['captchaSiteKey'] ) && ! empty( $stripe_settings['captchaSiteSecret'] ) ) {
				// If we have all of the required settings in Stripe settings, migrate them here.
				self::update_settings(
					[
						'use_captcha' => $stripe_settings['useCaptcha'],
						'site_key'    => $stripe_settings['captchaSiteKey'],
						'site_secret' => $stripe_settings['captchaSiteSecret'],
					]
				);

				$settings['use_captcha'] = $stripe_settings['useCaptcha'];
				$settings['site_key']    = $stripe_settings['captchaSiteKey'];
				$settings['site_secret'] = $stripe_settings['captchaSiteSecret'];
			}
		}

		return $settings;
	}

	/**
	 * Get the value for a given setting key.
	 *
	 * @param string $key Setting key.
	 *
	 * @return mixed Setting value.
	 */
	public static function get_setting( $key ) {
		$config = self::get_settings_config();
		if ( ! isset( $config[ $key ] ) ) {
			return null;
		}
		$value = \get_option( self::OPTIONS_PREFIX . $key, $config[ $key ] );

		// Use default value type for casting bool option value.
		if ( is_bool( $config[ $key ] ) ) {
			$value = (bool) $value;
		} elseif ( empty( $value ) ) {
			// If the stored value is empty, use the default value.
			$value = $config[ $key ];
		}

		return $value;
	}

	/**
	 * Get the reCAPTCHA site key.
	 */
	public static function get_site_key() {
		return self::get_setting( 'site_key' );
	}

	/**
	 * Get the reCAPTCHA site secret.
	 */
	public static function get_site_secret() {
		return self::get_setting( 'site_secret' );
	}

	/**
	 * Update settings values.
	 *
	 * @param mixed[] $settings Setting values to update, keyed by option name.
	 *
	 * @return mixed[] Updated settings, or WP_Error.
	 */
	public static function update_settings( $settings ) {
		// Avoid notoptions cache issue.
		wp_cache_delete( 'notoptions', 'options' );
		wp_cache_delete( 'alloptions', 'options' );

		foreach ( $settings as $key => $value ) {
			if ( in_array( $key, array_keys( self::get_settings_config() ), true ) ) {
				\update_option( self::OPTIONS_PREFIX . $key, $value );
			}
		}

		return self::get_settings();
	}

	/**
	 * Check whether reCaptcha is enabled and that we have all required settings.
	 *
	 * @param string $version If specified, check whether the given version of reCaptcha is enabled.
	 *
	 * @return boolean True if we can use reCaptcha to secure checkout requests.
	 */
	public static function can_use_captcha( $version = null ) {
		$settings = self::get_settings();
		if ( empty( $settings['use_captcha'] ) ) {
			return false;
		}

		if (
			$version &&
			(
				( 'v3' === $version && $version !== $settings['version'] ) ||
				( 'v2' === $version && $version !== substr( $settings['version'], 0, 2 ) )
			)
		) {
			return false;
		}

		if ( empty( self::get_site_key() ) || empty( self::get_site_secret() ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Verify a REST API request using reCAPTCHA.
	 * Should work for all versions of reCAPTCHA.
	 *
	 * @return boolean|WP_Error True if the request passes the CAPTCHA test, or WP_Error.
	 */
	public static function verify_captcha() {
		if ( ! self::can_use_captcha() ) {
			return true;
		}

		$version = self::get_setting( 'version' );
		$generic_error = 'v3' === $version ? __( 'Could not complete this request. Please try again later.', 'newspack-plugin' ) : __( 'Please complete the challenge to continue.', 'newspack-plugin' );
		$token         = isset( $_POST['g-recaptcha-response'] ) ? sanitize_text_field( wp_unslash( $_POST['g-recaptcha-response'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( empty( $token ) ) {
			return new \WP_Error(
				'newspack_recaptcha_invalid_token',
				$generic_error
			);
		}

		$captcha_verify = \wp_safe_remote_post(
			\add_query_arg(
				[
					'secret'   => self::get_site_secret(),
					'response' => $token,
				],
				'https://www.google.com/recaptcha/api/siteverify'
			)
		);

		// If the reCaptcha verification request fails.
		if ( \is_wp_error( $captcha_verify ) ) {
			return $captcha_verify;
		}

		$captcha_verify = json_decode( $captcha_verify['body'], true );

		// If the reCaptcha verification request succeeds, but with error.
		if ( ! boolval( $captcha_verify['success'] ) ) {
			$error = isset( $captcha_verify['error-codes'] ) ? reset( $captcha_verify['error-codes'] ) : $generic_error;
			return new \WP_Error(
				'newspack_recaptcha_error',
				// Translators: error message for reCaptcha.
				sprintf( __( 'Error: %s', 'newspack-plugin' ), $error )
			);
		}

		// If the reCAPTCHA verification score is below our threshold for valid user input (v3 only).
		if (
			'v3' === $version &&
			isset( $captcha_verify['score'] ) &&
			floatval( self::get_setting( 'threshold' ) ) > floatval( $captcha_verify['score'] )
		) {
			return new \WP_Error(
				'newspack_recaptcha_failure',
				$generic_error
			);
		}

		return true;
	}

	/**
	 * Render a container for the reCAPTCHA v2 checkbox widget.
	 */
	public static function render_recaptcha_v2_container() {
		if ( ! self::can_use_captcha( 'v2' ) ) {
			return;
		}
		?>
		<div id="<?php echo \esc_attr( 'newspack-recaptcha-' . uniqid() ); ?>" class="grecaptcha-container"></div>
		<?php
	}

	/**
	 * Add reCAPTCHA v2 to Woo checkout.
	 */
	public static function add_recaptcha_v2_to_checkout() {
		self::render_recaptcha_v2_container();
	}

	/**
	 * Add reCAPTCHA v3 to Woo checkout.
	 */
	public static function add_recaptcha_v3_to_checkout() {
		if ( ! self::can_use_captcha( 'v3' ) ) {
			return;
		}
		$site_key = self::get_site_key();
		?>
		<script src="<?php echo \esc_url( self::get_script_url() ); ?>"></script>
		<script>
			grecaptcha.ready( function() {
				var field;
				function refreshToken() {
					grecaptcha.execute(
						'<?php echo \esc_attr( $site_key ); ?>',
						{ action: 'checkout' }
					).then( function( token ) {
						if ( field ) {
							field.value = token;
						}
					} );
				}
				setInterval( refreshToken, 30000 );
				( function( $ ) {
					if ( ! $ ) { return; }
					$( document ).on( 'updated_checkout', refreshToken );
					$( document.body ).on( 'checkout_error', refreshToken );
				} )( jQuery );
				grecaptcha.execute(
					'<?php echo \esc_attr( $site_key ); ?>',
					{ action: 'checkout' }
				).then( function( token ) {
					field       = document.createElement('input');
					field.type  = 'hidden';
					field.name  = 'g-recaptcha-response';
					field.value = token;
					var form = document.querySelector('form.checkout');
					if ( form ) {
						form.appendChild( field );
					}
				} );
			} );
		</script>
		<?php
	}

	/**
	 * Verify reCAPTCHA on checkout submission.
	 */
	public static function verify_recaptcha_on_checkout() {
		$url                   = \home_url( \add_query_arg( null, null ) );
		$should_verify_captcha = apply_filters( 'newspack_recaptcha_verify_captcha', self::can_use_captcha(), $url );
		if ( ! $should_verify_captcha ) {
			return;
		}
		$check = self::verify_captcha();
		if ( \is_wp_error( $check ) ) {
			WooCommerce_Connection::add_wc_notice( $check->get_error_message(), 'error' );
		}
	}
}

Recaptcha::init();

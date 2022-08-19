<?php
/**
 * Class for reCAPTCHA integration.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Class for reCAPTCHA integration.
 */
final class Recaptcha {
	const RECAPTCHA_SCRIPT_HANDLE = 'newspack-recaptcha';
	const RECAPTCHA_THRESHOLD     = 0.5;
	const RECAPTCHA_API_NAMESPACE = 'newspack/v1';
	const OPTIONS_PREFIX          = 'newspack_recaptcha_';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'register_script' ] );
	}

	/**
	 * Register API endpoints.
	 */
	public static function register_api_endpoints() {
		\register_rest_route(
			self::RECAPTCHA_API_NAMESPACE,
			'/recaptcha',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_settings' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		\register_rest_route(
			self::RECAPTCHA_API_NAMESPACE,
			'/recaptcha',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_setting' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'key'   => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'value' => [
						'sanitize_callback' => [ __CLASS__, 'sanitize_text_or_boolean' ],
					],
				],
			]
		);
	}

	/**
	 * Register the reCAPTCHA v3 script.
	 */
	public static function register_script() {
		if ( self::can_use_captcha() ) {
			$captcha_site_key = self::get_setting( 'captchaSiteKey' );

			// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			\wp_register_script(
				self::RECAPTCHA_SCRIPT_HANDLE,
				esc_url( 'https://www.google.com/recaptcha/api.js?render=' . $captcha_site_key ),
				null,
				null,
				true
			);
			\wp_script_add_data( self::RECAPTCHA_SCRIPT_HANDLE, 'async', true );
			\wp_script_add_data( self::RECAPTCHA_SCRIPT_HANDLE, 'amp-plus', true );
		}
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @return bool|WP_Error
	 */
	public static function api_permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack' ),
				[
					'status' => 403,
				]
			);
		}
		return true;
	}

	/**
	 * Sanitize a text string or boolean value.
	 *
	 * @param string|boolean $value String or boolean value.
	 *
	 * @return string|boolean Sanitized value.
	 */
	public static function sanitize_text_or_boolean( $value ) {
		if ( is_numeric( $value ) || is_bool( $value ) ) {
			return boolval( $value );
		}

		return \sanitize_text_field( $value );
	}

	/**
	 * Get global reCAPTCHA settings and default values.
	 *
	 * @return mixed[] Global reCAPTCHA default values keyed by option name.
	 */
	public static function get_settings_config() {
		return [
			'useCaptcha'        => false,
			'captchaSiteKey'    => '',
			'captchaSiteSecret' => '',
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
	public static function api_update_setting( $request ) {
		$key   = $request->get_param( 'key' );
		$value = $request->get_param( 'value' );

		$setting_to_update         = [];
		$setting_to_update[ $key ] = $value;

		return \rest_ensure_response( self::update_settings( $setting_to_update ) );
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
		if ( ! $settings['useCaptcha'] && empty( $settings['captchaSiteKey'] ) && empty( $settings['captchaSiteSecret'] ) ) {
			$stripe_settings = Stripe_Connection::get_stripe_data();
			if ( ! empty( $stripe_settings['useCaptcha'] ) && ! empty( $stripe_settings['captchaSiteKey'] ) && ! empty( $stripe_settings['captchaSiteSecret'] ) ) {
				// If we have all of the required settings in Stripe settings, migrate them here.
				self::update_settings(
					[
						'useCaptcha'        => $stripe_settings['useCaptcha'],
						'captchaSiteKey'    => $stripe_settings['captchaSiteKey'],
						'captchaSiteSecret' => $stripe_settings['captchaSiteSecret'],
					]
				);

				$settings['useCaptcha']        = $stripe_settings['useCaptcha'];
				$settings['captchaSiteKey']    = $stripe_settings['captchaSiteKey'];
				$settings['captchaSiteSecret'] = $stripe_settings['captchaSiteSecret'];

				// Delete the legacy settings from Stripe settings and apply the settings to the return value.
				unset( $stripe_settings['useCaptcha'] );
				unset( $stripe_settings['captchaSiteKey'] );
				unset( $stripe_settings['captchaSiteSecret'] );
				Stripe_Connection::update_stripe_data( $stripe_settings );
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
		}
		return $value;
	}

	/**
	 * Update settings values.
	 *
	 * @param mixed[] $settings Setting values to update, keyed by option name.
	 *
	 * @return mixed[] Updated settings, or WP_Error.
	 */
	public static function update_settings( $settings ) {
		$config = self::get_settings_config();
		foreach ( $settings as $key => $value ) {
			if ( ! isset( $config[ $key ] ) ) {
				return new \WP_Error(
					'newspack_recaptcha_update_settings_error',
					__( 'Invalid settings key: ', 'newspack' ) . $key
				);
			}

			$updated = \update_option( self::OPTIONS_PREFIX . $key, $value );
			if ( ! $updated ) {
				return new \WP_Error(
					'newspack_recaptcha_update_settings_error',
					__( 'Error updating setting: ', 'newspack' ) . $key
				);
			}
		}

		return self::get_settings();
	}

	/**
	 * Check whether reCaptcha is enabled and that we have all required settings.
	 *
	 * @return boolean True if we can use reCaptcha to secure checkout requests.
	 */
	public static function can_use_captcha() {
		$settings = self::get_settings();
		if ( empty( $settings['useCaptcha'] ) || empty( $settings['captchaSiteKey'] ) || empty( $settings['captchaSiteSecret'] ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Verify a REST API request using reCAPTCHA v3.
	 *
	 * @param string $captcha_token Token to verify.
	 *
	 * @return boolean|WP_Error True if the request passes the CAPTCHA test, or WP_Error.
	 */
	public static function verify_captcha( $captcha_token ) {
		if ( ! self::can_use_captcha() ) {
			return true;
		}

		if ( empty( $captcha_token ) ) {
			return new \WP_Error(
				'newspack_recaptcha_invalid_token',
				__( 'Missing or invalid captcha token.', 'newspack' )
			);
		}

		$captcha_secret = self::get_setting( 'captchaSiteSecret' );
		$captcha_verify = \wp_safe_remote_post(
			\add_query_arg(
				[
					'secret'   => $captcha_secret,
					'response' => $captcha_token,
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
			$error = isset( $captcha_verify['error-codes'] ) ? reset( $captcha_verify['error-codes'] ) : __( 'Error validating captcha.', 'newspack' );
			return new \WP_Error(
				'newspack_recaptcha_error',
				// Translators: error message for reCaptcha.
				sprintf( __( 'reCaptcha error: %s', 'newspack' ), $error )
			);
		}

		// If the reCaptcha verification score is below our threshold for valid user input.
		if (
			isset( $captcha_verify['score'] ) &&
			self::RECAPTCHA_THRESHOLD > floatval( $captcha_verify['score'] )
		) {
			return new \WP_Error(
				'newspack_recaptcha_failure',
				__( 'User action failed captcha challenge.', 'newspack' )
			);
		}

		return true;
	}
}

Recaptcha::init();

<?php
/**
 * Reader Activation.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Recaptcha;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Activation Class.
 */
final class Reader_Activation {

	const OPTIONS_PREFIX = 'newspack_reader_activation_';

	const AUTH_READER_COOKIE    = 'np_auth_reader';
	const AUTH_INTENTION_COOKIE = 'np_auth_intention';
	const SCRIPT_HANDLE         = 'newspack-reader-activation';
	const AUTH_SCRIPT_HANDLE    = 'newspack-reader-auth';

	/**
	 * Reader user meta keys.
	 */
	const READER                            = 'np_reader';
	const EMAIL_VERIFIED                    = 'np_reader_email_verified';
	const WITHOUT_PASSWORD                  = 'np_reader_without_password';
	const REGISTRATION_METHOD               = 'np_reader_registration_method';
	const READER_SAVED_GENERIC_DISPLAY_NAME = 'np_reader_saved_generic_display_name';

	/**
	 * Unverified email rate limiting
	 */
	const LAST_EMAIL_DATE = 'np_reader_last_email_date';
	const EMAIL_INTERVAL  = 10; // 10 seconds

	/**
	 * Auth form.
	 */
	const AUTH_FORM_ACTION  = 'reader-activation-auth-form';
	const AUTH_FORM_OPTIONS = [
		'signin',
		'register',
		'link',
		'pwd',
	];

	/**
	 * Registration methods that don't require account verification.
	 */
	const SSO_REGISTRATION_METHODS = [ 'google' ];

	/**
	 * Whether the session is authenticating a newly registered reader
	 *
	 * @var bool
	 */
	private static $is_new_reader_auth = false;

	/**
	 * UI labels for reader auth flow.
	 *
	 * @var mixed[]
	 */
	private static $reader_auth_labels = [];

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
		\add_action( 'wp_footer', [ __CLASS__, 'render_auth_modal' ] );

		if ( self::is_enabled() ) {
			\add_action( 'clear_auth_cookie', [ __CLASS__, 'clear_auth_intention_cookie' ] );
			\add_action( 'clear_auth_cookie', [ __CLASS__, 'clear_auth_reader_cookie' ] );
			\add_action( 'set_auth_cookie', [ __CLASS__, 'clear_auth_intention_cookie' ] );
			\add_filter( 'login_form_defaults', [ __CLASS__, 'add_auth_intention_to_login_form' ], 20 );
			\add_action( 'wp_login', [ __CLASS__, 'login_set_reader_cookie' ], 10, 2 );
			\add_action( 'resetpass_form', [ __CLASS__, 'set_reader_verified' ] );
			\add_action( 'password_reset', [ __CLASS__, 'set_reader_verified' ] );
			\add_action( 'password_reset', [ __CLASS__, 'set_reader_has_password' ] );
			\add_action( 'newspack_magic_link_authenticated', [ __CLASS__, 'set_reader_verified' ] );
			\add_action( 'auth_cookie_expiration', [ __CLASS__, 'auth_cookie_expiration' ], 10, 3 );
			\add_action( 'init', [ __CLASS__, 'setup_nav_menu' ] );
			\add_action( 'wc_get_template', [ __CLASS__, 'replace_woocommerce_auth_form' ], 10, 2 );
			\add_action( 'template_redirect', [ __CLASS__, 'process_auth_form' ] );
			\add_filter( 'woocommerce_new_customer_data', [ __CLASS__, 'canonize_user_data' ] );
			\add_filter( 'wp_pre_insert_user_data', [ __CLASS__, 'validate_user_data' ], 10, 4 );
			\add_filter( 'woocommerce_add_error', [ __CLASS__, 'better_display_name_error' ] );
			\add_filter( 'amp_native_post_form_allowed', '__return_true' );
			\add_filter( 'woocommerce_email_actions', [ __CLASS__, 'disable_woocommerce_new_user_email' ] );
			\add_filter( 'retrieve_password_notification_email', [ __CLASS__, 'password_reset_configuration' ], 10, 4 );
			\add_action( 'lostpassword_post', [ __CLASS__, 'set_password_reset_mail_content_type' ] );
			\add_filter( 'lostpassword_errors', [ __CLASS__, 'rate_limit_lost_password' ], 10, 2 );
		}
	}

	/**
	 * Enqueue front-end scripts.
	 */
	public static function enqueue_scripts() {
		/**
		 * Filters whether to enqueue the reader auth scripts.
		 *
		 * @param bool $allow_reg_block_render Whether to allow the registration block to render.
		 */
		if ( ! apply_filters( 'newspack_reader_activation_should_render_auth', true ) ) {
			return;
		}

		$authenticated_email = '';
		if ( \is_user_logged_in() && self::is_user_reader( \wp_get_current_user() ) ) {
			$authenticated_email = \wp_get_current_user()->user_email;
		}
		$script_dependencies = [];
		$script_data         = [
			'auth_intention_cookie' => self::AUTH_INTENTION_COOKIE,
			'cid_cookie'            => NEWSPACK_CLIENT_ID_COOKIE_NAME,
			'is_logged_in'          => \is_user_logged_in(),
			'authenticated_email'   => $authenticated_email,
			'otp_auth_action'       => Magic_Link::OTP_AUTH_ACTION,
			'otp_rate_interval'     => Magic_Link::RATE_INTERVAL,
			'account_url'           => function_exists( 'wc_get_account_endpoint_url' ) ? \wc_get_account_endpoint_url( 'dashboard' ) : '',
		];

		if ( Recaptcha::can_use_captcha() ) {
			$script_dependencies[]           = Recaptcha::SCRIPT_HANDLE;
			$script_data['captcha_site_key'] = Recaptcha::get_setting( 'site_key' );
		}

		/**
		 * Reader Activation Frontend Library.
		 */
		\wp_enqueue_script(
			self::SCRIPT_HANDLE,
			Newspack::plugin_url() . '/dist/reader-activation.js',
			$script_dependencies,
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_localize_script(
			self::SCRIPT_HANDLE,
			'newspack_ras_config',
			$script_data
		);
		\wp_script_add_data( self::SCRIPT_HANDLE, 'async', true );
		\wp_script_add_data( self::SCRIPT_HANDLE, 'amp-plus', true );

		/**
		 * Reader Authentication
		 */
		\wp_enqueue_script(
			self::AUTH_SCRIPT_HANDLE,
			Newspack::plugin_url() . '/dist/reader-auth.js',
			[ self::SCRIPT_HANDLE ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_localize_script( self::AUTH_SCRIPT_HANDLE, 'newspack_reader_auth_labels', self::get_reader_auth_labels() );
		\wp_script_add_data( self::AUTH_SCRIPT_HANDLE, 'async', true );
		\wp_script_add_data( self::AUTH_SCRIPT_HANDLE, 'amp-plus', true );
		\wp_enqueue_style(
			self::AUTH_SCRIPT_HANDLE,
			Newspack::plugin_url() . '/dist/reader-auth.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Get reader activation auth flow labels.
	 *
	 * @param string|null $key Key of the label to return (optional).
	 *
	 * @return mixed[]|string The label string or an array of labels keyed by string.
	 */
	private static function get_reader_auth_labels( $key = null ) {
		if ( empty( self::$reader_auth_labels ) ) {
			$default_labels = [
				'title'                   => __( 'Sign in', 'newspack-plugin' ),
				'invalid_email'           => __( 'Please enter a valid email address.', 'newspack-plugin' ),
				'invalid_password'        => __( 'Please enter a password.', 'newspack-plugin' ),
				'invalid_display'         => __( 'Display name cannot match your email address. Please choose a different display name.', 'newspack-plugin' ),
				'blocked_popup'           => __( 'The popup has been blocked. Allow popups for the site and try again.', 'newspack-plugin' ),
				'code_resent'             => __( 'Code resent! Check your inbox.', 'newspack-plugin' ),
				'create_account'          => __( 'Create an account', 'newspack-plugin' ),
				'signin'                  => [
					'title'           => __( 'Sign in', 'newspack-plugin' ),
					'success_title'   => __( 'Success! You’re signed in.', 'newspack-plugin' ),
					'success_message' => __( 'Login successful!', 'newspack-plugin' ),
					'continue'        => __( 'Continue', 'newspack-plugin' ),
					'resend_code'     => __( 'Resend code', 'newspack-plugin' ),
					'otp'             => __( 'Email me a one-time code instead', 'newspack-plugin' ),
					'otp_title'       => __( 'Enter the code sent to your email.', 'newspack-plugin' ),
					'forgot_password' => __( 'Forgot password', 'newspack-plugin' ),
					'create_account'  => __( 'Create an account', 'newspack-plugin' ),
					'register'        => __( 'Sign in to an existing account', 'newspack-plugin' ),
					'go_back'         => __( 'Go back', 'newspack-plugin' ),
					'set_password'    => __( 'Set a password (optional)', 'newspack-plugin' ),
				],
				'register'                => [
					'title'               => __( 'Create an account', 'newspack-plugin' ),
					'success_title'       => __( 'Success! Your account was created and you’re signed in.', 'newspack-plugin' ),
					'success_description' => __( 'In the future, you’ll sign in with a magic link, or a code sent to your email. If you’d rather use a password, you can set one below.', 'newspack-plugin' ),
				],
				'verify'                  => __( 'Thank you for verifying your account!', 'newspack-plugin' ),
				'magic_link'              => __( 'Please check your inbox for an authentication link.', 'newspack-plugin' ),
				'password_reset_interval' => __( 'Please wait a moment before requesting another password reset email.', 'newspack-plugin' ),
				'account_link'            => [
					'signedin'  => __( 'My Account', 'newspack-plugin' ),
					'signedout' => __( 'Sign In', 'newspack-plugin' ),
				],
				'newsletters'             => __( 'Subscribe to our newsletter', 'newspack-plugin' ),
			];

			/**
			* Filters the global labels for reader activation auth flow.
			*
			* @param mixed[] $labels Labels keyed by name.
			*/
			$filtered_labels = apply_filters( 'newspack_reader_activation_auth_labels', $default_labels );

			foreach ( $default_labels as $key => $label ) {
				if ( isset( $filtered_labels[ $key ] ) ) {
					if ( is_array( $label ) && is_array( $filtered_labels[ $key ] ) ) {
						self::$reader_auth_labels[ $key ] = array_merge( $label, $filtered_labels[ $key ] );
					} elseif ( is_string( $label ) && is_string( $filtered_labels[ $key ] ) ) {
						self::$reader_auth_labels[ $key ] = $filtered_labels[ $key ];
					} else {
						// If filtered label type doesn't match, fallback to default.
						self::$reader_auth_labels[ $key ] = $label;
					}
				} else {
					self::$reader_auth_labels[ $key ] = $label;
				}
			}
		}

		if ( ! $key ) {
			return self::$reader_auth_labels;
		}

		return self::$reader_auth_labels[ $key ] ?? '';
	}

	/**
	 * Get settings config with default values.
	 *
	 * @return mixed[] Settings default values keyed by their name.
	 */
	private static function get_settings_config() {
		$label           = self::get_reader_auth_labels( 'newsletters' );
		$settings_config = [
			'enabled'                         => false,
			'enabled_account_link'            => true,
			'account_link_menu_locations'     => [ 'tertiary-menu' ],
			'newsletters_label'               => $label,
			'use_custom_lists'                => false,
			'newsletter_lists'                => [],
			'terms_text'                      => '',
			'terms_url'                       => '',
			'sync_esp'                        => true,
			'metadata_prefix'                 => Newspack_Newsletters::get_metadata_prefix(),
			'metadata_fields'                 => Newspack_Newsletters::get_metadata_fields(),
			'sync_esp_delete'                 => true,
			'active_campaign_master_list'     => '',
			'mailchimp_audience_id'           => '',
			'mailchimp_reader_default_status' => 'transactional',
			'emails'                          => Emails::get_emails( array_values( Reader_Activation_Emails::EMAIL_TYPES ), false ),
			'sender_name'                     => Emails::get_from_name(),
			'sender_email_address'            => Emails::get_from_email(),
			'contact_email_address'           => Emails::get_reply_to_email(),
		];

		/**
		 * Filters the global settings config for reader activation.
		 *
		 * @param mixed[] $settings_config Settings default values keyed by their name.
		 */
		return apply_filters( 'newspack_reader_activation_settings_config', $settings_config );
	}

	/**
	 * Get reader activation global settings.
	 *
	 * @return mixed[] Global settings keyed by their option name.
	 */
	public static function get_settings() {
		$config = self::get_settings_config();

		$settings = [];
		foreach ( $config as $key => $default_value ) {
			$settings[ $key ] = self::get_setting( $key );
		}

		return $settings;
	}

	/**
	 * Get a reader activation settings.
	 *
	 * @param string $name Setting name.
	 *
	 * @return mixed Setting value.
	 */
	public static function get_setting( $name ) {
		$config = self::get_settings_config();
		if ( ! isset( $config[ $name ] ) ) {
			return null;
		}
		$value = \get_option( self::OPTIONS_PREFIX . $name, $config[ $name ] );

		// Use default value type for casting bool option value.
		if ( is_bool( $config[ $name ] ) ) {
			$value = (bool) $value;
		}
		return $value;
	}

	/**
	 * Update a reader activation setting.
	 *
	 * @param string $key   Option name.
	 * @param mixed  $value Option value.
	 *
	 * @return bool True if the value was updated, false otherwise.
	 */
	public static function update_setting( $key, $value ) {
		$config = self::get_settings_config();
		if ( ! isset( $config[ $key ] ) ) {
			return false;
		}
		if ( is_bool( $value ) ) {
			$value = intval( $value );
		}
		if ( 'metadata_prefix' === $key ) {
			return Newspack_Newsletters::update_metadata_prefix( $value );
		}
		if ( 'metadata_fields' === $key ) {
			return Newspack_Newsletters::update_metadata_fields( $value );
		}

		return \update_option( self::OPTIONS_PREFIX . $key, $value );
	}

	/**
	 * Activate RAS features and publish RAS prompts + segments.
	 */
	public static function activate() {
		if ( ! method_exists( '\Newspack_Popups_Presets', 'activate_ras_presets' ) ) {
			return new \WP_Error( 'newspack_reader_activation_missing_dependencies', __( 'Newspack Campaigns plugin is required to activate Reader Activation features.', 'newspack-plugin' ) );
		}

		return \Newspack_Popups_Presets::activate_ras_presets();
	}

	/**
	 * Check if the required Woo plugins are active.
	 *
	 * @return boolean True if all required plugins are active, otherwise false.
	 */
	public static function is_woocommerce_active() {
		$is_active = Donations::is_woocommerce_suite_active();

		if ( \is_wp_error( $is_active ) ) {
			return false;
		}

		return $is_active;
	}

	/**
	 * Is the Newspack Newsletters plugin configured with an ESP?
	 */
	public static function is_esp_configured() {
		$newsletters_configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-newsletters' );

		if ( ! $newsletters_configuration_manager->is_esp_set_up() ) {
			return false;
		}

		$lists = $newsletters_configuration_manager->get_enabled_lists();
		if ( empty( $lists ) || ! is_array( $lists ) ) {
			return false;
		}

		// Can be considered fully configured if the ESP is setup and there's at least one active list.
		foreach ( $lists as $list ) {
			if ( $list['active'] ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get the newsletter lists that should be rendered during registration.
	 *
	 * @return array
	 */
	public static function get_registration_newsletter_lists() {
		if ( ! class_exists( '\Newspack_Newsletters_Subscription' ) ) {
			return [];
		}

		$registration_lists = self::get_available_newsletter_lists();

		/**
		 * Filters the newsletters lists that should be rendered during registration.
		 *
		 * @param array $registration_lists Array of newsletter lists.
		 */
		return apply_filters( 'newspack_registration_newsletters_lists', $registration_lists );
	}

	/**
	 * Get the newsletter lists that should be rendered after checkout.
	 *
	 * @param string $email Email address.
	 *
	 * @return array
	 */
	public static function get_post_checkout_newsletter_lists( $email ) {
		$available_lists    = self::get_available_newsletter_lists();
		$registration_lists = [];

		if ( empty( $available_lists ) || ! method_exists( '\Newspack_Newsletters_Subscription', 'get_contact_lists' ) ) {
			return [];
		}

		$current_lists = \Newspack_Newsletters_Subscription::get_contact_lists( $email );
		if ( \is_wp_error( $current_lists ) || ! is_array( $current_lists ) ) {
			return [];
		}

		foreach ( $available_lists as $list_id => $list ) {
			// Skip any lists the reader is already signed up for.
			if ( in_array( $list_id, $current_lists, true ) ) {
				continue;
			}

			// Skip any premium lists since the reader has already made a purchase at this stage.
			if ( method_exists( '\Newspack_Newsletters\Plugins\Woocommerce_Memberships', 'is_subscription_list_tied_to_plan' ) && \Newspack_Newsletters\Plugins\Woocommerce_Memberships::is_subscription_list_tied_to_plan( $list['db_id'] ) ) {
				continue;
			}

			$registration_lists[ $list_id ] = $list;
		}

		/**
		 * Filters the newsletters lists that should be rendered after checkout.
		 *
		 * @param array $registration_lists Array of newsletter lists.
		 */
		return apply_filters( 'newspack_post_registration_newsletters_lists', $registration_lists );
	}

	/**
	 * Get all available newsletter lists.
	 *
	 * @return array
	 */
	public static function get_available_newsletter_lists() {
		if ( ! method_exists( 'Newspack_Newsletters_Subscription', 'get_lists' ) ) {
			return [];
		}
		$use_custom_lists = self::get_setting( 'use_custom_lists' );
		$available_lists  = \Newspack_Newsletters_Subscription::get_lists_config();
		if ( \is_wp_error( $available_lists ) ) {
			return [];
		}
		if ( ! $use_custom_lists ) {
			$registration_lists = $available_lists;
		} else {
			$lists = self::get_setting( 'newsletter_lists' );
			if ( empty( $lists ) ) {
				return [];
			}
			$registration_lists = [];
			foreach ( $lists as $list ) {
				if ( isset( $available_lists[ $list['id'] ] ) ) {
					$registration_lists[ $list['id'] ]            = $available_lists[ $list['id'] ];
					$registration_lists[ $list['id'] ]['checked'] = $list['checked'] ?? false;
				}
			}
		}

		/**
		 * Filters the newsletters lists that should be rendered during registration.
		 *
		 * @param array $registration_lists Array of newsletter lists.
		 */
		return apply_filters( 'newspack_registration_newsletters_lists', $registration_lists );
	}

	/**
	 * Are all Reader Revenue features configured and ready to use?
	 * Platform must be "Newspack" and all donation settings must be configured.
	 */
	public static function is_reader_revenue_ready() {
		$ready             = false;
		$donation_settings = Donations::get_donation_settings();

		if ( \is_wp_error( $donation_settings ) ) {
			return $ready;
		}

		if ( Donations::is_platform_wc() ) {
			$ready = true;
		} elseif ( Donations::is_platform_nrh() && NRH::get_setting( 'nrh_organization_id' ) && method_exists( '\Newspack_Popups_Settings', 'donor_landing_page' ) && \Newspack_Popups_Settings::donor_landing_page() ) {
			$ready = true;
		}

		return $ready;
	}

	/**
	 * Are the Legal Pages settings configured?
	 * Allows for blank values.
	 */
	public static function is_terms_configured() {
		$terms_text = \get_option( self::OPTIONS_PREFIX . 'terms_text', false );
		$terms_url  = \get_option( self::OPTIONS_PREFIX . 'terms_url', false );

		return is_string( $terms_text ) && is_string( $terms_url );
	}

	/**
	 * Are Transaction Email settings configured?
	 */
	public static function is_transactional_email_configured() {
		$sender_name           = \get_option( self::OPTIONS_PREFIX . 'sender_name', false );
		$sender_email          = \get_option( self::OPTIONS_PREFIX . 'sender_email_address', false );
		$contact_email_address = \get_option( self::OPTIONS_PREFIX . 'contact_email_address', false );

		return ! empty( $sender_name ) && ! empty( $sender_email ) && ! empty( $contact_email_address );
	}

	/**
	 * Is the RAS campaign configured?
	 *
	 * TODO: Make this dynamic once the third UI screen to generate the prompts is built.
	 */
	public static function is_ras_campaign_configured() {
		return self::is_enabled();
	}

	/**
	 * Are all prerequisites for Reader Activation complete?
	 */
	public static function is_ras_ready_to_configure() {
		return self::is_terms_configured() && self::is_esp_configured() && self::is_transactional_email_configured() && method_exists( '\Newspack\Recaptcha', 'can_use_captcha' ) && \Newspack\Recaptcha::can_use_captcha() && self::is_woocommerce_active();
	}

	/**
	 * Get the status of the prerequisites for enabling reader activation.
	 * TODO: Finalize the list of prerequisites and all copy.
	 * TODO: Establish schema for input fields to be shown in expandable cards.
	 *
	 * @return array Array of prerequisites to complete.
	 */
	public static function get_prerequisites_status() {
		$prerequisites = [
			'terms_conditions' => [
				'active'      => self::is_terms_configured(),
				'label'       => __( 'Legal Pages', 'newspack-plugin' ),
				'description' => __( 'Displaying legal pages like Privacy Policy and Terms of Service on your site is recommended for allowing readers to register and access their account.', 'newspack-plugin' ),
				'help_url'    => 'https://help.newspack.com/engagement/reader-activation-system',
				'warning'     => __( 'Privacy policies that tell users how you collect and use their data are essential for running a  trustworthy website. While rules and regulations can differ by country, certain legal pages might be required by law.', 'newspack-plugin' ),
				'fields'      => [
					'terms_text' => [
						'label'       => __( 'Legal Pages Disclaimer Text', 'newspack-plugin' ),
						'description' => __( 'Legal pages disclaimer text to display on registration.', 'newspack-plugin' ),
					],
					'terms_url'  => [
						'label'       => __( 'Legal Pages URL', 'newspack-plugin' ),
						'description' => __( 'URL to the page containing the privacy policy or terms of service.', 'newspack-plugin' ),
					],
				],
			],
			'esp'              => [
				'active'       => self::is_esp_configured(),
				'plugins'      => [
					'newspack-newsletters' => class_exists( '\Newspack_Newsletters' ),
				],
				'label'        => __( 'Email Service Provider (ESP)', 'newspack-plugin' ),
				'description'  => __( 'Connect to your ESP to register readers with their email addresses and send newsletters.', 'newspack-plugin' ),
				'instructions' => __( 'Connect to your email service provider (ESP) and enable at least one subscription list.', 'newspack-plugin' ),
				'help_url'     => 'https://help.newspack.com/engagement/reader-activation-system',
				'href'         => \admin_url( '/admin.php?page=newspack-engagement-wizard#/newsletters' ),
				'action_text'  => __( 'ESP settings' ),
			],
			'emails'           => [
				'active'      => self::is_transactional_email_configured(),
				'label'       => __( 'Transactional Emails', 'newspack-plugin' ),
				'description' => __( 'Your sender name and email address determines how readers find emails related to their account in their inbox. To customize the content of these emails, visit Advanced Settings below.', 'newspack-plugin' ),
				'help_url'    => 'https://help.newspack.com/engagement/reader-activation-system',
				'fields'      => [
					'sender_name'           => [
						'label'       => __( 'Sender Name', 'newspack-plugin' ),
						'description' => __( 'Name to use as the sender of transactional emails.', 'newspack-plugin' ),
					],
					'sender_email_address'  => [
						'label'       => __( 'Sender Email Address', 'newspack-plugin' ),
						'description' => __( 'Email address to use as the sender of transactional emails.', 'newspack-plugin' ),
					],
					'contact_email_address' => [
						'label'       => __( 'Contact Email Address', 'newspack-plugin' ),
						'description' => __( 'This email will be used as "Reply-To" for transactional emails as well.', 'newspack-plugin' ),
					],
				],
			],
			'recaptcha'        => [
				'active'       => method_exists( '\Newspack\Recaptcha', 'can_use_captcha' ) && \Newspack\Recaptcha::can_use_captcha(),
				'label'        => __( 'reCAPTCHA v3', 'newspack-plugin' ),
				'description'  => __( 'Connecting to a Google reCAPTCHA v3 account enables enhanced anti-spam for all Newspack sign-up blocks.', 'newspack-plugin' ),
				'instructions' => __( 'Enable reCAPTCHA v3 and enter your account credentials.', 'newspack-plugin' ),
				'help_url'     => 'https://help.newspack.com/engagement/reader-activation-system',
				'href'         => \admin_url( '/admin.php?page=newspack-connections-wizard&scrollTo=recaptcha' ),
				'action_text'  => __( 'reCAPTCHA settings' ),
			],
			'reader_revenue'   => [
				'active'       => self::is_reader_revenue_ready(),
				'plugins'      => [
					'newspack-blocks'           => class_exists( '\Newspack_Blocks' ),
					'woocommerce'               => function_exists( 'WC' ),
					'woocommerce-subscriptions' => class_exists( 'WC_Subscriptions_Product' ),
				],
				'label'        => __( 'Reader Revenue', 'newspack-plugin' ),
				'description'  => __( 'Setting suggested donation amounts is required for enabling a streamlined donation experience.', 'newspack-plugin' ),
				'instructions' => __( 'Set platform to "Newspack" or "News Revenue Hub" and configure your default donation settings. If using News Revenue Hub, set an Organization ID and a Donor Landing Page in News Revenue Hub Settings.', 'newspack-plugin' ),
				'help_url'     => 'https://help.newspack.com/engagement/reader-activation-system',
				'href'         => \admin_url( '/admin.php?page=newspack-reader-revenue-wizard' ),
				'action_text'  => __( 'Reader Revenue settings' ),
			],
			'ras_campaign'     => [
				'active'         => self::is_ras_campaign_configured(),
				'plugins'        => [
					'newspack-popups' => class_exists( '\Newspack_Popups_Model' ),
				],
				'label'          => __( 'Reader Activation Campaign', 'newspack-plugin' ),
				'description'    => __( 'Building a set of prompts with default segments and settings allows for an improved experience optimized for Reader Activation.', 'newspack-plugin' ),
				'help_url'       => 'https://help.newspack.com/engagement/reader-activation-system',
				'href'           => self::is_ras_campaign_configured() ? \admin_url( '/admin.php?page=newspack-popups-wizard#/campaigns' ) : \admin_url( '/admin.php?page=newspack-engagement-wizard#/reader-activation/campaign' ),
				'action_enabled' => self::is_ras_ready_to_configure(),
				'action_text'    => __( 'Reader Activation campaign', 'newspack-plugin' ),
				'disabled_text'  => __( 'Waiting for all settings to be ready', 'newspack-plugin' ),
			],
		];

		return $prerequisites;
	}

	/**
	 * Whether reader activation features should be enabled.
	 *
	 * @return bool True if reader activation is enabled.
	 */
	public static function is_enabled() {
		if ( defined( 'IS_TEST_ENV' ) && IS_TEST_ENV ) {
			return true;
		}

		$is_enabled = (bool) \get_option( self::OPTIONS_PREFIX . 'enabled', false );

		/**
		 * Filters whether reader activation is enabled.
		 *
		 * @param bool $is_enabled Whether reader activation is enabled.
		 */
		return \apply_filters( 'newspack_reader_activation_enabled', $is_enabled );
	}

	/**
	 * Whether or not to render the Registration block front-end.
	 * This must be allowed to render before RAS is enabled in the context of previews.
	 *
	 * @return boolean
	 */
	public static function allow_reg_block_render() {
		if ( ! class_exists( '\Newspack_Popups' ) ) {
			return self::is_enabled();
		}

		// If RAS is not enabled yet, allow to render when previewing a campaign prompt.
		return self::is_enabled() || ( method_exists( '\Newspack_Popups', 'is_preview_request' ) && \Newspack_Popups::is_preview_request() );
	}

	/**
	 * Add auth intention email to login form defaults.
	 *
	 * @param array $defaults Login form defaults.
	 *
	 * @return array
	 */
	public static function add_auth_intention_to_login_form( $defaults ) {
		$email = self::get_auth_intention_value();
		if ( ! empty( $email ) ) {
			$defaults['label_username'] = __( 'Email address', 'newspack-plugin' );
			$defaults['value_username'] = $email;
		}
		return $defaults;
	}

	/**
	 * Clear the auth intention cookie.
	 */
	public static function clear_auth_intention_cookie() {
		/** This filter is documented in wp-includes/pluggable.php */
		if ( ! apply_filters( 'send_auth_cookies', true ) ) {
			return;
		}

		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
		setcookie( self::AUTH_INTENTION_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
	}

	/**
	 * Set the auth intention cookie.
	 *
	 * @param string $email Email address.
	 */
	public static function set_auth_intention_cookie( $email ) {
		/** This filter is documented in wp-includes/pluggable.php */
		if ( ! apply_filters( 'send_auth_cookies', true ) ) {
			return;
		}

		/**
		 * Filters the duration of the auth intention cookie expiration period.
		 *
		 * @param int    $length Duration of the expiration period in seconds.
		 * @param string $email  Email address.
		 */
		$expire = time() + \apply_filters( 'newspack_auth_intention_expiration', 30 * DAY_IN_SECONDS, $email );
		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
		setcookie( self::AUTH_INTENTION_COOKIE, $email, $expire, COOKIEPATH, COOKIE_DOMAIN, true );
	}

	/**
	 * Clear cookie that indicates the reader is authenticated.
	 */
	public static function clear_auth_reader_cookie() {
		/** This filter is documented in wp-includes/pluggable.php */
		if ( ! apply_filters( 'send_auth_cookies', true ) ) {
			return;
		}

		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
		setcookie( self::AUTH_READER_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN );
	}

	/**
	 * Set cookie to indicate the reader has been authenticated.
	 *
	 * This cookie expiration doesn't matter, as it's intended to be read right
	 * after a frontend action that might have registered/authenticated a reader.
	 *
	 * Do not use this cookie for validation.
	 *
	 * @param \WP_User $user User object.
	 */
	public static function set_auth_reader_cookie( $user ) {
		/** This filter is documented in wp-includes/pluggable.php */
		if ( ! apply_filters( 'send_auth_cookies', true ) ) {
			return;
		}

		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
		setcookie( self::AUTH_READER_COOKIE, $user->user_email, time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, true );
	}

	/**
	 * Set the reader cookie on wp login.
	 *
	 * @param string   $user_login User login.
	 * @param \WP_User $user       User object.
	 */
	public static function login_set_reader_cookie( $user_login, $user ) {
		if ( self::is_user_reader( $user ) ) {
			self::set_auth_reader_cookie( $user );
		}
	}

	/**
	 * Get the auth intention value.
	 *
	 * @return string|null Email address or null if not set.
	 */
	public static function get_auth_intention_value() {
		$email_address = null;
		if ( isset( $_COOKIE[ self::AUTH_INTENTION_COOKIE ] ) ) {
			// phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
			$email_address = \sanitize_email( $_COOKIE[ self::AUTH_INTENTION_COOKIE ] );
		}
		/**
		 * Filters the session auth intention email address.
		 *
		 * @param string|null $email_address Email address or null if not set.
		 */
		return \apply_filters( 'newspack_auth_intention', $email_address );
	}

	/**
	 * Get the reader roles.
	 */
	public static function get_reader_roles() {
		/**
		 * Filters the roles that can determine if a user is a reader.
		 *
		 * @param string[] $roles Array of user roles.
		 */
		return \apply_filters( 'newspack_reader_user_roles', [ 'subscriber', 'customer' ] );
	}

	/**
	 * Whether the user is a reader.
	 *
	 * @param WP_User $user   User object.
	 * @param bool    $strict Whether to check if the user was created through reader registration. Default false.
	 *
	 * @return bool Whether the user is a reader.
	 */
	public static function is_user_reader( $user, $strict = false ) {
		$is_reader = (bool) \get_user_meta( $user->ID, self::READER, true );
		$user_data = \get_userdata( $user->ID );

		if ( false === $is_reader && false === $strict ) {
			$reader_roles = self::get_reader_roles();
			if ( ! empty( $reader_roles ) ) {
				$is_reader = ! empty( array_intersect( $reader_roles, $user_data->roles ) );
			}
		}

		/**
		 * Filters roles that restricts a user from being a reader.
		 *
		 * @param string[] $roles Array of user roles that restrict a user from being a reader.
		 */
		$restricted_roles = \apply_filters( 'newspack_reader_restricted_roles', [ 'administrator', 'editor' ] );
		if ( ! empty( $restricted_roles ) && $is_reader && ! empty( array_intersect( $restricted_roles, $user_data->roles ) ) ) {
			$is_reader = false;
		}

		/**
		 * Filters whether the user is a reader.
		 *
		 * @param bool     $is_reader Whether the user is a reader.
		 * @param \WP_User $user      User object.
		 */
		return (bool) \apply_filters( 'newspack_is_user_reader', $is_reader, $user );
	}

	/**
	 * Verify email address of a reader given the user.
	 *
	 * @param \WP_User|int $user_or_user_id User object.
	 *
	 * @return bool Whether the email address was verified.
	 */
	public static function set_reader_verified( $user_or_user_id ) {
		if ( $user_or_user_id instanceof \WP_User ) {
			$user = $user_or_user_id;
		} elseif ( absint( $user_or_user_id ) ) {
			$user = get_user_by( 'id', $user_or_user_id );
		}

		if ( ! isset( $user ) || ! $user || self::is_reader_verified( $user ) ) {
			return false;
		}

		/** Should not verify email if user is not a reader. */
		if ( ! self::is_user_reader( $user ) ) {
			return false;
		}

		\update_user_meta( $user->ID, self::EMAIL_VERIFIED, true );

		WooCommerce_Connection::add_wc_notice( self::get_reader_auth_labels( 'verify' ), 'success' );

		/**
		 * Fires after a reader's email address is verified.
		 *
		 * @param \WP_User $user User object.
		 */
		do_action( 'newspack_reader_verified', $user );

		return true;
	}

	/**
	 * Remove "without password" meta from user.
	 *
	 * @param \WP_User|int $user_or_user_id User object or user ID.
	 *
	 * @return bool Whether the meta was removed.
	 */
	public static function set_reader_has_password( $user_or_user_id ) {
		if ( $user_or_user_id instanceof \WP_User ) {
			$user = $user_or_user_id;
		} elseif ( absint( $user_or_user_id ) ) {
			$user = get_user_by( 'id', $user_or_user_id );
		}

		if ( ! isset( $user ) || ! $user ) {
			return false;
		}

		delete_user_meta( $user->ID, self::WITHOUT_PASSWORD );
		return true;
	}

	/**
	 * Whether the reader hasn't set its own password.
	 *
	 * @param \WP_User|int $user_or_user_id User object or user ID.
	 *
	 * @return bool|WP_Error Whether the reader hasn't set its password or error.
	 */
	public static function is_reader_without_password( $user_or_user_id ) {
		if ( $user_or_user_id instanceof \WP_User ) {
			$user = $user_or_user_id;
		} elseif ( absint( $user_or_user_id ) ) {
			$user = get_user_by( 'id', $user_or_user_id );
		}

		if ( ! isset( $user ) || ! $user || ! self::is_user_reader( $user ) ) {
			return new \WP_Error( 'newspack_is_reader_without_password', __( 'Invalid user.', 'newspack-plugin' ) );
		}

		return (bool) \get_user_meta( $user->ID, self::WITHOUT_PASSWORD, false );
	}

	/**
	 * Set custom auth cookie expiration for readers.
	 *
	 * @param int  $length   Duration of the expiration period in seconds.
	 * @param int  $user_id  User ID.
	 * @param bool $remember Whether to remember the user login. Default false.
	 *
	 * @return int Duration of the expiration period in seconds.
	 */
	public static function auth_cookie_expiration( $length, $user_id, $remember ) {
		if ( true === $remember ) {
			$user = \get_user_by( 'id', $user_id );
			if ( $user && self::is_user_reader( $user ) ) {
				$length = YEAR_IN_SECONDS;
			}
		}

		/**
		 * If the session is authenticating a newly registered reader we want the
		 * auth cookie to be short lived since the email ownership has not yet been
		 * verified.
		 */
		if ( true === self::$is_new_reader_auth ) {
			$length = 24 * HOUR_IN_SECONDS;
		}
		return $length;
	}

	/**
	 * Get a BEM formatted class name.
	 *
	 * @param string ...$parts The parts of the class name.
	 *
	 * @return string The BEM formatted class name.
	 */
	private static function get_element_class_name( ...$parts ) {
		if ( is_array( $parts[0] ) ) {
			$parts = $parts[0];
		}
		$parts = array_filter( $parts );
		array_unshift( $parts, 'newspack-reader' );
		return empty( $parts ) ? '' : implode( '__', $parts );
	}

	/**
	 * Setup nav menu hooks.
	 */
	public static function setup_nav_menu() {
		if ( ! self::get_setting( 'enabled_account_link' ) || ! self::is_woocommerce_active() ) {
			return;
		}

		$locations = self::get_setting( 'account_link_menu_locations' );
		$self      = new self();

		/** Always have location enabled for account link. */
		\add_filter(
			'has_nav_menu',
			function( $has_nav_menu, $location ) use ( $locations ) {
				if ( in_array( $location, $locations, true ) ) {
					$has_nav_menu = true;
				}
				return $has_nav_menu;
			},
			10,
			2
		);

		/** Fallback location to always print nav menu args */
		\add_filter(
			'wp_nav_menu_args',
			function( $args ) use ( $self, $locations ) {
				if ( in_array( $args['theme_location'], $locations, true ) ) {
					$args['fallback_cb'] = function( $args ) use ( $self ) {
						echo $self->nav_menu_items( '', $args ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					};
				}
				return $args;
			}
		);

		/** Add as menu item */
		\add_filter( 'wp_nav_menu_items', [ __CLASS__, 'nav_menu_items' ], 20, 2 );

		/** Add mobile icon */
		\add_action(
			'newspack_header_after_mobile_toggle',
			function() use ( $self ) {
				?>
				<span class="<?php echo \esc_attr( self::get_element_class_name( 'account-link', 'mobile' ) ); ?>">
					<?php echo $self->get_account_link(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</span>
				<?php
			}
		);
	}

	/**
	 * Setup nav menu items for reader account access.
	 *
	 * @param string   $output The HTML for the menu items.
	 * @param stdClass $args   An object containing wp_nav_menu() arguments.
	 *
	 * @return string The HTML list content for the menu items.
	 */
	public static function nav_menu_items( $output, $args = [] ) {
		$args      = (object) $args;
		$locations = self::get_setting( 'account_link_menu_locations' );

		/** Do not alter items for authenticated non-readers */
		if ( \is_user_logged_in() && ! self::is_user_reader( \wp_get_current_user() ) && ! \is_customize_preview() ) {
			return $output;
		}

		/**
		 * Menu locations to add the account menu items to.
		 */
		if ( ! in_array( $args->theme_location, $locations, true ) ) {
			return $output;
		}

		$link = self::get_account_link();
		if ( empty( $link ) ) {
			return $output;
		}

		$item  = '<li class="menu-item">';
		$item .= $link;
		$item .= '</li>';

		if ( empty( $output ) ) {
			$menu_class = sprintf( '%s %s', $args->menu_class, self::get_element_class_name( 'account-menu' ) );
			$output     = sprintf( $args->items_wrap ?? '<ul id="%1$s" class="%2$s">%3$s</ul>', $args->menu_id, $menu_class, $item );
		} else {
			$output = $output . $item;
		}
		return $output;
	}

	/**
	 * Get account link.
	 *
	 * @return string Account link HTML or empty string.
	 */
	private static function get_account_link() {
		$account_url = '';
		if ( function_exists( 'wc_get_account_endpoint_url' ) ) {
			$account_url = \wc_get_account_endpoint_url( 'dashboard' );
		}

		/** Do not render link for authenticated readers if account page doesn't exist. */
		if ( empty( $account_url ) && \is_user_logged_in() ) {
			return '';
		}

		$class = function( ...$parts ) {
			array_unshift( $parts, 'account-link' );
			return self::get_element_class_name( $parts );
		};

		$labels = self::get_reader_auth_labels( 'account_link' );
		$label  = \is_user_logged_in() ? 'signedin' : 'signedout';

		$link  = '<a class="' . \esc_attr( $class() ) . '" data-labels="' . \esc_attr( htmlspecialchars( \wp_json_encode( $labels ), ENT_QUOTES, 'UTF-8' ) ) . '" href="' . \esc_url_raw( $account_url ?? '#' ) . '" data-newspack-reader-account-link>';
		$link .= '<span class="' . \esc_attr( $class( 'icon' ) ) . '">';
		$link .= \Newspack\Newspack_UI_Icons::get_svg( 'account' );
		$link .= '</span>';
		$link .= '<span class="' . \esc_attr( $class( 'label' ) ) . '">' . \esc_html( $labels[ $label ] ) . '</span>';
		$link .= '</a>';

		/**
		 * Filters the HTML for the reader account link.
		 *
		 * @param string $link HTML for the reader account link.
		 */
		return apply_filters( 'newspack_reader_account_link', $link );
	}

	/**
	 * Render a honeypot field to guard against bot form submissions. Note that
	 * this field is named `email` to hopefully catch more bots who might be
	 * looking for such fields, where as the "real" field is named "npe".
	 *
	 * Not rendered if reCAPTCHA is enabled as it's a superior spam protection.
	 *
	 * @param string $placeholder Placeholder text to render in the field.
	 */
	public static function render_honeypot_field( $placeholder = '' ) {
		if ( Recaptcha::can_use_captcha() ) {
			return;
		}

		if ( empty( $placeholder ) ) {
			$placeholder = __( 'Enter your email address', 'newspack-plugin' );
		}
		?>
		<input class="nphp" tabindex="-1" aria-hidden="true" name="email" type="email" autocomplete="off" placeholder="<?php echo \esc_attr( $placeholder ); ?>" />
		<?php
	}

	/**
	 * Renders reader authentication form.
	 */
	public static function render_auth_form() {
		/**
		 * Filters whether to render reader auth form.
		 *
		 * @param bool $should_render Whether to render reader auth form.
		 */
		if ( ! apply_filters( 'newspack_reader_activation_should_render_auth', true ) ) {
			return;
		}
		// No need to render if RAS is disabled and not a preview request.
		if ( ! self::allow_reg_block_render() ) {
			return;
		}

		$message = '';
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['reader_authenticated'] ) && isset( $_GET['message'] ) ) {
			$message = \sanitize_text_field( $_GET['message'] );
		}
		// phpcs:enable

		$referer = \wp_parse_url( \wp_get_referer() );
		$labels  = self::get_reader_auth_labels( 'signin' );
		?>
		<div class="newspack-ui newspack-reader-auth">
			<div class="newspack-ui__box newspack-ui__box--success newspack-ui__box--text-center" data-action="success">
				<span class="newspack-ui__icon newspack-ui__icon--success">
					<?php \Newspack\Newspack_UI_Icons::print_svg( 'check' ); ?>
				</span>
				<p>
					<strong class="success-title"></strong>
				</p>
				<p class="newspack-ui__font--xs success-description"></p>
			</div>
			<form method="post" target="_top">
				<div data-action="signin register">
					<?php self::render_third_party_auth(); ?>
				</div>
				<input type="hidden" name="<?php echo \esc_attr( self::AUTH_FORM_ACTION ); ?>" value="1" />
				<?php if ( ! empty( $referer['path'] ) ) : ?>
					<input type="hidden" name="referer" value="<?php echo \esc_url( $referer['path'] ); ?>" />
				<?php endif; ?>
				<input type="hidden" name="action" />
				<p data-action="otp">
					<label><?php echo esc_html( $labels['otp_title'] ); ?></label>
				</p>
				<div data-action="signin register">
					<p>
						<label for="newspack-reader-auth-email-input"><?php esc_html_e( 'Email address', 'newspack-plugin' ); ?></label>
						<input id="newspack-reader-auth-email-input" name="npe" type="email" placeholder="<?php \esc_attr_e( 'Your email address', 'newspack-plugin' ); ?>" />
					</p>
					<?php self::render_honeypot_field(); ?>
				</div>
				<p class="newspack-ui__code-input" data-action="otp">
					<input name="otp_code" type="text" maxlength="<?php echo \esc_attr( Magic_Link::OTP_LENGTH ); ?>" placeholder="<?php \esc_attr_e( '6-digit code', 'newspack-plugin' ); ?>" />
				</p>
				<p data-action="pwd">
					<label for="newspack-reader-auth-password-input"><?php esc_html_e( 'Enter your password', 'newspack-plugin' ); ?></label>
					<input id="newspack-reader-auth-password-input" name="password" type="password" />
				</p>
				<div class="response-container">
					<div class="response newspack-ui__inline-error">
						<?php if ( ! empty( $message ) ) : ?>
							<p><?php echo \esc_html( $message ); ?></p>
						<?php endif; ?>
					</div>
				</div>
				<p data-action="otp">
					<?php
					echo wp_kses_post(
						sprintf(
							// Translators: %s is the email address.
							__( 'Sign in by entering the code we sent to %s, or clicking the magic link in the email.', 'newspack-plugin' ),
							'<strong class="email-address"></strong>'
						)
					);
					?>
				</p>
				<button type="submit" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--primary" data-action="register signin pwd otp"><?php echo \esc_html( $labels['continue'] ); ?></button>
				<button type="button" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--secondary" data-action="otp" data-send-code><?php echo \esc_html( $labels['resend_code'] ); ?></button>
				<button type="button" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--secondary" data-action="pwd" data-send-code><?php echo \esc_html( $labels['otp'] ); ?></button>
				<a class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--secondary" data-action="pwd" href="<?php echo \esc_url( \wp_lostpassword_url() ); ?>"><?php echo \esc_html( $labels['forgot_password'] ); ?></a>
				<button type="button" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--ghost newspack-ui__last-child" data-action="signin" data-set-action="register"><?php echo \esc_html( $labels['create_account'] ); ?></button>
				<button type="button" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--ghost newspack-ui__last-child" data-action="register" data-set-action="signin"><?php echo \esc_html( $labels['register'] ); ?></button>
				<button type="button" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--ghost newspack-ui__last-child" data-action="otp pwd"  data-back><?php echo \esc_html( $labels['go_back'] ); ?></button>
			</form>
			<a href="#" class="auth-callback newspack-ui__button newspack-ui__button--wide newspack-ui__button--primary" data-action="success"><?php echo \esc_html( $labels['continue'] ); ?></a>
			<a href="#" class="set-password newspack-ui__button newspack-ui__button--wide newspack-ui__button--secondary" data-action="success"><?php echo \esc_html( $labels['set_password'] ); ?></a>
		</div>
		<?php
	}

	/**
	 * Renders reader authentication modal.
	 */
	public static function render_auth_modal() {
		/**
		 * Filters whether to render reader auth form.
		 *
		 * @param bool $should_render Whether to render reader auth form.
		 */
		if ( ! apply_filters( 'newspack_reader_activation_should_render_auth', true ) ) {
			return;
		}
		// No need to render if RAS is disabled and not a preview request.
		if ( ! self::allow_reg_block_render() ) {
			return;
		}

		$terms = self::get_auth_footer();
		$label = self::get_reader_auth_labels( 'title' );
		?>
		<div class="newspack-ui newspack-ui__modal-container newspack-reader-auth-modal">
			<div class="newspack-ui__modal-container__overlay"></div>
			<div class="newspack-ui__modal newspack-ui__modal--small">
				<div class="newspack-ui__modal__header">
					<h2><?php echo \esc_html( $label ); ?></h2>
					<button class="newspack-ui__button newspack-ui__button--icon newspack-ui__button--ghost newspack-ui__modal__close">
						<span class="screen-reader-text"><?php esc_html_e( 'Close', 'newspack-plugin' ); ?></span>
						<?php \Newspack\Newspack_UI_Icons::print_svg( 'close' ); ?>
					</button>
				</div>
				<div class="newspack-ui__modal__content">
					<?php self::render_auth_form(); ?>
				</div>
				<?php if ( ! empty( $terms ) ) : ?>
					<footer class="newspack-ui__modal__footer" data-action="signin register">
						<p>
							<?php echo wp_kses_post( trim( $terms ) ); ?>
						</p>
					</footer>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Get the authentication form footer text.
	 *
	 * @return string The authentication form footer text.
	 */
	public static function get_auth_footer() {
		$terms_text = self::get_setting( 'terms_text' );
		$terms_url  = self::get_setting( 'terms_url' );
		$terms      = trim( $terms_text ? $terms_text : '' );
		if ( ! empty( $terms ) ) {
			if ( $terms_url ) {
				$terms = sprintf( '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>', $terms_url, $terms_text );
			}
			if ( substr( trim( $terms_text ), -1 ) !== '.' ) {
				$terms .= '.';
			}
		}
		if ( Recaptcha::can_use_captcha() ) {
			$terms .= ' ' . Recaptcha::get_terms_text();
		}
		return $terms;
	}

	/**
	 * Send the auth form response to the client.
	 *
	 * @param array|WP_Error $data         The response to send to the client.
	 * @param string         $message      Optional custom message.
	 */
	private static function send_auth_form_response( $data = [], $message = false ) {
		$is_error = \is_wp_error( $data );
		if ( empty( $message ) ) {
			$labels  = self::get_reader_auth_labels( 'signin' );
			$message = $is_error ? $data->get_error_message() : $labels['success_message'];
		}
		\wp_send_json( compact( 'message', 'data' ), \is_wp_error( $data ) ? 400 : 200 );
	}

	/**
	 * Render newsletter subscription lists' form input.
	 *
	 * @param array[] $lists   {
	 *   List config keyed by their ID.
	 *
	 *   @type string $title       List title.
	 *   @type string $description List description.
	 * }
	 * @param array   $checked List IDs to pre-select.
	 * @param array   $config  {
	 *   Configuration options.
	 *
	 *   @type string  $title            Optional title to display above the list.
	 *   @type string  $name             Name of the input. Default is lists.
	 *   @type string  $single_label     Label for the input when only one list is present. Default is "Subscribe to our newsletter".
	 *   @type boolean $show_description Whether to display the list description. Default is true.
	 * }
	 */
	public static function render_subscription_lists_inputs( $lists = [], $checked = [], $config = [] ) {
		$label = self::get_reader_auth_labels( 'newsletters' );
		$config = \wp_parse_args(
			$config,
			[
				'title'            => '',
				'name'             => 'lists',
				'single_label'     => $label,
				'show_description' => true,
			]
		);

		if ( empty( $lists ) ) {
			$lists = self::get_registration_newsletter_lists();
		}

		/**
		 * Filter the available newsletter subscription lists in the Registration form.
		 *
		 * @param array[] $lists List config keyed by their ID.
		 */
		$lists = apply_filters( 'newspack_auth_form_newsletters_lists', $lists );

		if ( empty( $lists ) || is_wp_error( $lists ) ) {
			return;
		}

		$id = \wp_rand( 0, 99999 );

		$class = function( ...$parts ) {
			array_unshift( $parts, 'lists' );
			return self::get_element_class_name( $parts );
		};

		$checked_map = array_flip( $checked );
		?>
		<div class="<?php echo \esc_attr( $class() ); ?>">
			<?php if ( 1 < count( $lists ) && ! empty( $config['title'] ) ) : ?>
				<h3><?php echo \esc_html( $config['title'] ); ?></h3>
			<?php endif; ?>
			<ul>
				<?php
				foreach ( $lists as $list_id => $list ) :
					$checkbox_id = sprintf( 'newspack-%s-list-checkbox-%s', $id, $list_id );
					?>
					<li>
						<span class="<?php echo \esc_attr( $class( 'checkbox' ) ); ?>">
							<input
								type="checkbox"
								name="<?php echo \esc_attr( $config['name'] ); ?>[]"
								value="<?php echo \esc_attr( $list_id ); ?>"
								id="<?php echo \esc_attr( $checkbox_id ); ?>"
								<?php if ( isset( $checked_map[ $list_id ] ) ) : ?>
									checked
								<?php endif; ?>
							/>
						</span>
						<span class="<?php echo \esc_attr( $class( 'details' ) ); ?>">
							<label class="<?php echo \esc_attr( $class( 'label' ) ); ?>" for="<?php echo \esc_attr( $checkbox_id ); ?>">
								<span class="<?php echo \esc_attr( $class( 'title' ) ); ?>">
									<?php
									if ( 1 === count( $lists ) ) {
										echo \wp_kses_post( $config['single_label'] );
									} else {
										echo \esc_html( $list['title'] );
									}
									?>
								</span>
								<?php if ( $config['show_description'] ) : ?>
									<span class="<?php echo \esc_attr( $class( 'description' ) ); ?>"><?php echo \esc_html( $list['description'] ); ?></span>
								<?php endif; ?>
							</label>
						</span>
					</li>
				<?php endforeach; ?>
			</ul>
		</div>
		<?php
	}

	/**
	 * Render third party auth buttons for an authentication form.
	 */
	public static function render_third_party_auth() {
		if ( ! Google_OAuth::is_oauth_configured() ) {
			return;
		}
		?>
		<button type="button" class="newspack-ui__button newspack-ui__button--wide newspack-ui__button--secondary newspack-ui__button--google-oauth">
			<?php \Newspack\Newspack_UI_Icons::print_svg( 'google' ); ?>
			<?php echo \esc_html__( 'Sign in with Google', 'newspack-plugin' ); ?>
		</button>
		<div class="newspack-ui__word-divider">
			<?php echo \esc_html__( 'Or', 'newspack-plugin' ); ?>
		</div>
		<?php
	}

	/**
	 * If rendering the WooCommerce login form template, trick it into rendering nothing
	 * and replace it with our own login form.
	 *
	 * @param string $template Full template path.
	 * @param string $template_name Template name.
	 *
	 * @return string Filtered template path.
	 */
	public static function replace_woocommerce_auth_form( $template, $template_name ) {
		if ( 'myaccount/form-login.php' === $template_name ) {
			$template = dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-activation/login-form.php';
		}

		return $template;
	}

	/**
	 * Process reader authentication form.
	 */
	public static function process_auth_form() {
		if ( \is_user_logged_in() ) {
			return;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing
		// Nonce not required for an authentication attempt.
		if ( ! isset( $_POST[ self::AUTH_FORM_ACTION ] ) ) {
			return;
		}
		$action           = isset( $_POST['action'] ) ? \sanitize_text_field( $_POST['action'] ) : '';
		$referer          = isset( $_POST['referer'] ) ? \sanitize_text_field( $_POST['referer'] ) : '';
		$current_page_url = \wp_parse_url( \wp_get_raw_referer() ); // Referer is the current page URL because the form is submitted via AJAX.
		$email            = isset( $_POST['npe'] ) ? \sanitize_email( $_POST['npe'] ) : '';
		$password         = isset( $_POST['password'] ) ? \sanitize_text_field( $_POST['password'] ) : '';
		$lists            = isset( $_POST['lists'] ) ? array_map( 'sanitize_text_field', $_POST['lists'] ) : [];
		$honeypot         = isset( $_POST['email'] ) ? \sanitize_text_field( $_POST['email'] ) : '';
		$captcha_token    = isset( $_POST['captcha_token'] ) ? \sanitize_text_field( $_POST['captcha_token'] ) : '';
		// phpcs:enable

		if ( ! empty( $current_page_url['path'] ) ) {
			$current_page_url = \esc_url( \home_url( $current_page_url['path'] ) );
		}

		// Honeypot trap.
		if ( ! empty( $honeypot ) ) {
			return self::send_auth_form_response(
				[
					'email'         => $honeypot,
					'authenticated' => 1,
				]
			);
		}

		// reCAPTCHA test.
		if ( Recaptcha::can_use_captcha() ) {
			$captcha_result = Recaptcha::verify_captcha( $captcha_token );
			if ( \is_wp_error( $captcha_result ) ) {
				return self::send_auth_form_response( $captcha_result );
			}
		}

		if ( ! in_array( $action, self::AUTH_FORM_OPTIONS, true ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_request', __( 'Invalid request.', 'newspack-plugin' ) ) );
		}

		if ( empty( $email ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_email', __( 'You must enter a valid email address.', 'newspack-plugin' ) ) );
		}

		self::set_auth_intention_cookie( $email );

		$user = \get_user_by( 'email', $email );
		if ( ( ! $user && 'register' !== $action ) || ( $user && ! self::is_user_reader( $user ) ) ) {
			return self::send_auth_form_response( new \WP_Error( 'unauthorized', wp_kses_post( __( 'Account not found. <a href="#register_modal">Create an account</a> instead?', 'newspack-plugin' ) ) ) );
		}

		$payload = [
			'email'         => $email,
			'authenticated' => 0,
		];

		$magic_link_label = self::get_reader_auth_labels( 'magic_link' );

		switch ( $action ) {
			case 'signin':
				if ( self::is_reader_without_password( $user ) ) {
					$sent = Magic_Link::send_email( $user, $current_page_url );
					if ( true !== $sent ) {
						return self::send_auth_form_response( new \WP_Error( 'unauthorized', \is_wp_error( $sent ) ? $sent->get_error_message() : __( 'We encountered an error sending an authentication link. Please try again.', 'newspack-plugin' ) ) );
					}
					$payload['action'] = 'otp';
					return self::send_auth_form_response( $payload, false );
				} else {
					$payload['action'] = 'pwd';
					return self::send_auth_form_response( $payload, false );
				}
			case 'pwd':
				if ( empty( $password ) ) {
					return self::send_auth_form_response( new \WP_Error( 'invalid_password', __( 'Password not recognized, try again.', 'newspack-plugin' ) ) );
				}
				$user = \wp_authenticate( $user->user_login, $password );
				if ( \is_wp_error( $user ) ) {
					return self::send_auth_form_response( new \WP_Error( 'unauthorized', __( 'Password not recognized, try again.', 'newspack-plugin' ) ) );
				}
				$authenticated            = self::set_current_reader( $user->ID );
				$payload['authenticated'] = \is_wp_error( $authenticated ) ? 0 : 1;
				return self::send_auth_form_response( $payload, false );
			case 'link':
				$sent = Magic_Link::send_email( $user, $current_page_url );
				if ( true !== $sent ) {
					return self::send_auth_form_response( new \WP_Error( 'unauthorized', \is_wp_error( $sent ) ? $sent->get_error_message() : __( 'We encountered an error sending an authentication link. Please try again.', 'newspack-plugin' ) ) );
				}
				return self::send_auth_form_response( $payload, $magic_link_label );
			case 'register':
				$metadata = [ 'registration_method' => 'auth-form' ];
				if ( ! empty( $lists ) ) {
					$metadata['lists'] = $lists;
				}
				if ( ! empty( $referer ) ) {
					$metadata['referer'] = \esc_url( $referer );
				}
				if ( ! empty( $current_page_url ) ) {
					$metadata['current_page_url'] = $current_page_url;
				}
				$user_id = self::register_reader( $email, '', true, $metadata );
				if ( false === $user_id ) {
					return self::send_auth_form_response(
						new \WP_Error( 'unauthorized', __( 'An account was already registered with this email.', 'newspack-plugin' ) )
					);
				}
				if ( \is_wp_error( $user_id ) ) {
					return self::send_auth_form_response(
						new \WP_Error( 'unauthorized', __( 'Unable to register your account. Try a different email.', 'newspack-plugin' ) )
					);
				}

				$password_url_arg        = WooCommerce_My_Account::RESET_PASSWORD_URL_PARAM;
				$nonce                   = wp_create_nonce( $password_url_arg );
				$payload['password_url'] = add_query_arg(
					$password_url_arg,
					$nonce,
					function_exists( 'wc_get_account_endpoint_url' ) ? \wc_get_account_endpoint_url( 'edit-account' ) : home_url()
				);

				$payload['registered']    = 1;
				$payload['authenticated'] = 1;
				return self::send_auth_form_response( $payload, false );
		}
	}


	/**
	 * Check if current reader has its email verified.
	 *
	 * @param \WP_User $user User object.
	 *
	 * @return bool|null Whether the email address is verified, null if invalid user.
	 */
	public static function is_reader_verified( $user ) {
		if ( ! $user ) {
			return null;
		}

		/** Should not verify email if user is not a reader. */
		if ( ! self::is_user_reader( $user ) ) {
			return null;
		}

		if ( defined( 'NEWSPACK_ALLOW_MY_ACCOUNT_ACCESS_WITHOUT_VERIFICATION' ) && NEWSPACK_ALLOW_MY_ACCOUNT_ACCESS_WITHOUT_VERIFICATION ) {
			return true;
		}

		return (bool) \get_user_meta( $user->ID, self::EMAIL_VERIFIED, true );
	}

	/**
	 * Authenticate a reader session given its user ID.
	 *
	 * Warning: this method will only verify if the user is a reader in order to
	 * authenticate. It will not check for any credentials.
	 *
	 * @param \WP_User|int $user_or_user_id User object.
	 *
	 * @return \WP_User|\WP_Error The authenticated reader or WP_Error if authentication failed.
	 */
	public static function set_current_reader( $user_or_user_id ) {
		if ( $user_or_user_id instanceof \WP_User ) {
			$user = $user_or_user_id;
		} elseif ( absint( $user_or_user_id ) ) {
			$user = get_user_by( 'id', $user_or_user_id );
		}

		if ( ! $user || \is_wp_error( $user ) || ! self::is_user_reader( $user ) ) {
			return new \WP_Error( 'newspack_authenticate_invalid_user', __( 'Invalid user.', 'newspack-plugin' ) );
		}

		$user_id = \absint( $user->ID );

		\wp_clear_auth_cookie();
		\wp_set_current_user( $user->ID );
		\wp_set_auth_cookie( $user->ID, true );
		\do_action( 'wp_login', $user->user_login, $user );
		Logger::log( 'Logged in user ' . $user->ID );

		return $user;
	}

	/**
	 * Register a reader given its email.
	 *
	 * Due to authentication or auth intention, this method should be used
	 * preferably on POST or API requests to avoid issues with caching.
	 *
	 * @param string $email        Email address.
	 * @param string $display_name Reader display name to be used on account creation.
	 * @param bool   $authenticate Whether to authenticate after registering. Default to true.
	 * @param array  $metadata     Any metadata to pass along to the action hook.
	 *
	 * @return int|false|\WP_Error The created user ID in case of registration, false if the user already exists, or a WP_Error object.
	 */
	public static function register_reader( $email, $display_name = '', $authenticate = true, $metadata = [] ) {
		if ( ! self::is_enabled() ) {
			return new \WP_Error( 'newspack_register_reader_disabled', __( 'Registration is disabled.', 'newspack-plugin' ) );
		}

		if ( \is_user_logged_in() ) {
			return new \WP_Error( 'newspack_register_reader_logged_in', __( 'Cannot register while logged in.', 'newspack-plugin' ) );
		}

		$email = \sanitize_email( $email );

		if ( empty( $email ) ) {
			return new \WP_Error( 'newspack_register_reader_empty_email', __( 'Please enter a valid email address.', 'newspack-plugin' ) );
		}

		self::set_auth_intention_cookie( $email );

		$existing_user = \get_user_by( 'email', $email );
		if ( \is_wp_error( $existing_user ) ) {
			return $existing_user;
		}

		$user_id = false;

		if ( $existing_user ) {
			// Don't send OTP email for newsletter signup.
			if ( ! isset( $metadata['registration_method'] ) || false === strpos( $metadata['registration_method'], 'newsletters-subscription' ) ) {
				Logger::log( "User with $email already exists. Sending magic link." );
				$redirect = isset( $metadata['current_page_url'] ) ? $metadata['current_page_url'] : '';
				Magic_Link::send_email( $existing_user, $redirect );
			}
		} else {
			/**
			 * Create new reader.
			 */
			$user_data = self::canonize_user_data(
				[
					'display_name' => $display_name,
					'user_email'   => $email,
				]
			);
			if ( function_exists( '\wc_create_new_customer' ) ) {
				/**
				 * Create WooCommerce Customer if possible.
				 * Email notification for WooCommerce is handled by the plugin.
				 */
				$user_id = \wc_create_new_customer( $email, $user_data['user_login'], $user_data['user_pass'], $user_data );
			} else {
				$user_id = \wp_insert_user( $user_data );
				\wp_new_user_notification( $user_id, null, 'user' );
			}

			if ( \is_wp_error( $user_id ) ) {
				Logger::error( 'User registration failed: ' . $user_id->get_error_message() );
				return $user_id;
			}

			/**
			 * Add default reader related meta.
			 */
			\update_user_meta( $user_id, self::READER, true );
			/** Email is not yet verified. */
			\update_user_meta( $user_id, self::EMAIL_VERIFIED, false );
			/** User hasn't set their own password yet. */
			\update_user_meta( $user_id, self::WITHOUT_PASSWORD, true );

			Logger::log( 'Created new reader user with ID ' . $user_id );

			if ( $authenticate ) {
				self::$is_new_reader_auth = true;
				self::set_current_reader( $user_id );
			}
		}

		/**
		 * Filters the metadata to pass along to the action hook.
		 *
		 * @param array          $metadata      Metadata.
		 * @param int|false      $user_id       The created user id or false if the user already exists.
		 * @param false|\WP_User $existing_user The existing user object.
		 */
		$metadata = apply_filters( 'newspack_register_reader_metadata', $metadata, $user_id, $existing_user );

		// Note the user's login method for later use.
		if ( isset( $metadata['registration_method'] ) ) {
			\update_user_meta( $user_id, self::REGISTRATION_METHOD, $metadata['registration_method'] );
			if ( in_array( $metadata['registration_method'], self::SSO_REGISTRATION_METHODS, true ) ) {
				self::set_reader_verified( $user_id );
			}
		}

		/**
		 * Action after registering and authenticating a reader.
		 *
		 * @param string         $email         Email address.
		 * @param bool           $authenticate  Whether to authenticate after registering.
		 * @param false|int      $user_id       The created user id.
		 * @param false|\WP_User $existing_user The existing user object.
		 * @param array          $metadata      Metadata.
		 */
		\do_action( 'newspack_registered_reader', $email, $authenticate, $user_id, $existing_user, $metadata );

		return $user_id;
	}

	/**
	 * Get sanitized user data args for creating a new reader user account.
	 * See https://developer.wordpress.org/reference/functions/wp_insert_user/ for supported args.
	 *
	 * @param array $user_data          Default args for the new user.
	 *              $user_data['email] Email address for the new user (required).
	 */
	public static function canonize_user_data( $user_data = [] ) {
		if ( empty( $user_data['user_email'] ) ) {
			return $user_data;
		}

		$user_login      = str_replace( '+', '_', \sanitize_user( $user_data['user_email'], true ) ); // Matches the email address, but replace + with _ to allow for Gmail aliases.
		$random_password = \wp_generate_password();
		$user_nicename   = self::generate_user_nicename( ! empty( $user_data['display_name'] ) ? $user_data['display_name'] : $user_data['user_email'] );

		// If we don't have a display name, make it match the nicename.
		if ( empty( $user_data['display_name'] ) ) {
			$user_data['display_name'] = $user_nicename;
		}

		$user_data = array_merge(
			$user_data,
			[
				'user_login'    => $user_login,
				'user_nicename' => $user_nicename,
				'user_pass'     => $random_password,
			]
		);

		/*
		 * Filters the user_data used to register a new RAS reader account.
		 * See https://developer.wordpress.org/reference/functions/wp_insert_user/ for supported args.
		 */
		return \apply_filters( 'newspack_register_reader_user_data', $user_data );
	}

	/**
	 * Validate reader data before being saved.
	 *
	 * @param array $data     User data.
	 * @param bool  $update   Whether the user is being updated rather than created.
	 * @param int   $user_id  User ID.
	 * @param array $userdata Raw array of user data.
	 *
	 * @return array
	 */
	public static function validate_user_data( $data, $update, $user_id, $userdata ) {
		// Only when updating an existing user.
		if ( ! $update || ! $user_id ) {
			return $data;
		}
		// Only if the user is a reader.
		if ( ! self::is_user_reader( \get_user_by( 'id', $user_id ) ) ) {
			return $data;
		}

		// Validate display name before saving.
		if ( isset( $data['display_name'] ) ) {
			// If the reader saves an empty value.
			if ( empty( trim( $data['display_name'] ) ) ) {
				if ( empty( $userdata['display_name'] ) ) {
					// If the reader lacks a display name, generate one.
					$data['display_name'] = self::generate_user_nicename( $userdata['user_email'] );
					\delete_user_meta( $user_id, self::READER_SAVED_GENERIC_DISPLAY_NAME );
				} else {
					// Otherwise, don't update it.
					$data['display_name'] = $userdata['display_name'];
				}
			}
		}

		return $data;
	}

	/**
	 * Display improved copy for the display name error message.
	 *
	 * @param string $message Error message.
	 * @return string
	 */
	public static function better_display_name_error( $message ) {
		if ( 'Display name cannot be changed to email address due to privacy concern.' === $message ) {
			return self::get_reader_auth_labels( 'invalid_display' );
		}

		return $message;
	}

	/**
	 * Strip the domain part of an email address string.
	 * If not an email address, just return the string.
	 *
	 * @param string $str String to check.
	 * @return string
	 */
	public static function strip_email_domain( $str ) {
		return trim( explode( '@', $str, 2 )[0] );
	}

	/**
	 * Generate a URL-sanitized version of the given string for a new reader account.
	 *
	 * @param string $name User's display name, or email if not available.
	 * @return string
	 */
	public static function generate_user_nicename( $name ) {
		$name = self::strip_email_domain( $name ); // If an email address, strip the domain.
		return \sanitize_title( \sanitize_user( $name, true ) );
	}

	/**
	 * Check if the reader's display name was auto-generated from email address.
	 *
	 * @param int $user_id User ID.
	 * @return bool True if the display name was generated.
	 */
	public static function reader_has_generic_display_name( $user_id = 0 ) {
		// Allow an environment constant to override this check so that even generic/generated display names are allowed.
		if ( defined( 'NEWSPACK_ALLOW_GENERIC_READER_DISPLAY_NAMES' ) && NEWSPACK_ALLOW_GENERIC_READER_DISPLAY_NAMES ) {
			return false;
		}
		if ( ! $user_id ) {
			$user_id = \get_current_user_id();
		}
		$user = \get_userdata( $user_id );
		if ( empty( $user->data ) ) {
			return false;
		}

		// If the reader has intentionally saved a display name we consider generic, treat it as not generic.
		if ( \get_user_meta( $user_id, self::READER_SAVED_GENERIC_DISPLAY_NAME, true ) ) {
			return false;
		}

		// If the user lacks a display name or email address at all, treat it as generic.
		if ( empty( $user->data->display_name ) || empty( $user->data->user_email ) ) {
			return true;
		}

		// If we generated the display name from the user's email address, treat it as generic.
		if (
			self::generate_user_nicename( $user->data->user_email ) === $user->data->display_name || // New generated construction (URL-sanitized version of the email address minus domain).
			self::strip_email_domain( $user->data->user_email ) === $user->data->display_name // Legacy generated construction (just the email address minus domain).
		) {
			return true;
		}

		return false;
	}

	/**
	 * Whether the current reader is rate limited.
	 *
	 * @param \WP_User $user WP_User object to be verified.
	 *
	 * @return bool
	 */
	public static function is_reader_email_rate_limited( $user ) {
		if ( self::is_reader_verified( $user ) ) {
			return false;
		}
		$last_email = get_user_meta( $user->ID, self::LAST_EMAIL_DATE, true );
		return $last_email && self::EMAIL_INTERVAL > time() - $last_email;
	}

	/**
	 * Send a magic link with special messaging to verify the user.
	 *
	 * @param WP_User $user WP_User object to be verified.
	 */
	public static function send_verification_email( $user ) {
		$redirect_to = function_exists( '\wc_get_account_endpoint_url' ) ? \wc_get_account_endpoint_url( 'dashboard' ) : '';

		/** Rate limit control */
		if ( self::is_reader_email_rate_limited( $user ) ) {
			return new \WP_Error( 'newspack_verification_email_interval', __( 'Please wait before requesting another verification email.', 'newspack-plugin' ) );
		}
		\update_user_meta( $user->ID, self::LAST_EMAIL_DATE, time() );

		return Emails::send_email(
			Reader_Activation_Emails::EMAIL_TYPES['VERIFICATION'],
			$user->user_email,
			[
				[
					'template' => '*VERIFICATION_URL*',
					'value'    => Magic_Link::generate_url( $user, $redirect_to ),
				],
			]
		);
	}

	/**
	 * Get value of the client ID bearing cookie.
	 */
	public static function get_client_id() {
		// phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		return isset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ) ? sanitize_text_field( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ) : false;
	}

	/**
	 * Disable the standard WooCommerce "new customer welcome" email.
	 *
	 * @param array $emails Types of transactional emails sent by WooCommerce.
	 *
	 * @return array Filtered array of transactional email types.
	 */
	public static function disable_woocommerce_new_user_email( $emails ) {
		$emails = array_values(
			array_filter(
				$emails,
				function( $type ) {
					return 'woocommerce_created_customer' !== $type;
				}
			)
		);

		return $emails;
	}


	/**
	 * Filters args sent to wp_mail when a password change email is sent.
	 *
	 * @param array   $defaults {
	 *       The default notification email arguments. Used to build wp_mail().
	 *
	 *     @type string $to      The intended recipient - user email address.
	 *     @type string $subject The subject of the email.
	 *     @type string $message The body of the email.
	 *     @type string $headers The headers of the email.
	 * }
	 * @param string  $key        The activation key.
	 * @param string  $user_login The username for the user.
	 * @param WP_User $user       WP_User object.
	 *
	 * @return array The filtered $defaults.
	 */
	public static function password_reset_configuration( $defaults, $key, $user_login, $user ) {
		$config_name  = Reader_Activation_Emails::EMAIL_TYPES['RESET_PASSWORD'];
		$email_config = Emails::get_email_config_by_type( $config_name );

		$defaults['headers'] = sprintf(
			'From: %1$s <%2$s>',
			$email_config['from_name'],
			$email_config['from_email']
		);
		$defaults['subject'] = $email_config['subject'];
		$defaults['message'] = Emails::get_email_payload(
			$config_name,
			[
				[
					'template' => '*PASSWORD_RESET_LINK*',
					'value'    => Emails::get_password_reset_url( $user, $key ),
				],
			]
		);

		return $defaults;
	}

	/**
	 * Set email content type when a password reset email is about to be sent.
	 */
	public static function set_password_reset_mail_content_type() {
		$email_content_type = function() {
			return 'text/html';
		};
		add_filter( 'wp_mail_content_type', $email_content_type );
	}

	/**
	 * Rate limit password reset.
	 *
	 * @param \WP_Error      $errors    A WP_Error object containing any errors generated
	 *                                  by using invalid credentials.
	 * @param \WP_User|false $user_data WP_User object if found, false if the user does not exist.
	 *
	 * @return \WP_Error
	 */
	public static function rate_limit_lost_password( $errors, $user_data ) {
		if ( $user_data && self::is_reader_email_rate_limited( $user_data ) ) {
			$errors->add( 'newspack_password_reset_interval', self::get_reader_auth_labels( 'password_reset_interval' ) );
		} else {
			\update_user_meta( $user_data->ID, self::LAST_EMAIL_DATE, time() );
		}
		return $errors;
	}
}
Reader_Activation::init();

<?php
/**
 * Reader Activation.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Activation Class.
 */
final class Reader_Activation {

	const OPTIONS_PREFIX = 'newspack_reader_activation_';

	const AUTH_INTENTION_COOKIE = 'np_auth_intention';
	const SCRIPT_HANDLE         = 'newspack-reader-activation';
	const AUTH_SCRIPT_HANDLE    = 'newspack-reader-auth';

	/**
	 * Reader user meta keys.
	 */
	const READER                 = 'np_reader';
	const EMAIL_VERIFIED         = 'np_reader_email_verified';
	const REGISTRATION_METHOD    = 'np_reader_registration_method';
	const EMAIL_VERIFIED_META    = 'np_reader_emails_verified';
	const EMAIL_VERIFIED_REQUEST = 'np_reader_email_verification_request';
	const EMAIL_VERIFIED_CONFIRM = 'np_reader_email_verification';

	/**
	 * Auth form.
	 */
	const AUTH_FORM_ACTION  = 'reader-activation-auth-form';
	const AUTH_FORM_OPTIONS = [
		'pwd',
		'link',
		'register',
	];

	/**
	 * Whether the session is authenticating a newly registered reader
	 *
	 * @var bool
	 */
	private static $is_new_reader_auth = false;

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		if ( self::is_enabled() ) {
			\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
			\add_action( 'clear_auth_cookie', [ __CLASS__, 'clear_auth_intention_cookie' ] );
			\add_action( 'set_auth_cookie', [ __CLASS__, 'clear_auth_intention_cookie' ] );
			\add_filter( 'login_form_defaults', [ __CLASS__, 'add_auth_intention_to_login_form' ], 20 );
			\add_action( 'resetpass_form', [ __CLASS__, 'set_reader_verified' ] );
			\add_action( 'password_reset', [ __CLASS__, 'set_reader_verified' ] );
			\add_action( 'newspack_magic_link_authenticated', [ __CLASS__, 'set_reader_verified' ] );
			\add_action( 'auth_cookie_expiration', [ __CLASS__, 'auth_cookie_expiration' ], 10, 3 );
			\add_action( 'init', [ __CLASS__, 'setup_nav_menu' ] );
			\add_action( 'wp_footer', [ __CLASS__, 'render_auth_form' ] );
			\add_action( 'wc_get_template', [ __CLASS__, 'replace_woocommerce_auth_form' ], 10, 2 );
			\add_action( 'template_redirect', [ __CLASS__, 'process_auth_form' ] );
			\add_filter( 'amp_native_post_form_allowed', '__return_true' );

			/** User email verification for subscription management. */
			\add_filter( 'woocommerce_email_actions', [ __CLASS__, 'disable_woocommerce_new_user_email' ] );
			\add_action( 'resetpass_form', [ __CLASS__, 'set_current_user_email_verified' ] );
			\add_action( 'password_reset', [ __CLASS__, 'set_current_user_email_verified' ] );
			\add_action( 'newspack_magic_link_authenticated', [ __CLASS__, 'set_current_user_email_verified' ] );
			\add_action( 'template_redirect', [ __CLASS__, 'process_email_verification_request' ] );
			\add_action( 'template_redirect', [ __CLASS__, 'process_email_verification' ] );
			\add_action( 'newspack_registered_reader', [ __CLASS__, 'send_verification_email_on_registration' ], 10, 4 );
		}
	}

	/**
	 * Enqueue front-end scripts.
	 */
	public static function enqueue_scripts() {
		\wp_register_script(
			self::SCRIPT_HANDLE,
			Newspack::plugin_url() . '/dist/reader-activation.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		$authenticated_email = '';
		if ( \is_user_logged_in() && self::is_user_reader( \wp_get_current_user() ) ) {
			$authenticated_email = \wp_get_current_user()->user_email;
		}
		\wp_localize_script(
			self::SCRIPT_HANDLE,
			'newspack_reader_activation_data',
			[
				'auth_intention_cookie' => self::AUTH_INTENTION_COOKIE,
				'cid_cookie'            => NEWSPACK_CLIENT_ID_COOKIE_NAME,
				'authenticated_email'   => $authenticated_email,
			]
		);
		\wp_script_add_data( self::SCRIPT_HANDLE, 'amp-plus', true );

		/**
		 * Nav menu items script.
		 */
		\wp_enqueue_script(
			self::AUTH_SCRIPT_HANDLE,
			Newspack::plugin_url() . '/dist/reader-auth.js',
			[ self::SCRIPT_HANDLE ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
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
	 * Get settings config with default values.
	 *
	 * @return mixed[] Settings default values keyed by their name.
	 */
	private static function get_settings_config() {
		$settings_config = [
			'enabled'                     => true,
			'enabled_account_link'        => false,
			'account_link_menu_locations' => [ 'tertiary-menu' ],
			'newsletters_label'           => __( 'Subscribe to our newsletters:', 'newspack' ),
			'terms_text'                  => __( 'By signing up, you agree to our Terms and Conditions.', 'newspack' ),
			'terms_url'                   => '',
			'active_campaign_master_list' => '',
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
			$settings[ $key ] = \get_option( self::OPTIONS_PREFIX . $key, $default_value );
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
		return \get_option( self::OPTIONS_PREFIX . $name, $config[ $name ] );
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
		return \update_option( self::OPTIONS_PREFIX . $key, $value );
	}

	/**
	 * Whether reader activation is enabled.
	 *
	 * @return bool True if reader activation is enabled.
	 */
	public static function is_enabled() {
		$is_enabled = defined( 'NEWSPACK_EXPERIMENTAL_READER_ACTIVATION' ) && NEWSPACK_EXPERIMENTAL_READER_ACTIVATION;

		if ( $is_enabled ) {
			$is_enabled = self::get_setting( 'enabled' );
		}

		/**
		 * Filters whether reader activation is enabled.
		 *
		 * @param bool $is_enabled Whether reader activation is enabled.
		 */
		return \apply_filters( 'newspack_reader_activation_enabled', $is_enabled );
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
			$defaults['label_username'] = __( 'Email address', 'newspack' );
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
	 * Whether the user is a reader.
	 *
	 * @param \WP_User $user User object.
	 *
	 * @return bool Whether the user is a reader.
	 */
	public static function is_user_reader( $user ) {
		$is_reader = (bool) \get_user_meta( $user->ID, self::READER, true );
		$user_data = \get_userdata( $user->ID );

		if ( false === $is_reader ) {
			/**
			 * Filters the roles that can determine if a user is a reader.
			 *
			 * @param string[] $roles Array of user roles.
			 */
			$reader_roles = \apply_filters( 'newspack_reader_user_roles', [ 'subscriber', 'customer' ] );
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

		if ( function_exists( '\wc_add_notice' ) ) {
			\wc_add_notice( __( 'Thank you for verifying your account!', 'newspack' ), 'success' );
		}

		/**
		 * Fires after a reader's email address is verified.
		 *
		 * @param \WP_User $user User object.
		 */
		do_action( 'newspack_reader_verified', $user );

		return true;
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
		if ( ! self::get_setting( 'enabled_account_link' ) ) {
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
		if ( \is_user_logged_in() && ! self::is_user_reader( \wp_get_current_user() ) ) {
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
	 * Get the account icon SVG markup.
	 *
	 * @return string The account icon SVG markup.
	 */
	private static function get_account_icon() {
		return '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.25 16.4371C6.16445 15.2755 5.5 13.7153 5.5 12C5.5 8.41015 8.41015 5.5 12 5.5C15.5899 5.5 18.5 8.41015 18.5 12C18.5 13.7153 17.8356 15.2755 16.75 16.4371V16C16.75 14.4812 15.5188 13.25 14 13.25L10 13.25C8.48122 13.25 7.25 14.4812 7.25 16V16.4371ZM8.75 17.6304C9.70606 18.1835 10.8161 18.5 12 18.5C13.1839 18.5 14.2939 18.1835 15.25 17.6304V16C15.25 15.3096 14.6904 14.75 14 14.75L10 14.75C9.30964 14.75 8.75 15.3096 8.75 16V17.6304ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12ZM14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" /></svg>';
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

		$labels = [
			'signedin'  => \__( 'Account', 'newspack' ),
			'signedout' => \__( 'Sign In', 'newspack' ),
		];
		$label  = \is_user_logged_in() ? 'signedin' : 'signedout';

		$link  = '<a class="' . \esc_attr( $class() ) . '" data-labels="' . \esc_attr( htmlspecialchars( \wp_json_encode( $labels ), ENT_QUOTES, 'UTF-8' ) ) . '" href="' . \esc_url_raw( $account_url ?? '#' ) . '" data-newspack-reader-account-link>';
		$link .= '<span class="' . \esc_attr( $class( 'icon' ) ) . '">';
		$link .= self::get_account_icon();
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
	 * Renders reader authentication form.
	 *
	 * @param boolean $is_inline If true, render the form inline, otherwise render as a modal.
	 */
	public static function render_auth_form( $is_inline = false ) {
		// No need to render when logged in.
		if ( \is_user_logged_in() ) {
			return;
		}

		$class = function( ...$parts ) {
			array_unshift( $parts, 'auth-form' );
			return self::get_element_class_name( $parts );
		};

		$labels = [
			'signin'   => \__( 'Sign In', 'newspack' ),
			'register' => \__( 'Sign Up', 'newspack' ),
		];

		$message    = '';
		$classnames = [ 'newspack-reader-auth', $class() ];
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['reader_authenticated'] ) && isset( $_GET['message'] ) ) {
			$message      = \sanitize_text_field( $_GET['message'] );
			$classnames[] = $class( 'visible' );
		}
		// phpcs:enable

		if ( $is_inline ) {
			$classnames[] = $class( 'inline' );
		}

		$newsletters_label = self::get_setting( 'newsletters_label' );
		if ( method_exists( 'Newspack_Newsletters_Subscription', 'get_lists_config' ) ) {
			$lists_config = \Newspack_Newsletters_Subscription::get_lists_config();
			if ( ! \is_wp_error( $lists_config ) ) {
				$lists = $lists_config;
			}
		}
		$terms_text      = self::get_setting( 'terms_text' );
		$terms_url       = self::get_setting( 'terms_url' );
		$is_account_page = function_exists( '\wc_get_page_id' ) ? \get_the_ID() === \wc_get_page_id( 'myaccount' ) : false;
		$redirect        = $is_account_page ? \wc_get_account_endpoint_url( 'dashboard' ) : '';
		?>
		<div class="<?php echo \esc_attr( implode( ' ', $classnames ) ); ?>" data-labels="<?php echo \esc_attr( htmlspecialchars( \wp_json_encode( $labels ), ENT_QUOTES, 'UTF-8' ) ); ?>">
			<div class="<?php echo \esc_attr( $class( 'wrapper' ) ); ?>">
				<?php if ( ! $is_inline ) : ?>
				<button class="<?php echo \esc_attr( $class( 'close' ) ); ?>" data-close aria-label="<?php \esc_attr_e( 'Close Authentication Form', 'newspack' ); ?>">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
					</svg>
				</button>
				<?php endif; ?>
				<div class="<?php echo \esc_attr( $class( 'content' ) ); ?>">
					<form method="post" target="_top">
						<input type="hidden" name="<?php echo \esc_attr( self::AUTH_FORM_ACTION ); ?>" value="1" />
						<input type="hidden" name="action" value="pwd" />
						<div class="<?php echo \esc_attr( $class( 'header' ) ); ?>">
							<h2><?php _e( 'Sign In', 'newspack' ); ?></h2>
							<a href="#" data-action="pwd link" data-set-action="register"><?php \esc_html_e( "I don't have an account", 'newspack' ); ?></a>
							<a href="#" data-action="register" data-set-action="pwd"><?php \esc_html_e( 'I already have an account', 'newspack' ); ?></a>
						</div>
						<p data-has-auth-link>
							<?php _e( "We've recently sent you an authentication link. Please, check your inbox!", 'newspack' ); ?>
						</p>
						<p data-action="pwd">
							<?php _e( 'Sign in below to verify your identity.', 'newspack' ); ?>
						</p>
						<input type="hidden" name="redirect" value="<?php echo \esc_attr( $redirect ); ?>" />
						<?php if ( isset( $lists ) && ! empty( $lists ) ) : ?>
							<div data-action="register">
								<?php if ( 1 < count( $lists ) ) : ?>
									<p><?php echo \esc_html( $newsletters_label ); ?></p>
								<?php endif; ?>
								<?php
								self::render_subscription_lists_inputs(
									$lists,
									[],
									[
										'single_label' => $newsletters_label,
									]
								);
								?>
							</div>
						<?php endif; ?>
						<p>
							<input name="email" type="email" placeholder="<?php \esc_attr_e( 'Enter your email address', 'newspack' ); ?>" />
						</p>
						<div data-action="pwd">
							<p><input name="password" type="password" placeholder="<?php \esc_attr_e( 'Enter your password', 'newspack' ); ?>" /></p>
						</div>
						<div class="<?php echo \esc_attr( $class( 'response' ) ); ?>">
							<span class="<?php echo \esc_attr( $class( 'response', 'icon' ) ); ?>" data-form-status="400">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 24 24" role="img" aria-hidden="true" focusable="false">
									<path d="M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z" />
								</svg>
							</span>
							<span class="<?php echo \esc_attr( $class( 'response', 'icon' ) ); ?>" data-form-status="200">
								<?php echo self::get_account_icon(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							</span>
							<div class="<?php echo \esc_attr( $class( 'response', 'content' ) ); ?>">
								<?php if ( ! empty( $message ) ) : ?>
									<p><?php echo \esc_html( $message ); ?></p>
								<?php endif; ?>
							</div>
						</div>
						<div class="<?php echo \esc_attr( $class( 'actions' ) ); ?>" data-action="pwd">
							<p><button type="submit"><?php \esc_html_e( 'Sign In', 'newspack' ); ?></button></p>
							<p class="small">
								<a href="#" data-set-action="link"><?php \esc_html_e( 'Sign in using a link', 'newspack' ); ?></a>
							</p>
							<p class="small">
								<a href="<?php echo \esc_url( \wp_lostpassword_url() ); ?>"><?php _e( 'Lost your password?', 'newspack' ); ?></a>
							</p>
						</div>
						<div class="<?php echo \esc_attr( $class( 'actions' ) ); ?>" data-action="link">
							<p><button type="submit"><?php \esc_html_e( 'Send authentication link', 'newspack' ); ?></button></p>
							<p class="small">
								<?php \esc_html_e( 'Get a link sent to your email address to sign in instantly without your password.', 'newspack' ); ?><br/>
								<a href="#" data-set-action="pwd"><?php \esc_html_e( 'Sign in with a password instead', 'newspack' ); ?></a>.
							</p>
						</div>
						<div class="<?php echo \esc_attr( $class( 'actions' ) ); ?>" data-action="register">
							<p><button type="submit"><?php \esc_html_e( 'Register', 'newspack' ); ?></button></p>
						</div>
						<?php self::render_third_party_auth(); ?>
						<?php if ( ! empty( $terms_text ) ) : ?>
							<p class="<?php echo \esc_attr( $class( 'terms-text' ) ); ?>">
								<?php if ( ! empty( $terms_url ) ) : ?>
									<a href="<?php echo \esc_url( $terms_url ); ?>" target="_blank" rel="noopener noreferrer">
								<?php endif; ?>
								<?php echo \esc_html( $terms_text ); ?>
								<?php if ( ! empty( $terms_url ) ) : ?>
									</a>
								<?php endif; ?>
							</p>
						<?php endif; ?>
					</form>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Send the auth form response to the client, whether it's a JSON or POST request.
	 *
	 * @param array|WP_Error $data         The response to send to the client.
	 * @param string         $message      Optional custom message.
	 * @param string         $redirect_url Optional custom redirect URL.
	 */
	private static function send_auth_form_response( $data = [], $message = false, $redirect_url = false ) {
		$is_error = \is_wp_error( $data );
		if ( empty( $message ) ) {
			$message = $is_error ? $data->get_error_message() : __( 'Login successful!', 'newspack' );
		}
		if ( \wp_is_json_request() ) {
			\wp_send_json( compact( 'message', 'data' ), \is_wp_error( $data ) ? 400 : 200 );
			exit;
		} elseif ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] ) {
			\wp_safe_redirect(
				\add_query_arg(
					[
						'reader_authenticated' => $is_error ? '0' : '1',
						'message'              => $message,
					],
					$redirect_url
				)
			);
			exit;
		}
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
		$config = \wp_parse_args(
			$config,
			[
				'title'            => '',
				'name'             => 'lists',
				'single_label'     => __( 'Subscribe to our newsletter', 'newspack' ),
				'show_description' => true,
			]
		);

		if ( empty( $lists ) && method_exists( 'Newspack_Newsletters_Subscription', 'get_lists_config' ) ) {
			$lists = \Newspack_Newsletters_Subscription::get_lists_config();
		}

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
		$class      = function( ...$parts ) {
			array_unshift( $parts, 'logins' );
			return self::get_element_class_name( $parts );
		};
		$classnames = implode( ' ', [ $class(), $class() . '--disabled' ] );
		?>
		<div class="<?php echo \esc_attr( $classnames ); ?>">
			<div class="<?php echo \esc_attr( $class( 'separator' ) ); ?>">
				<div></div>
				<div>
					<?php echo \esc_html__( 'OR', 'newspack' ); ?>
				</div>
				<div></div>
			</div>
			<button type="button" class="<?php echo \esc_attr( $class( 'google' ) ); ?>">
				<?php echo file_get_contents( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/blocks/reader-registration/icons/google.svg' ); // phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span>
					<?php echo \esc_html__( 'Sign in with Google', 'newspack' ); ?>
				</span>
			</button>
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
		$action   = isset( $_POST['action'] ) ? \sanitize_text_field( $_POST['action'] ) : '';
		$email    = isset( $_POST['email'] ) ? \sanitize_email( $_POST['email'] ) : '';
		$password = isset( $_POST['password'] ) ? \sanitize_text_field( $_POST['password'] ) : '';
		$redirect = isset( $_POST['redirect'] ) ? \esc_url_raw( $_POST['redirect'] ) : '';
		$lists    = isset( $_POST['lists'] ) ? array_map( 'sanitize_text_field', $_POST['lists'] ) : [];
		// phpcs:enable

		if ( ! in_array( $action, self::AUTH_FORM_OPTIONS, true ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_request', __( 'Invalid request.', 'newspack' ) ) );
		}

		if ( $redirect && false === strpos( $redirect, home_url(), 0 ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_request', __( 'Invalid request.', 'newspack' ) ) );
		}

		if ( empty( $email ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_email', __( 'You must enter a valid email address.', 'newspack' ) ) );
		}

		self::set_auth_intention_cookie( $email );

		$user = \get_user_by( 'email', $email );
		if ( ( ! $user && 'register' !== $action ) || ( $user && ! self::is_user_reader( $user ) ) ) {
			return self::send_auth_form_response( new \WP_Error( 'unauthorized', __( 'Invalid account.', 'newspack' ) ) );
		}

		$payload = [
			'email'         => $email,
			'authenticated' => 0,
		];

		switch ( $action ) {
			case 'pwd':
				if ( empty( $password ) ) {
					return self::send_auth_form_response( new \WP_Error( 'invalid_password', __( 'You must enter a valid password.', 'newspack' ) ) );
				}
				$user = \wp_authenticate( $user->user_login, $password );
				if ( \is_wp_error( $user ) ) {
					return self::send_auth_form_response( new \WP_Error( 'unauthorized', __( 'Invalid credentials.', 'newspack' ) ) );
				}
				$authenticated            = self::set_current_reader( $user->ID );
				$payload['authenticated'] = \is_wp_error( $authenticated ) ? 0 : 1;
				return self::send_auth_form_response( $payload, false, $redirect );
			case 'link':
				$sent = Magic_Link::send_email( $user );
				if ( true !== $sent ) {
					return self::send_auth_form_response( new \WP_Error( 'unauthorized', __( 'Invalid account.', 'newspack' ) ) );
				}
				return self::send_auth_form_response( $payload, __( 'Please check your inbox for an authentication link.', 'newspack' ), $redirect );
			case 'register':
				$metadata = [];
				if ( ! empty( $lists ) ) {
					$metadata['lists'] = $lists;
				}
				$user_id = self::register_reader( $email, '', true, $metadata );
				if ( false === $user_id ) {
					return self::send_auth_form_response( $payload, __( 'An account was already registered with this email. Please check your inbox for an authentication link.', 'newspack' ), $redirect );
				}
				if ( \is_wp_error( $user_id ) ) {
					return self::send_auth_form_response(
						new \WP_Error( 'unauthorized', __( 'Unable to register your account. Try a different email.', 'newspack' ) )
					);
				}
				$payload['authenticated'] = \absint( $user_id ) ? 1 : 0;
				return self::send_auth_form_response( $payload, false, $redirect );
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
			return new \WP_Error( 'newspack_authenticate_invalid_user', __( 'Invalid user.', 'newspack' ) );
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
			return new \WP_Error( 'newspack_register_reader_disabled', __( 'Registration is disabled.', 'newspack' ) );
		}

		if ( \is_user_logged_in() ) {
			return new \WP_Error( 'newspack_register_reader_logged_in', __( 'Cannot register while logged in.', 'newspack' ) );
		}

		$email = \sanitize_email( $email );

		if ( empty( $email ) ) {
			return new \WP_Error( 'newspack_register_reader_empty_email', __( 'Please enter a valid email address.', 'newspack' ) );
		}

		self::set_auth_intention_cookie( $email );

		$existing_user = \get_user_by( 'email', $email );
		if ( \is_wp_error( $existing_user ) ) {
			return $existing_user;
		}

		$user_id = false;

		if ( $existing_user ) {
			Logger::log( "User with $email already exists. Sending magic link." );
			Magic_Link::send_email( $existing_user );
		} else {
			/**
			 * Create new reader.
			 */
			if ( empty( $display_name ) ) {
				$display_name = explode( '@', $email, 2 )[0];
			}

			$user_login = \sanitize_user( $email, true );

			$random_password = \wp_generate_password();

			if ( function_exists( '\wc_create_new_customer' ) ) {
				/**
				 * Create WooCommerce Customer if possible.
				 *
				 * Email notification for WooCommerce is handled by the plugin.
				 */
				$user_id = \wc_create_new_customer( $email, $user_login, $random_password, [ 'display_name' => $display_name ] );
			} else {
				$user_id = \wp_insert_user(
					[
						'user_login'   => $user_login,
						'user_email'   => $email,
						'user_pass'    => $random_password,
						'display_name' => $display_name,
					]
				);
				\wp_new_user_notification( $user_id, null, 'user' );
			}

			if ( \is_wp_error( $user_id ) ) {
				Logger::log( 'User registration failed: ' . $user_id->get_error_message() );
				return $user_id;
			}

			/** Add default reader related meta. */
			\update_user_meta( $user_id, self::READER, true );
			\update_user_meta( $user_id, self::EMAIL_VERIFIED, false );

			Logger::log( 'Created new reader user with ID ' . $user_id );

			if ( $authenticate ) {
				self::$is_new_reader_auth = true;
				self::set_current_reader( $user_id );
			}
		}

		/** Registration methods that don't require account verification. */
		$verified_registration_methods = [ 'google' ];

		// Note the user's login method for later use.
		if ( isset( $metadata['registration_method'] ) ) {
			\update_user_meta( $user_id, self::REGISTRATION_METHOD, $metadata['registration_method'] );
			if ( in_array( $metadata['registration_method'], $verified_registration_methods, true ) ) {
				self::set_reader_verified( $user_id );
			}
		}

		// Send a magic link to new, unverified readers to verify their email address.
		$user = \get_user_by( 'id', $user_id );
		if ( ! $existing_user && ! self::is_reader_verified( $user ) ) {
			$redirect_to = function_exists( '\wc_get_account_endpoint_url' ) ? \wc_get_account_endpoint_url( 'dashboard' ) : '';
			$blogname    = \wp_specialchars_decode( \get_option( 'blogname' ), ENT_QUOTES );

			$subject = __( 'Please verify your account', 'newspack' );

			/* translators: %s: Site title. */
			$message  = sprintf( __( 'Welcome to %s!', 'newspack' ), $blogname ) . "\r\n\r\n";
			$message .= __( 'To manage your account, please verify your email address by visiting the following URL:', 'newspack' ) . "\r\n\r\n";

			Magic_Link::send_email( $user, $redirect_to, $subject, $message );
			Logger::log( 'Sent verification email to new user ' . $email );
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
	 * Whether the current user has its email verified in order to manage their
	 * newletters subscriptions.
	 *
	 * @param int    $user_id User ID. Default is the current user ID.
	 * @param string $email   Email address being verified. Default is the current user email.
	 *
	 * @return bool
	 */
	public static function is_email_verified( $user_id = 0, $email = '' ) {
		if ( empty( $user_id ) ) {
			$user_id = get_current_user_id();
		}
		if ( ! $user_id ) {
			return false;
		}

		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return false;
		}

		if ( empty( $email ) ) {
			$email = $user->user_email;
		}

		$verified_emails = get_user_meta( $user_id, self::EMAIL_VERIFIED_META, true );
		if ( ! is_array( $verified_emails ) ) {
			$verified_emails = [];
		}

		$verified = in_array( $email, $verified_emails, true );

		/**
		 * Filters whether the current user has its email verified.
		 *
		 * @param bool    $verified Whether the current user has its email verified.
		 * @param WP_User $user     User object.
		 * @param string  $email    Email address being verified.
		 */
		return (bool) apply_filters( 'newspack_newsletters_is_email_verified', $verified, $user, $email );
	}

	/**
	 * Set email as verified for a user.
	 *
	 * @param int    $user_id User ID.
	 * @param string $email   Email address being verified. Default is the current user's email.
	 *
	 * @return bool Wether the email was marked as verified successfully.
	 */
	public static function set_email_verified( $user_id, $email = '' ) {
		$verified_emails = get_user_meta( $user_id, self::EMAIL_VERIFIED_META, true );
		if ( ! is_array( $verified_emails ) ) {
			$verified_emails = [];
		}
		if ( empty( $email ) ) {
			$email = get_user_by( 'id', $user_id )->user_email;
		}
		if ( ! in_array( $email, $verified_emails, true ) ) {
			$verified_emails[] = $email;
			return update_user_meta( $user_id, self::EMAIL_VERIFIED_META, $verified_emails );
		}
		return false;
	}

	/**
	 * Set the user's email as verified.
	 *
	 * @param WP_User $user User.
	 */
	public static function set_user_email_verified( $user ) {
		if ( ! $user instanceof WP_User ) {
			return;
		}
		self::set_email_verified( $user->ID, $user->user_email );
	}

	/**
	 * Set current user's email as verified.
	 */
	public static function set_current_user_email_verified() {
		if ( ! is_user_logged_in() ) {
			return;
		}
		self::set_user_email_verified( wp_get_current_user() );
	}

	/**
	 * Get current user email verification transient key.
	 *
	 * @param string $email Email address being verified. Default is the current user's email.
	 */
	private static function get_email_verification_transient_key( $email = '' ) {
		$user_id = get_current_user_id();
		if ( empty( $email ) ) {
			$email = get_user_by( 'id', $user_id )->user_email;
		}
		return sprintf( 'newspack_newsletters_email_verification_%s_%s', $user_id, wp_hash( $email ) );
	}

	/**
	 * Process request to verify a user's email.
	 *
	 * @param boolean $direct_request If calling this method directly from the server, no need to verify nonce.
	 *
	 * A 1-day transient will hold a token to verify the email.
	 */
	public static function process_email_verification_request( $direct_request = false ) {
		if (
			! $direct_request &&
			( ! isset( $_GET[ self::EMAIL_VERIFIED_REQUEST ] ) || ! wp_verify_nonce( sanitize_text_field( $_GET[ self::EMAIL_VERIFIED_REQUEST ] ), self::EMAIL_VERIFIED_REQUEST ) )
		) {
			return;
		}

		if ( ! is_user_logged_in() ) {
			wp_die( esc_html( __( 'Invalid request.', 'newspack' ) ) );
		}

		$user               = wp_get_current_user();
		$transient_key      = self::get_email_verification_transient_key();
		$token              = \wp_generate_password( 43, false, false );
		$verification_nonce = wp_create_nonce( self::EMAIL_VERIFIED_CONFIRM );

		$url = home_url();
		if ( function_exists( 'wc_get_account_endpoint_url' ) ) {
			$url = wc_get_account_endpoint_url( '' );
		}
		$url = add_query_arg(
			[
				self::EMAIL_VERIFIED_CONFIRM => $verification_nonce,
				'token'                      => $token,
			],
			$url
		);

		set_transient( $transient_key, $token, DAY_IN_SECONDS );

		$blogname = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );

		$switched_locale = switch_to_locale( get_user_locale( $user ) );

		/* translators: %s: User display name. */
		$message  = sprintf( __( 'Welcome, %s! Thank you for registering an account.', 'newspack' ), $user->display_name ) . "\r\n\r\n";
		$message .= __( 'To manage your account details, please verify your email address by visiting the following URL:', 'newspack' ) . "\r\n\r\n";
		$message .= $url . "\r\n";

		$email = [
			'to'      => $user->user_email,
			/* translators: %s Site title. */
			'subject' => __( '[%s] Verify your email', 'newspack' ),
			'message' => $message,
			'headers' => '',
		];

		/**
		 * Filters the email verification email.
		 *
		 * @param array    $email          Email arguments. {
		 *   Used to build wp_mail().
		 *
		 *   @type string $to      The intended recipient - New user email address.
		 *   @type string $subject The subject of the email.
		 *   @type string $message The body of the email.
		 *   @type string $headers The headers of the email.
		 * }
		 * @param \WP_User $user           User to send the magic link to.
		 * @param string   $magic_link_url Magic link url.
		 */
		$email = \apply_filters( 'newspack_newsletters_email_verification_email', $email, $user, $url );

		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail
		$sent = \wp_mail(
			$email['to'],
			\wp_specialchars_decode( sprintf( $email['subject'], $blogname ) ),
			$email['message'],
			$email['headers']
		);

		if ( $switched_locale ) {
			\restore_previous_locale();
		}

		if ( ! $direct_request ) {
			if ( function_exists( 'wc_add_notice' ) ) {
				wc_add_notice( __( 'Check your email address for a verification link.', 'newspack' ), 'success' );
			}
			wp_safe_redirect( add_query_arg( [ 'verification_sent' => 1 ], remove_query_arg( self::EMAIL_VERIFIED_REQUEST, wp_get_referer() ) ) );
			exit;
		}
	}

	/**
	 * Process email verification.
	 */
	public static function process_email_verification() {
		if ( ! isset( $_GET[ self::EMAIL_VERIFIED_CONFIRM ] ) || ! wp_verify_nonce( sanitize_text_field( $_GET[ self::EMAIL_VERIFIED_CONFIRM ] ), self::EMAIL_VERIFIED_CONFIRM ) ) {
			return;
		}
		if ( ! is_user_logged_in() ) {
			wp_die( esc_html( __( 'You\'re not logged in.', 'newspack' ) ) );
		}
		$transient_key = self::get_email_verification_transient_key();
		$token         = get_transient( $transient_key );
		if ( ! $token ) {
			wp_die( esc_html( __( 'Invalid request.', 'newspack' ) ) );
		}
		if ( ! isset( $_GET['token'] ) || sanitize_text_field( $_GET['token'] ) !== $token ) {
			wp_die( esc_html( __( 'Invalid request.', 'newspack' ) ) );
		}

		self::set_email_verified( get_current_user_id() );

		delete_transient( $transient_key );

		if ( function_exists( 'wc_add_notice' ) ) {
			wc_add_notice( __( 'Your email has been verified.', 'newspack' ), 'success' );
		}
		wp_safe_redirect( remove_query_arg( [ self::EMAIL_VERIFIED_CONFIRM, 'token' ] ) );
		exit;
	}

	/**
	 * Upon new reader registration, send a verification email.
	 *
	 * @param string         $email         Email address.
	 * @param bool           $authenticate  Whether to authenticate after registering.
	 * @param false|int      $user_id       The created user id.
	 * @param false|\WP_User $existing_user The existing user object.
	 */
	public static function send_verification_email_on_registration( $email, $authenticate, $user_id, $existing_user ) {
		// Only send for new, unverified users.
		if ( false !== $existing_user || self::is_email_verified( $user_id, $email ) ) {
			return;
		}

		self::process_email_verification_request( true );
		Logger::log( 'New reader account registered. Sending verification email to ' . $email . '.' );
	}
}
Reader_Activation::init();

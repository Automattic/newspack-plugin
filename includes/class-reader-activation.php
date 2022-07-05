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

	const AUTH_INTENTION_COOKIE = 'np_auth_intention';

	/**
	 * Reader user meta keys.
	 */
	const READER         = 'np_reader';
	const EMAIL_VERIFIED = 'np_reader_email_verified';

	/**
	 * Auth form.
	 */
	const AUTH_FORM_ACTION  = 'reader-activation-auth-form';
	const AUTH_FORM_OPTIONS = [
		'auth',
		'auth-link',
		'reset-pwd',
	];

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
			\add_action( 'auth_cookie_expiration', [ __CLASS__, 'auth_cookie_expiration' ], 10, 3 );
			\add_filter( 'wp_nav_menu_items', [ __CLASS__, 'nav_menu_items' ], 20, 2 );
			\add_action( 'wp_footer', [ __CLASS__, 'render_auth_form' ] );
			\add_action( 'template_redirect', [ __CLASS__, 'process_auth_form' ] );
		}
	}

	/**
	 * Enqueue front-end scripts.
	 */
	public static function enqueue_scripts() {
		$handle = 'newspack-reader-activation';
		\wp_register_script(
			$handle,
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
			$handle,
			'newspack_reader_activation_data',
			[
				'auth_intention_cookie' => self::AUTH_INTENTION_COOKIE,
				'authenticated_email'   => $authenticated_email,
			]
		);
		\wp_script_add_data( $handle, 'async', true );
		\wp_script_add_data( $handle, 'amp-plus', true );

		/**
		 * Nav menu items script.
		 */
		$auth_handle = 'newspack-reader-activation-auth';
		\wp_enqueue_script(
			$auth_handle,
			Newspack::plugin_url() . '/dist/reader-activation-auth.js',
			[ $handle ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		\wp_script_add_data( $auth_handle, 'async', true );
		\wp_script_add_data( $auth_handle, 'amp-plus', true );
		\wp_enqueue_style(
			$auth_handle,
			Newspack::plugin_url() . '/dist/reader-activation-auth.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Whether reader activation is enabled.
	 *
	 * @return bool True if reader activation is enabled.
	 */
	public static function is_enabled() {
		$is_enabled = defined( 'NEWSPACK_EXPERIMENTAL_READER_ACTIVATION' ) && NEWSPACK_EXPERIMENTAL_READER_ACTIVATION;

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

		if ( false === $is_reader ) {
			/**
			 * Filters the roles that can determine if a user is a reader.
			 *
			 * @param string[] $roles Array of user roles.
			 */
			$reader_roles = \apply_filters( 'newspack_reader_user_roles', [ 'subscriber', 'customer' ] );
			if ( ! empty( $reader_roles ) ) {
				$user_data = \get_userdata( $user->ID );
				$is_reader = ! empty( array_intersect( $reader_roles, $user_data->roles ) );
			}
		}

		/**
		 * Filters whether the user is a reader.
		 *
		 * @param bool     $is_reader Whether the user is a reader.
		 * @param \WP_User $user      User object.
		 */
		return \apply_filters( 'newspack_is_user_reader', $is_reader, $user );
	}

	/**
	 * Verify email address of a reader given the user.
	 *
	 * @param \WP_User $user User object.
	 *
	 * @return bool Whether the email address was verified.
	 */
	public static function set_reader_verified( $user ) {
		if ( ! $user ) {
			return false;
		}

		/** Should not verify email if user is not a reader. */
		if ( ! self::is_user_reader( $user ) ) {
			return false;
		}

		$verified = \get_user_meta( $user->ID, self::EMAIL_VERIFIED, true );
		if ( $verified ) {
			return true;
		}

		\update_user_meta( $user->ID, self::EMAIL_VERIFIED, true );

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
		return $length;
	}

	/**
	 * Setup nav menu items for reader account access.
	 *
	 * @param string   $output The HTML for the menu items.
	 * @param stdClass $args   An object containing wp_nav_menu() arguments.
	 *
	 * @return string The HTML list content for the menu items.
	 */
	public static function nav_menu_items( $output, $args ) {

		/** Do not alter items for authenticated non-readers */
		if ( \is_user_logged_in() && ! self::is_user_reader( \wp_get_current_user() ) ) {
			return $output;
		}

		$pre_items   = '';
		$after_items = '';
		if ( empty( $output ) ) {
			$output      = '';
			$pre_items   = '<ul>';
			$after_items = '</ul>';
		}

		/**
		 * Menu locations to add the account menu items to.
		 */
		$menu_locations = [ 'social' ];
		if ( ! in_array( $args->theme_location, $menu_locations, true ) ) {
			return $output;
		}
		$account_url = '';
		if ( function_exists( 'wc_get_account_endpoint_url' ) ) {
			$account_url = \wc_get_account_endpoint_url( 'dashboard' );
		}
		/** Do not render link for authenticated readers if account page doesn't exist. */
		if ( empty( $account_url ) && is_user_logged_in() ) {
			return $output;
		}
		$classnames = [ 'menu-item', 'newspack-reader-account-link' ];
		$item       = '';
		$item      .= '<li class="' . \esc_attr( implode( ' ', $classnames ) ) . '">';
		$item      .= '<a href="' . \esc_url_raw( $account_url ?? '#' ) . '">' . \esc_html__( 'My Account', 'newspack' ) . '</a>';
		$item      .= '</li>';
		$output     = $item . $output;
		return $pre_items . $output . $after_items;
	}

	/**
	 * Renders reader authentication form
	 */
	public static function render_auth_form() {
		if ( is_user_logged_in() ) {
			return;
		}
		$element_id = sprintf( 'newspack-%s', self::AUTH_FORM_ACTION );
		$message    = '';
		$classnames = [];
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['reader_authenticated'] ) && isset( $_GET['message'] ) ) {
			$message      = \sanitize_text_field( $_GET['message'] );
			$classnames[] = 'visible';
		}
		// phpcs:enable
		?>
		<div id="<?php echo \esc_attr( $element_id ); ?>" class="<?php echo \esc_attr( implode( ' ', $classnames ) ); ?>">
			<div class="form-wrapper">
				<button on="tap:<?php echo esc_attr( $element_id ); ?>.hide" class="form-close" aria-label="<?php esc_attr_e( 'Close Authentication Form', 'newspack' ); ?>">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
					</svg>
				</button>
				<form method="post">
					<p class="auth-link-message">
						<?php _e( "We've recently sent you an authentication link. Please, check your inbox for the link!", 'newspack' ); ?>
					</p>
					<?php wp_nonce_field( self::AUTH_FORM_ACTION, self::AUTH_FORM_ACTION ); ?>
					<input type="hidden" name="redirect" value="" />
					<p><input name="email" type="email" placeholder="<?php \esc_attr_e( 'Enter your email address', 'newspack' ); ?>" /></p>
					<p><input name="password" type="password" placeholder="<?php \esc_attr_e( 'Enter your password', 'newspack' ); ?>" /></p>
					<div class="form-actions">
						<input type="hidden" name="action" value="auth" />
						<p><button type="submit"><?php \esc_html_e( 'Authenticate', 'newspack' ); ?></button></p>
						<a href="#"><?php \esc_html_e( 'Send me an authentication link', 'newspack' ); ?></a>
					</div>
					<div class="form-response">
						<?php if ( ! empty( $message ) ) : ?>
							<p><?php echo \esc_html( $message ); ?></p>
						<?php endif; ?>
					</div>
				</form>
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
			$message = $is_error ? $data->get_error_message() : __( 'You are authenticated!', 'newspack' );
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
	 * Process reader authentication form.
	 */
	public static function process_auth_form() {
		if ( ! isset( $_POST[ self::AUTH_FORM_ACTION ] ) || ! \wp_verify_nonce( \sanitize_text_field( $_POST[ self::AUTH_FORM_ACTION ] ), self::AUTH_FORM_ACTION ) ) {
			return;
		}
		$action   = isset( $_POST['action'] ) ? \sanitize_text_field( $_POST['action'] ) : '';
		$email    = isset( $_POST['email'] ) ? \sanitize_email( $_POST['email'] ) : '';
		$password = isset( $_POST['password'] ) ? \sanitize_text_field( $_POST['password'] ) : '';
		$redirect = isset( $_POST['redirect'] ) ? \esc_url_raw( $_POST['redirect'] ) : '';

		if ( ! in_array( $action, self::AUTH_FORM_OPTIONS, true ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_request', __( 'Invalid request.', 'newspack' ) ) );
		}

		if ( $redirect && false === strpos( $redirect, home_url(), 0 ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_request', __( 'Invalid request.', 'newspack' ) ) );
		}

		if ( empty( $email ) ) {
			return self::send_auth_form_response( new \WP_Error( 'invalid_email', __( 'You must enter a valid email address.', 'newspack' ) ) );
		}

		switch ( $action ) {
			case 'auth':
				if ( empty( $password ) ) {
					return self::send_auth_form_response( new \WP_Error( 'invalid_password', __( 'You must enter a valid password.', 'newspack' ) ) );
				}
				$user = \get_user_by( 'email', $email );
				if ( ! $user || ! self::is_user_reader( $user ) ) {
					return self::send_auth_form_response( new \WP_Error( 'unauthorized', __( 'Invalid email or password.', 'newspack' ) ) );
				}
				$user = \wp_authenticate( $user->user_login, $password );
				if ( \is_wp_error( $user ) ) {
					return self::send_auth_form_response( new \WP_Error( 'unauthorized', __( 'Invalid email or password.', 'newspack' ) ) );
				}
				\wp_set_auth_cookie( $user->ID, true );
				return self::send_auth_form_response( [ 'email' => $email ], false, $redirect );
			case 'auth-link':
				$result = self::register_reader( $email );
				return self::send_auth_form_response( [], __( 'We have sent you an authentication link.', 'newspack' ) );
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
	 * @param int $user_id User ID.
	 *
	 * @return \WP_User|\WP_Error The authenticated reader or WP_Error if authentication failed.
	 */
	public static function set_current_reader( $user_id ) {
		$user_id = \absint( $user_id );
		if ( empty( $user_id ) ) {
			return new \WP_Error( 'newspack_authenticate_invalid_user_id', __( 'Invalid user id.', 'newspack' ) );
		}

		$user = \get_user_by( 'id', $user_id );
		if ( ! $user || \is_wp_error( $user ) || ! self::is_user_reader( $user ) ) {
			return new \WP_Error( 'newspack_authenticate_invalid_user', __( 'Invalid user.', 'newspack' ) );
		}

		\wp_clear_auth_cookie();
		\wp_set_current_user( $user->ID );
		\wp_set_auth_cookie( $user->ID, true );
		\do_action( 'wp_login', $user->user_login, $user );

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
	 *
	 * @return int|false|\WP_Error The created user ID in case of registration, false if the user already exists, or a WP_Error object.
	 */
	public static function register_reader( $email, $display_name = '', $authenticate = true ) {
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
			Magic_Link::send_email( $existing_user );
		} else {
			/**
			 * Create new reader.
			 */
			if ( empty( $display_name ) ) {
				$display_name = explode( '@', $email, 2 )[0];
			}

			$random_password = \wp_generate_password();

			if ( function_exists( '\wc_create_new_customer' ) ) {
				/**
				 * Create WooCommerce Customer if possible.
				 *
				 * Email notification for WooCommerce is handled by the plugin.
				 */
				$user_id = \wc_create_new_customer( $email, $email, $random_password, [ 'display_name' => $display_name ] );
			} else {
				$user_id = \wp_insert_user(
					[
						'user_login'   => $email,
						'user_email'   => $email,
						'user_pass'    => $random_password,
						'display_name' => $display_name,
					]
				);
				\wp_new_user_notification( $user_id, null, 'user' );
			}

			if ( \is_wp_error( $user_id ) ) {
				return $user_id;
			}

			/** Add default reader related meta. */
			\update_user_meta( $user_id, self::READER, true );
			\update_user_meta( $user_id, self::EMAIL_VERIFIED, false );

			if ( $authenticate ) {
				self::set_current_reader( $user_id );
			}
		}

		/**
		 * Action after registering and authenticating a reader.
		 *
		 * @param string         $email         Email address.
		 * @param bool           $authenticate  Whether to authenticate after registering.
		 * @param false|int      $user_id       The created user id.
		 * @param false|\WP_User $existing_user The existing user object.
		 */
		\do_action( 'newspack_registered_reader', $email, $authenticate, $user_id, $existing_user );

		return $user_id;
	}
}
Reader_Activation::init();

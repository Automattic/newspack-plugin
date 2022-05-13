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
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'wp_new_user_notification_email', [ __CLASS__, 'get_reader_registration_email' ], 10, 3 );
		add_action( 'clear_auth_cookie', [ __CLASS__, 'clear_auth_intention_cookie' ] );
		add_filter( 'login_form_defaults', [ __CLASS__, 'add_auth_intention_to_login_form' ] );
	}

	/**
	 * Get reader registration notification email.
	 *
	 * TODO: Use page with MJML rendering to format email.
	 * See \Newspack\Reader_Revenue_Emails for reference.
	 *
	 * @param array   $wp_new_user_notification_email {
	 *     Used to build wp_mail().
	 *
	 *     @type string $to      The intended recipient - New user email address.
	 *     @type string $subject The subject of the email.
	 *     @type string $message The body of the email.
	 *     @type string $headers The headers of the email.
	 * }
	 * @param WP_User $user     User object for new user.
	 * @param string  $blogname The site title.
	 */
	public static function get_reader_registration_email( $wp_new_user_notification_email, $user, $blogname ) {
		return $wp_new_user_notification_email;
	}


	/**
	 * Add auth intention email to login form defaults.
	 *
	 * @param array $defaults Login form defaults.
	 *
	 * @return array
	 */
	public static function add_auth_intention_to_login_form( $defaults ) {
		$email = self::get_auth_intention();
		if ( ! empty( $email ) ) {
			$defaults['value_username'] = $email;
		}
		return $defaults;
	}

	/**
	 * Clear the auth intention cookie.
	 */
	public static function clear_auth_intention_cookie() {
		setcookie( self::AUTH_INTENTION_COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN ); // phpcs:ignore
	}

	/**
	 * Set the auth intention cookie.
	 *
	 * @param string $email Email address.
	 */
	public static function set_auth_intention_cookie( $email ) {
		/**
		 * Filters the duration of the auth intention cookie expiration period.
		 *
		 * @param int    $length Duration of the expiration period in seconds.
		 * @param string $email  Email address.
		 */
		$expire = time() + apply_filters( 'newspack_auth_intention_expiration', 30 * DAY_IN_SECONDS, $email );
		setcookie( self::AUTH_INTENTION_COOKIE, $email, $expire, COOKIEPATH, COOKIE_DOMAIN, true ); // phpcs:ignore
	}

	/**
	 * Get the auth intention.
	 *
	 * @return string|null Email address or null if not set.
	 */
	public static function get_auth_intention() {
		return isset( $_COOKIE[ self::AUTH_INTENTION_COOKIE ] ) ? $_COOKIE[ self::AUTH_INTENTION_COOKIE ] : null; // phpcs:ignore
	}

	/**
	 * Register a reader given its email.
	 *
	 * Due to authentication or auth intention, this method should be used
	 * preferably on POST or API requests to avoid issues with caching.
	 *
	 * @param string $email        Email address.
	 * @param bool   $authenticate Whether to authenticate.
	 *
	 * @return int|string|\WP_Error The created user ID in case of registration, the user email if user already exists, or a WP_Error object.
	 */
	public static function register_reader( $email, $authenticate = true ) {
		if ( empty( $email ) ) {
			return new \WP_Error( 'newspack_reader_empty_email', __( 'Please enter an email address.', 'newspack' ) );
		}
		self::set_auth_intention_cookie( $email );
		$existing_user = \get_user_by( 'email', $email );
		if ( is_wp_error( $existing_user ) ) {
			return $existing_user;
		}
		$user_id = false;
		if ( ! $existing_user ) {
			$random_password = \wp_generate_password( 12, false );
			$user_id         = \wp_create_user( $email, $random_password, $email );
			\wp_new_user_notification( $user_id, null, 'user' );
			if ( $authenticate ) {
				\wp_clear_auth_cookie();
				\wp_set_current_user( $user_id );
				\wp_set_auth_cookie( $user_id, true );
			}
		}
		/**
		 * Action after registering and authenticating a reader.
		 *
		 * @param string         $email         Email address.
		 * @param bool           $authenticate  Whether to authenticate.
		 * @param false|int      $user_id       The created user id.
		 * @param false|\WP_User $existing_user The existing user object.
		 */
		do_action( 'newspack_registered_reader', $email, $authenticate, $user_id, $existing_user );
		return $user_id ?? $email;
	}
}
Reader_Activation::init();

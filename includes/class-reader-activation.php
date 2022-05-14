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

	const MAGIC_LINK_ACTION = 'np_magic_link';

	/**
	 * Reader user meta keys.
	 */
	const READER            = 'np_reader';
	const EMAIL_VERIFIED    = 'np_reader_email_verified';
	const MAGIC_LINK_TOKENS = 'np_magic_link_tokens';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_filter( 'wp_new_user_notification_email', [ __CLASS__, 'get_reader_registration_email' ], 10, 3 );
		\add_action( 'clear_auth_cookie', [ __CLASS__, 'clear_auth_intention_cookie' ] );
		\add_filter( 'login_form_defaults', [ __CLASS__, 'add_auth_intention_to_login_form' ] );
		\add_action( 'template_redirect', [ __CLASS__, 'process_magic_link_request' ] );
		\add_action( 'resetpass_form', [ __CLASS__, 'verify_reader_email' ] );
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
		$expire = time() + \apply_filters( 'newspack_auth_intention_expiration', 30 * DAY_IN_SECONDS, $email );
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
	 * Get the hashed client IP address.
	 *
	 * The HTTP_X_FORWARDED_FOR header is user-controlled and REMOTE_ADDR can be
	 * spoofed. This is not meant to ever be used as the sole security measure for
	 * a token validation.
	 *
	 * It is meant to associate a generated magic link token to its client to
	 * prevent nonmalicious authentication by a 3rd party from forwarded magic
	 * link emails.
	 *
	 * @return string|null Hashed IP address or null if not detected.
	 */
	private static function get_client_hashed_ip() {
		// phpcs:disable
		$hashed_ip = null;
		if ( isset( $_SERVER['REMOTE_ADDR'] ) && ! empty( $_SERVER['REMOTE_ADDR'] ) ) { 
			$hashed_ip = sha1( $_SERVER['REMOTE_ADDR'] );
		}
		if ( isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) && ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$hashed_ip = sha1( $_SERVER['HTTP_X_FORWARDED_FOR'] );
		}
		return $hashed_ip;
		// phpcs:enable
	}

	/**
	 * Get magic link token expiration period.
	 *
	 * @return int Expiration in seconds.
	 */
	private static function get_magic_link_token_expiration_period() {
		/**
		 * Filters the duration of the magic link token expiration period.
		 *
		 * @param int    $length Duration of the expiration period in seconds.
		 */
		return \apply_filters( 'newspack_magic_link_token_expiration', 30 * MINUTE_IN_SECONDS );
	}

	/**
	 * Whether the user is a reader.
	 *
	 * @param \WP_User $user User object.
	 *
	 * @return bool Whether the user is a reader.
	 */
	public static function is_user_reader( $user ) {
		return (bool) \get_user_meta( $user->ID, self::READER, true );
	}

	/**
	 * Verify email address of a reader given the user.
	 *
	 * @param \WP_User $user User object.
	 *
	 * @return bool Whether the email address was verified.
	 */
	public static function verify_reader_email( $user ) {
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
	 * Generate magic link token.
	 *
	 * @param \WP_User $user User to generate the magic link token for.
	 *
	 * @return array|\WP_Error {
	 *   Magic link token data.
	 *
	 *   @type string $token   The token.
	 *   @type string $ip_hash Origin IP hash.
	 *   @type string $time    Token creation time.
	 * }
	 */
	private static function generate_magic_link_token( $user ) {
		if ( ! self::is_user_reader( $user ) ) {
			return new \WP_Error( 'newspack_magic_link_invalid_user', __( 'User is not a reader.', 'newspack' ) );
		}
		$now    = time();
		$tokens = \get_user_meta( $user->ID, self::MAGIC_LINK_TOKENS, true );
		if ( empty( $tokens ) ) {
			$tokens = [];
		}

		/** Clear expired tokens. */
		$expire = $now - self::get_magic_link_token_expiration_period();
		if ( ! empty( $tokens ) ) {
			foreach ( $tokens as $index => $token_data ) {
				if ( $token_data['time'] < $expire ) {
					unset( $tokens[ $index ] );
				}
			}
			$tokens = array_values( $tokens );
		}

		/** Generate the new token. */
		$token  = sha1( \wp_generate_password() );
		$client = self::get_client_hashed_ip();
		if ( empty( $client ) ) {
			return new \WP_Error( 'newspack_magic_link_token_error', 'Could not generate magic link token.' );
		}
		$token_data = [
			'token'  => $token,
			'client' => $client,
			'time'   => $now,
		];
		$tokens[]   = $token_data;
		\update_user_meta( $user->ID, self::MAGIC_LINK_TOKENS, $tokens );
		return $token_data;
	}

	/**
	 * Generate a magic link.
	 *
	 * @param \WP_User $user User to generate the magic link for.
	 * @param string   $url  Destination url. Default is home_url().
	 *
	 * @return string|\WP_Error Magic link url or WP_Error if token generation failed.
	 */
	private static function generate_magic_link_url( $user, $url = '' ) {
		$token_data = self::generate_magic_link_token( $user );
		if ( \is_wp_error( $token_data ) ) {
			return $token_data;
		}
		return \add_query_arg(
			[
				'action' => self::MAGIC_LINK_ACTION,
				'uid'    => $user->ID,
				'token'  => $token_data['token'],
			],
			! empty( $url ) ? $url : \home_url()
		);
	}

	/**
	 * Send magic link email to reader.
	 *
	 * @param \WP_User $user User to send the magic link to.
	 *
	 * @return bool|\WP_Error Whether the email was sent or WP_Error if sending failed.
	 */
	private static function send_magic_link_email( $user ) {
		$magic_link_url = self::generate_magic_link_url( $user );
		if ( \is_wp_error( $magic_link_url ) ) {
			return $magic_link_url;
		}
		$message = 'Continue by clicking the link: ' . $magic_link_url;
		$args    = [
			'to'      => $user->user_email,
			/* translators: %s is the site name */
			'subject' => __( '[%s] Your authentication magic link', 'newspack' ),
			'message' => $message,
			'headers' => '',
		];
		/**
		 * Filters the magic link email.
		 *
		 * @param array    $args {
		 *   Used to build wp_mail().
		 *
		 *   @type string $to      The intended recipient - New user email address.
		 *   @type string $subject The subject of the email.
		 *   @type string $message The body of the email.
		 *   @type string $headers The headers of the email.
		 * }
		 * @param \WP_User $user User to send the magic link to.
		 * @param string   $magic_link Magic link url.
		 */
		$args     = \apply_filters( 'newspack_magic_link_email', $args, $user, $magic_link );
		$blogname = \wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
		return \wp_mail( // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail
			$args['to'],
			\wp_specialchars_decode( sprintf( $args['subject'], $blogname ) ),
			$args['message'],
			$args['headers']
		);
	}

	/**
	 * Authenticate a session given a user ID.
	 *
	 * @param int $user_id User ID.
	 */
	private static function authenticate( $user_id ) {
		$user = \get_user_by( 'id', $user_id );
		\wp_clear_auth_cookie();
		\wp_set_current_user( $user->ID );
		\wp_set_auth_cookie( $user->ID );
		\do_action( 'wp_login', $user->user_login, $user );
	}

	/**
	 * Verify and authenticate current session using magic link token.
	 *
	 * @param int    $user_id User ID.
	 * @param string $token   Token to verify.
	 *
	 * @return bool|\WP_Error Whether the user has been authenticated or WP_Error.
	 */
	private static function validate_magic_link_token( $user_id, $token ) {
		$errors = new \WP_Error();
		$user   = \get_user_by( 'id', $user_id );

		if ( ! $user ) {
			$errors->add( 'invalid_user', __( 'User not found.', 'newspack' ) );
		} elseif ( ! self::is_user_reader( $user ) ) {
			$errors->add( 'invalid_user_type', __( 'Not allowed for this user', 'newspack' ) );
		} else {
			$auth_intention = self::get_auth_intention();
			if ( $user->user_email !== $auth_intention ) {
				$errors->add( 'invalid_auth_intention', __( 'Invalid client.', 'newspack' ) );
			}
			$tokens = \get_user_meta( $user->ID, self::MAGIC_LINK_TOKENS, true );
			if ( empty( $tokens ) || empty( $token ) ) {
				$errors->add( 'invalid_token', __( 'Invalid token.', 'newspack' ) );
			}
		}

		$authenticated = false;

		if ( ! $errors->has_errors() ) {
			$client = self::get_client_hashed_ip();
			$expire = time() - self::get_magic_link_token_expiration_period();

			foreach ( $tokens as $index => $token_data ) {
				/** Clear expired tokens. */
				if ( $token_data['time'] < $expire ) {
					unset( $tokens[ $index ] );
				} else {
					/** Verify token for authentication. */
					if ( $token_data['token'] === $token && $token_data['client'] === $client ) {
						unset( $tokens[ $index ] );
						self::verify_reader_email( $user );
						self::authenticate( $user->ID );
						$authenticated = true;
						break;
					}
				}
			}

			if ( ! $authenticated ) {
				$errors->add( 'expired_token', __( 'Token has expired.', 'newspack' ) );
			}

			$tokens = array_values( $tokens );
			\update_user_meta( $user->ID, self::MAGIC_LINK_TOKENS, $tokens );
		}

		return $errors->has_errors() ? $errors : $authenticated;
	}

	/**
	 * Process magic link token from request.
	 */
	public static function process_magic_link_request() {
		/**
		 * The use of a secret token is enough for CSRF protection.
		 * phpcs:disable WordPress.Security.NonceVerification.Recommended
		 */
		if ( ! isset( $_GET['action'] ) || self::MAGIC_LINK_ACTION !== $_GET['action'] ) {
			return;
		}
		if ( ! isset( $_GET['token'] ) || ! isset( $_GET['uid'] ) ) {
			\wp_die( \esc_html__( 'Invalid request.', 'newspack' ) );
		}

		$user_id       = \absint( \wp_unslash( $_GET['uid'] ) );
		$token         = \sanitize_text_field( \wp_unslash( $_GET['token'] ) );
		$authenticated = self::validate_magic_link_token( $user_id, $token );

		if ( \is_wp_error( $authenticated ) ) {
			/** STO: Do not expose specific error messages to the user. */
			\wp_die( \esc_html__( 'We were not able to authenticate through the magic link. Please, request a new link.', 'newspack' ) );
		}

		\wp_safe_redirect( \remove_query_arg( [ 'action', 'uid', 'token' ] ) );
		exit;
		// phpcs:enable 
	}

	/**
	 * Register a reader given its email.
	 *
	 * Due to authentication or auth intention, this method should be used
	 * preferably on POST or API requests to avoid issues with caching.
	 *
	 * @param string $email        Email address.
	 * @param bool   $authenticate Whether to authenticate. Default to true.
	 * @param bool   $notify       Whether to send email notification to the reader. Default to true.
	 *
	 * @return int|string|\WP_Error The created user ID in case of registration, the user email if user already exists, or a WP_Error object.
	 */
	public static function register_reader( $email, $authenticate = true, $notify = true ) {
		if ( empty( $email ) ) {
			return new \WP_Error( 'newspack_reader_empty_email', __( 'Please enter an email address.', 'newspack' ) );
		}

		self::set_auth_intention_cookie( $email );
		$existing_user = \get_user_by( 'email', $email );
		if ( \is_wp_error( $existing_user ) ) {
			return $existing_user;
		}

		$user_id = false;
		if ( ! $existing_user ) {
			$random_password = \wp_generate_password( 12, false );
			$user_id         = \wp_create_user( $email, $random_password, $email );

			/** Add default reader related meta. */
			\update_user_meta( $user_id, self::READER, true );
			\update_user_meta( $user_id, self::EMAIL_VERIFIED, false );

			if ( $authenticate ) {
				self::authenticate( $user_id );
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
		\do_action( 'newspack_registered_reader', $email, $authenticate, $user_id, $existing_user );

		/**
		 * Notify user of registration or magic link in case of existing user.
		 */
		if ( $notify ) {
			if ( $user_id ) {
				\wp_new_user_notification( $user_id, null, 'user' );
			} elseif ( $existing_user ) {
				self::send_magic_link_email( $existing_user );
			}
		}
		return $user_id ?? $email;
	}
}
Reader_Activation::init();

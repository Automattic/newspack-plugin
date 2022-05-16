<?php
/**
 * Newspack Reader Activation Magic Links functionality.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Reader Activation Magic Links class.
 */
final class Magic_Link {

	const FORM_ACTION = 'np_magic_link';

	const USER_META = 'np_magic_link_tokens';

	const COOKIE = 'np_magic_link';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		if ( Reader_Activation::is_enabled() ) {
			\add_action( 'clear_auth_cookie', [ __CLASS__, 'clear_cookie' ] );
			\add_action( 'template_redirect', [ __CLASS__, 'process_token_request' ] );
		}
	}

	/**
	 * Get magic link token expiration period.
	 *
	 * @return int Expiration in seconds.
	 */
	private static function get_token_expiration_period() {
		/**
		 * Filters the duration of the magic link token expiration period.
		 *
		 * @param int    $length Duration of the expiration period in seconds.
		 */
		return \apply_filters( 'newspack_magic_link_token_expiration', 30 * MINUTE_IN_SECONDS );
	}

	/**
	 * Clear magic link cookie.
	 */
	public static function clear_cookie() {
		setcookie( self::COOKIE, ' ', time() - YEAR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN ); // phpcs:ignore
	}

	/**
	 * Get the session client hash.
	 *
	 * @param bool $reset_cookie Whether to reset the cookie.
	 *
	 * @return string|null Client hash or null if unable to generate one.
	 */
	private static function get_client_hash( $reset_cookie = false ) {
		$hash_args = [];

		// phpcs:disable
		if ( isset( $_SERVER['REMOTE_ADDR'] ) && ! empty( $_SERVER['REMOTE_ADDR'] ) ) { 
			$hash_args['ip'] = $_SERVER['REMOTE_ADDR'];
		}
		if ( isset( $_SERVER['HTTP_USER_AGENT'] ) && ! empty( $_SERVER['HTTP_USER_AGENT'] ) ) { 
			$hash_args['user_agent'] = \wp_unslash( $_SERVER['HTTP_USER_AGENT'] );
		}

		/**
		 * Filters whether to use a cookie as a client hash argument.
		 *
		 * @param bool $use_cookie Whether to use a cookie as a client hash argument.
		 */
		if ( true === apply_filters( 'newspack_magic_link_use_cookie', true ) ) {
			$cookie_value = '';
			if ( true === $reset_cookie || ! isset( $_COOKIE[ self::COOKIE ] ) ) {
				$cookie_value = \wp_generate_password( 32, false );
				setcookie( self::COOKIE, $cookie_value, time() + self::get_token_expiration_period(), COOKIEPATH, COOKIE_DOMAIN, true );
			} elseif ( ! empty( $_COOKIE[ self::COOKIE ] ) ) {
				$cookie_value = \sanitize_text_field( $_COOKIE[ self::COOKIE ] );
			}
			if ( ! empty( $cookie_value ) ) {
				$hash_args['cookie'] = $cookie_value;
			}
		}
		// phpcs:enable

		/**
		 * Filters the client hash arguments for the current session.
		 *
		 * @param string[] $hash_args Client hash arguments.
		 */
		$hash_args = \apply_filters( 'newspack_magic_link_client_hash_args', $hash_args );

		return ! empty( $hash_args ) ? sha1( implode( '', $hash_args ) ) : null;
	}

	/**
	 * Generate magic link token.
	 *
	 * @param \WP_User $user User to generate the magic link token for.
	 *
	 * @return array|\WP_Error {
	 *   Magic link token data.
	 *
	 *   @type string $token  The token.
	 *   @type string $client Origin IP hash.
	 *   @type string $time   Token creation time.
	 * }
	 */
	private static function generate_token( $user ) {
		if ( ! Reader_Activation::is_user_reader( $user ) ) {
			return new \WP_Error( 'newspack_magic_link_invalid_user', __( 'User is not a reader.', 'newspack' ) );
		}
		$now    = time();
		$tokens = \get_user_meta( $user->ID, self::USER_META, true );
		if ( empty( $tokens ) ) {
			$tokens = [];
		}

		$expire = $now - self::get_token_expiration_period();
		if ( ! empty( $tokens ) ) {
			/** Limit consecutive tokens to 5. */
			$tokens = array_slice( $tokens, -4, 4 );
			/** Clear expired tokens. */
			foreach ( $tokens as $index => $token_data ) {
				if ( $token_data['time'] < $expire ) {
					unset( $tokens[ $index ] );
				}
			}
			$tokens = array_values( $tokens );
		}

		/** Generate the new token. */
		$token  = sha1( \wp_generate_password() );
		$client = self::get_client_hash( true );
		if ( empty( $client ) ) {
			return new \WP_Error( 'newspack_magic_link_invalid_client', __( 'Invalid client.', 'newspack' ) );
		}
		$token_data = [
			'token'  => $token,
			'client' => $client,
			'time'   => $now,
		];
		$tokens[]   = $token_data;
		\update_user_meta( $user->ID, self::USER_META, $tokens );
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
	private static function generate_url( $user, $url = '' ) {
		$token_data = self::generate_token( $user );
		if ( \is_wp_error( $token_data ) ) {
			return $token_data;
		}
		return \add_query_arg(
			[
				'action' => self::FORM_ACTION,
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
	public static function send_email( $user ) {
		if ( ! Reader_Activation::is_enabled() ) {
			return new \WP_Error( 'newspack_magic_link_disabled', __( 'Magic links are disabled.', 'newspack' ) );
		}

		if ( ! Reader_Activation::is_user_reader( $user ) ) {
			return new \WP_Error( 'newspack_magic_link_invalid_user', __( 'User is not a reader.', 'newspack' ) );
		}

		$magic_link_url = self::generate_url( $user );

		if ( \is_wp_error( $magic_link_url ) ) {
			return $magic_link_url;
		}

		$blogname = \wp_specialchars_decode( \get_option( 'blogname' ), ENT_QUOTES );

		$switched_locale = \switch_to_locale( \get_user_locale( $user ) );

		/* translators: %s: Site title. */
		$message  = sprintf( __( 'Welcome back to %s!', 'newspack' ), $blogname ) . "\r\n\r\n";
		$message .= __( 'Authenticate your account by visiting the following address:', 'newspack' ) . "\r\n\r\n";
		$message .= $magic_link_url . "\r\n";

		$args = [
			'to'      => $user->user_email,
			/* translators: %s Site title. */
			'subject' => __( '[%s] Authentication link', 'newspack' ),
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
		$args = \apply_filters( 'newspack_magic_link_email', $args, $user, $magic_link );

		$sent = \wp_mail( // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.wp_mail_wp_mail
			$args['to'],
			\wp_specialchars_decode( sprintf( $args['subject'], $blogname ) ),
			$args['message'],
			$args['headers']
		);

		if ( $switched_locale ) {
			\restore_previous_locale();
		}

		return $sent;
	}

	/**
	 * Verify and returns the valid token given a user, token and client.
	 * 
	 * This method cleans up expired tokens and returns the token data for
	 * immediate use.
	 *
	 * @param int    $user_id User ID.
	 * @param string $client  Client hash.
	 * @param string $token   Token to verify.
	 *
	 * @return array|\WP_Error {
	 *   Token data.
	 *
	 *   @type string $token  The token.
	 *   @type string $client Client hash.
	 *   @type string $time   Token creation time.
	 * }
	 */
	private static function validate_token( $user_id, $client, $token ) {
		$errors = new \WP_Error();
		$user   = \get_user_by( 'id', $user_id );

		if ( ! $user ) {
			$errors->add( 'invalid_user', __( 'User not found.', 'newspack' ) );
		} elseif ( ! Reader_Activation::is_user_reader( $user ) ) {
			$errors->add( 'invalid_user_type', __( 'Not allowed for this user', 'newspack' ) );
		} else {
			$auth_intention = Reader_Activation::get_auth_intention();
			if ( $user->user_email !== $auth_intention ) {
				$errors->add( 'invalid_auth_intention', __( 'Invalid client.', 'newspack' ) );
			}
			$tokens = \get_user_meta( $user->ID, self::USER_META, true );
			if ( empty( $tokens ) || empty( $token ) ) {
				$errors->add( 'invalid_token', __( 'Invalid token.', 'newspack' ) );
			}
		}

		$valid_token = false;

		if ( ! $errors->has_errors() ) {
			$expire = time() - self::get_token_expiration_period();

			foreach ( $tokens as $index => $token_data ) {
				if ( $token_data['time'] < $expire ) {
					unset( $tokens[ $index ] );

				} elseif ( $token_data['token'] === $token ) {
					$valid_token = $token_data;

					if ( $token_data['client'] !== $client ) {
						$errors->add( 'invalid_client', __( 'Invalid client.', 'newspack' ) );
					}

					unset( $tokens[ $index ] );
					break;
				}
			}

			if ( empty( $valid_token ) ) {
				$errors->add( 'expired_token', __( 'Token has expired.', 'newspack' ) );
			}
			self::clear_cookie();

			$tokens = array_values( $tokens );
			\update_user_meta( $user->ID, self::USER_META, $tokens );
		}

		return $errors->has_errors() ? $errors : $valid_token;
	}

	/**
	 * Handle a reader authentication attempt using magic link token.
	 *
	 * @param int    $user_id User ID.
	 * @param string $token   Token to authenticate.
	 *
	 * @return bool|\WP_Error Whether the user was authenticated or WP_Error.
	 */
	private static function authenticate( $user_id, $token ) {
		if ( \is_user_logged_in() ) {
			return false;
		}

		$client     = self::get_client_hash();
		$token_data = self::validate_token( $user_id, $client, $token );

		if ( \is_wp_error( $token_data ) ) {
			return $token_data;
		}

		if ( empty( $token_data ) ) {
			return false;
		}

		$user = \get_user_by( 'id', $user_id );
		Reader_Activation::authenticate_reader( $user->ID, true );

		/**
		 * Fires after a reader has been authenticated via magic link.
		 *
		 * @param \WP_User $user User that has been authenticated.
		 */
		do_action( 'newspack_magic_link_authenticated', $user );

		return true;
	}

	/**
	 * Process magic link token from request.
	 */
	public static function process_token_request() {
		if ( ! Reader_Activation::is_enabled() ) {
			return;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['action'] ) || self::FORM_ACTION !== $_GET['action'] ) {
			return;
		}
		if ( ! isset( $_GET['token'] ) || ! isset( $_GET['uid'] ) ) {
			\wp_die( \esc_html__( 'Invalid request.', 'newspack' ) );
		}

		$user_id       = \absint( \wp_unslash( $_GET['uid'] ) );
		$token         = \sanitize_text_field( \wp_unslash( $_GET['token'] ) );
		$authenticated = self::authenticate( $user_id, $token );

		if ( \is_wp_error( $authenticated ) ) {
			/** Do not disclose error messages. */
			\wp_die( \esc_html__( 'We were not able to authenticate through this link.', 'newspack' ) );
		}

		\wp_safe_redirect( \remove_query_arg( [ 'action', 'uid', 'token' ] ) );
		exit;
		// phpcs:enable 
	}
}
Magic_Link::init();

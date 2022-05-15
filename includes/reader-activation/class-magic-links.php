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
final class Magic_Links {

	const FORM_ACTION = 'np_magic_link';

	const TOKENS = 'np_magic_link_tokens';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'template_redirect', [ __CLASS__, 'process_token_request' ] );
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
	 * Get the hashed client IP address.
	 *
	 * Meant to associate a generated magic link token to its client to prevent
	 * nonmalicious authentication by a 3rd party from eventual accidentally
	 * forwarded magic link emails.
	 *
	 * The HTTP_X_FORWARDED_FOR header is user-controlled and REMOTE_ADDR can be
	 * spoofed. This is not meant to guarantee that an exposed token is secured.
	 *
	 * @return string|null Hashed IP address or null if not detected.
	 */
	private static function get_client_ip_hash() {
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
		$tokens = \get_user_meta( $user->ID, self::TOKENS, true );
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
		$client = self::get_client_ip_hash();
		if ( empty( $client ) ) {
			return new \WP_Error( 'newspack_magic_link_invalid_client', __( 'Invalid client.', 'newspack' ) );
		}
		$token_data = [
			'token'  => $token,
			'client' => $client,
			'time'   => $now,
		];
		$tokens[]   = $token_data;
		\update_user_meta( $user->ID, self::TOKENS, $tokens );
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
		$magic_link_url = self::generate_url( $user );

		if ( \is_wp_error( $magic_link_url ) ) {
			return $magic_link_url;
		}

		$blogname = \wp_specialchars_decode( \get_option( 'blogname' ), ENT_QUOTES );

		$switched_locale = \switch_to_locale( \get_user_locale( $user ) );

		/* translators: %s: Site title. */
		$message = sprintf( __( 'Welcome back to %s!', 'newspack' ), $blogname ) . "\r\n\r\n";
		/* translators: %s: Magic link url. */
		$message .= __( 'To continue your navigation, authenticate by visiting the following address:', 'newspack' ) . "\r\n\r\n";
		$message .= $magic_link_url . "\r\n";

		$args = [
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
	 * @param string $client  Client.
	 * @param string $token   Token to verify.
	 *
	 * @return array|\WP_Error {
	 *   Token data.
	 *
	 *   @type string $token  The token.
	 *   @type string $client Origin IP hash.
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
			$tokens = \get_user_meta( $user->ID, self::TOKENS, true );
			if ( empty( $tokens ) || empty( $token ) ) {
				$errors->add( 'invalid_token', __( 'Invalid token.', 'newspack' ) );
			}
		}

		$valid_token = false;

		if ( ! $errors->has_errors() ) {
			$expire = time() - self::get_token_expiration_period();

			foreach ( $tokens as $index => $token_data ) {
				/** Clear expired tokens. */
				if ( $token_data['time'] < $expire ) {
					unset( $tokens[ $index ] );
				} else {
					/** Verify token for authentication. */
					if ( $token_data['token'] === $token && $token_data['client'] === $client ) {
						$valid_token = $token_data;
						unset( $tokens[ $index ] );
						break;
					}
				}
			}

			if ( empty( $valid_token ) ) {
				$errors->add( 'expired_token', __( 'Token has expired.', 'newspack' ) );
			}

			$tokens = array_values( $tokens );
			\update_user_meta( $user->ID, self::TOKENS, $tokens );
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

		$client     = self::get_client_ip_hash();
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
		/**
		 * Nonce verification not required due the use of a secret token, which is
		 * enough for CSRF protection.
		 * phpcs:disable WordPress.Security.NonceVerification.Recommended
		 */
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
			/** Do not expose specific error messages to the user. */
			\wp_die( \esc_html__( 'We were not able to authenticate through the magic link. Please, request a new link.', 'newspack' ) );
		}

		\wp_safe_redirect( \remove_query_arg( [ 'action', 'uid', 'token' ] ) );
		exit;
		// phpcs:enable 
	}
}
Magic_Links::init();

<?php
/**
 * Reader Activation - Reader Class.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;

/**
 * Reader Class.
 */
final class Reader extends \WP_User {
	/**
	 * Constructor.
	 *
	 * @param int $id User ID.
	 *
	 * @throws \Exception If user is not a reader.
	 */
	public function __construct( $id = 0 ) {
		parent::__construct( $id );

		if ( ! $this->is_reader() ) {
			throw new \Exception( 'User is not a reader.' );
		}
	}

	/**
	 * Get the user roles that can determine if a user is a reader.
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
	 * Check if user is a reader.
	 *
	 * @param bool $strict Whether to check if the user was created through reader registration. Default false.
	 *
	 * @return bool True if user is a reader, false otherwise.
	 */
	private function is_reader( $strict = false ) {
		$is_reader = (bool) \get_user_meta( $this->ID, Reader_Activation::READER, true );

		if ( false === $is_reader && false === $strict ) {
			$reader_roles = Reader_Activation::get_reader_roles();
			if ( ! empty( $reader_roles ) ) {
				$is_reader = ! empty( array_intersect( $reader_roles, $this->roles ) );
			}
		}

		/**
		 * Filters roles that restricts a user from being a reader.
		 *
		 * @param string[] $roles Array of user roles that restrict a user from being a reader.
		 */
		$restricted_roles = \apply_filters( 'newspack_reader_restricted_roles', [ 'administrator', 'editor' ] );
		if ( ! empty( $restricted_roles ) && $is_reader && ! empty( array_intersect( $restricted_roles, $this->roles ) ) ) {
			$is_reader = false;
		}

		/**
		 * Filters whether the user is a reader.
		 *
		 * @param bool     $is_reader Whether the user is a reader.
		 * @param \WP_User $user      User object.
		 */
		return (bool) \apply_filters( 'newspack_is_user_reader', $is_reader, $this );
	}

	/**
	 * Check if user has set a password.
	 *
	 * @return bool True if user has set a password, false otherwise.
	 */
	public function is_without_password() {
		return (bool) \get_user_meta( $this->ID, Reader_Activation::WITHOUT_PASSWORD, false );
	}

	/**
	 * Mark that reader has set a password.
	 *
	 * @return void
	 */
	public function remove_without_password() {
		\delete_user_meta( $this->ID, Reader_Activation::WITHOUT_PASSWORD );
	}

	/**
	 * Whether the user is rate limited for sending verification emails.
	 *
	 * @return bool True if the user is rate limited, false otherwise.
	 */
	private function is_email_rate_limited() {
		if ( $this->is_verified() ) {
			return false;
		}
		$last_email = get_user_meta( $this->ID, Reader_Activation::LAST_EMAIL_DATE, true );
		return $last_email && Reader_Activation::EMAIL_INTERVAL > time() - $last_email;
	}

	/**
	 * Send verification email.
	 *
	 * @return bool|\WP_Error Whether the email was sent or WP_Error if sending failed.
	 */
	public function send_verification_email() {
		$redirect_to = function_exists( '\wc_get_account_endpoint_url' ) ? \wc_get_account_endpoint_url( 'dashboard' ) : '';
		/** Rate limit control */
		if ( $this->is_email_rate_limited() ) {
			return new \WP_Error( 'newspack_verification_email_interval', __( 'Please wait before requesting another verification email.', 'newspack-plugin' ) );
		}
		\update_user_meta( $this->ID, Reader_Activation::LAST_EMAIL_DATE, time() );
		return Emails::send_email(
			Reader_Activation_Emails::EMAIL_TYPES['VERIFICATION'],
			$this->user_email,
			[
				[
					'template' => '*VERIFICATION_URL*',
					'value'    => Magic_Link::generate_url( $this, $redirect_to ),
				],
			]
		);
	}


	/**
	 * Check if user has verified their email address.
	 *
	 * @return bool True if user has verified their email address, false otherwise.
	 */
	public function is_verified() {
		return (bool) \get_user_meta( $this->ID, Reader_Activation::EMAIL_VERIFIED, true );
	}

	/**
	 * Mark the reader as verified.
	 *
	 * @return void
	 */
	public function verify() {
		\update_user_meta( $user->ID, self::EMAIL_VERIFIED, true );

		WooCommerce_Connection::add_wc_notice( __( 'Thank you for verifying your account!', 'newspack-plugin' ), 'success' );

		/**
		 * Upon verification we want to destroy existing sessions to prevent a bad
		 * actor having originated the account creation from accessing the, now
		 * verified, account.
		 *
		 * If the verification is for the current user, we destroy other sessions.
		 */
		if ( get_current_user_id() === $this->ID ) {
			\wp_destroy_other_sessions();
		} else {
			$session_tokens = \WP_Session_Tokens::get_instance( $this->ID );
			$session_tokens->destroy_all();
		}

		/**
		 * Fires after a reader's email address is verified.
		 *
		 * @param \WP_User $user User object.
		 */
		do_action( 'newspack_reader_verified', $this );
	}
}

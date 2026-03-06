<?php
/**
 * Newspack Group Subscription invitations.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack Group Subscription Invite class.
 */
class Group_Subscription_Invite {
	/**
	 * The query arg for the group subscription invitation.
	 *
	 * @var string
	 */
	const QUERY_ARG = 'group_invite';

	/**
	 * The subscription meta key for group subscription invite keys.
	 *
	 * @var string
	 */
	const META = 'newspack_group_subscription_invites';

	/**
	 * The email type for group subscription invitations.
	 *
	 * @var string
	 */
	const EMAIL_TYPE = 'group-subscription-invite';

	/**
	 * Cookie name for deferred invite acceptance.
	 *
	 * @var string
	 */
	const COOKIE_NAME = 'newspack_group_invite';

	/**
	 * Cookie expiry in seconds (1 hour).
	 *
	 * @var int
	 */
	const COOKIE_EXPIRY = 3600;

	/**
	 * Query arg for invite result notices.
	 *
	 * @var string
	 */
	const RESULT_QUERY_ARG = 'group_invite_result';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'newspack_email_configs', [ __CLASS__, 'add_email_config' ] );
		add_action( 'template_redirect', [ __CLASS__, 'process_invite_request' ] );
		add_action( 'wp_login', [ __CLASS__, 'process_deferred_invite' ], 10, 2 );
		add_action( 'init', [ __CLASS__, 'render_invite_notice' ] );
	}

	/**
	 * Register the group subscription invite email config.
	 *
	 * @param array $configs Email configs.
	 * @return array Modified email configs.
	 */
	public static function add_email_config( $configs ) {
		$configs[ self::EMAIL_TYPE ] = [
			'name'                   => self::EMAIL_TYPE,
			'category'               => 'reader-activation',
			'label'                  => __( 'Group Subscription Invitation', 'newspack-plugin' ),
			'description'            => __( 'Email sent to invite a reader to join a group subscription.', 'newspack-plugin' ),
			'template'               => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-activation-emails/group-subscription-invite.php',
			'editor_notice'          => __( 'This email will be sent when a reader is invited to join a group subscription.', 'newspack-plugin' ),
			'available_placeholders' => [
				[
					'label'    => __( 'the site title', 'newspack-plugin' ),
					'template' => '*SITE_TITLE*',
				],
				[
					'label'    => __( 'the site url', 'newspack-plugin' ),
					'template' => '*SITE_URL*',
				],
				[
					'label'    => __( 'the invitation acceptance link', 'newspack-plugin' ),
					'template' => '*INVITE_URL*',
				],
				[
					'label'    => __( 'the sender name', 'newspack-plugin' ),
					'template' => '*SENDER_NAME*',
				],
				[
					'label'    => __( 'the sender email address', 'newspack-plugin' ),
					'template' => '*SENDER_EMAIL*',
				],
				[
					'label'    => __( 'the recipient email address', 'newspack-plugin' ),
					'template' => '*RECIPIENT_EMAIL*',
				],
			],
		];
		return $configs;
	}

	/**
	 * Get the expiration time for a group subscription invitation.
	 * Default is 30 days after the invitation is generated.
	 *
	 * @return int The expiration time.
	 */
	public static function get_expiration_time() {
		return apply_filters( 'newspack_group_subscription_invite_expiration_time', 30 * DAY_IN_SECONDS );
	}

	/**
	 * Check if a group subscription invitation has expired.
	 * Expiration timestamps are stored as an array map keyed by invite key.
	 *
	 * @param array $invite The invite data.
	 *
	 * @return bool Whether the invitation has expired.
	 */
	public static function is_invite_expired( $invite ) {
		return $invite['expiration'] < time();
	}

	/**
	 * Get invitations for a given subscription.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param bool                 $show_expired If true, show expired invitations.
	 *
	 * @return array The invitations.
	 */
	public static function get_invites( $subscription, $show_expired = true ) {
		$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription );
		if ( ! $subscription ) {
			return [];
		}
		$all_invites = $subscription->get_meta( self::META, true );
		if ( ! is_array( $all_invites ) ) {
			return [];
		}
		if ( ! $show_expired ) {
			foreach ( $all_invites as $key => $invite ) {
				if ( self::is_invite_expired( $invite ) ) {
					unset( $all_invites[ $key ] );
				}
			}
		}
		return $all_invites;
	}

	/**
	 * Generate a group subscription invite key.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param string               $email The email address receiving the invitation.
	 *
	 * @return array|WP_Error The invite data, or a WP_Error if the key cannot be generated.
	 */
	public static function generate_invite( $subscription, $email ) {
		$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription );
		if ( ! $subscription || ! Group_Subscription::is_group_subscription( $subscription ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_subscription', __( 'Invalid subscription.', 'newspack-plugin' ) );
		}
		if ( ! $email ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_email', __( 'Invalid email address.', 'newspack-plugin' ) );
		}
		$existing_user = get_user_by( 'email', $email );
		if ( $existing_user && ! Reader_Activation::is_user_reader( $existing_user ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_non_reader', __( 'Not a valid reader account.', 'newspack-plugin' ) );
		}
		if ( $existing_user && in_array( (int) $existing_user->ID, array_map( 'absint', Group_Subscription::get_members( $subscription ) ), true ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_existing_user', __( 'User is already a member of this group subscription.', 'newspack-plugin' ) );
		}

		// Delete any invites for the given email address. There should only be one invitation per email address.
		$all_invites = self::get_invites( $subscription );
		foreach ( $all_invites as $key => $invite ) {
			if ( $invite['email'] === $email ) {
				unset( $all_invites[ $key ] );
			}
		}

		// The number of pending invites + existing members should not exceed the subscription member limit.
		$pending_invites_count = count(
			array_filter(
				array_values( $all_invites ),
				function( $invite_data ) {
					return ! self::is_invite_expired( $invite_data );
				}
			)
		);
		$subscription_settings = Group_Subscription_Settings::get_subscription_settings( $subscription );
		if ( $subscription_settings['limit'] > 0 ) {
			if ( $pending_invites_count + count( Group_Subscription::get_members( $subscription ) ) >= $subscription_settings['limit'] ) {
				return new \WP_Error( 'newspack_group_subscription_invite_limit_reached', __( 'You have reached the group member limit for this subscription. Please remove some members or cancel pending invitations before inviting more group members.', 'newspack-plugin' ) );
			}
		}

		// Add the new invite.
		$invite_key = wp_generate_password( 32, false );
		$new_invite = [
			'added_by'   => get_current_user_id(),
			'email'      => $email,
			'expiration' => time() + self::get_expiration_time(),
		];
		$all_invites[ $invite_key ] = $new_invite;

		$subscription->update_meta_data( self::META, $all_invites );
		$subscription->save();

		self::send_invite_email( $subscription->get_id(), $invite_key, $email );

		return $new_invite;
	}

	/**
	 * Send an invitation email.
	 *
	 * @param int    $subscription_id The subscription ID.
	 * @param string $key The invite key.
	 * @param string $email The invited email address.
	 *
	 * @return bool Whether the email was sent.
	 */
	public static function send_invite_email( $subscription_id, $key, $email ) {
		$url          = self::get_invite_url( $subscription_id, $key, $email );
		$invite       = self::get_invite_by_key( $subscription_id, $key );
		$sender_email = '';
		$sender_name  = '';
		if ( $invite && ! empty( $invite['added_by'] ) ) {
			$sender = get_user_by( 'id', $invite['added_by'] );
			if ( $sender ) {
				$sender_email = $sender->user_email;
				$sender_name  = $sender->display_name;
			}
		}
		return Emails::send_email(
			self::EMAIL_TYPE,
			$email,
			[
				[
					'template' => '*INVITE_URL*',
					'value'    => $url,
				],
				[
					'template' => '*SENDER_NAME*',
					'value'    => $sender_name,
				],
				[
					'template' => '*SENDER_EMAIL*',
					'value'    => $sender_email,
				],
				[
					'template' => '*RECIPIENT_EMAIL*',
					'value'    => $email,
				],
			]
		);
	}

	/**
	 * Accept a group subscription invitation.
	 * Validates the invite, adds the user to the group, and deletes the invite.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param string               $key The invite key.
	 * @param string               $email The email address of the invitee.
	 *
	 * @return true|\WP_Error True on success, or a WP_Error on failure.
	 */
	public static function accept_invite( $subscription, $key, $email ) {
		$invite = self::get_invite_by_key( $subscription, $key );
		if ( ! $invite || $invite['email'] !== $email ) {
			return new \WP_Error( 'newspack_group_subscription_invite_not_found', __( 'Invalid or expired invitation.', 'newspack-plugin' ) );
		}
		if ( self::is_invite_expired( $invite ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_expired', __( 'This invitation has expired.', 'newspack-plugin' ) );
		}

		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			return new \WP_Error( 'newspack_group_subscription_invite_no_user', __( 'No user found for this email address.', 'newspack-plugin' ) );
		}

		$result = Group_Subscription::update_members( $subscription, [ $user->ID ] );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		self::cancel_invite( $subscription, $email );
		return true;
	}

	/**
	 * Get the invite URL for a group subscription invitation.
	 *
	 * @param int    $subscription_id The subscription ID.
	 * @param string $key The invite key.
	 * @param string $email The invited email address.
	 *
	 * @return string The invite URL.
	 */
	public static function get_invite_url( $subscription_id, $key, $email ) {
		return add_query_arg(
			[
				'action'       => self::QUERY_ARG,
				'key'          => $key,
				'email'        => rawurlencode( $email ),
				'subscription' => $subscription_id,
			],
			home_url()
		);
	}

	/**
	 * Get an invite by its key.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param string               $key The invite key.
	 *
	 * @return array|null The invite data, or null if not found.
	 */
	public static function get_invite_by_key( $subscription, $key ) {
		$invites = self::get_invites( $subscription );
		return $invites[ $key ] ?? null;
	}

	/**
	 * Process an invite link request.
	 * Handles the ?action=group_invite URL.
	 */
	public static function process_invite_request() {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return;
		}
		if ( ! isset( $_GET['action'] ) || self::QUERY_ARG !== $_GET['action'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$key             = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$email           = isset( $_GET['email'] ) ? sanitize_email( wp_unslash( $_GET['email'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$subscription_id = isset( $_GET['subscription'] ) ? absint( $_GET['subscription'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( ! $key || ! $email || ! $subscription_id ) {
			self::redirect_with_result( 'error', __( 'Invalid invitation link.', 'newspack-plugin' ) );
			return;
		}

		$current_user = wp_get_current_user();

		// Case 1: User is logged in.
		if ( $current_user->ID ) {
			if ( $current_user->user_email !== $email ) {
				self::redirect_with_result( 'error', __( 'This invitation is for a different email address.', 'newspack-plugin' ) );
				return;
			}
			$result = self::accept_invite( $subscription_id, $key, $email );
			if ( is_wp_error( $result ) ) {
				self::redirect_with_result( 'error', $result->get_error_message() );
				return;
			}
			self::redirect_with_result( 'success' );
			return;
		}

		// Case 2: User is not logged in but has an existing account — store invite in cookie and redirect to login.
		$existing_user = get_user_by( 'email', $email );
		if ( $existing_user ) {
			self::set_invite_cookie( $subscription_id, $key, $email );
			$login_url = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : wp_login_url();
			wp_safe_redirect( $login_url );
			exit;
		}

		// Case 3: New user — auto-create account, verify email, and accept.
		$user_id = Reader_Activation::register_reader( $email, false );
		if ( is_wp_error( $user_id ) || ! $user_id ) {
			self::redirect_with_result( 'error', __( 'Could not create your account. Please try again.', 'newspack-plugin' ) );
			return;
		}
		Reader_Activation::set_reader_verified( $user_id );
		Reader_Activation::set_current_reader( $user_id );

		$result = self::accept_invite( $subscription_id, $key, $email );
		if ( is_wp_error( $result ) ) {
			self::redirect_with_result( 'error', $result->get_error_message() );
			return;
		}
		self::redirect_with_result( 'success' );
	}

	/**
	 * Process a deferred invite after login.
	 * Fires on the wp_login action.
	 *
	 * @param string   $user_login The user login.
	 * @param \WP_User $user The user object.
	 */
	public static function process_deferred_invite( $user_login, $user ) {
		$invite_data = self::get_and_clear_invite_cookie();
		if ( ! $invite_data ) {
			return;
		}

		$email = $invite_data['email'] ?? '';
		if ( $user->user_email !== $email ) {
			return;
		}

		$result = self::accept_invite(
			$invite_data['subscription'] ?? 0,
			$invite_data['key'] ?? '',
			$email
		);

		if ( ! is_wp_error( $result ) ) {
			set_transient( 'np_group_invite_accepted_' . $user->ID, true, 60 );
		}
	}

	/**
	 * Render invite result notice.
	 */
	public static function render_invite_notice() {
		if ( ! function_exists( 'wc_add_notice' ) ) {
			return;
		}

		$result = isset( $_GET[ self::RESULT_QUERY_ARG ] ) ? sanitize_text_field( wp_unslash( $_GET[ self::RESULT_QUERY_ARG ] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! $result ) {
			// Check for deferred acceptance notice.
			$user_id = get_current_user_id();
			if ( $user_id && get_transient( 'np_group_invite_accepted_' . $user_id ) ) {
				delete_transient( 'np_group_invite_accepted_' . $user_id );
				$result = 'success';
			}
		}
		if ( ! $result ) {
			return;
		}

		if ( 'success' === $result ) {
			$message = __( 'You have successfully joined the group!', 'newspack-plugin' );
			$type    = 'success';
		} else {
			$message = __( 'There was a problem with your invitation.', 'newspack-plugin' );
			if ( isset( $_GET['message_key'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$transient_key  = sanitize_text_field( wp_unslash( $_GET['message_key'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$stored_message = get_transient( 'np_group_invite_msg_' . $transient_key );
				if ( $stored_message ) {
					$message = $stored_message;
					delete_transient( $transient_key );
				}
			}
			$type = 'error';
		}

		wc_add_notice( $message, $type );
	}

	/**
	 * Redirect to home with a result query parameter.
	 *
	 * @param string $status 'success' or 'error'.
	 * @param string $message Optional error message.
	 */
	private static function redirect_with_result( $status, $message = '' ) {
		$args = [ self::RESULT_QUERY_ARG => $status ];
		if ( 'error' === $status && $message ) {
			// Store message in a transient since it can be too long for a query param.
			$transient_key = wp_generate_password( 8, false );
			set_transient( 'np_group_invite_msg_' . $transient_key, $message, 60 );
			$args['message_key'] = $transient_key;
		}
		wp_safe_redirect( add_query_arg( $args, function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : home_url() ) );
		exit;
	}

	/**
	 * Set a cookie with invite params for deferred acceptance after login.
	 *
	 * @param int    $subscription_id The subscription ID.
	 * @param string $key The invite key.
	 * @param string $email The invited email address.
	 */
	private static function set_invite_cookie( $subscription_id, $key, $email ) {
		$value = wp_json_encode(
			[
				'subscription' => $subscription_id,
				'key'          => $key,
				'email'        => $email,
			]
		);
		setcookie( self::COOKIE_NAME, $value, time() + self::COOKIE_EXPIRY, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
	}

	/**
	 * Get and clear the invite cookie.
	 *
	 * @return array|null The invite params or null.
	 */
	private static function get_and_clear_invite_cookie() {
		if ( ! isset( $_COOKIE[ self::COOKIE_NAME ] ) ) { // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
			return null;
		}
		$data = json_decode( sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE_NAME ] ) ), true ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		// Clear the cookie.
		setcookie( self::COOKIE_NAME, '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.cookies_setcookie
		return is_array( $data ) ? $data : null;
	}

	/**
	 * Cancel a pending invite for a given subscription and email address.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param string               $email The email address receiving the invitation.
	 *
	 * @return true|\WP_Error Whether the invite was cancelled, or a WP_Error if the invite cannot be cancelled.
	 */
	public static function cancel_invite( $subscription, $email ) {
		$subscription = WooCommerce_Subscriptions::sanitize_subscription( $subscription );
		if ( ! $subscription || ! Group_Subscription::is_group_subscription( $subscription ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_subscription', __( 'Invalid subscription.', 'newspack-plugin' ) );
		}
		if ( ! $email ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_email', __( 'Invalid email address.', 'newspack-plugin' ) );
		}
		$all_invites = self::get_invites( $subscription );
		foreach ( $all_invites as $key => $invite ) {
			if ( $invite['email'] === $email ) {
				unset( $all_invites[ $key ] );
			}
		}
		$subscription->update_meta_data( self::META, $all_invites );
		$subscription->save();
		return true;
	}
}
Group_Subscription_Invite::init();

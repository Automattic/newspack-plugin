<?php
/**
 * Newspack Group Subscription invitations.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Settings class.
 */
class Group_Subscription_Invite {
	/**
	 * The query arg for the group subscription invititation.
	 *
	 * @var string
	 */
	const QUERY_ARG = 'group_invite';

	/**
	 * The subscription meta key for group subscription invitations.
	 *
	 * @var string
	 */
	const META = 'newspack_group_subscription_invites';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return;
		}
	}

	/**
	 * Get the expiration time for a group subscription invitation.
	 * Default is 30 days.
	 *
	 * @return int The expiration time.
	 */
	public static function get_invite_expiration_time() {
		return apply_filters( 'newspack_group_subscription_invite_expiration_time', 30 * DAY_IN_SECONDS );
	}

	/**
	 * Check if a group subscription invitation has expired.
	 *
	 * @param array $invite The invitation data.
	 *
	 * @return bool Whether the invitation has expired.
	 */
	public static function is_invite_expired( $invite ) {
		return $invite['timestamp'] + self::get_invite_expiration_time() < time();
	}

	/**
	 * Generate a group subscription invitation key.
	 *
	 * @param int    $subscription_id The subscription ID the key is for.
	 * @param string $email The email address receiving the invitation.
	 *
	 * @return array|WP_Error The invitation data, or a WP_Error if the key cannot be generated.
	 */
	public static function generate_invite_key( $subscription_id, $email ) {
		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription || ! Group_Subscription::is_group_subscription( $subscription ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_subscription', __( 'Invalid subscription.', 'newspack-plugin' ) );
		}
		if ( ! $email ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_email', __( 'Invalid email address.', 'newspack-plugin' ) );
		}
		if ( ! current_user_can( 'manage_woocommerce' ) && ! Group_Subscription::user_is_manager( get_current_user_id(), $subscription ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_invalid_user', __( 'User is not a manager of this group subscription.', 'newspack-plugin' ) );
		}
		$existing_invites = $subscription->get_meta( self::META, true );
		if ( ! $existing_invites ) {
			$existing_invites = [];
		}

		// Filter out any invites for the given email address. There should only be one invitation per email address.
		$all_invites = array_values(
			array_filter(
				$existing_invites,
				function( $invite ) use ( $email ) {
					return $invite['email'] !== $email;
				}
			)
		);

		// Filter out non-expired invites. The number of active invites and existing members/managers should not exceed the subscription member limit.
		$valid_invites = array_values(
			array_filter(
				$all_invites,
				function( $invite ) {
					return ! self::is_invite_expired( $invite );
				}
			)
		);
		$subscription_settings = Group_Subscription_Settings::get_subscription_settings( $subscription );
		if ( $subscription_settings['limit'] > 0 ) {
			if ( count( $valid_invites ) + count( Group_Subscription::get_members( $subscription ) ) + count( Group_Subscription::get_managers( $subscription ) ) >= $subscription_settings['limit'] ) {
				return new \WP_Error( 'newspack_group_subscription_invite_limit_reached', __( 'You have reached the group member limit for this subscription. Please remove some members or cancel pending invitations before inviting more group members.', 'newspack-plugin' ) );
			}
		}

		// Add the new invite.
		$invite_data = [
			'key'       => wp_generate_password( 32, false ),
			'user_id'   => get_current_user_id(),
			'email'     => $email,
			'timestamp' => time(), // When the key was generated.
		];

		$all_invites[] = $invite_data;
		$subscription->update_meta_data( self::META, $all_invites );
		$subscription->save();
		return $invite_data;
	}
}

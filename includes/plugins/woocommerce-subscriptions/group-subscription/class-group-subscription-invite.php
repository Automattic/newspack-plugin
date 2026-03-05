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
	 * Initialize hooks.
	 */
	public static function init() {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return;
		}
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
		return $new_invite;
	}

	/**
	 * Cancel a pending invite for a given subscription and email address.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param string               $email The email address receiving the invitation.
	 *
	 * @return true|WP_Error Whether the invite was cancelled, or a WP_Error if the invite cannot be cancelled.
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

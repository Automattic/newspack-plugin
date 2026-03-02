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
	 * The subscription meta key for group subscription invite keys.
	 *
	 * @var string
	 */
	const META = 'newspack_group_subscription_invite_key';

	/**
	 * The subscription meta key for storing group subscription expiration timestamps for each invite key.
	 *
	 * @var string
	 */
	const EXPIRATION_META = 'newspack_group_subscription_invite_expirations';

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
	 * @param \WC_Subscription $subscription The subscription object.
	 * @param string           $invite_key The invite key to check.
	 *
	 * @return bool Whether the invitation has expired.
	 */
	public static function is_invite_expired( $subscription, $invite_key ) {
		$expirations = $subscription->get_meta( self::EXPIRATION_META, true );

		// No timestamp found for this key; assume it's expired.
		if ( ! isset( $expirations[ $invite_key ] ) ) {
			return true;
		}
		return $expirations[ $invite_key ]['expiration'] < time();
	}

	/**
	 * Add an expiration timetamp for the given invite key.
	 * Expiration timestamps are stored as an array map keyed by invite key.
	 *
	 * @param \WC_Subscription $subscription The subscription object.
	 * @param string           $email The email address receiving the invitation.
	 */
	public static function add_invite_expiration( $subscription, $email ) {
		$expirations = $subscription->get_meta( self::EXPIRATION_META, true );
		if ( ! is_array( $expirations ) ) {
			$expirations = [];
		}
		$expirations[ wp_hash( $email ) ] = [
			'expiration' => time() + self::get_expiration_time(),
			'email'      => $email,
		];
		$subscription->update_meta_data( self::EXPIRATION_META, $expirations );
		$subscription->save();
	}

	/**
	 * Remove an expiration timestamp for the given invite key.
	 * Expiration timestamps are stored as an array map keyed by invite key.
	 *
	 * @param \WC_Subscription $subscription The subscription object.
	 * @param string           $email The email address receiving the invitation.
	 */
	public static function remove_invite_expiration( $subscription, $email ) {
		$expirations = $subscription->get_meta( self::EXPIRATION_META, true );
		if ( ! is_array( $expirations ) ) {
			$expirations = [];
		}
		unset( $expirations[ wp_hash( $email ) ] );
		$subscription->update_meta_data( self::EXPIRATION_META, $expirations );
		$subscription->save();
	}

	/**
	 * Get invitations for a given subscription.
	 *
	 * @param \WC_Subscription|int $subscription The subscription object or ID.
	 * @param bool                 $show_expired If true, show expired invitations.
	 */
	public static function get_invites( $subscription, $show_expired = true ) {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return new \WP_Error( 'newspack_group_subscription_get_invites', __( 'WooCommerce Subscriptions is not available.', 'newspack-plugin' ) );
		}
		if ( ! is_a( $subscription, 'WC_Subscription' ) ) {
			$subscription = \wcs_get_subscription( $subscription );
		}
		if ( ! $subscription || ! Group_Subscription::is_group_subscription( $subscription ) ) {
			return new \WP_Error( 'newspack_group_subscription_get_invites', __( 'Not a group subscription.', 'newspack-plugin' ) );
		}
		$all_invites = $subscription->get_meta( self::EXPIRATION_META, true );
		if ( ! is_array( $all_invites ) ) {
			$all_invites = [];
		}
		if ( ! $show_expired ) {
			foreach ( array_keys( $all_invites ) as $key ) {
				if ( self::is_invite_expired( $subscription, $key ) ) {
					unset( $all_invites[ $key ] );
				}
			}
		}
		return $all_invites;
	}

	/**
	 * Generate a group subscription invite key.
	 *
	 * @param int    $subscription_id The subscription ID the key is for.
	 * @param string $email The email address receiving the invitation.
	 *
	 * @return string|WP_Error The invite key, or a WP_Error if the key cannot be generated.
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
		$existing_user = get_user_by( 'email', $email );
		if ( $existing_user && ! Reader_Activation::is_user_reader( $existing_user ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_non_reader', __( 'Not a valid reader account.', 'newspack-plugin' ) );
		}
		if ( $existing_user && in_array( (int) $existing_user->ID, array_map( 'absint', Group_Subscription::get_members( $subscription ) ), true ) ) {
			return new \WP_Error( 'newspack_group_subscription_invite_existing_user', __( 'User is already a member of this group subscription.', 'newspack-plugin' ) );
		}

		// Invite keys are simply hashed versions of the sanitized email string.
		$invite_key = wp_hash( $email );

		// Delete any invites for the given email address. There should only be one invitation per email address.
		$subscription->delete_meta_data_value( self::META, $invite_key );

		// The number of pending invites + existing members + managers should not exceed the subscription member limit.
		$pending_invites = self::get_invites( $subscription, false );
		if ( empty( $pending_invites ) || ! is_array( $pending_invites ) ) {
			$pending_invites = [];
		}
		$subscription_settings = Group_Subscription_Settings::get_subscription_settings( $subscription );
		if ( $subscription_settings['limit'] > 0 ) {
			if ( count( $pending_invites ) + count( Group_Subscription::get_members( $subscription ) ) >= $subscription_settings['limit'] ) {
				return new \WP_Error( 'newspack_group_subscription_invite_limit_reached', __( 'You have reached the group member limit for this subscription. Please remove some members or cancel pending invitations before inviting more group members.', 'newspack-plugin' ) );
			}
		}

		// Add the new invite.
		$subscription->add_meta_data( self::META, $invite_key );
		self::add_invite_expiration( $subscription, $email );
		$subscription->save();
		return $invite_key;
	}

	/**
	 * Cancel a pending invite for a given subscription and email address.
	 *
	 * @param int    $subscription_id The subscription ID the key is for.
	 * @param string $email The email address receiving the invitation.
	 *
	 * @return bool Whether the invite was cancelled.
	 */
	public static function cancel_invite( $subscription_id, $email ) {
		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription || ! Group_Subscription::is_group_subscription( $subscription ) ) {
			return false;
		}
		if ( ! $email ) {
			return false;
		}
		if ( ! current_user_can( 'manage_woocommerce' ) && ! Group_Subscription::user_is_manager( get_current_user_id(), $subscription ) ) {
			return false;
		}
		$invite_key = wp_hash( $email );
		$subscription->delete_meta_data_value( self::META, $invite_key );
		self::remove_invite_expiration( $subscription, $email );
		$subscription->save();
		return true;
	}
}

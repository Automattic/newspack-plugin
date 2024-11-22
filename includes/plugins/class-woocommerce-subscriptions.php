<?php
/**
 * WooCommerce Subscriptions integration class.
 * https://wordpress.org/plugins/woocommerce
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class WooCommerce_Subscriptions {
	const CANCELLATION_REASON_META_KEY        = 'newspack_subscriptions_cancellation_reason';
	const CANCELLATION_REASON_USER_CANCELLED  = 'user-cancelled';
	const CANCELLATION_REASON_ADMIN_CANCELLED = 'manually-cancelled';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'woocommerce_subscription_status_changed', array( __CLASS__, 'maybe_record_cancelled_subscription' ), 10, 4 );
	}

	/**
	 * Check if WooCommerce Subscriptions is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return class_exists( 'WC_Subscriptions' ) && Reader_Activation::is_enabled();
	}

	/**
	 * Record woo custom field for cancelled subscriptions.
	 *
	 * @param int             $id            The subscription ID.
	 * @param string          $from_status   The status the subscription is changing from.
	 * @param string          $to_status     The status the subscription is changing to.
	 * @param WC_Subscription $subscription  The subscription object.
	 */
	public static function maybe_record_cancelled_subscription( $id, $from_status, $to_status, $subscription ) {
		if ( ! self::is_active() ) {
			return;
		}
		if ( 'cancelled' === $to_status && ! in_array( $from_status, [ 'cancelled', 'expired' ], true ) ) {
			$meta_value = is_admin() ? self::CANCELLATION_REASON_ADMIN_CANCELLED : self::CANCELLATION_REASON_USER_CANCELLED;
			$subscription->update_meta_data( self::CANCELLATION_REASON_META_KEY, $meta_value );
			$subscription->save();
		}
	}
}
WooCommerce_Subscriptions::init();

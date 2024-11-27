<?php
/**
 * WooCommerce Subscriptions meta class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Subscriptions_Meta {
	const CANCELLATION_REASON_META_KEY        = 'newspack_subscriptions_cancellation_reason';
	const CANCELLATION_REASON_USER_CANCELLED  = 'user-cancelled';
	const CANCELLATION_REASON_ADMIN_CANCELLED = 'manually-cancelled';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'woocommerce_subscription_status_updated', array( __CLASS__, 'maybe_record_cancelled_subscription_meta' ), 10, 3 );
	}

	/**
	 * Record woo custom field for cancelled subscriptions.
	 *
	 * @param WC_Subscription $subscription  The subscription object.
	 * @param string          $to_status     The status the subscription is changing to.
	 * @param string          $from_status   The status the subscription is changing from.
	 */
	public static function maybe_record_cancelled_subscription_meta( $subscription, $to_status, $from_status ) {
		if ( ! WooCommerce_Subscriptions::is_active() ) {
			return;
		}
		if ( 'cancelled' === $to_status && ! in_array( $from_status, [ 'cancelled', 'expired' ], true ) ) {
			$meta_value = $subscription->get_meta( self::CANCELLATION_REASON_META_KEY, true );
			if ( ! $meta_value ) {
				$meta_value = is_admin() ? self::CANCELLATION_REASON_ADMIN_CANCELLED : self::CANCELLATION_REASON_USER_CANCELLED;
				$subscription->update_meta_data( self::CANCELLATION_REASON_META_KEY, $meta_value );
				$subscription->save();
			}
		}
	}
}

<?php
/**
 * Newspack WooCommerce Update Payment Notice.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Class for the update payment notice.
 */
class WooCommerce_Update_Payment_Notice {
	/**
	 * Initialize the class.
	 */
	public static function init() {
		add_action( 'wp', [ __CLASS__, 'maybe_display_update_payment_notice' ] );
	}

	/**
	 * Maybe display the update payment notice.
	 */
	public static function maybe_display_update_payment_notice() {
		if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
			return;
		}
		if ( ! function_exists( 'wcs_get_subscriptions' ) ) {
			return;
		}
		$subscriptions = wcs_get_subscriptions(
			[
				'customer_id' => wp_get_current_user()->ID,
			]
		);
		foreach ( $subscriptions as $subscription ) {
			if ( 'cancelled' === $subscription->get_status() ) {
				continue;
			}
			if ( ! $subscription->needs_payment() ) {
				continue;
			}

			$use_modal_checkout = false;
			$url = $subscription->get_view_order_url();

			$last_order = wc_get_order( $subscription->get_last_order() );
			if ( $last_order && $last_order->needs_payment() ) {
				$use_modal_checkout = true;
				$url = $last_order->get_checkout_payment_url();
			}

			wc_add_notice(
				sprintf(
					/* translators: %1$s: action URL, %2$s: additional attributes */
					__( 'Your subscription needs attention. Please <a href="%1$s" %2$s>update your payment method</a>.', 'newspack-plugin' ),
					$url,
					$use_modal_checkout ? 'class="pay"' : ''
				),
				'notice'
			);
		}
	}
}
WooCommerce_Update_Payment_Notice::init();

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
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'maybe_redirect_to_checkout_payment_page' ] );
	}

	/**
	 * Determine whether WC Subscriptions is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return class_exists( 'WC_Subscriptions' );
	}

	/**
	 * Redirect to subscriptions pending renewals my account page.
	 */
	public static function maybe_redirect_to_checkout_payment_page() {
		if ( ! is_user_logged_in() || ! self::is_active() || ! isset( $_GET['np_renewal'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$user_id = get_current_user_id();
		if ( ! wcs_user_has_subscription( $user_id ) ) {
			return;
		}
		$subscriptions = wcs_get_subscriptions(
			[
				'customer_id' => $user_id,
			]
		);
		foreach ( $subscriptions as $subscription ) {
			if ( ! $subscription->needs_payment() ) {
				continue;
			}
			$renewal_orders = $subscription->get_related_orders( 'all', 'renewal' );
			foreach ( $renewal_orders as $renewal_order ) {
				if ( $renewal_order->needs_payment() ) {
					wp_safe_redirect( $renewal_order->get_checkout_payment_url() );
					exit;
				}
			}
		}
	}
}
WooCommerce_Subscriptions::init();

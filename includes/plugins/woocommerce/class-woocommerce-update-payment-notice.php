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
		add_action( 'wp', [ __CLASS__, 'maybe_add_wc_notices' ] );
		add_action( 'wp_footer', [ __CLASS__, 'maybe_add_newspack_notices' ] );
	}

	/**
	 * Maybe add WC notices.
	 */
	public static function maybe_add_wc_notices() {
		if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
			return;
		}
		if ( ! function_exists( 'wcs_get_subscriptions' ) ) {
			return;
		}

		// Only display the notice if there are no other notices.
		if ( ! empty( wc_get_notices() ) ) {
			return;
		}

		$notices = self::get_notices();
		if ( empty( $notices ) ) {
			return;
		}

		foreach ( $notices as $notice ) {
			wc_add_notice( $notice, 'notice' );
		}
	}

	/**
	 * Maybe add Newspack UI snackbar.
	 */
	public static function maybe_add_newspack_notices() {
		// Under "My Account" page we use WC notices.
		if ( function_exists( 'is_account_page' ) && is_account_page() ) {
			return;
		}

		$notices = self::get_notices();
		if ( empty( $notices ) ) {
			return;
		}

		foreach ( $notices as $notice ) {
			Newspack_UI::add_notice(
				$notice,
				[
					'type'     => 'warning',
					'corner'   => 'top-right',
					'autohide' => false,
				]
			);
		}
	}

	/**
	 * Get the notices for subscriptions that need payment.
	 *
	 * @return array The notices.
	 */
	private static function get_notices() {
		$subscriptions = wcs_get_subscriptions(
			[
				'customer_id' => wp_get_current_user()->ID,
			]
		);

		$notices = [];

		foreach ( $subscriptions as $subscription ) {
			if ( 'cancelled' === $subscription->get_status() ) {
				continue;
			}
			if ( ! $subscription->needs_payment() ) {
				continue;
			}

			$message = __( 'Your subscription is not active.', 'newspack-plugin' );
			$is_donation = Donations::is_donation_order( $subscription );
			if ( $is_donation ) {
				$message = __( 'Your recurring donation has stopped.', 'newspack-plugin' );
			}

			$link_attrs = [];
			$url = $subscription->get_view_order_url();

			// If we have a last order that needs payment, we can use the checkout payment URL.
			$last_order = wc_get_order( $subscription->get_last_order() );
			if ( $last_order && $last_order->needs_payment() ) {
				$url = $last_order->get_checkout_payment_url();
				$link_attrs = [
					'class'                => 'pay',
					'data-action'          => $is_donation ? 'donation_renewal' : 'subscription_renewal',
					'data-subscription-id' => $subscription->get_id(),
				];
			}

			$notices[] = $message . ' ' . sprintf(
					/* translators: %1$s: action URL, %2$s: link attributes */
				__( 'Please <a href="%1$s" %2$s>update your payment method</a>.', 'newspack-plugin' ),
				esc_url( $url ),
				implode(
					' ',
					array_map(
						function( $key, $value ) {
							return sprintf( '%s="%s"', $key, $value );
						},
						array_keys( $link_attrs ),
						array_values( $link_attrs )
					)
				)
			);
		}

		return $notices;
	}
}
WooCommerce_Update_Payment_Notice::init();

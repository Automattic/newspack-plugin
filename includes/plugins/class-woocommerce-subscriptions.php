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
	 * Renewal URL query parameter.
	 */
	const RENEWAL_QUERY_PARAM = 'np_renewal';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'maybe_redirect_to_renewals' ] );
	}

	/**
	 * Get my account subscriptions url.
	 *
	 * @param bool $add_renewal_param Whether to add the renewal query parameter. Default false.
	 *
	 * @return string My account subscriptions URL.
	 */
	public static function get_subscriptions_url( $add_renewal_param = false ) {
		$url = wc_get_account_endpoint_url( 'subscriptions' );
		if ( $add_renewal_param ) {
			$url = add_query_arg(
				[
					self::RENEWAL_QUERY_PARAM => is_user_logged_in() ? 1 : 0,
				],
				$url
			);
		}
		return $url;
	}

	/**
	 * Determine whether WC and WC Subscriptions are active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return function_exists( 'WC' ) && class_exists( 'WC_Subscriptions' );
	}

	/**
	 * Whether the request is a renewal request.
	 *
	 * @param bool $logged_in_only Whether to check for logged out renewal param value. Default false.
	 *
	 * @return bool True if the request is a renewal request.
	 */
	public static function is_renewal_request( $logged_in_only = false ) {
		$np_renewal = filter_input( INPUT_GET, self::RENEWAL_QUERY_PARAM, FILTER_SANITIZE_NUMBER_INT );
		if ( null === $np_renewal ) {
			return false;
		}
		if ( $logged_in_only ) {
			return ! is_numeric( $np_renewal ) || 1 === (int) $np_renewal;
		}
		return true;
	}

	/**
	 * Redirect to subscriptions pending renewals my account page.
	 */
	public static function maybe_redirect_to_renewals() {
		if ( ! self::is_active() || ! self::is_renewal_request( true ) ) {
			return;
		}
		$redirect_url = self::get_subscriptions_url( ! is_user_logged_in() );
		if ( is_user_logged_in() ) {
			$subscriptions = wcs_get_subscriptions(
				[
					'customer_id'         => get_current_user_id(),
					'subscription_status' => [
						'pending',
						'on-hold',
					],
				]
			);
			if ( empty( $subscriptions ) ) {
				// Reset redirect url if there are no pending or on-hold subscriptions.
				$redirect_url = '';
			} elseif ( count( $subscriptions ) === 1 ) {
				foreach ( $subscriptions as $subscription ) {
					$renewal_orders = $subscription->get_related_orders( 'all', 'renewal' );
					foreach ( $renewal_orders as $renewal_order ) {
						if ( $renewal_order->needs_payment() ) {
							$redirect_url = $renewal_order->get_checkout_payment_url();
							break;
						}
					}
				}
			}
		}
		if ( $redirect_url ) {
			wp_safe_redirect( $redirect_url );
			exit;
		}
	}
}
WooCommerce_Subscriptions::init();

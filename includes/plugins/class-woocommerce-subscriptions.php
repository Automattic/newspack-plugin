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
	 * Renewal endpoint.
	 *
	 * @var string
	 */
	const RENEWALS_ENDPOINT = 'my-renewals';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'add_renewals_endpoint' ] );
		if ( ! is_admin() ) {
			add_filter( 'woocommerce_get_query_vars', [ __CLASS__, 'add_renewals_query_var' ] );
			add_filter( 'pre_get_posts', [ __CLASS__, 'maybe_redirect_renewals_endpoint' ] );
		}
	}

	/**
	 * Add renewals endpoint.
	 */
	public static function add_renewals_endpoint() {
		if ( self::is_active() ) {
			add_rewrite_endpoint( self::RENEWALS_ENDPOINT, EP_ROOT | EP_PAGES );
		}
	}

	/**
	 * Add renewals query var.
	 *
	 * @param array $query_vars Query vars.
	 *
	 * @return array
	 */
	public static function add_renewals_query_var( $query_vars ) {
		if ( self::is_active() ) {
			$query_vars[ self::RENEWALS_ENDPOINT ] = self::RENEWALS_ENDPOINT;
		}
		return $query_vars;
	}

	/**
	 * Get the URL for the My Account > Subscriptions page.
	 *
	 * @return string
	 */
	public static function get_subscriptions_url() {
		return wc_get_account_endpoint_url( 'subscriptions' );
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
	 * Returns true when on the My Account > Subscriptions front end page.
	 *
	 * @return bool
	 */
	public static function is_subscriptions_page() {
		if ( ! self::is_active() ) {
			return false;
		}
		return is_wc_endpoint_url( 'subscriptions' );
	}

	/**
	 * Conditionally redirects the renewals endpoint url.
	 *
	 * @param \WP_Query $query Query object.
	 */
	public static function maybe_redirect_renewals_endpoint( $query ) { // phpcs:ignore WordPressVIPMinimum.Hooks.AlwaysReturnInFilter.VoidReturn, WordPressVIPMinimum.Hooks.AlwaysReturnInFilter.MissingReturnStatement
		if (
			! self::is_active() ||
			! $query->is_main_query() ||
			! isset( $query->query_vars[ self::RENEWALS_ENDPOINT ] )
		) {
			return;
		}
		$redirect_url = wc_get_account_endpoint_url( 'subscriptions' );
		if ( is_user_logged_in() ) {
			$pending_renewals = wcs_get_subscriptions(
				[
					'customer_id'         => get_current_user_id(),
					'subscription_status' => [
						'pending',
						'on-hold',
					],
				]
			);
			if ( count( $pending_renewals ) === 1 ) {
				$orders = array_pop( $pending_renewals )->get_related_orders( 'all', 'renewal' );
				foreach ( $orders as $order ) {
					if ( $order->needs_payment() ) {
						$redirect_url = $order->get_checkout_payment_url();
						break;
					}
				}
			}
		}
		wp_safe_redirect( $redirect_url );
		exit();
	}
}
WooCommerce_Subscriptions::init();

<?php
/**
 * Connection with WooCommerce's features.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Connection with WooCommerce's "My Account" page.
 */
class WooCommerce_My_Account {
	const BILLING_ENDPOINT             = 'billing';
	const STRIPE_CUSTOMER_ID_USER_META = '_newspack_stripe_customer_id';

	/**
	 * Cached Stripe customer ID of the current user.
	 *
	 * @var string
	 */
	private static $stripe_customer_id = null;

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		add_filter( 'woocommerce_account_menu_items', [ __CLASS__, 'my_account_menu_items' ], 1000 );
		add_action( 'woocommerce_account_' . self::BILLING_ENDPOINT . '_endpoint', [ __CLASS__, 'render_billing_template' ] );
		add_action( 'init', [ __CLASS__, 'add_rewrite_endpoints' ] );
		add_action( 'template_redirect', [ __CLASS__, 'redirect_to_account_details' ] );
		add_filter( 'woocommerce_save_account_details_required_fields', [ __CLASS__, 'remove_required_fields' ] );
	}

	/**
	 * Filter "My Account" items, if Stripe is the donations platform.
	 *
	 * @param array $items Items.
	 */
	public static function my_account_menu_items( $items ) {
		if ( ! Donations::is_platform_stripe() ) {
			return $items;
		}
		$disabled_wc_menu_items = [ 'dashboard', 'downloads', 'members-area', 'subscriptions', 'edit-address', 'orders', 'payment-methods' ];
		foreach ( $disabled_wc_menu_items as $key ) {
			if ( isset( $items[ $key ] ) ) {
				unset( $items[ $key ] );
			}
		}

		$stripe_customer_id = self::get_current_user_stripe_id();
		if ( false === $stripe_customer_id ) {
			return $items;
		}
		$custom_endpoints = [ self::BILLING_ENDPOINT => __( 'Billing', 'newspack' ) ];
		return array_slice( $items, 0, 1, true ) + $custom_endpoints + array_slice( $items, 1, null, true );
	}

	/**
	 * Redirect to "Account details" if accessing "My Account" directly.
	 */
	public static function redirect_to_account_details() {
		if ( Donations::is_platform_stripe() && function_exists( 'wc_get_page_permalink' ) ) {
			global $wp;
			$current_url               = home_url( $wp->request );
			$my_account_page_permalink = wc_get_page_permalink( 'myaccount' );
			if ( trailingslashit( $current_url ) === trailingslashit( $my_account_page_permalink ) ) {
				wp_safe_redirect( '/my-account/edit-account/' );
				exit;
			}
		}
	}

	/**
	 * Get current user's Stripe customer ID.
	 */
	private static function get_current_user_stripe_id() {
		if ( self::$stripe_customer_id ) {
			return self::$stripe_customer_id;
		}
		$user_id               = get_current_user_id();
		$user_meta_customer_id = get_user_meta( $user_id, self::STRIPE_CUSTOMER_ID_USER_META, true );
		if ( $user_meta_customer_id ) {
			self::$stripe_customer_id = $user_meta_customer_id;
			return $user_meta_customer_id;
		}
		$customer_orders     = wc_get_orders(
			[
				'customer_id' => $user_id,
				'created_via' => WooCommerce_Connection::CREATED_VIA_NAME,
				'limit'       => -1,
			]
		);
		$stripe_customer_ids = [];
		foreach ( $customer_orders as $order ) {
			$stripe_customer_id = $order->get_meta( '_stripe_customer_id' );
			if ( $stripe_customer_id ) {
				$stripe_customer_ids[] = $stripe_customer_id;
			}
		}
		array_unique( $stripe_customer_ids );
		if ( empty( $stripe_customer_ids ) ) {
			self::$stripe_customer_id = false;
		} else {
			self::$stripe_customer_id = $stripe_customer_ids[0];
			update_user_meta( $user_id, self::STRIPE_CUSTOMER_ID_USER_META, self::$stripe_customer_id );
		}
		return self::$stripe_customer_id;
	}

	/**
	 * Render custom "My Account" page.
	 */
	public static function render_billing_template() {
		$stripe_customer_id        = self::get_current_user_stripe_id();
		$stripe_billing_portal_url = Stripe_Connection::get_billing_portal_url( $stripe_customer_id );
		$error_message             = false;
		if ( is_wp_error( $stripe_billing_portal_url ) ) {
			$error_message = $stripe_billing_portal_url->get_error_message();
			Logger::log( 'Error getting Stripe billing portal URL: ' . wp_json_encode( $stripe_billing_portal_url ) );
		}

		include dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/reader-revenue/templates/myaccount-billing.php';
	}

	/**
	 * Add the necessary endpoints to rewrite rules.
	 */
	public static function add_rewrite_endpoints() {
		if ( ! Donations::is_platform_stripe() ) {
			return;
		}
		add_rewrite_endpoint( self::BILLING_ENDPOINT, EP_PAGES );
		if ( ! get_option( '_newspack_has_set_up_custom_billing_endpoint' ) ) {
			flush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules
			Logger::log( 'Flushed rewrite rules to add billing endpoint' );
			update_option( '_newspack_has_set_up_custom_billing_endpoint', true );
		}
	}

	/**
	 * Remove first and last name from WC's required fields.
	 *
	 * @param array $required_fields Required fields.
	 */
	public static function remove_required_fields( $required_fields ) {
		if ( ! Donations::is_platform_stripe() ) {
			return $required_fields;
		}
		unset( $required_fields['account_first_name'] );
		unset( $required_fields['account_last_name'] );
		return $required_fields;
	}
}

WooCommerce_My_Account::init();

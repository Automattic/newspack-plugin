<?php
/**
 * WooCommerce Subscriptions Confirmation class for FTC compliance.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Subscriptions_Confirmation {

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( ! WooCommerce_Subscriptions::is_enabled() ) {
			return;
		}
		add_action( 'woocommerce_review_order_before_submit', [ __CLASS__, 'add_subscription_confirmation_checkbox' ] );
		add_action( 'woocommerce_checkout_process', [ __CLASS__, 'validate_subscription_confirmation_checkbox' ] );
	}

	/**
	 * Check if the cart contains any subscription products.
	 *
	 * @return boolean Returns whether or not the cart contains a subscription product.
	 */
	private static function has_subscription_in_cart() {
		if ( ! WC()->cart ) {
			return false;
		}
		foreach ( WC()->cart->get_cart() as $cart_item ) {
			if ( \WC_Subscriptions_Product::is_subscription( $cart_item['data'] ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Make sure the subscription confirmation checkbox is checked before checkout can be completed.
	 */
	public static function validate_subscription_confirmation_checkbox() {
		// Skip validation if we don't have a subscription in the cart, or if we're on the first screen of the modal checkout.
		if ( ! self::has_subscription_in_cart() || ( isset( $_POST['is_validation_only'] ) && '1' === $_POST['is_validation_only'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return;
		}

		if ( ! isset( $_POST['newspack_subscription_confirmation'] ) || '1' !== $_POST['newspack_subscription_confirmation'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			wc_add_notice( esc_html__( 'You must agree to the subscription terms before proceeding.', 'newspack-plugin' ), 'error' );
		}
	}

	/**
	 * Add a checkbox to the WooCommerce checkout form when enabled and when the cart contains a subscription product.
	 * This checkbox will appear before the submit button.
	 */
	public static function add_subscription_confirmation_checkbox() {
		if ( ! Reader_Activation::is_subscription_confirmation_enabled() || ! self::has_subscription_in_cart() ) {
			return;
		}

		woocommerce_form_field(
			'newspack_subscription_confirmation',
			array(
				'type'     => 'checkbox',
				'class'    => array( 'form-row-wide', 'newspack-subscription-confirmation-checkbox' ),
				'label'    => Reader_Activation::get_subscription_confirmation_text(),
				'required' => true,
			)
		);
	}
}

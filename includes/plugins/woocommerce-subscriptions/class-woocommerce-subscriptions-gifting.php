<?php
/**
 * WooCommerce Subscriptions Gifting Integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class WooCommerce_Subscriptions_Gifting {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		\add_filter( 'wcsg_new_recipient_account_details_fields', [ __CLASS__, 'new_recipient_fields' ] );
		\add_filter( 'wcsg_require_shipping_address_for_virtual_products', '__return_false' );
		\add_filter( 'wcsg_is_giftable_product', [ __CLASS__, 'is_giftable_product' ], 10, 2 );
		\add_filter( 'default_option_woocommerce_subscriptions_gifting_gifting_checkbox_text', [ __CLASS__, 'default_gifting_checkbox_text' ] );
		\add_filter( 'newpack_reader_activation_reader_is_without_password', [ __CLASS__, 'is_reader_without_password' ], 10, 2 );
	}

	/**
	 * Check if WooCommerce Subscriptions Gifting is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return function_exists( 'WC' ) && class_exists( 'WC_Subscriptions' ) && class_exists( 'WCS_Gifting' );
	}

	/**
	 * Ensure that only billing address fields enabled in Reader Revenue settings
	 * are required for new gift recipient accounts.
	 *
	 * See: https://github.com/woocommerce/woocommerce-subscriptions-gifting/blob/trunk/includes/class-wcsg-recipient-details.php#L275
	 *
	 * @param array $fields Address fields.
	 * @return array
	 */
	public static function new_recipient_fields( $fields ) {
		// Escape hatch to force required shipping address for virtual products.
		if ( apply_filters( 'wcsg_require_shipping_address_for_virtual_products', false ) ) { // phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			return $fields;
		}
		$required_fields = Donations::get_billing_fields();
		foreach ( $fields as $field_name => $field_config ) {
			if ( 'shipping_' !== substr( $field_name, 0, 9 ) && ! in_array( 'billing_' . $field_name, $required_fields, true ) ) {
				unset( $fields[ $field_name ] );
			}
		}
		return $fields;
	}

	/**
	 * Filters the default text shown for the gifting checkbox during checkout.
	 *
	 * @return string
	 */
	public static function default_gifting_checkbox_text() {
		return __( 'This purchase is a gift', 'newspack' );
	}

	/**
	 * New gift recipients don't yet have a password.
	 *
	 * @param bool $is_reader_without_password True if the reader has not set a password.
	 * @param int  $user_id The user ID.
	 *
	 * @return bool
	 */
	public static function is_reader_without_password( $is_reader_without_password, $user_id ) {
		// wcsg_update_account meta will force the user to update/set account information on login.
		$user_needs_account_update = get_user_meta( $user_id, 'wcsg_update_account', true );
		if ( ! empty( $user_needs_account_update ) ) {
			return 'true' === $user_needs_account_update;
		}
		return $is_reader_without_password;
	}

	/**
	 * Filter to check if a product is giftable.
	 *
	 * @param bool        $is_giftable Whether the product is giftable.
	 * @param \WC_Product $product The product object.
	 *
	 * @return bool
	 */
	public static function is_giftable_product( $is_giftable, $product ) {
		// Check if gifting is enabled for this product.
		$allow_gifting = get_post_meta( $product->get_id(), '_newspack_allow_gifting', true );
		if ( 'yes' !== $allow_gifting ) {
			return false;
		}

		// Check if product is a subscription type, just in case.
		$product_type = $product->get_type();
		if ( ! in_array( $product_type, [ 'subscription', 'variable-subscription' ] ) ) {
			return false;
		}

		// Check if subscription limit is set to 'no' (no limit), just in case.
		$subscription_limit = get_post_meta( $product->get_id(), '_subscription_limit', true );
		return 'no' === $subscription_limit;
	}
}
WooCommerce_Subscriptions_Gifting::init();

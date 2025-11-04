<?php
/**
 * WooCommerce Subscriptions Integration class.
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
		add_action( 'plugins_loaded', [ __CLASS__, 'woocommerce_subscriptions_integration_init' ] );
		add_filter( 'woocommerce_subscriptions_product_limited_for_user', [ __CLASS__, 'maybe_limit_subscription_product_for_user' ], 10, 3 );
	}

	/**
	 * Initialize WooCommerce Subscriptions Integration.
	 */
	public static function woocommerce_subscriptions_integration_init() {
		include_once __DIR__ . '/class-on-hold-duration.php';
		include_once __DIR__ . '/class-renewal.php';
		include_once __DIR__ . '/class-subscriptions-meta.php';
		include_once __DIR__ . '/class-subscriptions-confirmation.php';
		include_once __DIR__ . '/class-subscriptions-tiers.php';

		On_Hold_Duration::init();
		Renewal::init();
		Subscriptions_Meta::init();
		Subscriptions_Confirmation::init();
	}


	/**
	 * Check if WooCommerce Subscriptions is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return function_exists( 'WC' ) && class_exists( 'WC_Subscriptions' );
	}

	/**
	 * Check if WooCommerce Subscriptions Integration is enabled.
	 *
	 * True if:
	 * - WooCommerce Subscriptions is active and,
	 * - Reader Activation is enabled and,
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$is_enabled = self::is_active() && Reader_Activation::is_enabled();
		/**
		 * Filters whether subscriptions expiration is enabled.
		 *
		 * @param bool $is_enabled
		 */
		return apply_filters( 'newspack_subscriptions_expiration_enabled', $is_enabled );
	}

	/**
	 * Get the label for a frequency.
	 *
	 * @param string $frequency Frequency.
	 *
	 * @return string
	 */
	public static function get_frequency_label( $frequency ) {
		$frequencies = [
			'day'     => __( 'Daily', 'newspack-plugin' ),
			'week'    => __( 'Weekly', 'newspack-plugin' ),
			'week_2'  => __( 'Bi-Weekly', 'newspack-plugin' ),
			'month'   => __( 'Monthly', 'newspack-plugin' ),
			'month_3' => __( 'Quarterly', 'newspack-plugin' ),
			'month_6' => __( 'Semi-Annually', 'newspack-plugin' ),
			'year'    => __( 'Yearly', 'newspack-plugin' ),
		];
		// If frequency is not in the array, try to find the frequency without the interval.
		if ( ! isset( $frequencies[ $frequency ] ) ) {
			$frequency = explode( '_', $frequency )[0];
			$label = $frequencies[ $frequency ] ?? ucfirst( $frequency );
		} else {
			$label = $frequencies[ $frequency ];
		}

		/**
		 * Filters the frequency label.
		 *
		 * @param string $label     Frequency label.
		 * @param string $frequency Frequency.
		 */
		return apply_filters( 'newspack_subscriptions_frequency_label', $label, $frequency );
	}

	/**
	 * Maybe limit the subscription product for user.
	 *
	 * @param bool           $is_limited_for_user Whether the subscription product is limited for user.
	 * @param int|WC_Product $product A WC_Product object or the ID of a product.
	 * @param int            $user_id The user ID.
	 */
	public static function maybe_limit_subscription_product_for_user( $is_limited_for_user, $product, $user_id ) {
		if ( ! $is_limited_for_user ) {
			$product_id            = $product->get_id();
			$is_free_trial_product = class_exists( 'WC_Subscriptions_Product' ) && \WC_Subscriptions_Product::get_trial_length( $product_id ) > 0;
			$product_limitation    = \wcs_get_product_limitation( $product );
			if ( $is_free_trial_product && 'active' === $product_limitation ) {
				$is_limited_for_user = \wcs_user_has_subscription( $user_id, $product->get_id(), [ 'cancelled', 'on-hold', 'pending', 'pending-cancel' ] );
			}
		}

		return $is_limited_for_user;
	}
}
WooCommerce_Subscriptions::init();

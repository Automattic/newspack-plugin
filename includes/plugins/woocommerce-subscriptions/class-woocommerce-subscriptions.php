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
	 * Get the user's subscription within a grouped or variable subscription product.
	 *
	 * @param \WC_Product $product Product.
	 * @param int|null    $user_id User ID. Defaults to the current user.
	 *
	 * @return \WC_Subscription|null Subscription or null if the user does not have a subscription.
	 */
	public static function get_user_subscription( $product, $user_id = null ) {
		if ( ! function_exists( 'wcs_get_users_subscriptions' ) || ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		$user_id = $user_id ?? get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$products           = $product->get_children();
		$user_subscriptions = wcs_get_users_subscriptions( $user_id );

		foreach ( $products as $product ) {
			$product = wc_get_product( $product );
			if ( ! $product ) {
				continue;
			}
			foreach ( $user_subscriptions as $subscription ) {
				if ( $subscription->has_product( $product->get_id() ) && $subscription->has_status( 'active' ) ) {
					return $subscription;
				}
			}
		}

		return null;
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
}
WooCommerce_Subscriptions::init();

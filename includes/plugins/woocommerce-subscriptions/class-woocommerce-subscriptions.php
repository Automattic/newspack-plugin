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

		On_Hold_Duration::init();
		Renewal::init();
		Subscriptions_Meta::init();
	}


	/**
	 * Check if WooCommerce Subscriptions is active.
	 *
	 * @return bool
	 */
	public static function is_active() {
		return class_exists( 'WC_Subscriptions' );
	}

	/**
	 * Check if WooCommerce Subscriptions Integration is enabled.
	 *
	 * True if:
	 * - WooCommerce Subscriptions is active and,
	 * - Reader Activation is enabled and,
	 * - The NEWSPACK_SUBSCRIPTIONS_EXPIRATION feature flag is defined and true.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return self::is_active() && Reader_Activation::is_enabled() && defined( 'NEWSPACK_SUBSCRIPTIONS_EXPIRATION' ) && NEWSPACK_SUBSCRIPTIONS_EXPIRATION;
	}
}
WooCommerce_Subscriptions::init();

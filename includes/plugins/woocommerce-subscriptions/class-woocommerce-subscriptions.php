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
	 * Feature flag for the Newspack Subscriptions Expiration feature.
	 */
	const NEWSPACK_SUBSCRIPTIONS_EXPIRATION_FEATURE_FLAG = 'NEWSPACK_SUBSCRIPTIONS_EXPIRATION';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( self::is_enabled() ) {
			include_once __DIR__ . '/class-on-hold-duration.php';

			On_Hold_Duration::init();
		}
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
	 * Enalbed if Reader activation is enabled and the feature flag is defined.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Reader_Activation::is_enabled() && defined( self::NEWSPACK_SUBSCRIPTIONS_EXPIRATION_FEATURE_FLAG );
	}
}
WooCommerce_Subscriptions::init();

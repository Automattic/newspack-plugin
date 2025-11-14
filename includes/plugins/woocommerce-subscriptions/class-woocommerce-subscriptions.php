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
	 * Get the label for a frequency.
	 *
	 * @param string   $frequency Frequency.
	 * @param int|null $interval  Optional interval. If not provided, the interval
	 *                            can be extracted from the frequency string.
	 *                            E.g. 'month_2' -> 2.
	 *
	 * @return string
	 */
	public static function get_frequency_label( $frequency, $interval = null ) {
		$parts    = explode( '_', $frequency );
		$period   = $parts[0] ?? '';
		$interval = $interval ?? ( isset( $parts[1] ) ? (int) $parts[1] : 1 );
		$interval = $interval > 0 ? $interval : 1;

		$single_labels = [
			'day'   => __( 'Daily', 'newspack-plugin' ),
			'week'  => __( 'Weekly', 'newspack-plugin' ),
			'month' => __( 'Monthly', 'newspack-plugin' ),
			'year'  => __( 'Yearly', 'newspack-plugin' ),
		];

		// phpcs:disable WordPress.WP.I18n.MissingTranslatorsComment
		$multiple_templates = [
			'day'   => __( '%s Days', 'newspack-plugin' ),
			'week'  => __( '%s Weeks', 'newspack-plugin' ),
			'month' => __( '%s Months', 'newspack-plugin' ),
			'year'  => __( '%s Years', 'newspack-plugin' ),
		];
		// phpcs:enable

		if ( 1 === $interval ) {
			$label = $single_labels[ $period ] ?? ucfirst( $period );
		} elseif ( isset( $multiple_templates[ $period ] ) ) {
				$label = sprintf(
					$multiple_templates[ $period ],
					number_format_i18n( $interval )
				);
		} else {
			$label = sprintf(
				// translators: 1: Subscription interval. 2: Subscription period.
				__( '%1$s %2$ss', 'newspack-plugin' ),
				number_format_i18n( $interval ),
				ucfirst( $period )
			);
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

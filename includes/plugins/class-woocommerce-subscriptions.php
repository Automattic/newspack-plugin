<?php
/**
 * WooCommerce Subscriptions integration class.
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
		add_filter( 'woocommerce_subscription_settings', [ __CLASS__, 'add_post_retry_payment_attempt_setting' ], 11, 1 );
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
	 * Add post-retry payment attempt setting.
	 *
	 * @param array $settings Subscription settings.
	 *
	 * @return array
	 */
	public static function add_post_retry_payment_attempt_setting( $settings ) {
		if ( self::is_active() ) {
			return array_merge(
				$settings,
				[
					[
						'name' => __( 'Newspack Subscriptions Settings', 'newspack-plugin' ),
						'type' => 'title',
						'desc' => __( 'Subscriptions settings added by Newspack.', 'newspack-plugin' ),
						'id'   => 'newspack_subscriptions_options',
					],
					[
						'name'              => __( 'Post-retry Payment Attempt', 'newspack-plugin' ),
						'desc'              => __( 'The number of days after final retry to reattempt payment when automatic retries are enabled', 'newspack-plugin' ),
						'id'                => 'newspack_subscriptions_post_retry_payment_attempt',
						'css'               => 'max-width:80px;',
						'value'             => self::get_post_retry_payment_attempt(),
						'type'              => 'number',
						'custom_attributes' => array(
							'min'  => 0,
							'step' => 1,
						),
					],
					[
						'type' => 'sectionend',
						'id'   => 'newspack_subscriptions_options',
					],
				]
			);
		}
		return $settings;
	}

	/**
	 * Get post-retry payment attempt. Defaults to 0.
	 *
	 * @return int
	 */
	public static function get_post_retry_payment_attempt() {
		return absint( get_option( 'newspack_subscriptions_post_retry_payment_attempt', 0 ) );
	}
}
WooCommerce_Subscriptions::init();

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
		add_filter( 'woocommerce_subscription_settings', [ __CLASS__, 'add_post_retry_setting' ], 11, 1 );
		add_filter( 'wcs_default_retry_rules', [ __CLASS__, 'maybe_apply_post_retry' ], 99, 1 );
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
	public static function add_post_retry_setting( $settings ) {
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
						'id'                => 'newspack_subscriptions_post_retry_days',
						'css'               => 'max-width:80px;',
						'value'             => self::get_post_retry_days(),
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
	public static function get_post_retry_days() {
		return absint( get_option( 'newspack_subscriptions_post_retry_days', 0 ) );
	}

	/**
	 * Conditionally adds post-retry rule to retry rules.
	 *
	 * @param array $retry_rules Subscriptions retry rules.
	 */
	public static function maybe_apply_post_retry( $retry_rules ) {
		if ( self::is_active() ) {
			$post_retry_days = self::get_post_retry_days();
			if ( $post_retry_days > 0 ) {
				$final_retry_rule                                    = end( $retry_rules );
				$post_retry_rule                                     = $final_retry_rule;
				$final_order_status                                  = $final_retry_rule['status_to_apply_to_order'];
				$final_subscription_status                           = $final_retry_rule['status_to_apply_to_subscription'];
				$final_retry_rule['status_to_apply_to_order']        = 'pending';
				$final_retry_rule['status_to_apply_to_subscription'] = 'on-hold';
				$post_retry_rule['status_to_apply_to_order']         = $final_order_status;
				$post_retry_rule['status_to_apply_to_subscription']  = $final_subscription_status;
				$post_retry_rule['retry_after_interval']             = DAY_IN_SECONDS * $post_retry_days;
				return array_merge( $retry_rules, [ $post_retry_rule ] );
			}
		}
		return $retry_rules;
	}
}
WooCommerce_Subscriptions::init();

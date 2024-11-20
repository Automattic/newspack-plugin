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
		add_filter( 'woocommerce_subscription_settings', [ __CLASS__, 'add_on_hold_duration_setting' ], 11, 1 );
		add_filter( 'wcs_default_retry_rules', [ __CLASS__, 'maybe_apply_on_hold_duration_rule' ], 99, 1 );
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
	 * Add on-hold duration setting.
	 *
	 * @param array $settings Subscription settings.
	 *
	 * @return array
	 */
	public static function add_on_hold_duration_setting( $settings ) {
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
						'name'              => __( 'On-hold Duration', 'newspack-plugin' ),
						'desc'              => __( 'The number of days after all automatic payment retries have failed before attempting a final payment attempt and ending retries.', 'newspack-plugin' ),
						'id'                => 'newspack_subscriptions_on_hold_duration',
						'css'               => 'max-width:80px;',
						'value'             => self::get_on_hold_duration(),
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
	 * Get on-hold duration. Defaults to 0.
	 *
	 * @return int
	 */
	public static function get_on_hold_duration() {
		return absint( get_option( 'newspack_subscriptions_on_hold_duration', 0 ) );
	}

	/**
	 * Conditionally adds on-hold duration rule to retry rules.
	 *
	 * @param array $retry_rules Subscriptions retry rules.
	 */
	public static function maybe_apply_on_hold_duration_rule( $retry_rules ) {
		if ( self::is_active() ) {
			$post_retry_days = self::get_on_hold_duration();
			if ( $post_retry_days > 0 ) {
				$final_retry_rule          = array_pop( $retry_rules );
				$final_order_status        = $final_retry_rule['status_to_apply_to_order'];
				$final_subscription_status = $final_retry_rule['status_to_apply_to_subscription'];
				$retry_rules               = array_merge(
					$retry_rules,
					[
						array_merge(
							$final_retry_rule,
							[
								'status_to_apply_to_order' => 'pending',
								'status_to_apply_to_subscription' => 'on-hold',
							]
						),
						array_merge(
							$final_retry_rule,
							[
								'status_to_apply_to_order' => $final_order_status,
								'status_to_apply_to_subscription' => $final_subscription_status,
								'retry_after_interval'     => DAY_IN_SECONDS * $post_retry_days,
							]
						),
					]
				);
			}
		}
		return $retry_rules;
	}
}
WooCommerce_Subscriptions::init();

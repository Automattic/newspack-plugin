<?php
/**
 * Newspack Group Subscriptions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Group_Subscriptions {

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'newspack_custom_product_options', [ __CLASS__, 'add_custom_product_options' ] );
		add_filter( 'newspack_custom_product_pricing_options', [ __CLASS__, 'add_custom_product_pricing_options' ] );
	}

	/**
	 * Add custom product options.
	 *
	 * @param array $custom_options Keyed array of custom product options.
	 *
	 * @return array Keyed array of custom product options.
	 */
	public static function add_custom_product_options( $custom_options ) {
		if ( ! Content_Gate::is_newspack_feature_enabled() ) {
			return $custom_options;
		}
		$custom_options['newspack_group_subscription_enabled'] = [
			'id'            => '_newspack_group_subscription_enabled',
			'wrapper_class' => '',
			'label'         => __( 'Group subscription', 'newspack-plugin' ),
			'description'   => __( 'Enable group subscriptions for this product.', 'newspack-plugin' ),
			'default'       => 'no',
			'product_types' => [ 'subscription', 'subscription_variation' ],
			'type'          => 'boolean',
		];
		return $custom_options;
	}

	/**
	 * Add custom product pricing options.
	 *
	 * @param array $custom_product_pricing_options Keyed array of custom product pricing options.
	 *
	 * @return array Keyed array of custom product pricing options.
	 */
	public static function add_custom_product_pricing_options( $custom_product_pricing_options ) {
		if ( ! Content_Gate::is_newspack_feature_enabled() ) {
			return $custom_product_pricing_options;
		}
		$custom_product_pricing_options['newspack_group_subscription_limit'] = [
			'id'                => '_newspack_group_subscription_limit',
			'wrapper_class'     => 'form-row form-row-first',
			'label'             => __( 'Group subscription member limit', 'newspack-plugin' ),
			'desc_tip'          => true,
			'description'       => __( 'Set the maximum number of members for group subscriptions. Leave empty to allow an unlimited number of group members.', 'newspack-plugin' ),
			'default'           => 0,
			'product_types'     => [ 'subscription', 'subscription_variation' ],
			'type'              => 'number',
			'custom_attributes' => [
				'step' => 1,
				'min'  => 0,
			],
		];
		return $custom_product_pricing_options;
	}
}
Group_Subscriptions::init();

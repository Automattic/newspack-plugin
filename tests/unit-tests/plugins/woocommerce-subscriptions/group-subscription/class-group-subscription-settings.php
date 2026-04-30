<?php
/**
 * Tests for Group_Subscription_Settings.
 *
 * @package Newspack\Tests
 * @group WooCommerce_Subscriptions_Integration
 */

use Newspack\Group_Subscription_Settings;

/**
 * Test Group_Subscription_Settings.
 */
class Test_Group_Subscription_Settings extends WP_UnitTestCase {

	/**
	 * Set up test fixtures.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Include WC mocks.
		require_once dirname( __DIR__, 4 ) . '/mocks/wc-mocks.php';
	}

	/**
	 * Set up: simulate being on the account page.
	 */
	public function set_up() {
		parent::set_up();
		global $subscriptions_database, $products_database;
		$subscriptions_database = [];
		$products_database      = [];
	}

	/**
	 * Tear down: reset subscriptions and products databases.
	 */
	public function tear_down() {
		global $subscriptions_database, $products_database;
		$subscriptions_database = [];
		$products_database      = [];
		parent::tear_down();
	}

	/**
	 * A subscription limit override of 0 takes precedence over a non-zero product limit.
	 */
	public function test_subscription_limit_zero_overrides_product_limit() {
		$product_limit = 10;

		// Simulate a product that has a non-zero group subscription limit.
		$product_settings_filter = function ( $settings ) use ( $product_limit ) {
			$settings['enabled'] = true;
			$settings['limit']   = $product_limit;
			return $settings;
		};
		add_filter( 'newspack_group_subscription_product_settings', $product_settings_filter );

		$subscription = wcs_create_subscription(
			[
				'customer_id'    => 1,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);

		$subscription->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		// Set the limit override to 0 (string, as stored by WooCommerce meta).
		$subscription->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'limit', '0' );

		$settings = Group_Subscription_Settings::get_subscription_settings( $subscription );

		remove_filter( 'newspack_group_subscription_product_settings', $product_settings_filter );

		$this->assertSame( 0, $settings['limit'], 'A subscription limit of 0 should override the product limit of ' . $product_limit );
	}
}

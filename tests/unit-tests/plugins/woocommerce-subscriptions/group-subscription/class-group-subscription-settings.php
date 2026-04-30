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
	 * Set up: reset subscriptions and products databases.
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
	 * Build a subscription linked to a product with a non-zero group subscription limit.
	 *
	 * @param int        $product_limit         The product's group subscription limit.
	 * @param mixed|null $subscription_override If not null, set as the subscription's limit meta override.
	 *
	 * @return WC_Subscription
	 */
	private function make_subscription_with_product_limit( $product_limit, $subscription_override = null ) {
		$product_id = 123;
		wc_create_mock_product(
			[
				'id'   => $product_id,
				'meta' => [
					Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled' => 'yes',
					Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'limit'   => (string) $product_limit,
				],
			]
		);

		$subscription = wcs_create_subscription(
			[
				'customer_id'    => 1,
				'status'         => 'active',
				'billing_period' => 'month',
				'items'          => [
					new WC_Order_Item_Product( [ 'product_id' => $product_id ] ),
				],
			]
		);

		if ( null !== $subscription_override ) {
			$subscription->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'limit', $subscription_override );
		}

		return $subscription;
	}

	/**
	 * When a subscription has no limit override, the inherited product limit applies.
	 */
	public function test_inherits_product_limit_when_subscription_override_unset() {
		$subscription = $this->make_subscription_with_product_limit( 10 );

		$settings = Group_Subscription_Settings::get_subscription_settings( $subscription );

		$this->assertTrue( $settings['enabled'], 'Enabled should be inherited from the product.' );
		$this->assertSame( 10, $settings['limit'], 'Limit should be inherited from the product when no subscription override is set.' );
	}

	/**
	 * A subscription limit override of 0 takes precedence over a non-zero product limit.
	 */
	public function test_zero_subscription_limit_overrides_product_limit() {
		// '0' as string, matching how WooCommerce stores meta.
		$subscription = $this->make_subscription_with_product_limit( 10, '0' );

		$settings = Group_Subscription_Settings::get_subscription_settings( $subscription );

		$this->assertSame( 0, $settings['limit'], 'A subscription limit of 0 should override the product limit of 10.' );
	}

	/**
	 * A non-zero subscription limit override takes precedence over the product limit.
	 */
	public function test_nonzero_subscription_limit_overrides_product_limit() {
		$subscription = $this->make_subscription_with_product_limit( 10, '5' );

		$settings = Group_Subscription_Settings::get_subscription_settings( $subscription );

		$this->assertSame( 5, $settings['limit'], 'A subscription limit of 5 should override the product limit of 10.' );
	}
}

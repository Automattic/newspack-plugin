<?php
/**
 * Tests the WooCommerce Subscriptions integration class.
 *
 * @package Newspack\Tests
 */

use Newspack\WooCommerce_Subscriptions;
use Newspack\Reader_Activation;

/**
 * Test WooCommerce Subscriptions integration functionality.
 *
 * @group WooCommerce_Subscriptions_Integration
 */
class Newspack_Test_WooCommerce_Subscriptions extends WP_UnitTestCase {
	/**
	 * Test WooCommerce_Subscriptions::is_active.
	 */
	public function test_is_active() {
		$is_active = WooCommerce_Subscriptions::is_active();
		$this->assertTrue( $is_active, 'WooCommerce Subscriptions integration should be active when WC_Subscriptions class exists.' );
	}

	/**
	 * Test WooCommerce_Subscriptions::is_enabled.
	 */
	public function test_is_enabled() {
		$is_enabled = WooCommerce_Subscriptions::is_enabled();
		$this->assertTrue( $is_enabled, 'WooCommerce Subscriptions integration should be enabled when RAS is enabled.' );
	}
}

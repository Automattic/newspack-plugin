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
 */
class Newspack_Test_WooCommerce_Subscriptions extends WP_UnitTestCase {
	/**
	 * Test WooCommerce_Subscriptions::is_active.
	 */
	public function test_is_active() {
		// Unfortunately we can't test for inactive case since the testing environment flag will always return true for Reader Activation.
		$is_active = WooCommerce_Subscriptions::is_active();
		$this->assertTrue( $is_active, 'WooCommerce Subscriptions integration should be active when Reader Activation is enabled.' );
	}

	/**
	 * Test WooCommerce_Subscriptions::maybe_record_cancelled_subscription.
	 */
	public function test_maybe_record_cancelled_subscription() {
		$subscription = wcs_create_subscription();
		$this->assertEquals(
			'',
			$subscription->get_meta( WooCommerce_Subscriptions::CANCELLATION_REASON_META_KEY, '' ),
			'Cancellation reason meta should be empty before cancellation.'
		);
		WooCommerce_Subscriptions::maybe_record_cancelled_subscription( 1, 'pending', 'active', $subscription );
		$this->assertEquals(
			'',
			$subscription->get_meta( WooCommerce_Subscriptions::CANCELLATION_REASON_META_KEY, '' ),
			'Cancellation reason meta should be empty when subscription status is not cancelled.'
		);
		WooCommerce_Subscriptions::maybe_record_cancelled_subscription( 1, 'active', 'cancelled', $subscription );
		$this->assertEquals(
			WooCommerce_Subscriptions::CANCELLATION_REASON_USER_CANCELLED,
			$subscription->get_meta( WooCommerce_Subscriptions::CANCELLATION_REASON_META_KEY, '' ),
			'Cancellation reason meta should be set to user-cancelled when subscription is cancelled.'
		);
	}
}

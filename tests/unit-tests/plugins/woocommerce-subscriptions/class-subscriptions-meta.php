<?php
/**
 * Tests the WooCommerce Subscriptions integration class.
 *
 * @package Newspack\Tests
 */

use Newspack\Subscriptions_Meta;
use Newspack\WooCommerce_Subscriptions;

/**
 * Test WooCommerce Subscriptions integration functionality.
 */
class Newspack_Test_Subscriptions_Meta extends WP_UnitTestCase {
	/**
	 * Setup for the tests.
	 */
	public function set_up() {
		define( WooCommerce_Subscriptions::NEWSPACK_SUBSCRIPTIONS_EXPIRATION_FEATURE_FLAG, true );
		WooCommerce_Subscriptions::init();
	}

	/**
	 * Test Subscriptions_Meta::maybe_record_cancelled_subscription_meta.
	 */
	public function test_maybe_record_cancelled_subscription_meta() {
		$subscription = wcs_create_subscription();
		$this->assertEquals(
			'',
			$subscription->get_meta( Subscriptions_Meta::CANCELLATION_REASON_META_KEY, '' ),
			'Cancellation reason meta should be empty before cancellation.'
		);
		Subscriptions_Meta::maybe_record_cancelled_subscription_meta( 1, 'pending', 'active', $subscription );
		$this->assertEquals(
			'',
			$subscription->get_meta( Subscriptions_Meta::CANCELLATION_REASON_META_KEY, '' ),
			'Cancellation reason meta should be empty when subscription status is not cancelled.'
		);
		Subscriptions_Meta::maybe_record_cancelled_subscription_meta( 1, 'active', 'cancelled', $subscription );
		$this->assertEquals(
			Subscriptions_Meta::CANCELLATION_REASON_USER_CANCELLED,
			$subscription->get_meta( Subscriptions_Meta::CANCELLATION_REASON_META_KEY, '' ),
			'Cancellation reason meta should be set to user-cancelled when subscription is cancelled.'
		);
	}
}

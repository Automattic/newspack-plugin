<?php
/**
 * Tests for the WooCommerce Gateway Stripe integration class.
 *
 * @package Newspack\Tests
 */

use Newspack\WooCommerce_Gateway_Stripe;

require_once __DIR__ . '/../../mocks/wc-mocks.php';

/**
 * Tests WooCommerce_Gateway_Stripe dual-gateway guard methods.
 *
 * @group WooCommerce_Gateway_Stripe
 */
class Newspack_Test_WooCommerce_Gateway_Stripe extends WP_UnitTestCase {

	/**
	 * Reset the global order and subscriptions databases before each test.
	 */
	public function set_up() {
		parent::set_up();
		global $orders_database, $subscriptions_database;
		$orders_database        = [];
		$subscriptions_database = [];
	}

	// -------------------------------------------------------------------------
	// Part 2: woocommerce_before_subscription_object_save guard
	// -------------------------------------------------------------------------

	/**
	 * A WooPayments subscription with _stripe_customer_id in-memory should have
	 * the meta removed before save.
	 */
	public function test_stripe_customer_id_stripped_for_woopayments_subscription() {
		$subscription = wcs_create_subscription(
			[
				'payment_method' => 'woocommerce_payments',
				'meta'           => [ '_stripe_customer_id' => 'cus_stale123' ],
			]
		);

		WooCommerce_Gateway_Stripe::maybe_strip_stripe_customer_id_before_save( $subscription );

		$this->assertSame(
			'',
			$subscription->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should be stripped from in-memory meta for WooPayments subscriptions.'
		);
	}

	/**
	 * A Stripe subscription should NOT have _stripe_customer_id removed before save.
	 */
	public function test_stripe_customer_id_preserved_for_stripe_subscription() {
		$subscription = wcs_create_subscription(
			[
				'payment_method' => 'stripe',
				'meta'           => [ '_stripe_customer_id' => 'cus_live456' ],
			]
		);

		WooCommerce_Gateway_Stripe::maybe_strip_stripe_customer_id_before_save( $subscription );

		$this->assertSame(
			'cus_live456',
			$subscription->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should be preserved for Stripe subscriptions.'
		);
	}

	/**
	 * Stripe variant gateways (stripe_sepa, stripe_klarna, etc.) should also be preserved.
	 */
	public function test_stripe_customer_id_preserved_for_stripe_variant_gateways() {
		foreach ( [ 'stripe_sepa', 'stripe_klarna', 'stripe_afterpay' ] as $gateway ) {
			$subscription = wcs_create_subscription(
				[
					'payment_method' => $gateway,
					'meta'           => [ '_stripe_customer_id' => 'cus_variant789' ],
				]
			);

			WooCommerce_Gateway_Stripe::maybe_strip_stripe_customer_id_before_save( $subscription );

			$this->assertSame(
				'cus_variant789',
				$subscription->get_meta( '_stripe_customer_id' ),
				"_stripe_customer_id should be preserved for {$gateway} subscriptions."
			);
		}
	}

	// -------------------------------------------------------------------------
	// Part 1: update_post_metadata filter guard
	// -------------------------------------------------------------------------

	/**
	 * The post meta filter should return true (block write) for a WooPayments subscription.
	 */
	public function test_post_meta_filter_blocks_woopayments_subscription() {
		$subscription = wcs_create_subscription( [ 'payment_method' => 'woocommerce_payments' ] );

		$result = WooCommerce_Gateway_Stripe::maybe_block_stripe_customer_id_post_meta_update(
			null,
			$subscription->get_id(),
			'_stripe_customer_id'
		);

		$this->assertTrue(
			$result,
			'Filter should return true (blocking write) for a WooPayments subscription.'
		);
	}

	/**
	 * The post meta filter should return null (allow write) for a Stripe subscription.
	 */
	public function test_post_meta_filter_allows_stripe_subscription() {
		$subscription = wcs_create_subscription( [ 'payment_method' => 'stripe' ] );

		$result = WooCommerce_Gateway_Stripe::maybe_block_stripe_customer_id_post_meta_update(
			null,
			$subscription->get_id(),
			'_stripe_customer_id'
		);

		$this->assertNull(
			$result,
			'Filter should return null (allowing write) for a Stripe subscription.'
		);
	}

	/**
	 * The post meta filter should return null (allow write) for Stripe variant gateway subscriptions.
	 */
	public function test_post_meta_filter_allows_stripe_variant_gateways() {
		foreach ( [ 'stripe_sepa', 'stripe_klarna', 'stripe_afterpay' ] as $gateway ) {
			$subscription = wcs_create_subscription( [ 'payment_method' => $gateway ] );

			$result = WooCommerce_Gateway_Stripe::maybe_block_stripe_customer_id_post_meta_update(
				null,
				$subscription->get_id(),
				'_stripe_customer_id'
			);

			$this->assertNull(
				$result,
				"Filter should return null (allowing write) for {$gateway} subscriptions."
			);
		}
	}

	/**
	 * The post meta filter should be a no-op for non-subscription post IDs.
	 */
	public function test_post_meta_filter_ignores_non_subscription() {
		// Use an ID that is not in $subscriptions_database.
		$result = WooCommerce_Gateway_Stripe::maybe_block_stripe_customer_id_post_meta_update(
			null,
			99999,
			'_stripe_customer_id'
		);

		$this->assertNull(
			$result,
			'Filter should return null (pass-through) for non-subscription post IDs.'
		);
	}

	/**
	 * The post meta filter should be a no-op for meta keys other than _stripe_customer_id.
	 */
	public function test_post_meta_filter_ignores_other_meta_keys() {
		$subscription = wcs_create_subscription( [ 'payment_method' => 'woocommerce_payments' ] );

		$result = WooCommerce_Gateway_Stripe::maybe_block_stripe_customer_id_post_meta_update(
			null,
			$subscription->get_id(),
			'_some_other_key'
		);

		$this->assertNull(
			$result,
			'Filter should return null for meta keys other than _stripe_customer_id.'
		);
	}

	// -------------------------------------------------------------------------
	// Part 3: wcs_renewal_order_created guard
	// -------------------------------------------------------------------------

	/**
	 * On renewal for a WooPayments subscription, stale _stripe_customer_id should
	 * be cleared from both the renewal order and the subscription.
	 */
	public function test_renewal_clears_stale_customer_id_for_woopayments() {
		$renewal_order = new WC_Order(
			[
				'status' => 'pending',
				'meta'   => [ '_stripe_customer_id' => 'cus_stale123' ],
			]
		);
		$subscription  = wcs_create_subscription(
			[
				'payment_method' => 'woocommerce_payments',
				'meta'           => [ '_stripe_customer_id' => 'cus_stale123' ],
			]
		);

		WooCommerce_Gateway_Stripe::clear_stripe_customer_id_on_renewal( $renewal_order, $subscription );

		$this->assertSame(
			'',
			$renewal_order->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should be cleared from the renewal order for a WooPayments subscription.'
		);
		$this->assertSame(
			'',
			$subscription->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should also be cleared from the subscription itself on renewal.'
		);
	}

	/**
	 * On renewal for a Stripe subscription, _stripe_customer_id should not be
	 * touched on either the renewal order or the subscription.
	 */
	public function test_renewal_preserves_customer_id_for_stripe() {
		$renewal_order = new WC_Order(
			[
				'status' => 'pending',
				'meta'   => [ '_stripe_customer_id' => 'cus_live456' ],
			]
		);
		$subscription  = wcs_create_subscription(
			[
				'payment_method' => 'stripe',
				'meta'           => [ '_stripe_customer_id' => 'cus_live456' ],
			]
		);

		WooCommerce_Gateway_Stripe::clear_stripe_customer_id_on_renewal( $renewal_order, $subscription );

		$this->assertSame(
			'cus_live456',
			$renewal_order->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should be preserved on renewal order for a Stripe subscription.'
		);
		$this->assertSame(
			'cus_live456',
			$subscription->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should be preserved on subscription for a Stripe subscription.'
		);
	}

	/**
	 * On renewal for a non-Stripe subscription where only the order carries the
	 * stale value (subscription already clean), the order should be cleared
	 * without errors.
	 */
	public function test_renewal_clears_order_when_subscription_already_clean() {
		$renewal_order = new WC_Order(
			[
				'status' => 'pending',
				'meta'   => [ '_stripe_customer_id' => 'cus_stale123' ],
			]
		);
		$subscription  = wcs_create_subscription( [ 'payment_method' => 'woocommerce_payments' ] );

		WooCommerce_Gateway_Stripe::clear_stripe_customer_id_on_renewal( $renewal_order, $subscription );

		$this->assertSame(
			'',
			$renewal_order->get_meta( '_stripe_customer_id' ),
			'_stripe_customer_id should be cleared from renewal order even when subscription meta is already clean.'
		);
	}

	/**
	 * Stripe variant gateways should not have _stripe_customer_id cleared on renewal.
	 */
	public function test_renewal_preserves_customer_id_for_stripe_variant_gateways() {
		foreach ( [ 'stripe_sepa', 'stripe_klarna', 'stripe_afterpay' ] as $gateway ) {
			$renewal_order = new WC_Order(
				[
					'status' => 'pending',
					'meta'   => [ '_stripe_customer_id' => 'cus_variant789' ],
				]
			);
			$subscription  = wcs_create_subscription(
				[
					'payment_method' => $gateway,
					'meta'           => [ '_stripe_customer_id' => 'cus_variant789' ],
				]
			);

			WooCommerce_Gateway_Stripe::clear_stripe_customer_id_on_renewal( $renewal_order, $subscription );

			$this->assertSame(
				'cus_variant789',
				$renewal_order->get_meta( '_stripe_customer_id' ),
				"_stripe_customer_id should not be cleared from renewal order for {$gateway}."
			);
		}
	}
}

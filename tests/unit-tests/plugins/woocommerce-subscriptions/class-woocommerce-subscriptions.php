<?php
/**
 * Tests the WooCommerce Subscriptions integration class.
 *
 * @package Newspack\Tests
 */

use Newspack\WooCommerce_Subscriptions;
use Newspack\Reader_Activation;

require_once __DIR__ . '/../../../mocks/wc-mocks.php';

/**
 * Test WooCommerce Subscriptions integration functionality.
 *
 * @group WooCommerce_Subscriptions_Integration
 */
class Newspack_Test_WooCommerce_Subscriptions extends WP_UnitTestCase {
	/**
	 * Reset the global mock databases before each test.
	 */
	public function set_up() {
		parent::set_up();
		global $subscriptions_database, $products_database, $wcs_mock_total_paid_including_signup_fee, $wcs_mock_last_calculate_total_paid_args, $wcs_mock_order_items, $wcs_mock_items_sign_up_fee;
		$subscriptions_database                   = [];
		$products_database                        = [];
		$wcs_mock_total_paid_including_signup_fee = 0;
		$wcs_mock_last_calculate_total_paid_args  = null;
		$wcs_mock_order_items                     = [];
		$wcs_mock_items_sign_up_fee               = 0;
	}

	/**
	 * Reset any filters or mock state added by individual tests so they do
	 * not leak across tests.
	 */
	public function tear_down() {
		global $wcs_mock_total_paid_including_signup_fee, $wcs_mock_last_calculate_total_paid_args, $wcs_mock_order_items, $wcs_mock_items_sign_up_fee;
		$wcs_mock_total_paid_including_signup_fee = 0;
		$wcs_mock_last_calculate_total_paid_args  = null;
		$wcs_mock_order_items                     = [];
		$wcs_mock_items_sign_up_fee               = 0;
		remove_all_filters( 'newspack_wc_subs_switch_include_signup_fee' );
		parent::tear_down();
	}

	/**
	 * Test WooCommerce_Subscriptions::is_active.
	 */
	public function test_is_active() {
		$is_active = WooCommerce_Subscriptions::is_active();
		$this->assertFalse( $is_active, 'WooCommerce Subscriptions integration should not be active if the main WooCommerce plugin is not available.' );
	}

	/**
	 * Test WooCommerce_Subscriptions::is_enabled.
	 */
	public function test_is_enabled() {
		$is_enabled = WooCommerce_Subscriptions::is_enabled();
		$this->assertFalse( $is_enabled, 'WooCommerce Subscriptions integration should not be active if the main WooCommerce plugin is not available.' );
	}

	/**
	 * Test get_user_subscription returns an active subscription for a simple product.
	 */
	public function test_get_user_subscription_simple_product_active() {
		$user_id    = $this->factory->user->create();
		$product_id = 100;
		$product    = wc_create_mock_product( [ 'id' => $product_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'active',
				'products'    => [ $product_id ],
			]
		);

		$result = WooCommerce_Subscriptions::get_user_subscription( $product, $user_id );
		$this->assertInstanceOf( WC_Subscription::class, $result, 'Should find active subscription for a simple product.' );
	}

	/**
	 * Test get_user_subscription returns null for a simple product with no subscription.
	 */
	public function test_get_user_subscription_simple_product_none() {
		$user_id = $this->factory->user->create();
		$product = wc_create_mock_product( [ 'id' => 200 ] );

		$result = WooCommerce_Subscriptions::get_user_subscription( $product, $user_id );
		$this->assertNull( $result, 'Should return null when the user has no subscription for the product.' );
	}

	/**
	 * Test get_user_subscription finds an active subscription on a child product.
	 */
	public function test_get_user_subscription_variable_product() {
		$user_id  = $this->factory->user->create();
		$child_id = 301;

		wc_create_mock_product( [ 'id' => $child_id ] );
		$parent = wc_create_mock_product(
			[
				'id'       => 300,
				'type'     => 'variable',
				'children' => [ $child_id ],
			]
		);

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'active',
				'products'    => [ $child_id ],
			]
		);

		$result = WooCommerce_Subscriptions::get_user_subscription( $parent, $user_id );
		$this->assertInstanceOf( WC_Subscription::class, $result, 'Should find active subscription on a child/variation product.' );
	}

	/**
	 * Test get_user_subscription treats pending-cancel as active.
	 */
	public function test_get_user_subscription_pending_cancel_is_active() {
		$user_id    = $this->factory->user->create();
		$product_id = 400;
		$product    = wc_create_mock_product( [ 'id' => $product_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'pending-cancel',
				'products'    => [ $product_id ],
			]
		);

		$result = WooCommerce_Subscriptions::get_user_subscription( $product, $user_id );
		$this->assertInstanceOf( WC_Subscription::class, $result, 'Should treat pending-cancel subscriptions as active.' );
	}

	/**
	 * Test get_user_subscription returns null for an expired subscription.
	 */
	public function test_get_user_subscription_expired_returns_null() {
		$user_id    = $this->factory->user->create();
		$product_id = 500;
		$product    = wc_create_mock_product( [ 'id' => $product_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'expired',
				'products'    => [ $product_id ],
			]
		);

		$result = WooCommerce_Subscriptions::get_user_subscription( $product, $user_id );
		$this->assertNull( $result, 'Should return null for an expired subscription.' );
	}

	/**
	 * Test get_user_subscription returns null for a cancelled subscription.
	 */
	public function test_get_user_subscription_cancelled_returns_null() {
		$user_id    = $this->factory->user->create();
		$product_id = 600;
		$product    = wc_create_mock_product( [ 'id' => $product_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'cancelled',
				'products'    => [ $product_id ],
			]
		);

		$result = WooCommerce_Subscriptions::get_user_subscription( $product, $user_id );
		$this->assertNull( $result, 'Should return null for a cancelled subscription.' );
	}

	/**
	 * When WCS finds no amount paid, recover the baseline from the
	 * subscription's recurring line-item total.
	 */
	public function test_recover_total_paid_when_wcs_returns_zero() {
		$subscription  = new WC_Subscription(
			[
				'id'     => 1,
				'status' => 'active',
				'meta'   => [ '_piano_subscription_id' => 'piano-1' ],
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 50.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 50.0, $result, 'A zero WCS value should fall back to the recurring line-item total.' );
	}

	/**
	 * A legitimate non-zero WCS value must be returned unchanged.
	 */
	public function test_recover_total_paid_leaves_positive_value_untouched() {
		$subscription  = new WC_Subscription(
			[
				'id'     => 2,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 50.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 12.34, $subscription, $existing_item );

		$this->assertSame( 12.34, $result, 'A positive WCS value must not be overridden.' );
	}

	/**
	 * A genuinely free subscription (recurring total is zero) must stay zero
	 * so no phantom credit is created.
	 */
	public function test_recover_total_paid_stays_zero_for_free_subscription() {
		$subscription  = new WC_Subscription(
			[
				'id'     => 3,
				'status' => 'active',
				'meta'   => [ '_piano_subscription_id' => 'piano-3' ],
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 0.0, $result, 'A free subscription must not gain a phantom proration credit.' );
	}

	/**
	 * A non-object / unexpected existing item must be passed through untouched
	 * so the filter never fatals or fabricates a value.
	 */
	public function test_recover_total_paid_passes_through_when_item_not_an_order_item() {
		$subscription = new WC_Subscription(
			[
				'id'     => 4,
				'status' => 'active',
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, null );

		$this->assertSame( 0.0, $result, 'A non-order-item argument must be returned unchanged.' );
	}

	/**
	 * A subscription still in its free trial must not gain a recovered
	 * baseline, otherwise an unpaid trial could be switched into
	 * manufactured proration credit.
	 */
	public function test_recover_total_paid_skips_active_free_trial() {
		$subscription  = new WC_Subscription(
			[
				'id'     => 5,
				'status' => 'active',
				'times'  => [
					'trial_end' => time() + DAY_IN_SECONDS,
				],
				'meta'   => [ '_piano_subscription_id' => 'piano-5' ],
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 50.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 0.0, $result, 'A subscription in an active free trial must not receive a recovered baseline.' );
	}

	/**
	 * A non-migrated subscription must not gain a recovered baseline. WCS's
	 * default switching behavior is intentional for comped, discounted, or
	 * otherwise zero-paid subscriptions that originate in WooCommerce.
	 */
	public function test_recover_total_paid_skips_non_migrated_subscription() {
		$subscription  = new WC_Subscription(
			[
				'id'     => 6,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 50.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 0.0, $result, 'A non-migrated subscription must be left to WCS default behavior.' );
	}

	/**
	 * With sign-up-fee counting enabled, a non-migrated subscription whose
	 * amount paid (including the sign-up fee) is higher than WCS's value
	 * recovers to the sign-up-fee-inclusive amount.
	 */
	public function test_recover_total_paid_counts_signup_fee_when_enabled() {
		global $wcs_mock_total_paid_including_signup_fee;
		$wcs_mock_total_paid_including_signup_fee = 30.0;

		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription  = new WC_Subscription(
			[
				'id'     => 10,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 30.0, $result, 'The paid sign-up fee should become the recovered baseline when counting is enabled.' );
	}

	/**
	 * With sign-up-fee counting disabled (the default), a non-migrated
	 * subscription is left to WCS's default switching behavior even when a
	 * sign-up fee was paid.
	 */
	public function test_recover_total_paid_skips_signup_fee_when_disabled() {
		global $wcs_mock_total_paid_including_signup_fee;
		$wcs_mock_total_paid_including_signup_fee = 30.0;

		$subscription  = new WC_Subscription(
			[
				'id'     => 11,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 0.0, $result, 'A non-migrated subscription must not recover the sign-up fee while counting is disabled.' );
	}

	/**
	 * With sign-up-fee counting enabled but nothing actually paid (a comped
	 * purchase, no sign-up fee), the subscription is left untouched.
	 */
	public function test_recover_total_paid_skips_signup_fee_when_nothing_paid() {
		global $wcs_mock_total_paid_including_signup_fee;
		$wcs_mock_total_paid_including_signup_fee = 0.0;

		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription  = new WC_Subscription(
			[
				'id'     => 12,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 0.0, $result, 'With no sign-up fee actually paid there is nothing to recover.' );
	}

	/**
	 * A migrated subscription is recovered through the migrated branch even
	 * when sign-up-fee counting is enabled; the sign-up-fee branch is not
	 * reached.
	 */
	public function test_recover_total_paid_migrated_takes_precedence_over_signup_fee() {
		global $wcs_mock_total_paid_including_signup_fee;
		$wcs_mock_total_paid_including_signup_fee = 999.0;

		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription  = new WC_Subscription(
			[
				'id'     => 13,
				'status' => 'active',
				'meta'   => [ '_piano_subscription_id' => 'piano-13' ],
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 50.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 50.0, $result, 'A migrated subscription must recover via the recurring total, not the sign-up-fee branch.' );
	}

	/**
	 * Stripe migration meta triggers the same recovery as Piano migration meta.
	 *
	 * The recovery path keys off the meta-driven helper, so both keys must
	 * behave identically. Without this test, dropping `_stripe_subscription_id`
	 * from the helper would not fail any assertion.
	 */
	public function test_recover_total_paid_recognizes_stripe_migration_meta() {
		$subscription  = new WC_Subscription(
			[
				'id'     => 20,
				'status' => 'active',
				'meta'   => [ '_stripe_subscription_id' => 'stripe-20' ],
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 50.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 50.0, $result, 'A Stripe-migrated subscription should recover the same way a Piano-migrated one does.' );
	}

	/**
	 * The `instanceof WC_Order_Item_Product` guard rejects any object that is
	 * not an order item -- not just `null`. Without this test, a regression
	 * that removed the instanceof check would only fail the null case.
	 */
	public function test_recover_total_paid_passes_through_for_non_order_item_object() {
		$subscription = new WC_Subscription(
			[
				'id'     => 21,
				'status' => 'active',
				'meta'   => [ '_piano_subscription_id' => 'piano-21' ],
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, new stdClass() );

		$this->assertSame( 0.0, $result, 'A wrong-typed object must be returned unchanged, just like null.' );
	}

	/**
	 * A paid-trial subscription with the opt-in enabled and an active free
	 * trial recovers to the sign-up fee the reader actually paid.
	 *
	 * This is the publisher use case the opt-in is designed for: stepped
	 * pricing as a sign-up fee plus a free trial. WCS sees `$0` paid (the
	 * sign-up fee is excluded from its accounting), but the reader did pay
	 * the fee, and a switch during the trial should be prorated against it.
	 */
	public function test_recover_total_paid_counts_signup_fee_during_active_trial() {
		global $wcs_mock_total_paid_including_signup_fee;
		$wcs_mock_total_paid_including_signup_fee = 25.0;

		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription  = new WC_Subscription(
			[
				'id'     => 22,
				'status' => 'active',
				'times'  => [
					'trial_end' => time() + DAY_IN_SECONDS,
				],
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		$result = WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( 25.0, $result, 'A paid-trial sub mid-trial with opt-in enabled should recover the paid sign-up fee.' );
	}

	/**
	 * The `newspack_wc_subs_switch_include_signup_fee` filter must receive
	 * the subscription and line item alongside the enabled flag so callbacks
	 * can scope the decision per-subscription or per-product. A regression
	 * dropping those args would silently downgrade the filter to a global
	 * on/off toggle.
	 */
	public function test_signup_fee_filter_receives_subscription_and_item() {
		$captured     = [];
		$subscription = new WC_Subscription(
			[
				'id'     => 40,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		add_filter(
			'newspack_wc_subs_switch_include_signup_fee',
			function ( $enabled, $sub, $item ) use ( &$captured ) {
				$captured = [
					'enabled'      => $enabled,
					'subscription' => $sub,
					'item'         => $item,
				];
				return $enabled;
			},
			10,
			3
		);

		WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertSame( $subscription, $captured['subscription'], 'Filter must receive the subscription so callbacks can scope per-subscription.' );
		$this->assertSame( $existing_item, $captured['item'], 'Filter must receive the line item so callbacks can scope per-product.' );
		$this->assertFalse( $captured['enabled'], 'Default enabled value must be false when neither constant nor opt-in filter sets it.' );
	}

	/**
	 * When the sign-up-fee branch fires, the WCS call must include sign-up
	 * fees -- not the default `exclude_sign_up_fees` mode. A regression
	 * flipping that flag would silently break the recovery without changing
	 * the returned value.
	 */
	public function test_recover_total_paid_passes_include_sign_up_fees_argument() {
		global $wcs_mock_total_paid_including_signup_fee, $wcs_mock_last_calculate_total_paid_args;
		$wcs_mock_total_paid_including_signup_fee = 25.0;

		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription  = new WC_Subscription(
			[
				'id'     => 23,
				'status' => 'active',
			]
		);
		$existing_item = new WC_Order_Item_Product(
			[
				'product_id' => 100,
				'total'      => 0.0,
			]
		);

		WooCommerce_Subscriptions::recover_total_paid_for_switch( 0.0, $subscription, $existing_item );

		$this->assertNotNull( $wcs_mock_last_calculate_total_paid_args, 'WCS::calculate_total_paid_since_last_order() should have been called.' );
		$this->assertSame( 'include_sign_up_fees', $wcs_mock_last_calculate_total_paid_args['include_sign_up_fees'], 'Sign-up fees must be included; otherwise the recovery is a no-op.' );
	}

	/**
	 * Migrated subscriptions clamp days_in_old_cycle to one billing cycle.
	 *
	 * Without this clamp, WCS divides the recovered recurring total by the
	 * span from the original platform sign-up to the next renewal -- often
	 * many cycles -- which makes old_price_per_day artificially low and
	 * misclassifies a downgrade as an upgrade even after
	 * recover_total_paid_for_switch supplies one cycle's worth of value.
	 */
	public function test_bound_switch_proration_days_in_old_cycle_clamps_migrated_subscription() {
		$subscription = new WC_Subscription(
			[
				'id'               => 30,
				'status'           => 'active',
				'billing_period'   => 'month',
				'billing_interval' => 1,
				'meta'             => [ '_piano_subscription_id' => 'piano-30' ],
			]
		);

		// 730 days = ~2 years of accumulated span since the original platform sign-up.
		$result = WooCommerce_Subscriptions::bound_switch_proration_days_in_old_cycle( 730, $subscription );

		$this->assertSame( 30, $result, 'A migrated monthly sub must clamp to one cycle (30 days), not the full span since original sign-up.' );
	}

	/**
	 * If WCS already computed a value inside a single billing cycle (early
	 * switches, monthly subs newly migrated), respect that value instead of
	 * inflating it to one cycle's worth.
	 */
	public function test_bound_switch_proration_days_in_old_cycle_respects_smaller_value() {
		$subscription = new WC_Subscription(
			[
				'id'               => 31,
				'status'           => 'active',
				'billing_period'   => 'month',
				'billing_interval' => 1,
				'meta'             => [ '_piano_subscription_id' => 'piano-31' ],
			]
		);

		$result = WooCommerce_Subscriptions::bound_switch_proration_days_in_old_cycle( 12, $subscription );

		$this->assertSame( 12, $result, 'The clamp is a ceiling, not a floor; a smaller WCS value must pass through.' );
	}

	/**
	 * Non-migrated subscriptions are left to WCS's default behavior even
	 * when WCS computes a denominator longer than one cycle.
	 */
	public function test_bound_switch_proration_days_in_old_cycle_skips_non_migrated_subscription() {
		$subscription = new WC_Subscription(
			[
				'id'               => 32,
				'status'           => 'active',
				'billing_period'   => 'month',
				'billing_interval' => 1,
			]
		);

		$result = WooCommerce_Subscriptions::bound_switch_proration_days_in_old_cycle( 730, $subscription );

		$this->assertSame( 730, $result, 'A non-migrated subscription must pass through unchanged.' );
	}

	/**
	 * Annual migrated subscriptions clamp to one annual cycle, not one month.
	 */
	public function test_bound_switch_proration_days_in_old_cycle_uses_billing_period_for_clamp() {
		$subscription = new WC_Subscription(
			[
				'id'               => 33,
				'status'           => 'active',
				'billing_period'   => 'year',
				'billing_interval' => 1,
				'meta'             => [ '_stripe_subscription_id' => 'stripe-33' ],
			]
		);

		// 1500 days = ~4+ years of accumulated span.
		$result = WooCommerce_Subscriptions::bound_switch_proration_days_in_old_cycle( 1500, $subscription );

		$this->assertSame( 365, $result, 'An annual migrated sub must clamp to one year (365 days), not one month.' );
	}

	/**
	 * Helper: stage a paid-trial switch cart context with a new product
	 * priced at $new_recurring for the upgrade target.
	 *
	 * @param float $total_paid    Amount the reader paid for the old plan.
	 * @param float $new_recurring Full-cycle recurring price of the new (upgrade) plan.
	 * @return array { subscription, existing_item, cart_item } tuple.
	 */
	private function stage_paid_trial_switch_context( $total_paid, $new_recurring = 10.0 ) {
		global $wcs_mock_total_paid_including_signup_fee, $wcs_mock_order_items;

		$wcs_mock_total_paid_including_signup_fee = $total_paid;

		$existing_item = new WC_Order_Item_Product(
			[
				'id'         => 999,
				'product_id' => 100,
				'total'      => 5.0,
			]
		);
		$wcs_mock_order_items[999] = $existing_item;

		$subscription = new WC_Subscription(
			[
				'id'     => 50,
				'status' => 'active',
				'times'  => [
					'trial_end' => time() + ( 15 * DAY_IN_SECONDS ),
				],
			]
		);

		$new_product = wc_create_mock_product(
			[
				'id'   => 200,
				'meta' => [ '_subscription_price' => (string) $new_recurring ],
			]
		);

		$cart_item = [
			'subscription_switch' => [ 'item_id' => 999 ],
			'data'                => $new_product,
		];

		return [ $subscription, $existing_item, $cart_item ];
	}

	/**
	 * Stepped-pricing immediate switch: nothing consumed, full unconsumed
	 * credit applied. For Regular ($3 paid) -> Pro ($10/mo), the reader
	 * pays new_recurring - unconsumed = $10 - $3 = $7.
	 */
	public function test_apply_stepped_pricing_switch_charge_returns_new_recurring_minus_unconsumed_at_day_0() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		// total_paid = $3, new_recurring = $10. WCS computed extra_to_pay = -$3 (full unconsumed credit).
		[ $subscription, , $cart_item ] = $this->stage_paid_trial_switch_context( 3.0 );

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -3.0, $subscription, $cart_item );

		$this->assertSame( 7.0, $result, 'Day-0 switch charges new_recurring ($10) minus full unconsumed credit ($3).' );
	}

	/**
	 * Stepped-pricing mid-trial switch: half consumed, half credited. For
	 * Regular ($3 paid) -> Pro ($10/mo) at day 15 of 30, WCS reports
	 * extra_to_pay = -$1.50; charge = $10 - $1.50 = $8.50.
	 */
	public function test_apply_stepped_pricing_switch_charge_at_day_15() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		[ $subscription, , $cart_item ] = $this->stage_paid_trial_switch_context( 3.0 );

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -1.5, $subscription, $cart_item );

		$this->assertSame( 8.5, $result, 'Day-15 switch charges new_recurring ($10) minus half-unconsumed ($1.50).' );
	}

	/**
	 * If the new plan is cheaper (Pro -> Regular), the result is still
	 * clamped at 0 -- we never refund or carry credit across switches.
	 */
	public function test_apply_stepped_pricing_switch_charge_clamps_negative_to_zero() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		// new_recurring = $2 (cheap), unconsumed_credit = $3 (-$3 extra_to_pay).
		// $2 - $3 = -$1 -> clamped to 0.
		[ $subscription, , $cart_item ] = $this->stage_paid_trial_switch_context( 3.0, 2.0 );

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -3.0, $subscription, $cart_item );

		$this->assertSame( 0.0, $result, 'A downgrade whose unconsumed credit exceeds the new recurring must clamp to 0.' );
	}

	/**
	 * Without the opt-in, the manufactured negative credit is left alone --
	 * publishers who have not opted in get WCS's default behavior.
	 */
	public function test_apply_stepped_pricing_switch_charge_passes_through_without_optin() {
		[ $subscription, , $cart_item ] = $this->stage_paid_trial_switch_context( 3.0 );

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -3.0, $subscription, $cart_item );

		$this->assertSame( -3.0, $result, 'Without the opt-in, the negative credit must pass through unchanged.' );
	}

	/**
	 * A legitimate downgrade credit outside any trial is left alone -- our
	 * filter must not block normal proration refunds when the publisher
	 * downgrades a fully-paid subscription.
	 */
	public function test_apply_stepped_pricing_switch_charge_passes_through_outside_trial() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription = new WC_Subscription(
			[
				'id'     => 42,
				'status' => 'active',
			]
		);

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -5.0, $subscription, [] );

		$this->assertSame( -5.0, $result, 'Negative credits on non-trial switches are legitimate downgrade refunds and must not be touched.' );
	}

	/**
	 * A positive extra_to_pay -- a real upgrade charge from WCS -- always
	 * passes through unchanged, regardless of opt-in or trial state.
	 */
	public function test_apply_stepped_pricing_switch_charge_passes_through_positive_value() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		[ $subscription, , $cart_item ] = $this->stage_paid_trial_switch_context( 3.0 );

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( 7.5, $subscription, $cart_item );

		$this->assertSame( 7.5, $result, 'A positive extra_to_pay is a real upgrade charge and must be preserved.' );
	}

	/**
	 * The filter guards against non-WC_Subscription inputs so it cannot
	 * fatal if a third-party callback supplies an unexpected value.
	 */
	public function test_apply_stepped_pricing_switch_charge_passes_through_non_subscription() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -3.0, null, [] );

		$this->assertSame( -3.0, $result, 'A non-WC_Subscription argument must be returned unchanged.' );
	}

	/**
	 * If the new product is missing from the cart_item (malformed switch
	 * metadata), the filter passes through so we never fabricate a charge
	 * without knowing the upgrade target's recurring price.
	 */
	public function test_apply_stepped_pricing_switch_charge_passes_through_without_new_product() {
		add_filter( 'newspack_wc_subs_switch_include_signup_fee', '__return_true' );

		$subscription = new WC_Subscription(
			[
				'id'     => 43,
				'status' => 'active',
				'times'  => [
					'trial_end' => time() + ( 15 * DAY_IN_SECONDS ),
				],
			]
		);

		// cart_item missing 'data' (new product) -> no recurring price lookup possible.
		$result = WooCommerce_Subscriptions::apply_stepped_pricing_switch_charge( -3.0, $subscription, [] );

		$this->assertSame( -3.0, $result, 'Without the new product we cannot compute the charge and must pass through.' );
	}
}

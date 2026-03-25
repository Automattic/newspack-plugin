<?php
/**
 * Tests for the Premium_Newsletters class.
 *
 * @package Newspack\Tests\Content_Gate
 * @group premium-newsletters
 */

namespace Newspack\Tests\Content_Gate;

use Newspack\Content_Gate;
use Newspack\Content_Rules;
use Newspack\Data_Events;
use Newspack\Premium_Newsletters;

/**
 * Tests for the Premium_Newsletters class.
 *
 * @group premium-newsletters
 */
class Newspack_Test_Premium_Newsletters extends \WP_UnitTestCase {

	/**
	 * Gate IDs created during tests.
	 *
	 * @var int[]
	 */
	private $gate_ids = [];

	/**
	 * Post IDs created during tests.
	 *
	 * @var int[]
	 */
	private $post_ids = [];

	/**
	 * Set up before all tests.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		require_once dirname( __DIR__, 2 ) . '/mocks/newsletters-mocks.php';
		require_once dirname( __DIR__, 2 ) . '/mocks/newsletters-namespaced-mocks.php';
		require_once dirname( __DIR__, 2 ) . '/mocks/wc-mocks.php';
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		\Newspack_Newsletters_Contacts::reset_calls();
		\Newspack_Newsletters_Subscription::reset_calls();
		remove_all_filters( 'newspack_content_restriction_control_user_id' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		foreach ( $this->gate_ids as $id ) {
			wp_delete_post( $id, true );
		}
		$this->gate_ids = [];
		foreach ( $this->post_ids as $id ) {
			wp_delete_post( $id, true );
		}
		$this->post_ids = [];
		parent::tear_down();
	}

	/**
	 * Create a newsletter gate with the given product IDs and list IDs.
	 *
	 * @param array $product_ids Product IDs for the subscription access rule.
	 * @param array $list_ids    List post IDs for the newsletters content rule.
	 *
	 * @return int Gate post ID.
	 */
	private function create_newsletter_gate( array $product_ids, array $list_ids ): int {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Newsletter Gate' ], Content_Gate::GATE_CPT, true );
		$this->gate_ids[] = $gate_id;

		Content_Gate::update_custom_access_settings(
			$gate_id,
			[
				'active'       => true,
				'access_rules' => [
					[
						[
							'slug'  => 'subscription',
							'value' => $product_ids,
						],
					],
				],
			]
		);

		Content_Rules::update_gate_content_rules(
			$gate_id,
			[
				[
					'slug'  => 'newsletters',
					'value' => $list_ids,
				],
			]
		);

		return $gate_id;
	}

	// =========================================================================
	// Group A — get_restricted_lists_by_products()
	// =========================================================================

	/**
	 * Test that standard (non-newsletter) gates are ignored.
	 */
	public function test_get_restricted_lists_ignores_standard_gates() {
		// Create a standard gate (not newsletter — third arg omitted / false).
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Standard Gate' ], Content_Gate::GATE_CPT, false );
		$this->gate_ids[] = $gate_id;

		update_post_meta(
			$gate_id,
			'custom_access',
			[
				'active'       => true,
				'access_rules' => [
					[
						[
							'slug'  => 'subscription',
							'value' => [ 100 ],
						],
					],
				],
			]
		);

		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		Content_Rules::update_gate_content_rules(
			$gate_id,
			[
				[
					'slug'  => 'newsletters',
					'value' => [ $list_post_id ],
				],
			]
		);

		$result = Premium_Newsletters::get_restricted_lists_by_products( null );
		$this->assertEmpty( $result );
	}

	/**
	 * Test that newsletter gates without active custom_access are skipped.
	 */
	public function test_get_restricted_lists_skips_inactive_custom_access() {
		// Create newsletter gate but do NOT set custom_access meta (defaults to inactive).
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Newsletter Gate Inactive' ], Content_Gate::GATE_CPT, true );
		$this->gate_ids[] = $gate_id;

		$result = Premium_Newsletters::get_restricted_lists_by_products( null );
		$this->assertEmpty( $result );
	}

	/**
	 * Test that newsletter gates with no subscription rule are skipped.
	 */
	public function test_get_restricted_lists_skips_gate_with_no_subscription_rule() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Newsletter Gate No Sub' ], Content_Gate::GATE_CPT, true );
		$this->gate_ids[] = $gate_id;

		update_post_meta(
			$gate_id,
			'custom_access',
			[
				'active'       => true,
				'access_rules' => [
					[
						[
							'slug'  => 'email_domain',
							'value' => 'example.com',
						],
					],
				],
			]
		);

		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		Content_Rules::update_gate_content_rules(
			$gate_id,
			[
				[
					'slug'  => 'newsletters',
					'value' => [ $list_post_id ],
				],
			]
		);

		$result = Premium_Newsletters::get_restricted_lists_by_products( null );
		$this->assertEmpty( $result );
	}

	/**
	 * Test that no results returned when product does not match.
	 */
	public function test_get_restricted_lists_returns_empty_when_product_does_not_match() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 200 ], [ $list_post_id ] );

		$result = Premium_Newsletters::get_restricted_lists_by_products( [ 999 ] );
		$this->assertEmpty( $result );
	}

	/**
	 * Test that the public list ID is returned for a matching product.
	 */
	public function test_get_restricted_lists_returns_public_id_for_matching_product() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 200 ], [ $list_post_id ] );

		$result = Premium_Newsletters::get_restricted_lists_by_products( [ 200 ] );
		$this->assertCount( 1, $result );
		$this->assertContains( 'list-' . $list_post_id, $result );
	}

	/**
	 * Test that results aggregate across multiple gates.
	 */
	public function test_get_restricted_lists_aggregates_across_multiple_gates() {
		$list_post_id_1 = $this->factory->post->create();
		$list_post_id_2 = $this->factory->post->create();
		$this->post_ids[] = $list_post_id_1;
		$this->post_ids[] = $list_post_id_2;

		$this->create_newsletter_gate( [ 300 ], [ $list_post_id_1 ] );
		$this->create_newsletter_gate( [ 300 ], [ $list_post_id_2 ] );

		$result = Premium_Newsletters::get_restricted_lists_by_products( [ 300 ] );
		$this->assertCount( 2, $result );
		$this->assertContains( 'list-' . $list_post_id_1, $result );
		$this->assertContains( 'list-' . $list_post_id_2, $result );
	}

	/**
	 * Test that duplicate list IDs across gates are deduplicated.
	 */
	public function test_get_restricted_lists_deduplicates_list_ids() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 400 ], [ $list_post_id ] );
		$this->create_newsletter_gate( [ 400 ], [ $list_post_id ] );

		$result = Premium_Newsletters::get_restricted_lists_by_products( [ 400 ] );
		$this->assertCount( 1, $result );
	}

	/**
	 * Test that all lists are returned when product_ids is null.
	 */
	public function test_get_restricted_lists_returns_all_when_product_ids_is_null() {
		$list_post_id_1 = $this->factory->post->create();
		$list_post_id_2 = $this->factory->post->create();
		$this->post_ids[] = $list_post_id_1;
		$this->post_ids[] = $list_post_id_2;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id_1 ] );
		$this->create_newsletter_gate( [ 200 ], [ $list_post_id_2 ] );

		$result = Premium_Newsletters::get_restricted_lists_by_products( null );
		$this->assertCount( 2, $result );
	}

	/**
	 * Test that a scalar product ID is accepted.
	 */
	public function test_get_restricted_lists_accepts_scalar_product_id() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 500 ], [ $list_post_id ] );

		$result = Premium_Newsletters::get_restricted_lists_by_products( 500 );
		$this->assertCount( 1, $result );
	}

	// =========================================================================
	// Group B — maybe_add_user_to_lists()
	// =========================================================================

	/**
	 * Test that lists are added on payment.
	 */
	public function test_maybe_add_user_to_lists_adds_lists_on_payment() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		Premium_Newsletters::maybe_add_user_to_lists(
			time(),
			[
				'subscription_id' => 42,
				'email'           => 'subscriber@example.com',
				'product_ids'     => [ 100 ],
			],
			null
		);

		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertEquals( 'subscriber@example.com', $calls[0]['email'] );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_add'] );
		$this->assertEmpty( $calls[0]['lists_to_remove'] );
	}

	/**
	 * Test that already-subscribed lists are skipped.
	 */
	public function test_maybe_add_user_to_lists_skips_already_subscribed_lists() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		// Simulate user already subscribed.
		\Newspack_Newsletters_Subscription::$contact_lists['subscriber@example.com'] = [ 'list-' . $list_post_id ];

		Premium_Newsletters::maybe_add_user_to_lists(
			time(),
			[
				'subscription_id' => 42,
				'email'           => 'subscriber@example.com',
				'product_ids'     => [ 100 ],
			],
			null
		);

		$this->assertEmpty( \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	/**
	 * Test that product_ids from data are used to filter lists.
	 */
	public function test_maybe_add_user_to_lists_uses_product_ids_from_data() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 200 ], [ $list_post_id ] );

		Premium_Newsletters::maybe_add_user_to_lists(
			time(),
			[
				'subscription_id' => 42,
				'email'           => 'subscriber@example.com',
				'product_ids'     => [ 999 ],
			],
			null
		);

		$this->assertEmpty( \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	// =========================================================================
	// Group C — maybe_remove_user_from_lists()
	// =========================================================================

	/**
	 * Test that remove proceeds when status_after key is absent.
	 */
	public function test_maybe_remove_user_from_lists_proceeds_when_status_after_absent() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		Premium_Newsletters::maybe_remove_user_from_lists(
			time(),
			[
				'subscription_id' => 42,
				'email'           => 'subscriber@example.com',
				'product_ids'     => [ 100 ],
			],
			null
		);

		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_remove'] );
		$this->assertEmpty( $calls[0]['lists_to_add'] );
	}

	/**
	 * Test that remove proceeds on cancelled status.
	 */
	public function test_maybe_remove_user_from_lists_proceeds_on_cancelled() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		Premium_Newsletters::maybe_remove_user_from_lists(
			time(),
			[
				'subscription_id' => 42,
				'email'           => 'subscriber@example.com',
				'product_ids'     => [ 100 ],
				'status_after'    => 'cancelled',
			],
			null
		);

		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_remove'] );
	}

	/**
	 * Test that remove proceeds on expired status.
	 */
	public function test_maybe_remove_user_from_lists_proceeds_on_expired() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		Premium_Newsletters::maybe_remove_user_from_lists(
			time(),
			[
				'subscription_id' => 42,
				'email'           => 'subscriber@example.com',
				'product_ids'     => [ 100 ],
				'status_after'    => 'expired',
			],
			null
		);

		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_remove'] );
	}

	/**
	 * Test that remove is skipped for non-terminal statuses.
	 */
	public function test_maybe_remove_user_from_lists_skips_non_terminal_status() {
		$list_post_id = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		$non_terminal_statuses = [ 'active', 'on-hold', 'pending', 'pending-cancel' ];

		foreach ( $non_terminal_statuses as $status ) {
			\Newspack_Newsletters_Contacts::reset_calls();

			Premium_Newsletters::maybe_remove_user_from_lists(
				time(),
				[
					'subscription_id' => 42,
					'email'           => 'subscriber@example.com',
					'product_ids'     => [ 100 ],
					'status_after'    => $status,
				],
				null
			);

			$this->assertEmpty(
				\Newspack_Newsletters_Contacts::$add_and_remove_lists_calls,
				"Expected no call for status_after = '{$status}'"
			);
		}
	}

	// =========================================================================
	// Group D — filter_subscription_lists()
	// =========================================================================

	/**
	 * Test that unrestricted lists pass through.
	 */
	public function test_filter_subscription_lists_passes_unrestricted_lists() {
		$post_id = $this->factory->post->create();
		$this->post_ids[] = $post_id;

		// No gate covering this post.
		$mock_list = new \Newspack\Newsletters\Subscription_List( $post_id );

		$result = Premium_Newsletters::filter_subscription_lists( [ $mock_list ] );
		$this->assertCount( 1, $result );
		$this->assertSame( $mock_list, $result[0] );
	}

	/**
	 * Test that restricted lists are removed.
	 */
	public function test_filter_subscription_lists_removes_restricted_lists() {
		// Register the CPT so posts of this type can be created.
		if ( ! post_type_exists( \Newspack\Newsletters\Subscription_Lists::CPT ) ) {
			register_post_type( \Newspack\Newsletters\Subscription_Lists::CPT );
		}

		$post_id = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
		$this->post_ids[] = $post_id;

		$this->create_newsletter_gate( [ 100 ], [ $post_id ] );

		$mock_list = new \Newspack\Newsletters\Subscription_List( $post_id );

		$result = Premium_Newsletters::filter_subscription_lists( [ $mock_list ] );
		$this->assertEmpty( $result );
	}

	/**
	 * Test that the result array is re-indexed after filtering.
	 */
	public function test_filter_subscription_lists_result_is_reindexed() {
		// Register the CPT.
		if ( ! post_type_exists( \Newspack\Newsletters\Subscription_Lists::CPT ) ) {
			register_post_type( \Newspack\Newsletters\Subscription_Lists::CPT );
		}

		// Restricted post.
		$restricted_post_id = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
		$this->post_ids[] = $restricted_post_id;
		$this->create_newsletter_gate( [ 100 ], [ $restricted_post_id ] );

		// Unrestricted post.
		$unrestricted_post_id = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
		$this->post_ids[] = $unrestricted_post_id;

		$restricted_list   = new \Newspack\Newsletters\Subscription_List( $restricted_post_id );
		$unrestricted_list = new \Newspack\Newsletters\Subscription_List( $unrestricted_post_id );

		// Pass restricted first so index 0 would be missing without array_values.
		$result = Premium_Newsletters::filter_subscription_lists( [ $restricted_list, $unrestricted_list ] );
		$this->assertCount( 1, $result );
		$this->assertArrayHasKey( 0, $result, 'Result must be re-indexed (array_values applied).' );
		$this->assertSame( $unrestricted_list, $result[0] );
	}

	// =========================================================================
	// Group E — register_handlers()
	// =========================================================================

	/**
	 * Test that all four handlers are wired to the correct actions.
	 */
	public function test_register_handlers_wires_all_four_handlers() {
		$add_handler = [ 'Newspack\Premium_Newsletters', 'maybe_add_user_to_lists' ];
		$remove_handler = [ 'Newspack\Premium_Newsletters', 'maybe_remove_user_from_lists' ];

		$handlers = Data_Events::get_action_handlers( 'subscription_payment_complete' );
		$this->assertContains( $add_handler, $handlers, 'maybe_add_user_to_lists should be registered for subscription_payment_complete' );

		$handlers = Data_Events::get_action_handlers( 'subscription_renewal_payment_failed' );
		$this->assertContains( $remove_handler, $handlers, 'maybe_remove_user_from_lists should be registered for subscription_renewal_payment_failed' );

		$handlers = Data_Events::get_action_handlers( 'product_subscription_changed' );
		$this->assertContains( $remove_handler, $handlers, 'maybe_remove_user_from_lists should be registered for product_subscription_changed' );

		$handlers = Data_Events::get_action_handlers( 'donation_subscription_changed' );
		$this->assertContains( $remove_handler, $handlers, 'maybe_remove_user_from_lists should be registered for donation_subscription_changed' );
	}
}

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
		global $subscriptions_database;
		$subscriptions_database = [];
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
	// Group B — maybe_add_or_remove_lists() — adding behaviour
	// =========================================================================

	/**
	 * Test that lists are added when user has an active subscription matching the gate's access rule.
	 */
	public function test_maybe_add_or_remove_lists_adds_lists_when_user_has_access() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$email   = get_userdata( $user_id )->user_email;

		$list_post_id     = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'active',
				'products'    => [ 100 ],
			]
		);

		Premium_Newsletters::maybe_add_or_remove_lists(
			time(),
			[
				'user_id' => $user_id,
				'email'   => $email,
			],
			null
		);

		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertEquals( $email, $calls[0]['email'] );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_add'] );
		$this->assertEmpty( $calls[0]['lists_to_remove'] );
	}

	/**
	 * Test that no call is made when auto-signup is disabled, even when user has access.
	 */
	public function test_maybe_add_or_remove_lists_does_not_add_when_auto_signup_disabled() {
		update_option( 'newspack_premium_newsletters_auto_signup', 0 );

		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$email   = get_userdata( $user_id )->user_email;

		$list_post_id     = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'active',
				'products'    => [ 100 ],
			]
		);

		Premium_Newsletters::maybe_add_or_remove_lists(
			time(),
			[
				'user_id' => $user_id,
				'email'   => $email,
			],
			null
		);

		$this->assertEmpty( \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	/**
	 * Test that no call is made when user has access and auto-signup is on but is already subscribed.
	 */
	public function test_maybe_add_or_remove_lists_skips_already_subscribed_lists() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$email   = get_userdata( $user_id )->user_email;

		$list_post_id     = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'active',
				'products'    => [ 100 ],
			]
		);

		// Simulate user already subscribed to the list.
		\Newspack_Newsletters_Subscription::$contact_lists[ $email ] = [ 'list-' . $list_post_id ];

		Premium_Newsletters::maybe_add_or_remove_lists(
			time(),
			[
				'user_id' => $user_id,
				'email'   => $email,
			],
			null
		);

		// Production code calls get_contact_lists(), finds the list already present,
		// and exits early before calling add_and_remove_lists.
		$this->assertEmpty( \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	// =========================================================================
	// Group C — maybe_add_or_remove_lists() — removing behaviour
	// =========================================================================

	/**
	 * Test that lists are removed when the user has no subscription matching the gate's access rule.
	 */
	public function test_maybe_add_or_remove_lists_removes_lists_when_user_lacks_access() {
		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$email   = get_userdata( $user_id )->user_email;

		$list_post_id     = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 200 ], [ $list_post_id ] );

		// No WC subscription created — user has no access.

		Premium_Newsletters::maybe_add_or_remove_lists(
			time(),
			[
				'user_id' => $user_id,
				'email'   => $email,
			],
			null
		);

		// The remove path has no auto_signup guard — it fires regardless of that option.
		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_remove'] );
		$this->assertEmpty( $calls[0]['lists_to_add'] );
	}

	/**
	 * Test that a list is not removed when the user has access to the same list from another gate.
	 *
	 * Gate A (product 300) and Gate B (product 400) both cover the same list.
	 * The user has a subscription for product 300 (Gate A) but not 400 (Gate B).
	 * With auto-signup on, the list lands in lists_to_add (Gate A) and lists_to_remove (Gate B).
	 * After array_diff the list is stripped from lists_to_remove, so only an add call is made.
	 */
	public function test_maybe_add_or_remove_lists_does_not_remove_lists_accessible_from_another_gate() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$email   = get_userdata( $user_id )->user_email;

		$list_post_id     = $this->factory->post->create();
		$this->post_ids[] = $list_post_id;

		// Gate A: user has access (subscription for product 300).
		$this->create_newsletter_gate( [ 300 ], [ $list_post_id ] );
		// Gate B: user lacks access (no subscription for product 400).
		$this->create_newsletter_gate( [ 400 ], [ $list_post_id ] );

		wcs_create_subscription(
			[
				'customer_id' => $user_id,
				'status'      => 'active',
				'products'    => [ 300 ],
			]
		);

		Premium_Newsletters::maybe_add_or_remove_lists(
			time(),
			[
				'user_id' => $user_id,
				'email'   => $email,
			],
			null
		);

		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_add'] );
		$this->assertEmpty( $calls[0]['lists_to_remove'] );
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
		$handler = [ 'Newspack\Premium_Newsletters', 'maybe_add_or_remove_lists' ];

		foreach ( [
			'subscription_payment_complete',
			'subscription_renewal_payment_failed',
			'product_subscription_changed',
			'donation_subscription_changed',
		] as $action ) {
			$handlers = Data_Events::get_action_handlers( $action );
			$this->assertContains(
				$handler,
				$handlers,
				"maybe_add_or_remove_lists should be registered for {$action}"
			);
		}
	}
}

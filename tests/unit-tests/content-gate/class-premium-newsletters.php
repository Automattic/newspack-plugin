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
		if ( ! post_type_exists( \Newspack\Newsletters\Subscription_Lists::CPT ) ) {
			register_post_type( \Newspack\Newsletters\Subscription_Lists::CPT );
		}
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		\Newspack_Newsletters_Contacts::reset_calls();
		\Newspack_Newsletters_Subscription::reset_calls();
		remove_all_filters( 'newspack_content_restriction_control_user_id' );
		$prop = new \ReflectionProperty( Premium_Newsletters::class, 'restricted_lists' );
		$prop->setAccessible( true );
		$prop->setValue( null, [] );
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
		wp_clear_scheduled_hook( Premium_Newsletters::SCHEDULED_HOOK );
		if ( function_exists( 'as_unschedule_all_actions' ) ) {
			as_unschedule_all_actions( Premium_Newsletters::SCHEDULED_HOOK, [], 'newspack' );
		}
		// Clear alloptions cache after clearing scheduled events so that after the
		// DB transaction rolls back, Memcached does not retain the now-stale cron entry.
		wp_cache_delete( 'alloptions', 'options' );
		delete_option( Premium_Newsletters::QUEUE_OPTION );
		remove_all_filters( 'newspack_premium_newsletters_access_check_delay' );
		parent::tear_down();
	}

	// =========================================================================
	// Private test helpers
	// =========================================================================

	/**
	 * Return just the user_ids array from the stored queue option.
	 *
	 * @return int[]
	 */
	private function get_queued_user_ids(): array {
		$state = get_option( Premium_Newsletters::QUEUE_OPTION, [] );
		return isset( $state['user_ids'] ) ? (array) $state['user_ids'] : [];
	}

	/**
	 * Write a queue state option directly, bypassing schedule_access_check.
	 *
	 * @param int[] $user_ids   User IDs to place in the queue.
	 * @param int   $created_at Unix timestamp for the batch. Defaults to now.
	 *
	 * @return void
	 */
	private function set_queue( array $user_ids, int $created_at = 0 ): void {
		update_option(
			Premium_Newsletters::QUEUE_OPTION,
			[
				'user_ids'   => $user_ids,
				'created_at' => $created_at ?: time(), // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
			],
			false
		);
	}

	/**
	 * Return all scheduled timestamps for SCHEDULED_HOOK from both WP cron and ActionScheduler.
	 *
	 * Queries both backends so tests remain backend-agnostic: production code uses
	 * ActionScheduler when available, and WP cron otherwise.
	 *
	 * @return int[]
	 */
	private function get_scheduled_hook_timestamps(): array {
		$timestamps = [];

		// WP cron.
		foreach ( _get_cron_array() as $timestamp => $cron ) {
			if ( isset( $cron[ Premium_Newsletters::SCHEDULED_HOOK ] ) ) {
				$timestamps[] = (int) $timestamp;
			}
		}

		// ActionScheduler (WooCommerce).
		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$actions = as_get_scheduled_actions(
				[
					'hook'     => Premium_Newsletters::SCHEDULED_HOOK,
					'group'    => 'newspack',
					'status'   => 'pending',
					'per_page' => -1,
				]
			);
			foreach ( $actions as $action ) {
				$schedule = $action->get_schedule();
				if ( $schedule ) {
					$date = $schedule->get_date();
					if ( $date instanceof \DateTimeInterface ) {
						$timestamps[] = $date->getTimestamp();
					}
				}
			}
		}

		return $timestamps;
	}

	/**
	 * Return the earliest scheduled timestamp for SCHEDULED_HOOK across all backends, or false.
	 *
	 * @return int|false
	 */
	private function get_next_hook_time() {
		$timestamps = $this->get_scheduled_hook_timestamps();
		return empty( $timestamps ) ? false : min( $timestamps );
	}

	/**
	 * Schedule a single SCHEDULED_HOOK event using the same backend as production
	 * (ActionScheduler when available, WP cron otherwise).
	 *
	 * @param int $timestamp Unix timestamp for the event.
	 */
	private function schedule_hook_for_test( int $timestamp ): void {
		if ( function_exists( 'as_schedule_single_action' ) ) {
			as_schedule_single_action( $timestamp, Premium_Newsletters::SCHEDULED_HOOK, [], 'newspack' );
		} else {
			wp_schedule_single_event( $timestamp, Premium_Newsletters::SCHEDULED_HOOK );
		}
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

		$list_post_id     = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
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
		Premium_Newsletters::process_access_check_queue();

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

		$list_post_id     = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
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
		Premium_Newsletters::process_access_check_queue();

		$this->assertEmpty( \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	/**
	 * Test that no call is made when user has access and auto-signup is on but is already subscribed.
	 */
	public function test_maybe_add_or_remove_lists_skips_already_subscribed_lists() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$email   = get_userdata( $user_id )->user_email;

		$list_post_id     = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
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
		Premium_Newsletters::process_access_check_queue();

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

		$list_post_id     = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
		$this->post_ids[] = $list_post_id;

		$this->create_newsletter_gate( [ 200 ], [ $list_post_id ] );

		// No WC subscription created — user has no access.

		// Simulate the user currently subscribed to the list in the ESP so that the
		// dedup check inside add_and_remove_lists() allows the removal to proceed.
		\Newspack_Newsletters_Subscription::$contact_lists[ $email ] = [ 'list-' . $list_post_id ];

		Premium_Newsletters::maybe_add_or_remove_lists(
			time(),
			[
				'user_id' => $user_id,
				'email'   => $email,
			],
			null
		);
		Premium_Newsletters::process_access_check_queue();

		// The remove path has no auto_signup guard — it fires regardless of that option.
		$calls = \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls;
		$this->assertCount( 1, $calls );
		$this->assertContains( 'list-' . $list_post_id, $calls[0]['lists_to_remove'] );
		$this->assertEmpty( $calls[0]['lists_to_add'] );
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
	// Group F — schedule_access_check() / process_access_check_queue() / clear_queue()
	// =========================================================================

	/**
	 * Test that calling maybe_add_or_remove_lists appends the user ID to the queue option.
	 */
	public function test_schedule_adds_user_to_queue() {
		$user_id = $this->factory->user->create();

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );

		$this->assertContains( $user_id, $this->get_queued_user_ids() );
	}

	/**
	 * Test that the same user ID is only stored once even when enqueued multiple times.
	 */
	public function test_schedule_deduplicates_user_ids() {
		$user_id = $this->factory->user->create();

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );
		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );

		$this->assertCount( 1, $this->get_queued_user_ids() );
	}

	/**
	 * Test that a scheduled event is created when none exists.
	 */
	public function test_schedule_creates_cron_event_when_none_exists() {
		$user_id = $this->factory->user->create();
		$before  = time();

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );

		$next = $this->get_next_hook_time();
		$this->assertNotFalse( $next, 'A scheduled event should have been created.' );
		$this->assertGreaterThanOrEqual( $before + Premium_Newsletters::DEFAULT_DELAY, $next );
	}

	/**
	 * Test that no additional event is scheduled when a far-future one already exists.
	 */
	public function test_schedule_does_not_duplicate_when_far_future_event_exists() {
		$user_id = $this->factory->user->create();
		$far     = time() + 3600;

		// Pre-schedule via the same backend production uses so it is visible to the
		// debounce check inside schedule_access_check().
		$this->schedule_hook_for_test( $far );

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );

		$timestamps = $this->get_scheduled_hook_timestamps();
		$this->assertCount( 1, $timestamps, 'Only the pre-existing far-future event should remain.' );
		$this->assertEquals( $far, $timestamps[0], 'The far-future timestamp must not be changed.' );
	}

	/**
	 * Test that a new event is scheduled AFTER an imminent (within-threshold) event.
	 */
	public function test_schedule_creates_new_event_after_imminent_event() {
		$user_id  = $this->factory->user->create();
		$imminent = time() + 5; // within FUTURE_EVENT_THRESHOLD (10s).

		// Pre-schedule via the same backend production uses so the imminent-event path
		// inside schedule_access_check() is triggered correctly.
		$this->schedule_hook_for_test( $imminent );

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );

		$timestamps = $this->get_scheduled_hook_timestamps();
		$this->assertCount( 2, $timestamps, 'A second event should be scheduled after the imminent one.' );
		$this->assertGreaterThanOrEqual(
			$imminent + Premium_Newsletters::DEFAULT_DELAY,
			max( $timestamps ),
			'The new event must be scheduled at least DEFAULT_DELAY seconds after the imminent event.'
		);
	}

	/**
	 * Test that process_access_check_queue() runs check_access for each queued user.
	 */
	public function test_process_queue_calls_check_access_for_each_user() {
		update_option( 'newspack_premium_newsletters_auto_signup', 1 );

		$user1 = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$user2 = $this->factory->user->create( [ 'role' => 'subscriber' ] );

		$list_post_id     = $this->factory->post->create( [ 'post_type' => \Newspack\Newsletters\Subscription_Lists::CPT ] );
		$this->post_ids[] = $list_post_id;
		$this->create_newsletter_gate( [ 100 ], [ $list_post_id ] );

		foreach ( [ $user1, $user2 ] as $uid ) {
			wcs_create_subscription(
				[
					'customer_id' => $uid,
					'status'      => 'active',
					'products'    => [ 100 ],
				]
			);
		}

		$this->set_queue( [ $user1, $user2 ] );

		Premium_Newsletters::process_access_check_queue();

		$this->assertCount( 2, \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	/**
	 * Test that process_access_check_queue() clears the queue option before processing.
	 */
	public function test_process_queue_clears_option_before_running() {
		$user_id = $this->factory->user->create();
		$this->set_queue( [ $user_id ] );

		Premium_Newsletters::process_access_check_queue();

		$this->assertEmpty( get_option( Premium_Newsletters::QUEUE_OPTION ) );
	}

	/**
	 * Test that process_access_check_queue() is a no-op when the queue is empty.
	 */
	public function test_process_queue_is_noop_when_empty() {
		delete_option( Premium_Newsletters::QUEUE_OPTION );

		Premium_Newsletters::process_access_check_queue();

		$this->assertEmpty( \Newspack_Newsletters_Contacts::$add_and_remove_lists_calls );
	}

	/**
	 * Test that the scheduling delay is filterable.
	 */
	public function test_delay_is_filterable() {
		$custom = 999;
		add_filter( 'newspack_premium_newsletters_access_check_delay', fn() => $custom );

		$user_id = $this->factory->user->create();
		$before  = time();

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user_id ], null );

		$next = $this->get_next_hook_time();
		$this->assertNotFalse( $next );
		$this->assertGreaterThanOrEqual( $before + $custom, $next );
	}

	/**
	 * Test that created_at is stamped on first enqueue and preserved on subsequent enqueues.
	 */
	public function test_queue_created_at_set_on_first_enqueue_and_preserved() {
		$user1  = $this->factory->user->create();
		$user2  = $this->factory->user->create();
		$before = time();

		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user1 ], null );
		$state_after_first = get_option( Premium_Newsletters::QUEUE_OPTION );
		$created_at        = $state_after_first['created_at'];

		$this->assertGreaterThanOrEqual( $before, $created_at, 'created_at should be set to approximately now.' );

		// A second enqueue must not reset created_at.
		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user2 ], null );
		$state_after_second = get_option( Premium_Newsletters::QUEUE_OPTION );

		$this->assertSame( $created_at, $state_after_second['created_at'], 'created_at must not change on subsequent enqueues.' );
	}

	/**
	 * Test that a stale queue (older than MAX_QUEUE_AGE) triggers a 0-delay event.
	 */
	public function test_stale_queue_schedules_with_zero_delay() {
		$user1      = $this->factory->user->create();
		$user2      = $this->factory->user->create();
		$stale_time = time() - ( Premium_Newsletters::MAX_QUEUE_AGE + 60 );

		// Seed a queue that is older than MAX_QUEUE_AGE so the next call detects staleness.
		$this->set_queue( [ $user1 ], $stale_time );

		$before = time();
		Premium_Newsletters::maybe_add_or_remove_lists( time(), [ 'user_id' => $user2 ], null );

		$next = $this->get_next_hook_time();
		$this->assertNotFalse( $next, 'An event should be scheduled for the stale queue.' );
		// With delay overridden to 0, the scheduled time must be at or before now + 1 s.
		$this->assertLessThanOrEqual( $before + 1, $next, 'Stale queue must schedule with 0 delay.' );
	}

	/**
	 * Test that clear_queue() deletes the queue option entirely.
	 */
	public function test_clear_queue_deletes_option() {
		$this->set_queue( [ $this->factory->user->create() ] );

		Premium_Newsletters::clear_queue();

		$this->assertFalse( get_option( Premium_Newsletters::QUEUE_OPTION, false ), 'Queue option must not exist after clear_queue().' );
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

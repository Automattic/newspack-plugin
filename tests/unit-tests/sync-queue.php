<?php
/**
 * Tests the Sync Queue functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader_Activation\Sync_Queue;

/**
 * Tests the Sync Queue functionality.
 */
class Newspack_Test_Sync_Queue extends WP_UnitTestCase {

	/**
	 * Test that push() queues a sync for a valid contact.
	 */
	public function test_push_queues_sync() {
		$contact = [
			'email'    => 'test@example.com',
			'metadata' => [ 'key' => 'value' ],
		];

		Sync_Queue::push( $contact, 'Test context' );

		// The sync should be in the in-memory request queue.
		// Flushing should schedule it via AS.
		// We can verify by checking that flush doesn't error.
		Sync_Queue::flush_request_queue();

		// Verify an AS action was scheduled.
		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$actions = as_get_scheduled_actions(
				[
					'hook'   => Sync_Queue::AS_HOOK,
					'group'  => Sync_Queue::AS_GROUP,
					'status' => \ActionScheduler_Store::STATUS_PENDING,
				],
				'ARRAY_A'
			);
			$this->assertNotEmpty( $actions, 'A sync action should be scheduled after flush.' );
		}
	}

	/**
	 * Test that push() ignores contacts without email.
	 */
	public function test_push_requires_email() {
		$contact = [
			'metadata' => [ 'key' => 'value' ],
		];

		Sync_Queue::push( $contact, 'Test context' );
		Sync_Queue::flush_request_queue();

		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$actions = as_get_scheduled_actions(
				[
					'hook'   => Sync_Queue::AS_HOOK,
					'group'  => Sync_Queue::AS_GROUP,
					'status' => \ActionScheduler_Store::STATUS_PENDING,
				],
				'ARRAY_A'
			);
			$this->assertEmpty( $actions, 'No action should be scheduled for contact without email.' );
		}
	}

	/**
	 * Test that multiple pushes for the same email within a request are deduplicated.
	 */
	public function test_push_deduplicates_within_request() {
		$contact = [
			'email'    => 'dedup@example.com',
			'metadata' => [ 'key' => 'value1' ],
		];

		// Push the same email twice with different contexts.
		Sync_Queue::push( $contact, 'Context 1' );
		Sync_Queue::push( $contact, 'Context 2' );

		Sync_Queue::flush_request_queue();

		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$actions = as_get_scheduled_actions(
				[
					'hook'   => Sync_Queue::AS_HOOK,
					'group'  => Sync_Queue::AS_GROUP,
					'status' => \ActionScheduler_Store::STATUS_PENDING,
					'args'   => [ 'dedup@example.com' ],
				],
				'ARRAY_A'
			);
			// Should only have one scheduled action for this email.
			$this->assertCount( 1, $actions, 'Only one sync action should be scheduled per email per flush.' );
		}
	}

	/**
	 * Test that is_available returns based on ActionScheduler presence.
	 */
	public function test_is_available() {
		// ActionScheduler is bundled via composer, so it should be available.
		$this->assertEquals(
			function_exists( 'as_enqueue_async_action' ),
			Sync_Queue::is_available()
		);
	}

	/**
	 * Test the retry backoff schedule constants.
	 */
	public function test_retry_backoff_schedule() {
		$backoff = Sync_Queue::RETRY_BACKOFF;

		$this->assertCount( 5, $backoff, 'Should have 5 retry intervals.' );
		$this->assertEquals( 30, $backoff[0], 'First retry should be 30 seconds.' );
		$this->assertEquals( 120, $backoff[1], 'Second retry should be 2 minutes.' );
		$this->assertEquals( 480, $backoff[2], 'Third retry should be 8 minutes.' );
		$this->assertEquals( 1800, $backoff[3], 'Fourth retry should be 30 minutes.' );
		$this->assertEquals( 7200, $backoff[4], 'Fifth retry should be 2 hours.' );
	}

	/**
	 * Test queue constants are reasonable.
	 */
	public function test_queue_limits() {
		$this->assertEquals( 3, Sync_Queue::MAX_PER_EMAIL, 'Max per email should be 3.' );
		$this->assertEquals( 5000, Sync_Queue::TOTAL_PENDING_WARNING_THRESHOLD, 'Pending warning threshold should be 5000.' );
		$this->assertEquals( 5, Sync_Queue::MAX_RETRIES, 'Max retries should be 5.' );
	}

	/**
	 * Test get_pending_count returns 0 when no actions are pending.
	 */
	public function test_get_pending_count_empty() {
		if ( ! Sync_Queue::is_available() ) {
			$this->markTestSkipped( 'ActionScheduler not available.' );
		}

		// Clean any existing actions first.
		$actions = as_get_scheduled_actions(
			[
				'group'  => Sync_Queue::AS_GROUP,
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			],
			'ARRAY_A'
		);
		foreach ( $actions as $action ) {
			as_unschedule_action( $action['hook'], $action['args'], Sync_Queue::AS_GROUP );
		}

		$count = Sync_Queue::get_pending_count();
		$this->assertEquals( 0, $count );
	}
}

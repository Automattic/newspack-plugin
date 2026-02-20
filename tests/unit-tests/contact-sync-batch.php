<?php
/**
 * Tests the Contact_Sync_Batch class.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader_Activation\Contact_Sync_Batch;

/**
 * Test the Contact_Sync_Batch class.
 */
class Newspack_Test_Contact_Sync_Batch extends WP_UnitTestCase {

	/**
	 * Test that enqueue creates a progress record and schedules AS actions.
	 */
	public function test_enqueue_creates_progress_and_schedules_actions() {
		if ( ! function_exists( 'as_schedule_single_action' ) ) {
			$this->markTestSkipped( 'ActionScheduler not available.' );
		}

		// Clean up any pending actions from previous runs.
		as_unschedule_all_actions( Contact_Sync_Batch::BATCH_HOOK );

		$user_ids   = [ 1, 2, 3, 4, 5 ];
		$batch_size = 2;
		$batch_id   = Contact_Sync_Batch::enqueue( $user_ids, [ 'batch_size' => $batch_size ] );

		$this->assertIsString( $batch_id, 'enqueue() should return a string batch ID.' );
		$this->assertStringStartsWith( 'batch_', $batch_id, 'Batch ID should start with batch_ prefix.' );

		// Verify progress record.
		$progress = Contact_Sync_Batch::get_progress( $batch_id );
		$this->assertIsArray( $progress, 'get_progress() should return an array.' );
		$this->assertEquals( 5, $progress['total'], 'Total should equal the number of user IDs.' );
		$this->assertEquals( 0, $progress['completed'], 'Completed should be 0 initially.' );
		$this->assertEquals( 0, $progress['failed'], 'Failed should be 0 initially.' );
		$this->assertEquals( 'running', $progress['status'], 'Status should be running.' );

		// Verify scheduled actions: 5 users / batch_size 2 = 3 chunks (2, 2, 1).
		$pending = as_get_scheduled_actions(
			[
				'hook'   => Contact_Sync_Batch::BATCH_HOOK,
				'group'  => 'newspack',
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			],
			'ARRAY_A'
		);
		$this->assertCount( 3, $pending, 'Should schedule 3 AS actions for 5 users with batch_size 2.' );
	}

	/**
	 * Test that get_progress returns false for an invalid batch ID.
	 */
	public function test_get_progress_invalid_id() {
		$result = Contact_Sync_Batch::get_progress( 'nonexistent_batch_id' );
		$this->assertFalse( $result, 'get_progress() should return false for an unknown batch ID.' );
	}

	/**
	 * Test that process_batch syncs contacts and updates progress.
	 */
	public function test_process_batch_syncs_contacts() {
		if ( ! function_exists( 'as_schedule_single_action' ) ) {
			$this->markTestSkipped( 'ActionScheduler not available.' );
		}

		as_unschedule_all_actions( Contact_Sync_Batch::BATCH_HOOK );

		$user_ids = [ 1, 2, 3 ];
		$batch_id = Contact_Sync_Batch::enqueue( $user_ids, [ 'batch_size' => 3 ] );

		// Process the single chunk directly.
		Contact_Sync_Batch::process_batch( $batch_id, $user_ids );

		$progress = Contact_Sync_Batch::get_progress( $batch_id );
		$this->assertEquals( 3, $progress['completed'] + $progress['failed'], 'All 3 contacts should be accounted for (completed + failed).' );
	}

	/**
	 * Test that batch completion is detected after all chunks are processed.
	 */
	public function test_batch_completion() {
		if ( ! function_exists( 'as_schedule_single_action' ) ) {
			$this->markTestSkipped( 'ActionScheduler not available.' );
		}

		as_unschedule_all_actions( Contact_Sync_Batch::BATCH_HOOK );

		$user_ids = [ 1, 2, 3, 4 ];
		$batch_id = Contact_Sync_Batch::enqueue( $user_ids, [ 'batch_size' => 2 ] );

		// Process chunk 1: users [1, 2].
		Contact_Sync_Batch::process_batch( $batch_id, [ 1, 2 ] );
		$progress = Contact_Sync_Batch::get_progress( $batch_id );
		$this->assertEquals( 'running', $progress['status'], 'Status should still be running after first chunk.' );

		// Process chunk 2: users [3, 4].
		Contact_Sync_Batch::process_batch( $batch_id, [ 3, 4 ] );
		$progress = Contact_Sync_Batch::get_progress( $batch_id );
		$this->assertEquals( 'complete', $progress['status'], 'Status should be complete after all chunks processed.' );
	}
}

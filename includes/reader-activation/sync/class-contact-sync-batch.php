<?php
/**
 * Batch queue for contact data syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Contact Sync Batch Class.
 *
 * Manages chunked batches of user IDs for async contact syncing via ActionScheduler.
 */
class Contact_Sync_Batch {

	/**
	 * ActionScheduler hook for processing a batch chunk.
	 */
	const BATCH_HOOK = 'newspack_contact_sync_batch';

	/**
	 * Option name for batch progress records.
	 */
	const PROGRESS_OPTION = 'newspack_contact_sync_batch_progress';

	/**
	 * Default number of user IDs per batch chunk.
	 */
	const DEFAULT_BATCH_SIZE = 10;

	/**
	 * Time-to-live for progress records in seconds.
	 */
	const PROGRESS_TTL = DAY_IN_SECONDS;

	/**
	 * Initialize hooks.
	 */
	public static function init_hooks() {
		add_action( self::BATCH_HOOK, [ __CLASS__, 'process_batch' ], 10, 2 );
	}

	/**
	 * Enqueue a batch of user IDs for async contact syncing.
	 *
	 * Splits the user IDs into chunks and schedules an ActionScheduler action for each chunk.
	 * Creates a progress record in wp_options to track batch status.
	 *
	 * @param array $user_ids Array of user IDs to sync.
	 * @param array $config   Optional. Configuration options.
	 *                        - batch_size (int): Number of users per chunk. Default DEFAULT_BATCH_SIZE.
	 *                        - context (string): Context string for sync logging. Default 'Batch sync'.
	 *
	 * @return string The batch ID, or empty string if no user IDs provided.
	 */
	public static function enqueue( array $user_ids, array $config = [] ) {
		if ( empty( $user_ids ) ) {
			return '';
		}

		$batch_size = isset( $config['batch_size'] ) ? absint( $config['batch_size'] ) : self::DEFAULT_BATCH_SIZE;
		if ( $batch_size < 1 ) {
			$batch_size = self::DEFAULT_BATCH_SIZE;
		}

		$context  = isset( $config['context'] ) ? $config['context'] : 'Batch sync';
		$batch_id = 'batch_' . uniqid();
		$chunks   = array_chunk( $user_ids, $batch_size );

		$progress = [
			'total'      => count( $user_ids ),
			'completed'  => 0,
			'failed'     => 0,
			'status'     => 'running',
			'context'    => $context,
			'created_at' => time(),
		];
		self::save_progress( $batch_id, $progress );

		foreach ( $chunks as $chunk ) {
			\as_schedule_single_action(
				time(),
				self::BATCH_HOOK,
				[ $batch_id, $chunk ],
				'newspack'
			);
		}

		Logger::log(
			sprintf(
				'Batch %s enqueued: %d users in %d chunks (batch_size=%d).',
				$batch_id,
				count( $user_ids ),
				count( $chunks ),
				$batch_size
			),
			'NEWSPACK-SYNC'
		);

		self::cleanup_stale_progress();

		return $batch_id;
	}

	/**
	 * Process a batch chunk of user IDs for contact syncing.
	 *
	 * Called by ActionScheduler for each chunk. Syncs each user via Contact_Sync::sync_contact(),
	 * increments completed/failed counters, and sets status to 'complete' when all contacts
	 * have been processed.
	 *
	 * @param string $batch_id The batch ID.
	 * @param array  $user_ids The user IDs in this chunk.
	 */
	public static function process_batch( $batch_id, $user_ids ) {
		if ( empty( $batch_id ) || ! is_array( $user_ids ) ) {
			Logger::log( 'Invalid batch data received from Action Scheduler.', 'NEWSPACK-SYNC', 'error' );
			return;
		}

		$progress = self::get_progress( $batch_id );
		if ( ! $progress || 'running' !== $progress['status'] ) {
			return;
		}

		$context = isset( $progress['context'] ) ? $progress['context'] : 'Batch sync';

		foreach ( $user_ids as $user_id ) {
			try {
				$result = Contact_Sync::sync_contact( $user_id, $context );
				if ( \is_wp_error( $result ) ) {
					$progress['failed']++;
				} else {
					$progress['completed']++;
				}
			} catch ( \Throwable $e ) {
				$progress['failed']++;
				Logger::log(
					sprintf( 'Batch %s: error syncing user %d: %s', $batch_id, $user_id, $e->getMessage() ),
					'NEWSPACK-SYNC',
					'error'
				);
			}
		}

		// Check if all contacts have been processed.
		if ( ( $progress['completed'] + $progress['failed'] ) >= $progress['total'] ) {
			$progress['status'] = 'complete';
			Logger::log(
				sprintf(
					'Batch %s complete: %d succeeded, %d failed out of %d.',
					$batch_id,
					$progress['completed'],
					$progress['failed'],
					$progress['total']
				),
				'NEWSPACK-SYNC'
			);
		}

		self::save_progress( $batch_id, $progress );
	}

	/**
	 * Cancel a running batch.
	 *
	 * Unschedules all pending ActionScheduler actions for the batch hook
	 * and marks the batch progress as cancelled.
	 *
	 * @param string $batch_id The batch ID.
	 */
	public static function cancel( $batch_id ) {
		$progress = self::get_progress( $batch_id );
		if ( ! $progress ) {
			return;
		}

		if ( function_exists( 'as_get_scheduled_actions' ) ) {
			$actions = as_get_scheduled_actions(
				[
					'hook'   => self::BATCH_HOOK,
					'group'  => 'newspack',
					'status' => \ActionScheduler_Store::STATUS_PENDING,
				]
			);
			foreach ( $actions as $action_id => $action ) {
				$args = $action->get_args();
				if ( isset( $args[0] ) && $args[0] === $batch_id ) {
					\ActionScheduler::store()->cancel_action( $action_id );
				}
			}
		}

		$progress['status'] = 'cancelled';
		self::save_progress( $batch_id, $progress );

		Logger::log(
			sprintf(
				'Batch %s cancelled. %d/%d completed before cancellation.',
				$batch_id,
				$progress['completed'],
				$progress['total']
			),
			'NEWSPACK-SYNC'
		);
	}

	/**
	 * Get the progress of a batch.
	 *
	 * @param string $batch_id The batch ID.
	 *
	 * @return array|false The progress array, or false if the batch ID is not found.
	 */
	public static function get_progress( $batch_id ) {
		$all_progress = get_option( self::PROGRESS_OPTION, [] );
		return isset( $all_progress[ $batch_id ] ) ? $all_progress[ $batch_id ] : false;
	}

	/**
	 * Save the progress record for a batch.
	 *
	 * @param string $batch_id The batch ID.
	 * @param array  $progress The progress data.
	 */
	private static function save_progress( $batch_id, $progress ) {
		$all_progress              = get_option( self::PROGRESS_OPTION, [] );
		$all_progress[ $batch_id ] = $progress;
		update_option( self::PROGRESS_OPTION, $all_progress, false );
	}

	/**
	 * Delete stale progress records older than PROGRESS_TTL.
	 */
	private static function cleanup_stale_progress() {
		$all_progress = get_option( self::PROGRESS_OPTION, [] );
		if ( empty( $all_progress ) ) {
			return;
		}
		$now     = time();
		$cleaned = false;
		foreach ( $all_progress as $batch_id => $progress ) {
			if ( is_array( $progress ) && isset( $progress['created_at'] ) && ( $now - $progress['created_at'] ) > self::PROGRESS_TTL ) {
				unset( $all_progress[ $batch_id ] );
				$cleaned = true;
			}
		}
		if ( $cleaned ) {
			update_option( self::PROGRESS_OPTION, $all_progress, false );
		}
	}
}
Contact_Sync_Batch::init_hooks();

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
	 * Option name prefix for batch progress records.
	 */
	const PROGRESS_OPTION_PREFIX = 'newspack_contact_sync_batch_';

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
	 *
	 * @return string The batch ID.
	 */
	public static function enqueue( array $user_ids, array $config = [] ) {
		$batch_size = isset( $config['batch_size'] ) ? absint( $config['batch_size'] ) : self::DEFAULT_BATCH_SIZE;
		if ( $batch_size < 1 ) {
			$batch_size = self::DEFAULT_BATCH_SIZE;
		}

		$batch_id = 'batch_' . uniqid();
		$chunks   = array_chunk( $user_ids, $batch_size );

		$progress = [
			'total'      => count( $user_ids ),
			'completed'  => 0,
			'failed'     => 0,
			'status'     => 'running',
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
	 * Process a batch chunk. Placeholder for Task 2.
	 *
	 * @param string $batch_id The batch ID.
	 * @param array  $user_ids The user IDs in this chunk.
	 */
	public static function process_batch( $batch_id, $user_ids ) {
		// To be implemented in Task 2.
	}

	/**
	 * Get the progress of a batch.
	 *
	 * @param string $batch_id The batch ID.
	 *
	 * @return array|false The progress array, or false if the batch ID is not found.
	 */
	public static function get_progress( $batch_id ) {
		$progress = get_option( self::PROGRESS_OPTION_PREFIX . $batch_id, false );
		return $progress;
	}

	/**
	 * Save the progress record for a batch.
	 *
	 * @param string $batch_id The batch ID.
	 * @param array  $progress The progress data.
	 */
	private static function save_progress( $batch_id, $progress ) {
		update_option( self::PROGRESS_OPTION_PREFIX . $batch_id, $progress, false );
	}

	/**
	 * Delete stale progress records older than PROGRESS_TTL.
	 */
	private static function cleanup_stale_progress() {
		global $wpdb;
		$prefix  = self::PROGRESS_OPTION_PREFIX;
		$results = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
				$wpdb->esc_like( $prefix ) . '%'
			)
		);
		if ( empty( $results ) ) {
			return;
		}
		$now = time();
		foreach ( $results as $row ) {
			$progress = maybe_unserialize( $row->option_value );
			if ( is_array( $progress ) && isset( $progress['created_at'] ) && ( $now - $progress['created_at'] ) > self::PROGRESS_TTL ) {
				delete_option( $row->option_name );
			}
		}
	}
}
Contact_Sync_Batch::init_hooks();

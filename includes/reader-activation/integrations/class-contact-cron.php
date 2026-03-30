<?php
/**
 * Contact Cron orchestration class
 *
 * Handles recurring pull and push of contact data via WP-Cron.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Integrations;

use Newspack\Reader_Activation\Integrations;
use Newspack\Reader_Activation\Contact_Sync;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Contact Cron Class.
 *
 * Manages recurring contact data synchronization: queues users for
 * pull (from integrations) and push (to integrations), processes
 * them in batch via WP-Cron.
 */
class Contact_Cron {
	/**
	 * Cron interval in seconds (5 minutes).
	 *
	 * @var int
	 */
	const CRON_INTERVAL = 300;

	/**
	 * User meta key for last enqueue timestamp.
	 *
	 * @var string
	 */
	const LAST_ENQUEUE_META = 'newspack_contact_cron_last_enqueue';

	/**
	 * WP-Cron hook for batch processing.
	 *
	 * @var string
	 */
	const CRON_HOOK = 'newspack_contact_cron_batch';

	/**
	 * WP option key for the pull queue.
	 *
	 * @var string
	 */
	const PULL_QUEUE_OPTION = 'newspack_pull_contact_data_queue';

	/**
	 * WP option key for the push queue.
	 *
	 * @var string
	 */
	const PUSH_QUEUE_OPTION = 'newspack_push_contact_data_queue';

	/**
	 * WP-Cron schedule name.
	 *
	 * @var string
	 */
	const CRON_SCHEDULE = 'newspack_contact_cron_interval';

	/**
	 * Logger header for Contact Cron messages.
	 *
	 * @var string
	 */
	const LOGGER_HEADER = 'NEWSPACK-CONTACT-CRON';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'cron_schedules', [ __CLASS__, 'add_cron_schedule' ] ); // phpcs:ignore WordPress.WP.CronInterval.ChangeDetected
		add_action( 'init', [ __CLASS__, 'maybe_enqueue_contact' ], 20 );
		add_action( 'init', [ __CLASS__, 'schedule_cron' ] );
		add_action( self::CRON_HOOK, [ __CLASS__, 'handle_batch' ] );
	}

	/**
	 * Register custom cron schedule.
	 *
	 * @param array $schedules Existing cron schedules.
	 * @return array Modified schedules.
	 */
	public static function add_cron_schedule( $schedules ) {
		$schedules[ self::CRON_SCHEDULE ] = [
			'interval' => self::CRON_INTERVAL,
			'display'  => __( 'Newspack Contact Cron Interval', 'newspack-plugin' ),
		];
		return $schedules;
	}

	/**
	 * Enqueue contact data for pull and push for the current logged-in user.
	 *
	 * If the last pull is stale (> 24 h), the pull runs synchronously.
	 */
	public static function maybe_enqueue_contact() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user_id      = get_current_user_id();
		$last_enqueue = (int) get_user_meta( $user_id, self::LAST_ENQUEUE_META, true );

		if ( ( time() - $last_enqueue ) < self::CRON_INTERVAL ) {
			return;
		}
		update_user_meta( $user_id, self::LAST_ENQUEUE_META, time() );

		self::enqueue_for_push( $user_id );
		self::enqueue_for_pull( $user_id );

		if ( Contact_Pull::is_stale( $last_enqueue ) ) {
			Contact_Pull::pull_sync();
		}
	}

	/**
	 * Add a user to the pull queue.
	 *
	 * @param int $user_id WordPress user ID.
	 */
	public static function enqueue_for_pull( $user_id ) {
		self::enqueue( self::PULL_QUEUE_OPTION, $user_id );
	}

	/**
	 * Add a user to the push queue.
	 *
	 * @param int $user_id WordPress user ID.
	 */
	public static function enqueue_for_push( $user_id ) {
		self::enqueue( self::PUSH_QUEUE_OPTION, $user_id );
	}

	/**
	 * Add a user ID to a queue option.
	 *
	 * @param string $option  The option key.
	 * @param int    $user_id WordPress user ID.
	 */
	private static function enqueue( $option, $user_id ) {
		$queue = get_option( $option, [] );
		if ( ! in_array( $user_id, $queue, true ) ) {
			$queue[] = $user_id;
			update_option( $option, $queue, false );
		}
	}

	/**
	 * Ensure the recurring cron event is scheduled.
	 */
	public static function schedule_cron() {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time(), self::CRON_SCHEDULE, self::CRON_HOOK );
		}
	}

	/**
	 * Handle the recurring cron event.
	 *
	 * Processes both pull and push queues.
	 */
	public static function handle_batch() {
		self::handle_batch_pull();
		self::handle_batch_push();
	}

	/**
	 * Process the pull queue.
	 *
	 * Reads the queue, pulls all active integrations for each user,
	 * and removes successfully processed users.
	 */
	private static function handle_batch_pull() {
		$queue = get_option( self::PULL_QUEUE_OPTION, [] );
		if ( empty( $queue ) ) {
			return;
		}
		delete_option( self::PULL_QUEUE_OPTION );

		Logger::log( 'Batch pull started for ' . count( $queue ) . ' user(s).', self::LOGGER_HEADER );

		foreach ( $queue as $user_id ) {
			if ( ! get_userdata( $user_id ) ) {
				Logger::log( 'Batch pull skipping non-existent user ' . $user_id . '.', self::LOGGER_HEADER );
				continue;
			}
			if ( Contact_Pull::has_pending_retries( $user_id ) ) {
				Logger::log( 'Batch pull skipping user ' . $user_id . ': pending pull retries.', self::LOGGER_HEADER );
				continue;
			}
			$result = Contact_Pull::pull_all( $user_id );
			if ( is_wp_error( $result ) ) {
				Logger::error( 'Batch pull failed for user ' . $user_id . ': ' . $result->get_error_message(), self::LOGGER_HEADER );
			}
		}

		Logger::log( 'Batch pull completed.', self::LOGGER_HEADER );
	}

	/**
	 * Process the push queue.
	 *
	 * Reads the queue, fetches fresh contact data for each user,
	 * and pushes to all active integrations.
	 */
	private static function handle_batch_push() {
		$queue = get_option( self::PUSH_QUEUE_OPTION, [] );
		if ( empty( $queue ) ) {
			return;
		}
		delete_option( self::PUSH_QUEUE_OPTION );

		Logger::log( 'Batch push started for ' . count( $queue ) . ' user(s).', self::LOGGER_HEADER );

		foreach ( $queue as $user_id ) {
			if ( ! get_userdata( $user_id ) ) {
				Logger::log( 'Batch push skipping non-existent user ' . $user_id . '.', self::LOGGER_HEADER );
				continue;
			}
			if ( Contact_Sync::has_pending_retries( $user_id ) ) {
				Logger::log( 'Batch push skipping user ' . $user_id . ': pending sync retries.', self::LOGGER_HEADER );
				continue;
			}
			$result = Contact_Sync::sync_contact( $user_id, 'Recurring sync routine' );
			if ( is_wp_error( $result ) ) {
				Logger::error( 'Batch push failed for user ' . $user_id . ': ' . $result->get_error_message(), self::LOGGER_HEADER );
			}
		}

		Logger::log( 'Batch push completed.', self::LOGGER_HEADER );
	}
}

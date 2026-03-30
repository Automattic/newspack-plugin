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
	 * Threshold in seconds (24 hours) for synchronous vs async pull.
	 *
	 * If the last pull is older than this, the pull runs synchronously.
	 * Otherwise it is queued for the next cron run.
	 *
	 * @var int
	 */
	const PULL_SYNC_THRESHOLD = 86400;

	/**
	 * AJAX action name for the loopback pull endpoint.
	 *
	 * @var string
	 */
	const AJAX_ACTION = 'newspack_pull_integration';

	/**
	 * Nonce action name for the loopback pull endpoint.
	 *
	 * @var string
	 */
	const NONCE_ACTION = 'newspack_pull_integration_nonce';

	/**
	 * User meta key for last pull timestamp.
	 *
	 * @var string
	 */
	const LAST_PULL_META = 'newspack_integrations_last_pull';

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
		add_action( 'init', [ __CLASS__, 'maybe_pull_contact_data' ], 20 );
		add_action( 'init', [ __CLASS__, 'schedule_cron' ] );
		add_action( self::CRON_HOOK, [ __CLASS__, 'handle_batch' ] );
		add_action( 'wp_ajax_' . self::AJAX_ACTION, [ __CLASS__, 'handle_ajax_pull' ] );
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
	 * Get the timeout for loopback pull requests.
	 *
	 * @return int Timeout in seconds.
	 */
	private static function get_pull_request_timeout() {
		/**
		 * Newspack Integrations: Filter the max amount of time (in seconds) to allow for a synchronous contact metadata pull request before falling back to async scheduling.
		 */
		return apply_filters( 'newspack_pull_integration_request_timeout', 1 );
	}

	/**
	 * Pull contact data from active integrations for the current logged-in user.
	 *
	 * If the last pull is older than PULL_SYNC_THRESHOLD (24 h), the pull runs
	 * synchronously with a time limit. Any integrations that don't finish in time
	 * are queued for the next cron run.
	 *
	 * If the last pull is newer than 24 h (but older than CRON_INTERVAL) the
	 * user is queued for batch pull.
	 */
	public static function maybe_pull_contact_data() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user      = wp_get_current_user();
		$last_pull = (int) get_user_meta( $user->ID, self::LAST_PULL_META, true );
		$age       = time() - $last_pull;

		if ( $age < self::CRON_INTERVAL ) {
			return;
		}

		// Set immediately to prevent concurrent pulls from overlapping page loads.
		update_user_meta( $user->ID, self::LAST_PULL_META, time() );

		// Always enqueue for push.
		self::enqueue_for_push( $user->ID );

		$active_integrations = Integrations::get_active_integrations();

		// Data is stale (> 24 h) — pull synchronously, schedule leftovers.
		if ( $age >= self::PULL_SYNC_THRESHOLD ) {
			self::pull_sync( $user->ID, $active_integrations );
			return;
		}

		// Data is relatively fresh — enqueue for batch pull.
		self::enqueue_for_pull( $user->ID );
	}

	/**
	 * Run synchronous pull via per-integration loopback requests.
	 *
	 * Each integration is pulled via a blocking wp_remote_post to the AJAX
	 * endpoint with get_pull_request_timeout. If the request completes, the handler
	 * has already stored the data. If it times out or fails, the user is
	 * queued for the next cron run.
	 *
	 * @param int                                       $user_id      WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration[] $integrations Active integrations to pull from.
	 */
	private static function pull_sync( $user_id, $integrations ) {
		$failed = [];

		foreach ( $integrations as $id => $integration ) {
			$selected_fields = $integration->get_enabled_incoming_fields();
			if ( empty( $selected_fields ) ) {
				continue;
			}

			$response = self::fire_pull_request( $id );

			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				$error_message = is_wp_error( $response ) ? $response->get_error_message() : 'Unexpected response code: ' . wp_remote_retrieve_response_code( $response );
				Logger::log( 'Loopback pull failed for ' . $id . '. Scheduling async. Error: ' . $error_message, self::LOGGER_HEADER );
				$failed[ $id ] = $integration;
			} else {
				Logger::log( 'Loopback pull succeeded for ' . $id . '.', self::LOGGER_HEADER );
			}
		}

		if ( ! empty( $failed ) ) {
			self::enqueue_for_pull( $user_id );
		}
	}

	/**
	 * Fire a blocking loopback request to pull data for a single integration.
	 *
	 * @param string $integration_id The integration identifier.
	 * @return array|\WP_Error The response or WP_Error on failure.
	 */
	private static function fire_pull_request( $integration_id ) {
		$url = add_query_arg(
			[
				'action' => self::AJAX_ACTION,
				'nonce'  => wp_create_nonce( self::NONCE_ACTION ),
			],
			admin_url( 'admin-ajax.php' )
		);

		return wp_remote_post(
			$url,
			[
				'timeout'   => self::get_pull_request_timeout(),
				'blocking'  => true,
				'body'      => [ 'integration_id' => $integration_id ],
				'cookies'   => $_COOKIE, // phpcs:ignore
				'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
			]
		);
	}

	/**
	 * Handle the AJAX loopback request for pulling a single integration.
	 *
	 * Verifies the nonce, looks up the integration, pulls and stores data,
	 * then returns a JSON response.
	 */
	public static function handle_ajax_pull() {
		if ( ! isset( $_REQUEST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( $_REQUEST['nonce'] ), self::NONCE_ACTION ) ) { // phpcs:ignore
			wp_send_json_error( 'Invalid nonce.', 403 );
		}

		$integration_id = isset( $_POST['integration_id'] ) ? sanitize_text_field( $_POST['integration_id'] ) : ''; // phpcs:ignore
		if ( empty( $integration_id ) ) {
			wp_send_json_error( 'Missing integration_id.', 400 );
		}

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration || ! Integrations::is_enabled( $integration_id ) ) {
			wp_send_json_error( 'Integration not found or not enabled.', 404 );
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			wp_send_json_error( 'No user context.', 403 );
		}

		$result = self::pull_single_integration( $user_id, $integration );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message(), 500 );
		}

		wp_send_json_success();
	}

	/**
	 * Pull data from a single integration and store selected fields.
	 *
	 * @param int                                     $user_id     WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration $integration The integration instance.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public static function pull_single_integration( $user_id, $integration ) {
		$selected_fields = $integration->get_enabled_incoming_fields();
		if ( empty( $selected_fields ) ) {
			return new \WP_Error( 'no_selected_incoming_fields', 'No selected incoming fields for ' . $integration->get_id() );
		}

		try {
			$data = $integration->pull_contact_data( $user_id );

			if ( is_wp_error( $data ) ) {
				Logger::log( 'Pull error from ' . $integration->get_id() . ': ' . $data->get_error_message(), self::LOGGER_HEADER );
				return $data;
			}

			$selected_fields = array_filter( $selected_fields, 'is_string' );
			$selected_keys   = array_flip( $selected_fields );
			$data            = array_intersect_key( $data, $selected_keys );
			Logger::log( 'Pulled data from ' . $integration->get_id() . ': ' . wp_json_encode( $data ), self::LOGGER_HEADER );

			foreach ( $data as $key => $value ) {
				\Newspack\Reader_Data::update_item( $user_id, $key, wp_json_encode( $value ) );
			}

			return true;
		} catch ( \Throwable $e ) {
			Logger::log( 'Pull exception from ' . $integration->get_id() . ': ' . $e->getMessage(), self::LOGGER_HEADER );
			return new \WP_Error( 'pull_exception', $e->getMessage() );
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

		Logger::log( 'Batch pull started for ' . count( $queue ) . ' user(s).', self::LOGGER_HEADER );

		$active_integrations = Integrations::get_active_integrations();
		if ( empty( $active_integrations ) ) {
			Logger::log( 'Batch pull aborted: no active integrations.', self::LOGGER_HEADER );
			return;
		}

		$failed_user_ids = [];

		foreach ( $queue as $user_id ) {
			if ( ! get_userdata( $user_id ) ) {
				Logger::log( 'Batch pull skipping non-existent user ' . $user_id . '.', self::LOGGER_HEADER );
				continue;
			}
			$user_failed = false;
			foreach ( $active_integrations as $integration ) {
				$selected_fields = $integration->get_enabled_incoming_fields();
				if ( empty( $selected_fields ) ) {
					continue;
				}
				$result = self::pull_single_integration( $user_id, $integration );
				if ( is_wp_error( $result ) ) {
					Logger::error( 'Batch pull failed for user ' . $user_id . ', integration ' . $integration->get_id() . ': ' . $result->get_error_message(), self::LOGGER_HEADER );
					$user_failed = true;
				}
			}
			if ( $user_failed ) {
				$failed_user_ids[] = $user_id;
			}
		}

		self::update_queue_after_processing( self::PULL_QUEUE_OPTION, $queue, $failed_user_ids );

		if ( ! empty( $failed_user_ids ) ) {
			Logger::log( 'Batch pull completed with ' . count( $failed_user_ids ) . ' failed user(s) kept in queue.', self::LOGGER_HEADER );
		} else {
			Logger::log( 'Batch pull completed.', self::LOGGER_HEADER );
		}
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

		Logger::log( 'Batch push started for ' . count( $queue ) . ' user(s).', self::LOGGER_HEADER );

		$failed_user_ids = [];

		foreach ( $queue as $user_id ) {
			if ( ! get_userdata( $user_id ) ) {
				Logger::log( 'Batch push skipping non-existent user ' . $user_id . '.', self::LOGGER_HEADER );
				continue;
			}
			$result = Contact_Sync::sync_contact( $user_id, 'Recurring sync routine' );
			if ( is_wp_error( $result ) ) {
				Logger::error( 'Batch push failed for user ' . $user_id . ': ' . $result->get_error_message(), self::LOGGER_HEADER );
				$failed_user_ids[] = $user_id;
			}
		}

		self::update_queue_after_processing( self::PUSH_QUEUE_OPTION, $queue, $failed_user_ids );

		if ( ! empty( $failed_user_ids ) ) {
			Logger::log( 'Batch push completed with ' . count( $failed_user_ids ) . ' failed user(s) kept in queue.', self::LOGGER_HEADER );
		} else {
			Logger::log( 'Batch push completed.', self::LOGGER_HEADER );
		}
	}

	/**
	 * Update a queue option after batch processing.
	 *
	 * Keeps failed user IDs and any new entries added during processing.
	 * Removes successfully processed entries.
	 *
	 * @param string $option          The option key.
	 * @param array  $processed_queue The queue snapshot that was processed.
	 * @param array  $failed_user_ids User IDs that failed processing.
	 */
	private static function update_queue_after_processing( $option, $processed_queue, $failed_user_ids ) {
		$current_queue = get_option( $option, [] );
		$new_entries   = array_diff( $current_queue, $processed_queue );
		$remaining     = array_unique( array_merge( $failed_user_ids, $new_entries ) );

		if ( ! empty( $remaining ) ) {
			update_option( $option, array_values( $remaining ), false );
		} else {
			delete_option( $option );
		}
	}
}

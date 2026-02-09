<?php
/**
 * Sync Queue - ActionScheduler-backed contact sync with deduplication.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Logger;
use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Sync Queue Class.
 *
 * Provides a persistent, deduplicated queue for syncing contact data
 * to external integrations (ESP, CRM, etc.) via ActionScheduler.
 */
class Sync_Queue {

	/**
	 * ActionScheduler group for sync queue actions.
	 */
	const AS_GROUP = 'newspack-sync-queue';

	/**
	 * ActionScheduler hook for processing a queued sync.
	 */
	const AS_HOOK = 'newspack_sync_queue_process';

	/**
	 * ActionScheduler hook for processing a per-integration retry.
	 */
	const AS_RETRY_HOOK = 'newspack_sync_queue_retry';

	/**
	 * Maximum pending sync actions per email address.
	 */
	const MAX_PER_EMAIL = 3;

	/**
	 * Number of total pending actions that triggers a warning log.
	 */
	const TOTAL_PENDING_WARNING_THRESHOLD = 5000;

	/**
	 * Maximum number of retries per integration.
	 */
	const MAX_RETRIES = 5;

	/**
	 * Retry backoff schedule in seconds: 30s, 2min, 8min, 30min, 2h.
	 */
	const RETRY_BACKOFF = [ 30, 120, 480, 1800, 7200 ];

	/**
	 * Header to be used while logging.
	 */
	const LOGGER_HEADER = 'NEWSPACK-SYNC-QUEUE';

	/**
	 * Stale action age in seconds (24 hours).
	 */
	const STALE_AGE = 86400;

	/**
	 * In-memory queue for batching pushes within a single request.
	 * Keyed by email, value is array of contexts.
	 *
	 * @var array[]
	 */
	private static $request_queue = [];

	/**
	 * Initialize the sync queue.
	 */
	public static function init() {
		\add_action( self::AS_HOOK, [ __CLASS__, 'process' ], 10, 2 );
		\add_action( self::AS_RETRY_HOOK, [ __CLASS__, 'process_retry' ], 10, 3 );
		\add_action( 'shutdown', [ __CLASS__, 'flush_request_queue' ] );

		// Schedule daily cleanup of stale actions.
		if ( ! \wp_next_scheduled( 'newspack_sync_queue_cleanup' ) ) {
			\wp_schedule_event( time(), 'daily', 'newspack_sync_queue_cleanup' );
		}
		\add_action( 'newspack_sync_queue_cleanup', [ __CLASS__, 'cleanup_stale' ] );
	}

	/**
	 * Whether ActionScheduler is available.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return function_exists( 'as_enqueue_async_action' );
	}

	/**
	 * Queue a contact sync. Deduplicates by email within the current request,
	 * then schedules via ActionScheduler on shutdown.
	 *
	 * @param array  $contact          Contact data with 'email' and 'metadata' keys.
	 * @param string $context          Context describing why the sync is happening.
	 * @param array  $existing_contact Optional existing contact data.
	 */
	public static function push( $contact, $context = '', $existing_contact = null ) {
		if ( empty( $contact['email'] ) ) {
			return;
		}

		$email = $contact['email'];

		// Merge into in-memory queue (dedup within current request).
		if ( ! isset( self::$request_queue[ $email ] ) ) {
			self::$request_queue[ $email ] = [
				'contexts'         => [],
				'existing_contact' => null,
			];
		}

		if ( ! empty( $context ) ) {
			self::$request_queue[ $email ]['contexts'][] = $context;
		}

		if ( null !== $existing_contact ) {
			self::$request_queue[ $email ]['existing_contact'] = $existing_contact;
		}

		Logger::log(
			sprintf( 'Queued sync for %s (context: %s).', $email, $context ),
			self::LOGGER_HEADER
		);
	}

	/**
	 * Flush the in-memory request queue to ActionScheduler on shutdown.
	 * Uses cancel-and-reschedule to deduplicate across requests.
	 */
	public static function flush_request_queue() {
		if ( empty( self::$request_queue ) ) {
			return;
		}

		// Warn if pending count is high, but don't drop events.
		// The per-email limit (MAX_PER_EMAIL) prevents explosive growth.
		// Dropping syncs silently would be worse than a large queue.
		$total_pending = self::get_pending_count();
		if ( $total_pending >= self::TOTAL_PENDING_WARNING_THRESHOLD ) {
			Logger::error(
				sprintf(
					'Warning: %d pending sync actions in group "%s". Queue processing may be stalled.',
					$total_pending,
					self::AS_GROUP
				),
				self::LOGGER_HEADER
			);
		}

		foreach ( self::$request_queue as $email => $data ) {
			self::schedule_sync( $email, $data['contexts'], $data['existing_contact'] );
		}

		self::$request_queue = [];
	}

	/**
	 * Schedule a sync for a given email, deduplicating against existing pending actions.
	 *
	 * @param string $email            The contact email.
	 * @param array  $contexts         Array of sync context strings.
	 * @param array  $existing_contact Optional existing contact data.
	 */
	private static function schedule_sync( $email, $contexts, $existing_contact = null ) {
		// Check per-email pending count.
		$pending_for_email = \as_get_scheduled_actions(
			[
				'hook'   => self::AS_HOOK,
				'status' => \ActionScheduler_Store::STATUS_PENDING,
				'group'  => self::AS_GROUP,
				'args'   => [ $email ],
			],
			'ARRAY_A'
		);

		// Cancel-and-reschedule: cancel existing pending sync for this email.
		if ( ! empty( $pending_for_email ) ) {
			if ( count( $pending_for_email ) >= self::MAX_PER_EMAIL ) {
				Logger::log(
					sprintf( 'Max pending syncs (%d) reached for %s. Skipping.', self::MAX_PER_EMAIL, $email ),
					self::LOGGER_HEADER
				);
				return;
			}
			// Cancel the most recent pending action to reschedule with merged context.
			\as_unschedule_action( self::AS_HOOK, [ $email, [] ], self::AS_GROUP );
		}

		\as_enqueue_async_action(
			self::AS_HOOK,
			[ $email, $contexts ],
			self::AS_GROUP
		);

		Logger::log(
			sprintf(
				'Scheduled sync for %s with %d context(s).',
				$email,
				count( $contexts )
			),
			self::LOGGER_HEADER
		);
	}

	/**
	 * Process a queued sync. This is the ActionScheduler callback.
	 *
	 * @param string $email    The contact email.
	 * @param array  $contexts Array of sync context strings.
	 */
	public static function process( $email, $contexts = [] ) {
		Logger::log(
			sprintf( 'Processing sync for %s.', $email ),
			self::LOGGER_HEADER
		);

		$context = implode( '; ', $contexts );
		if ( empty( $context ) ) {
			$context = 'Sync Queue';
		}

		// Get fresh contact data.
		$user = \get_user_by( 'email', $email );
		if ( $user ) {
			$contact = ESP_Sync::get_contact_data( $user->ID );
			if ( \is_wp_error( $contact ) ) {
				Logger::error(
					sprintf( 'Failed to get contact data for %s: %s', $email, $contact->get_error_message() ),
					self::LOGGER_HEADER
				);
				return;
			}
		} else {
			Logger::log(
				sprintf( 'No user found for %s. Skipping sync.', $email ),
				self::LOGGER_HEADER
			);
			return;
		}

		/**
		 * Filters the contact data before normalizing and syncing.
		 *
		 * @param array  $contact The contact data to sync.
		 * @param string $context The context of the sync.
		 */
		$contact = \apply_filters( 'newspack_esp_sync_contact', $contact, $context );
		$contact = Sync\Metadata::normalize_contact_data( $contact );

		$integrations = Integrations::get_active_integrations();
		if ( empty( $integrations ) ) {
			Logger::log( 'No active integrations. Skipping sync.', self::LOGGER_HEADER );
			return;
		}

		foreach ( $integrations as $integration ) {
			$result = $integration->push_contact_data( $contact, $context );

			if ( \is_wp_error( $result ) ) {
				Logger::error(
					sprintf(
						'Integration "%s" failed for %s: %s',
						$integration->get_id(),
						$email,
						$result->get_error_message()
					),
					self::LOGGER_HEADER
				);
				self::handle_failure( $email, $integration->get_id(), $context, 0 );
			} else {
				Logger::log(
					sprintf( 'Integration "%s" synced %s successfully.', $integration->get_id(), $email ),
					self::LOGGER_HEADER
				);
			}
		}
	}

	/**
	 * Handle a per-integration sync failure. Schedules a retry with backoff.
	 *
	 * @param string $email          The contact email.
	 * @param string $integration_id The integration that failed.
	 * @param string $context        The sync context.
	 * @param int    $attempt        The current attempt number (0-indexed).
	 */
	private static function handle_failure( $email, $integration_id, $context, $attempt ) {
		if ( $attempt >= self::MAX_RETRIES ) {
			Logger::error(
				sprintf(
					'Max retries (%d) reached for integration "%s" on %s. Giving up.',
					self::MAX_RETRIES,
					$integration_id,
					$email
				),
				self::LOGGER_HEADER
			);
			return;
		}

		$delay = self::RETRY_BACKOFF[ $attempt ] ?? end( self::RETRY_BACKOFF );

		\as_schedule_single_action(
			time() + $delay,
			self::AS_RETRY_HOOK,
			[ $email, $integration_id, $attempt + 1 ],
			self::AS_GROUP
		);

		Logger::log(
			sprintf(
				'Scheduled retry #%d for integration "%s" on %s in %d seconds.',
				$attempt + 1,
				$integration_id,
				$email,
				$delay
			),
			self::LOGGER_HEADER
		);
	}

	/**
	 * Process a per-integration retry. This is the ActionScheduler callback for retries.
	 *
	 * @param string $email          The contact email.
	 * @param string $integration_id The integration to retry.
	 * @param int    $attempt        The current attempt number.
	 */
	public static function process_retry( $email, $integration_id, $attempt ) {
		Logger::log(
			sprintf( 'Retry #%d for integration "%s" on %s.', $attempt, $integration_id, $email ),
			self::LOGGER_HEADER
		);

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration ) {
			Logger::error(
				sprintf( 'Integration "%s" not found for retry.', $integration_id ),
				self::LOGGER_HEADER
			);
			return;
		}

		$user = \get_user_by( 'email', $email );
		if ( ! $user ) {
			Logger::log(
				sprintf( 'No user found for %s during retry. Skipping.', $email ),
				self::LOGGER_HEADER
			);
			return;
		}

		$contact = ESP_Sync::get_contact_data( $user->ID );
		if ( \is_wp_error( $contact ) ) {
			Logger::error(
				sprintf( 'Failed to get contact data for %s during retry: %s', $email, $contact->get_error_message() ),
				self::LOGGER_HEADER
			);
			return;
		}

		$contact = \apply_filters( 'newspack_esp_sync_contact', $contact, 'Sync Queue Retry' );
		$contact = Sync\Metadata::normalize_contact_data( $contact );

		$result = $integration->push_contact_data( $contact, 'Sync Queue Retry' );

		if ( \is_wp_error( $result ) ) {
			Logger::error(
				sprintf(
					'Retry #%d failed for integration "%s" on %s: %s',
					$attempt,
					$integration_id,
					$email,
					$result->get_error_message()
				),
				self::LOGGER_HEADER
			);
			self::handle_failure( $email, $integration_id, 'Sync Queue Retry', $attempt );
		} else {
			Logger::log(
				sprintf( 'Retry #%d succeeded for integration "%s" on %s.', $attempt, $integration_id, $email ),
				self::LOGGER_HEADER
			);
		}
	}

	/**
	 * Get the count of pending sync actions.
	 *
	 * @return int
	 */
	public static function get_pending_count() {
		if ( ! self::is_available() ) {
			return 0;
		}

		$pending = \as_get_scheduled_actions(
			[
				'group'  => self::AS_GROUP,
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			],
			'ARRAY_A'
		);

		return count( $pending );
	}

	/**
	 * Clean up stale sync actions older than 24 hours.
	 */
	public static function cleanup_stale() {
		if ( ! self::is_available() ) {
			return;
		}

		$stale_date = gmdate( 'Y-m-d H:i:s', time() - self::STALE_AGE );

		$stale_actions = \as_get_scheduled_actions(
			[
				'group'        => self::AS_GROUP,
				'status'       => \ActionScheduler_Store::STATUS_PENDING,
				'date'         => $stale_date,
				'date_compare' => '<',
			],
			'ARRAY_A'
		);

		$count = 0;
		foreach ( $stale_actions as $action ) {
			if ( isset( $action['action_id'] ) ) {
				\as_unschedule_action( $action['hook'] ?? self::AS_HOOK, $action['args'] ?? [], self::AS_GROUP );
				$count++;
			}
		}

		if ( $count > 0 ) {
			Logger::log(
				sprintf( 'Cleaned up %d stale sync actions.', $count ),
				self::LOGGER_HEADER
			);
		}
	}
}

if ( Sync_Queue::is_available() ) {
	Sync_Queue::init();
}

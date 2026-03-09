<?php
/**
 * Alert Manager for integration sync observability.
 *
 * Listens for retry exhaustion events and fires a unified
 * newspack_alert action.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Alert Manager Class.
 */
class Alert_Manager {

	/**
	 * ActionScheduler hook for the recurring pattern scan.
	 */
	const PATTERN_SCAN_HOOK = 'newspack_alert_pattern_scan';

	/**
	 * Default scan interval in seconds (5 minutes).
	 */
	const DEFAULT_SCAN_INTERVAL = 300;

	/**
	 * Option name for storing the failure log.
	 */
	const FAILURE_LOG_OPTION = 'newspack_alert_failure_log';

	/**
	 * Default pattern rules.
	 * Each rule defines a grouping dimension, threshold, and time interval.
	 */
	const DEFAULT_PATTERN_RULES = [
		[
			'id'        => 'same_user',
			'label'     => 'Same user',
			'group_by'  => 'contact_email',
			'threshold' => 5,
			'interval'  => 3600,
		],
		[
			'id'        => 'same_event',
			'label'     => 'Same event',
			'group_by'  => 'action_name',
			'threshold' => 5,
			'interval'  => 3600,
		],
		[
			'id'        => 'same_integration',
			'label'     => 'Same integration',
			'group_by'  => 'integration_id',
			'threshold' => 5,
			'interval'  => 3600,
		],
		[
			'id'        => 'same_message',
			'label'     => 'Same error message',
			'group_by'  => 'reason',
			'threshold' => 5,
			'interval'  => 3600,
		],
	];

	/**
	 * Get the pattern rules, passed through a filter for customization.
	 *
	 * @return array Pattern rules.
	 */
	public static function get_pattern_rules() {
		/**
		 * Filters the failure pattern detection rules.
		 *
		 * Each rule is an array with keys: id, label, group_by, threshold, interval.
		 * - id: Unique rule identifier.
		 * - label: Human-readable label.
		 * - group_by: Key in the failure record to group by.
		 * - threshold: Number of failures to trigger an alert.
		 * - interval: Time window in seconds.
		 *
		 * @param array $rules The pattern rules.
		 */
		return apply_filters( 'newspack_alert_pattern_rules', self::DEFAULT_PATTERN_RULES );
	}

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'newspack_sync_retry_exhausted', [ __CLASS__, 'handle_sync_retry_exhausted' ] );
		add_action( 'newspack_data_event_retry_exhausted', [ __CLASS__, 'handle_data_event_retry_exhausted' ] );
		add_action( self::PATTERN_SCAN_HOOK, [ __CLASS__, 'scan_failure_patterns' ] );
		add_action( 'init', [ __CLASS__, 'schedule_pattern_scan' ] );
	}

	/**
	 * Schedule the recurring pattern scan via Action Scheduler.
	 */
	public static function schedule_pattern_scan() {
		if ( ! function_exists( 'as_next_scheduled_action' ) ) {
			return;
		}

		if ( false !== as_next_scheduled_action( self::PATTERN_SCAN_HOOK ) ) {
			return;
		}

		/**
		 * Filters the interval in seconds for the failure pattern scan.
		 *
		 * @param int $interval Scan interval in seconds. Default 300 (5 minutes).
		 */
		$interval = apply_filters( 'newspack_alert_pattern_scan_interval', self::DEFAULT_SCAN_INTERVAL );

		as_schedule_recurring_action( time(), $interval, self::PATTERN_SCAN_HOOK, [], 'newspack' );
	}

	/**
	 * Record a failure entry in the failure log option.
	 *
	 * Appends a lightweight, flattened record so the pattern scanner
	 * can later detect recurring failure patterns.
	 *
	 * @param array $payload Alert data from the exhaustion hook.
	 */
	private static function record_failure( $payload ) {
		$log = get_option( self::FAILURE_LOG_OPTION, [] );

		$record = [
			'timestamp'      => time(),
			'integration_id' => $payload['integration_id'] ?? null,
			'contact_email'  => $payload['contact']['email'] ?? null,
			'action_name'    => $payload['action_name'] ?? null,
			'reason'         => $payload['reason'] ?? null,
		];

		/**
		 * Filters the failure record before it is stored in the failure log.
		 *
		 * Useful for adding custom fields that a custom pattern rule can group by.
		 *
		 * @param array $record  The failure record to be stored.
		 * @param array $payload The full payload from the exhaustion hook.
		 */
		$record = apply_filters( 'newspack_alert_failure_record', $record, $payload );

		$log[] = $record;
		update_option( self::FAILURE_LOG_OPTION, $log, false );
	}

	/**
	 * Handle sync retry exhaustion.
	 *
	 * @param array $payload Alert data from Contact_Sync.
	 */
	public static function handle_sync_retry_exhausted( $payload ) {
		self::record_failure( $payload );

		$message = sprintf(
			'Max retries (%d) reached for integration "%s" sync of %s. Last error: %s',
			$payload['retry_count'] ?? 0,
			$payload['integration_id'] ?? 'unknown',
			$payload['contact']['email'] ?? 'unknown',
			$payload['reason'] ?? 'unknown'
		);

		/**
		 * Fires when an alert condition is detected in the sync system.
		 *
		 * @param array $alert {
		 *     Structured alert data.
		 *
		 *     @type string $type          Alert type identifier.
		 *     @type string $severity      Alert severity ('error', 'warning').
		 *     @type string $message       Human-readable alert message.
		 *     @type array  $context       Full payload from the source hook.
		 *     @type int    $timestamp     Unix timestamp.
		 * }
		 */
		do_action(
			'newspack_alert',
			[
				'type'      => 'sync_retry_exhausted',
				'severity'  => 'error',
				'message'   => $message,
				'context'   => $payload,
				'timestamp' => time(),
			]
		);
	}

	/**
	 * Handle data event handler retry exhaustion.
	 *
	 * @param array $payload Alert data from Data_Events.
	 */
	public static function handle_data_event_retry_exhausted( $payload ) {
		self::record_failure( $payload );

		$handler_name = is_array( $payload['handler'] ?? null )
			? implode( '::', $payload['handler'] )
			: (string) ( $payload['handler'] ?? 'unknown' );

		$message = sprintf(
			'Max retries (%d) reached for handler %s on "%s". Last error: %s',
			$payload['retry_count'] ?? 0,
			$handler_name,
			$payload['action_name'] ?? 'unknown',
			$payload['reason'] ?? 'unknown'
		);

		/** This action is documented in includes/class-alert-manager.php */
		do_action(
			'newspack_alert',
			[
				'type'      => 'data_event_retry_exhausted',
				'severity'  => 'error',
				'message'   => $message,
				'context'   => $payload,
				'timestamp' => time(),
			]
		);
	}

	/**
	 * Scan the failure log for recurring patterns and fire alerts.
	 *
	 * Reads the failure log, groups entries by each rule's dimension,
	 * and fires a `newspack_alert` action when a threshold is exceeded
	 * within the configured time window. Deduplicates alerts using
	 * transients so the same pattern is not re-alerted within the interval.
	 */
	public static function scan_failure_patterns() {
		$log = get_option( self::FAILURE_LOG_OPTION, [] );
		if ( empty( $log ) ) {
			return;
		}

		$rules        = self::get_pattern_rules();
		$now          = time();
		$max_interval = 0;

		foreach ( $rules as $rule ) {
			if ( $rule['interval'] > $max_interval ) {
				$max_interval = $rule['interval'];
			}

			$cutoff = $now - $rule['interval'];

			// Filter entries within the time window.
			$recent = array_filter(
				$log,
				function ( $entry ) use ( $cutoff ) {
					return $entry['timestamp'] >= $cutoff;
				}
			);

			// Group by the rule's dimension.
			$groups = [];
			foreach ( $recent as $entry ) {
				$key = $entry[ $rule['group_by'] ] ?? null;
				if ( null === $key || '' === $key ) {
					continue;
				}
				if ( ! isset( $groups[ $key ] ) ) {
					$groups[ $key ] = [];
				}
				$groups[ $key ][] = $entry;
			}

			// Check each group against the threshold.
			foreach ( $groups as $group_value => $entries ) {
				if ( count( $entries ) < $rule['threshold'] ) {
					continue;
				}

				// Deduplication: skip if already alerted within the interval.
				$dedup_key = self::get_dedup_key( $rule['id'], $group_value );
				if ( get_transient( $dedup_key ) ) {
					continue;
				}

				$message = sprintf(
					'Pattern detected: %d failures with %s "%s" in the last %s.',
					count( $entries ),
					$rule['label'],
					$group_value,
					self::format_interval( $rule['interval'] )
				);

				/** This action is documented in includes/class-alert-manager.php */
				do_action(
					'newspack_alert',
					[
						'type'      => 'failure_pattern',
						'severity'  => 'error',
						'message'   => $message,
						'context'   => [
							'rule_id'     => $rule['id'],
							'group_by'    => $rule['group_by'],
							'group_value' => $group_value,
							'count'       => count( $entries ),
							'threshold'   => $rule['threshold'],
							'interval'    => $rule['interval'],
						],
						'timestamp' => time(),
					]
				);

				set_transient( $dedup_key, $now, $rule['interval'] );
			}
		}

		// Clean up entries older than the maximum interval.
		if ( $max_interval > 0 ) {
			$cleanup_cutoff = $now - $max_interval;
			$log            = array_filter(
				$log,
				function ( $entry ) use ( $cleanup_cutoff ) {
					return $entry['timestamp'] >= $cleanup_cutoff;
				}
			);
			update_option( self::FAILURE_LOG_OPTION, array_values( $log ), false );
		}
	}

	/**
	 * Get the deduplication transient key for a rule+group combination.
	 *
	 * @param string $rule_id     The rule identifier.
	 * @param string $group_value The grouped value.
	 *
	 * @return string Transient key.
	 */
	private static function get_dedup_key( $rule_id, $group_value ) {
		return 'newspack_alert_pat_' . md5( $rule_id . ':' . $group_value );
	}

	/**
	 * Format a time interval in seconds as a human-readable string.
	 *
	 * @param int $seconds The interval in seconds.
	 *
	 * @return string Formatted interval (e.g. '1h', '5m').
	 */
	private static function format_interval( $seconds ) {
		if ( $seconds >= 3600 ) {
			return round( $seconds / 3600 ) . 'h';
		}
		return round( $seconds / 60 ) . 'm';
	}
}
Alert_Manager::init();

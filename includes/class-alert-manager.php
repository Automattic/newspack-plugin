<?php
/**
 * Alert Manager for integration sync observability.
 *
 * Listens for retry exhaustion events and fires a unified
 * newspack_alert action. Provides sync health data via REST API.
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
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_routes' ] );
		add_action( self::PATTERN_SCAN_HOOK, [ __CLASS__, 'scan_failure_patterns' ] );
		add_action( 'init', [ __CLASS__, 'schedule_pattern_scan' ] );
	}

	/**
	 * Schedule the recurring pattern scan via Action Scheduler.
	 */
	public static function schedule_pattern_scan() {
		if ( ! function_exists( 'as_has_scheduled_action' ) ) {
			return;
		}

		if ( as_has_scheduled_action( self::PATTERN_SCAN_HOOK ) ) {
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
		$log   = get_option( self::FAILURE_LOG_OPTION, [] );
		$log[] = [
			'timestamp'      => time(),
			'integration_id' => $payload['integration_id'] ?? null,
			'contact_email'  => $payload['contact']['email'] ?? null,
			'action_name'    => $payload['action_name'] ?? null,
			'reason'         => $payload['reason'] ?? null,
			'failure_layer'  => $payload['failure_layer'] ?? null,
		];
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

				// Determine dominant failure layer.
				$layer_counts = [];
				foreach ( $entries as $entry ) {
					$layer = $entry['failure_layer'] ?? 'unknown';
					if ( ! isset( $layer_counts[ $layer ] ) ) {
						$layer_counts[ $layer ] = 0;
					}
					$layer_counts[ $layer ]++;
				}
				arsort( $layer_counts );
				$dominant_layer = array_key_first( $layer_counts );

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
						'type'          => 'failure_pattern',
						'failure_layer' => $dominant_layer,
						'severity'      => 'error',
						'message'       => $message,
						'context'       => [
							'rule_id'     => $rule['id'],
							'group_by'    => $rule['group_by'],
							'group_value' => $group_value,
							'count'       => count( $entries ),
							'threshold'   => $rule['threshold'],
							'interval'    => $rule['interval'],
						],
						'timestamp'     => time(),
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
	 * @return string Transient key.
	 */
	private static function get_dedup_key( $rule_id, $group_value ) {
		return 'newspack_alert_pat_' . md5( $rule_id . ':' . $group_value );
	}

	/**
	 * Format a time interval in seconds as a human-readable string.
	 *
	 * @param int $seconds The interval in seconds.
	 * @return string Formatted interval (e.g. '1h', '5m').
	 */
	private static function format_interval( $seconds ) {
		if ( $seconds >= 3600 ) {
			return round( $seconds / 3600 ) . 'h';
		}
		return round( $seconds / 60 ) . 'm';
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_rest_routes() {
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/sync/health',
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'api_get_sync_health' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'integration_id' => [
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
	}

	/**
	 * Permission check for REST API endpoints.
	 *
	 * @return bool|\WP_Error
	 */
	public static function api_permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to access this endpoint.', 'newspack-plugin' ),
				[ 'status' => 403 ]
			);
		}
		return true;
	}

	/**
	 * REST API callback for sync health.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response
	 */
	public static function api_get_sync_health( $request ) {
		$integration_filter = $request->get_param( 'integration_id' );
		return rest_ensure_response( self::get_sync_health( $integration_filter ) );
	}

	/**
	 * Get sync health data by querying ActionScheduler tables.
	 *
	 * @param string|null $integration_filter Optional. Filter by integration ID.
	 * @return array Health data.
	 */
	public static function get_sync_health( $integration_filter = null ) {
		$health = [
			'integrations' => [],
			'data_events'  => [
				'pending_retries'   => 0,
				'exhausted_retries' => 0,
			],
		];

		if ( ! function_exists( 'as_get_scheduled_actions' ) ) {
			return $health;
		}

		$integrations = Reader_Activation\Integrations::get_active_integrations();

		foreach ( $integrations as $id => $integration ) {
			if ( $integration_filter && $id !== $integration_filter ) {
				continue;
			}

			$can_sync = $integration->can_sync( true );

			$integration_health = [
				'name'                => $integration->get_name(),
				'can_sync'            => ! $can_sync->has_errors(),
				'pending_retries'     => 0,
				'exhausted_retries'   => 0,
				'last_success'        => null,
				'last_failure'        => null,
				'last_failure_reason' => null,
			];

			// Count pending retries for this integration.
			$pending = \as_get_scheduled_actions(
				[
					'hook'     => Reader_Activation\Contact_Sync::RETRY_HOOK,
					'group'    => 'newspack',
					'status'   => \ActionScheduler_Store::STATUS_PENDING,
					'per_page' => 0,
				],
				'ids'
			);

			// Filter by integration_id in args — AS doesn't support arg filtering natively.
			foreach ( $pending as $action_id ) {
				$store  = \ActionScheduler::store();
				$action = $store->fetch_action( $action_id );
				$args   = $action->get_args();
				if ( ! empty( $args[0]['integration_id'] ) && $args[0]['integration_id'] === $id ) {
					$integration_health['pending_retries']++;
				}
			}

			// Get failed (exhausted) retries.
			$failed = \as_get_scheduled_actions(
				[
					'hook'     => Reader_Activation\Contact_Sync::RETRY_HOOK,
					'group'    => 'newspack',
					'status'   => \ActionScheduler_Store::STATUS_FAILED,
					'per_page' => 0,
				],
				'ids'
			);
			foreach ( $failed as $action_id ) {
				$store  = \ActionScheduler::store();
				$action = $store->fetch_action( $action_id );
				$args   = $action->get_args();
				if ( ! empty( $args[0]['integration_id'] ) && $args[0]['integration_id'] === $id ) {
					$integration_health['exhausted_retries']++;
				}
			}

			// Last completed (successful) retry.
			$completed = \as_get_scheduled_actions(
				[
					'hook'     => Reader_Activation\Contact_Sync::RETRY_HOOK,
					'group'    => 'newspack',
					'status'   => \ActionScheduler_Store::STATUS_COMPLETE,
					'per_page' => 1,
					'orderby'  => 'date',
					'order'    => 'DESC',
				],
				'ids'
			);
			if ( ! empty( $completed ) ) {
				$store  = \ActionScheduler::store();
				$action = $store->fetch_action( reset( $completed ) );
				$args   = $action->get_args();
				if ( ! empty( $args[0]['integration_id'] ) && $args[0]['integration_id'] === $id ) {
					$schedule = $action->get_schedule();
					if ( $schedule ) {
						$integration_health['last_success'] = $schedule->get_date()->format( 'c' );
					}
				}
			}

			// Last failed retry — extract reason and layer from args.
			if ( ! empty( $failed ) ) {
				$last_failed_id = end( $failed );
				$store          = \ActionScheduler::store();
				$action         = $store->fetch_action( $last_failed_id );
				$args           = $action->get_args();
				if ( ! empty( $args[0]['integration_id'] ) && $args[0]['integration_id'] === $id ) {
					$schedule = $action->get_schedule();
					if ( $schedule ) {
						$integration_health['last_failure'] = $schedule->get_date()->format( 'c' );
					}
					$integration_health['last_failure_reason'] = $args[0]['reason'] ?? null;
				}
			}

			$health['integrations'][ $id ] = $integration_health;
		}

		// Data events handler retries (aggregate, not per-integration).
		$de_pending = \as_get_scheduled_actions(
			[
				'hook'     => Data_Events::HANDLER_RETRY_HOOK,
				'group'    => 'newspack',
				'status'   => \ActionScheduler_Store::STATUS_PENDING,
				'per_page' => 0,
			],
			'ids'
		);
		$health['data_events']['pending_retries'] = count( $de_pending );

		$de_failed = \as_get_scheduled_actions(
			[
				'hook'     => Data_Events::HANDLER_RETRY_HOOK,
				'group'    => 'newspack',
				'status'   => \ActionScheduler_Store::STATUS_FAILED,
				'per_page' => 0,
			],
			'ids'
		);
		$health['data_events']['exhausted_retries'] = count( $de_failed );

		return $health;
	}
}
Alert_Manager::init();

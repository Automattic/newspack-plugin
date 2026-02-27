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
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'newspack_sync_retry_exhausted', [ __CLASS__, 'handle_sync_retry_exhausted' ] );
		add_action( 'newspack_data_event_retry_exhausted', [ __CLASS__, 'handle_data_event_retry_exhausted' ] );
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_routes' ] );
	}

	/**
	 * Handle sync retry exhaustion.
	 *
	 * @param array $payload Alert data from Contact_Sync.
	 */
	public static function handle_sync_retry_exhausted( $payload ) {
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

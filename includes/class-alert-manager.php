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
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'newspack_sync_retry_exhausted', [ __CLASS__, 'handle_sync_retry_exhausted' ] );
		add_action( 'newspack_data_event_retry_exhausted', [ __CLASS__, 'handle_data_event_retry_exhausted' ] );
		add_action( 'newspack_integration_health_check_failed', [ __CLASS__, 'handle_health_check_failed' ] );
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
	 * Handle integration health check failure.
	 *
	 * @param array $payload Health check failure data.
	 */
	public static function handle_health_check_failed( $payload ) {
		$error   = $payload['error'] ?? null;
		$message = sprintf(
			'Integration "%s" health check failed: %s',
			$payload['integration_name'] ?? 'unknown',
			is_wp_error( $error ) ? implode( '; ', $error->get_error_messages() ) : 'unknown error'
		);

		/** This action is documented in includes/class-alert-manager.php */
		do_action(
			'newspack_alert',
			[
				'type'      => 'integration_health_check_failed',
				'severity'  => 'error',
				'message'   => $message,
				'context'   => $payload,
				'timestamp' => time(),
			]
		);
	}
}
Alert_Manager::init();

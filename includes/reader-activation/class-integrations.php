<?php
/**
 * Integrations management class
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Data_Events;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Integrations Management Class.
 *
 * Manages registration, enabling/disabling, and retrieval of integrations.
 * Also owns the data event handler map and dispatch logic.
 */
class Integrations {
	/**
	 * Logger header for integration-related messages.
	 */
	const LOGGER_HEADER = 'NEWSPACK-INTEGRATION';

	/**
	 * Cron hook name for integration health checks.
	 */
	const HEALTH_CHECK_CRON_HOOK = 'newspack_integration_health_check';

	/**
	 * Registered integrations.
	 *
	 * @var Integration[]
	 */
	private static $integrations = [];

	/**
	 * Whether integrations have been registered.
	 *
	 * @var bool
	 */
	private static $integrations_registered = false;

	/**
	 * Maps registered data event handlers to their integration and method.
	 *
	 * Keyed by "ClassName::action_name" to allow per-integration dispatch.
	 * Only one instance per concrete subclass can register a handler for a
	 * given action. If multiple instances of the same subclass register for
	 * the same action, the last registration wins.
	 *
	 * @var array<string, array{integration_id: string, method: string}>
	 */
	private static $handler_map = [];

	/**
	 * Option name for storing enabled integrations.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'newspack_reader_activation_enabled_integrations';

	/**
	 * Initialize integrations system.
	 */
	public static function init() {
		// Include required files.
		require_once __DIR__ . '/integrations/class-integration.php';
		require_once __DIR__ . '/integrations/class-contact-pull.php';

		add_action( 'init', [ __CLASS__, 'register_integrations' ], 5 );
		add_action( 'init', [ __CLASS__, 'schedule_health_check' ] );
		add_action( self::HEALTH_CHECK_CRON_HOOK, [ __CLASS__, 'run_health_checks' ] );

		Integrations\Contact_Pull::init();
	}

	/**
	 * Register integrations.
	 */
	public static function register_integrations() {
		// Native integrations.
		self::register( new Integrations\ESP() );

		// Hook for other plugins/code to register their integrations.
		do_action( 'newspack_reader_activation_register_integrations' );

		// hardcode ESP integration as enabled for now.
		self::enable( 'esp' );

		// Let each integration register its data event handlers.
		foreach ( self::$integrations as $integration ) {
			$integration->register_handlers();
		}

		// Mark integrations as registered.
		self::$integrations_registered = true;
	}

	/**
	 * Register a new integration.
	 *
	 * @param Integration $integration The integration instance to register.
	 *
	 * @return bool True if registered successfully, false if already registered.
	 */
	public static function register( $integration ) {
		if ( ! $integration instanceof Integration ) {
			return false;
		}

		$id = $integration->get_id();

		if ( isset( self::$integrations[ $id ] ) ) {
			return false;
		}

		self::$integrations[ $id ] = $integration;

		return true;
	}

	/**
	 * Enable an integration.
	 *
	 * @param string $integration_id The integration ID to enable.
	 *
	 * @return bool True if enabled successfully, false otherwise.
	 */
	public static function enable( $integration_id ) {
		if ( ! isset( self::$integrations[ $integration_id ] ) ) {
			return false;
		}

		$enabled = self::get_enabled_integration_ids();

		if ( in_array( $integration_id, $enabled, true ) ) {
			return true;
		}

		$enabled[] = $integration_id;

		return update_option( self::OPTION_NAME, $enabled );
	}

	/**
	 * Disable an integration.
	 *
	 * @param string $integration_id The integration ID to disable.
	 *
	 * @return bool True if disabled successfully, false otherwise.
	 */
	public static function disable( $integration_id ) {
		$enabled = self::get_enabled_integration_ids();

		$key = array_search( $integration_id, $enabled, true );

		if ( false === $key ) {
			return true;
		}

		unset( $enabled[ $key ] );

		return update_option( self::OPTION_NAME, array_values( $enabled ) );
	}

	/**
	 * Get all available integrations.
	 *
	 * @return Integration[] Array of all registered integration instances.
	 */
	public static function get_available_integrations() {
		return self::$integrations;
	}

	/**
	 * Get active integrations.
	 *
	 * @return Integration[] Array of enabled integration instances.
	 */
	public static function get_active_integrations() {
		$enabled_ids = self::get_enabled_integration_ids();
		$active      = [];

		foreach ( $enabled_ids as $id ) {
			if ( isset( self::$integrations[ $id ] ) ) {
				$active[ $id ] = self::$integrations[ $id ];
			}
		}

		return $active;
	}

	/**
	 * Get a specific integration by ID.
	 *
	 * @param string $integration_id The integration ID.
	 *
	 * @return Integration|null The integration instance or null if not found.
	 */
	public static function get_integration( $integration_id ) {
		return self::$integrations[ $integration_id ] ?? null;
	}

	/**
	 * Check if an integration is enabled.
	 *
	 * @param string $integration_id The integration ID.
	 *
	 * @return bool True if enabled, false otherwise.
	 */
	public static function is_enabled( $integration_id ) {
		$enabled_ids = self::get_enabled_integration_ids();
		return in_array( $integration_id, $enabled_ids, true );
	}

	/**
	 * Get enabled integration IDs from option.
	 *
	 * @return array Array of enabled integration IDs.
	 */
	private static function get_enabled_integration_ids() {
		$enabled = get_option( self::OPTION_NAME, [] );

		if ( ! is_array( $enabled ) ) {
			return [];
		}

		return $enabled;
	}

	/**
	 * Check if integrations have been registered.
	 *
	 * @return bool True if integrations have been registered, false otherwise.
	 */
	public static function are_integrations_registered() {
		return self::$integrations_registered;
	}

	/**
	 * Get settings config for all integrations that have settings fields.
	 *
	 * @return array Keyed array of integration settings.
	 */
	public static function get_all_integration_settings() {
		$result = [];
		foreach ( self::$integrations as $id => $integration ) {
			$fields = $integration->get_settings_fields();
			if ( empty( $fields ) ) {
				continue;
			}
			$result[ $id ] = [
				'id'          => $id,
				'name'        => $integration->get_name(),
				'description' => $integration->get_description(),
				'enabled'     => self::is_enabled( $id ),
				'settings'    => $integration->get_settings_config(),
			];
		}
		return $result;
	}

	/**
	 * Update settings for a specific integration.
	 *
	 * @param string $integration_id The integration ID.
	 * @param array  $settings       Key-value pairs of settings to update.
	 * @return bool|null True if updated, null if integration not found.
	 */
	public static function update_integration_settings( $integration_id, $settings ) {
		$integration = self::get_integration( $integration_id );
		if ( ! $integration ) {
			return null;
		}
		foreach ( $settings as $key => $value ) {
			$integration->update_settings_field_value( $key, $value );
		}
		return true;
	}

	/**
	 * Register a data event handler for an integration.
	 *
	 * Validates the method, stores the handler in the map, and registers
	 * a serializable static callable with Data Events.
	 *
	 * What Data Events sees: [ $class, 'dispatch_data_event_handler' ]
	 * — two strings, fully serializable. The instance method is resolved
	 * from the integration registry at execution time.
	 *
	 * @param Integration $integration The integration instance.
	 * @param string      $class       The concrete integration class name (via static::class).
	 * @param string      $action_name The data event action name.
	 * @param string      $method      The instance method to call on this integration.
	 */
	public static function register_data_event_handler( $integration, $class, $action_name, $method ) {
		if ( ! is_callable( [ $integration, $method ] ) ) {
			Logger::error(
				sprintf(
					'Integration "%s" tried to register uncallable method "%s" for data event "%s".',
					$integration->get_id(),
					$method,
					$action_name
				),
				self::LOGGER_HEADER
			);
			return;
		}

		$key = $class . '::' . $action_name;
		self::$handler_map[ $key ] = [
			'integration_id' => $integration->get_id(),
			'method'         => $method,
		];

		Data_Events::register_handler(
			[ $class, 'dispatch_data_event_handler' ],
			$action_name
		);
	}

	/**
	 * Dispatch a data event to the registered integration handler.
	 *
	 * Resolves the concrete integration instance from the registry and
	 * calls the registered instance method. Throws on failure so that
	 * Data Events' retry mechanism can re-queue via ActionScheduler.
	 *
	 * @param string $class     The concrete integration class name (via static::class).
	 * @param int    $timestamp Timestamp of the event.
	 * @param array  $data      Data associated with the event.
	 * @param string $client_id Client ID.
	 *
	 * @throws \RuntimeException When the handler cannot be dispatched.
	 */
	public static function dispatch_data_event_handler( $class, $timestamp, $data, $client_id ) {
		$action = Data_Events::current_event();
		if ( ! $action ) {
			$message = sprintf( 'Integration data event dispatch aborted for %s: no current event available.', $class );
			Logger::error( $message, self::LOGGER_HEADER );
			throw new \RuntimeException( esc_html( $message ) );
		}

		$key = $class . '::' . $action;
		if ( ! isset( self::$handler_map[ $key ] ) ) {
			$message = sprintf( 'No integration data event handler registered for key "%s".', $key );
			Logger::error( $message, self::LOGGER_HEADER );
			throw new \RuntimeException( esc_html( $message ) );
		}

		$entry       = self::$handler_map[ $key ];
		$integration = self::get_integration( $entry['integration_id'] );
		if ( ! $integration ) {
			$message = sprintf( 'Failed to resolve integration "%s" for data event "%s".', $entry['integration_id'], $action );
			Logger::error( $message, self::LOGGER_HEADER );
			throw new \RuntimeException( esc_html( $message ) );
		}

		if ( ! is_callable( [ $integration, $entry['method'] ] ) ) {
			$message = sprintf(
				'Method "%s" is not callable on integration "%s" for data event "%s".',
				$entry['method'],
				$entry['integration_id'],
				$action
			);
			Logger::error( $message, self::LOGGER_HEADER );
			throw new \RuntimeException( esc_html( $message ) );
		}

		$integration->{ $entry['method'] }( $timestamp, $data, $client_id );
	}

	/**
	 * Schedule the hourly health check cron event.
	 *
	 * Respects NEWSPACK_CRON_DISABLE to allow selective disabling.
	 */
	public static function schedule_health_check() {
		register_deactivation_hook( NEWSPACK_PLUGIN_FILE, [ __CLASS__, 'deactivate_health_check' ] );

		if ( defined( 'NEWSPACK_CRON_DISABLE' ) && is_array( NEWSPACK_CRON_DISABLE ) && in_array( self::HEALTH_CHECK_CRON_HOOK, NEWSPACK_CRON_DISABLE, true ) ) {
			self::deactivate_health_check();
		} elseif ( ! \wp_next_scheduled( self::HEALTH_CHECK_CRON_HOOK ) ) {
			\wp_schedule_event( time(), 'hourly', self::HEALTH_CHECK_CRON_HOOK );
		}
	}

	/**
	 * Deactivate the health check cron event.
	 */
	public static function deactivate_health_check() {
		\wp_clear_scheduled_hook( self::HEALTH_CHECK_CRON_HOOK );
	}

	/**
	 * Run health checks on all active integrations.
	 *
	 * Logs failures and fires an action for the Alert Manager.
	 */
	public static function run_health_checks() {
		$active = self::get_active_integrations();
		foreach ( $active as $integration ) {
			$result = $integration->health_check();
			if ( is_wp_error( $result ) ) {
				Logger::error(
					sprintf(
						'Health check failed for integration "%s": %s',
						$integration->get_name(),
						implode( '; ', $result->get_error_messages() )
					),
					self::LOGGER_HEADER
				);

				/**
				 * Fires when an integration health check fails.
				 *
				 * @param array $payload {
				 *     Health check failure data.
				 *
				 *     @type string    $integration_id   The integration ID.
				 *     @type string    $integration_name The integration display name.
				 *     @type \WP_Error $error            The error object.
				 * }
				 */
				do_action(
					'newspack_integration_health_check_failed',
					[
						'integration_id'   => $integration->get_id(),
						'integration_name' => $integration->get_name(),
						'error'            => $result,
					]
				);
			}
		}
	}
}

<?php
/**
 * Base integration class for contact data syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Data_Events;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Base Integration Class.
 *
 * This class should be extended by specific integration implementations.
 */
abstract class Integration {
	/**
	 * Logger header for integration-related messages.
	 */
	const LOGGER_HEADER = 'NEWSPACK-INTEGRATION';

	/**
	 * The unique identifier for this integration.
	 *
	 * @var string
	 */
	protected $id;

	/**
	 * The display name for this integration.
	 *
	 * @var string
	 */
	protected $name;

	/**
	 * Settings fields for this integration.
	 *
	 * @var array
	 */
	protected $settings_fields = [];

	/**
	 * Maps registered data event handlers to their integration and method.
	 *
	 * Keyed by "ClassName::action_name" to allow per-integration dispatch.
	 *
	 * @var array<string, array{integration_id: string, method: string}>
	 */
	private static $handler_map = [];

	/**
	 * Constructor.
	 *
	 * @param string $id              The unique identifier for this integration.
	 * @param string $name            The display name for this integration.
	 */
	public function __construct( $id, $name ) {
		$this->id   = $id;
		$this->name = $name;
	}

	/**
	 * Get the integration ID.
	 *
	 * @return string The integration ID.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Get the integration name.
	 *
	 * @return string The integration name.
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|\WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	abstract public function can_sync( $return_errors = false );

	/**
	 * Push contact data to the integration destination.
	 *
	 * This method should be implemented by child classes to send
	 * contact data to their specific integration destination.
	 *
	 * @param array      $contact The contact data to push.
	 * @param string     $context Optional. The context of the sync.
	 * @param array|null $existing_contact Optional. Existing contact data if available.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	abstract public function push_contact_data( $contact, $context = '', $existing_contact = null );

	/**
	 * Register a data event handler for this integration.
	 *
	 * Wraps the instance method in a serializable static dispatcher so
	 * that Data Events handler-level retry works via ActionScheduler.
	 *
	 * What Data Events sees: [ static::class, 'dispatch_data_event_handler' ]
	 * — two strings, fully serializable. The instance method is resolved from
	 * the integration registry at execution time.
	 *
	 * @param string $action_name The data event action name.
	 * @param string $method      The instance method to call on this integration.
	 */
	protected function register_data_event_handler( $action_name, $method ) {
		if ( ! is_callable( [ $this, $method ] ) ) {
			Logger::error(
				sprintf(
					'Integration "%s" tried to register uncallable method "%s" for data event "%s".',
					$this->id,
					$method,
					$action_name
				),
				self::LOGGER_HEADER
			);
			return;
		}

		$key = static::class . '::' . $action_name;
		self::$handler_map[ $key ] = [
			'integration_id' => $this->id,
			'method'         => $method,
		];

		Data_Events::register_handler(
			[ static::class, 'dispatch_data_event_handler' ],
			$action_name
		);
	}

	/**
	 * Static dispatcher called by Data Events.
	 *
	 * Resolves the concrete integration instance from the registry and
	 * calls the registered instance method. Because this is a static method
	 * inherited via late static binding, static::class resolves to the
	 * concrete subclass, keeping each integration's handler independent.
	 *
	 * Throws on failure so that Data Events' retry mechanism (which catches
	 * \Throwable) can re-queue the handler via ActionScheduler.
	 *
	 * @param int    $timestamp Timestamp of the event.
	 * @param array  $data      Data associated with the event.
	 * @param string $client_id Client ID.
	 *
	 * @throws \RuntimeException When the handler cannot be dispatched.
	 */
	public static function dispatch_data_event_handler( $timestamp, $data, $client_id ) {
		$action = Data_Events::current_event();
		if ( ! $action ) {
			$message = sprintf( 'Integration data event dispatch aborted for %s: no current event available.', static::class );
			Logger::error( $message, self::LOGGER_HEADER );
			throw new \RuntimeException( esc_html( $message ) );
		}

		$key = static::class . '::' . $action;
		if ( ! isset( self::$handler_map[ $key ] ) ) {
			$message = sprintf( 'No integration data event handler registered for key "%s".', $key );
			Logger::error( $message, self::LOGGER_HEADER );
			throw new \RuntimeException( esc_html( $message ) );
		}

		$entry       = self::$handler_map[ $key ];
		$integration = Integrations::get_integration( $entry['integration_id'] );
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
}

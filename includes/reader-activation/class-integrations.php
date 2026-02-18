<?php
/**
 * Integrations management class
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Integrations Management Class.
 *
 * Manages registration, enabling/disabling, and retrieval of integrations.
 */
class Integrations {
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
	 * Option name for storing enabled integrations.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'newspack_reader_activation_enabled_integrations';

	/**
	 * Pull interval in seconds (5 minutes).
	 *
	 * @var int
	 */
	const PULL_INTERVAL = 300;

	/**
	 * Max seconds for the entire pull routine.
	 *
	 * @var int
	 */
	const PULL_TIME_LIMIT = 5;

	/**
	 * User meta key for last pull timestamp.
	 *
	 * @var string
	 */
	const LAST_PULL_META = 'np_integrations_last_pull';

	/**
	 * Initialize integrations system.
	 */
	public static function init() {
		// Include required files.
		require_once __DIR__ . '/integrations/class-integration.php';

		add_action( 'init', [ __CLASS__, 'register_integrations' ], 5 );
		add_action( 'init', [ __CLASS__, 'maybe_pull_contact_data' ], 20 );
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
	 * Pull contact data from active integrations for the current logged-in user.
	 *
	 * Runs periodically based on PULL_INTERVAL and respects PULL_TIME_LIMIT.
	 */
	public static function maybe_pull_contact_data() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user      = wp_get_current_user();
		$last_pull = (int) get_user_meta( $user->ID, self::LAST_PULL_META, true );

		if ( time() - $last_pull < self::PULL_INTERVAL ) {
			return;
		}

		// Set immediately to prevent concurrent pulls from overlapping page loads.
		update_user_meta( $user->ID, self::LAST_PULL_META, time() );

		$active_integrations = self::get_active_integrations();
		$start               = microtime( true );

		foreach ( $active_integrations as $integration ) {
			$elapsed = microtime( true ) - $start;
			if ( $elapsed >= self::PULL_TIME_LIMIT ) {
				\Newspack\Logger::log( 'Pull routine time limit reached.' );
				break;
			}

			$selected_fields = $integration->get_selected_fields();
			if ( empty( $selected_fields ) ) {
				continue;
			}

			$remaining = self::PULL_TIME_LIMIT - ( microtime( true ) - $start );
			$timeout   = max( 1, (int) $remaining );

			try {
				$data = $integration->pull_contact_data( $user->ID, $timeout );

				if ( is_wp_error( $data ) ) {
					\Newspack\Logger::log( 'Pull error from ' . $integration->get_id() . ': ' . $data->get_error_message() );
					continue;
				}

				$selected_keys = array_flip( $selected_fields );
				$data          = array_intersect_key( $data, $selected_keys );

				foreach ( $data as $key => $value ) {
					\Newspack\Reader_Data::update_item( $user->ID, $key, $value );
				}
			} catch ( \Throwable $e ) {
				\Newspack\Logger::log( 'Pull exception from ' . $integration->get_id() . ': ' . $e->getMessage() );
				continue;
			}
		}
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
}

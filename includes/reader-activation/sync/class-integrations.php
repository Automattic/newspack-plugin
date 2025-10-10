<?php
/**
 * Integration management class for contact data syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync;

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
	 * Option name for storing enabled integrations.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'newspack_reader_activation_enabled_integrations';

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
	 * Initialize REST API endpoints.
	 */
	public static function init_rest_api() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_routes' ] );
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_rest_routes() {
		// Get all integrations with their settings and status.
		register_rest_route(
			'newspack/v1',
			'/reader-activation/integrations',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_integrations' ],
				'permission_callback' => [ __CLASS__, 'api_permission_callback' ],
			]
		);

		// Update integration enabled status.
		register_rest_route(
			'newspack/v1',
			'/reader-activation/integrations/(?P<id>[a-zA-Z0-9_-]+)/toggle',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_toggle_integration' ],
				'permission_callback' => [ __CLASS__, 'api_permission_callback' ],
				'args'                => [
					'id'      => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_key',
					],
					'enabled' => [
						'required'          => true,
						'type'              => 'boolean',
					],
				],
			]
		);

		// Update integration settings.
		register_rest_route(
			'newspack/v1',
			'/reader-activation/integrations/(?P<id>[a-zA-Z0-9_-]+)/settings',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_settings' ],
				'permission_callback' => [ __CLASS__, 'api_permission_callback' ],
				'args'                => [
					'id'       => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_key',
					],
					'settings' => [
						'required' => true,
						'type'     => 'object',
					],
				],
			]
		);

		// Update integration metadata keys.
		register_rest_route(
			'newspack/v1',
			'/reader-activation/integrations/(?P<id>[a-zA-Z0-9_-]+)/metadata-keys',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_metadata_keys' ],
				'permission_callback' => [ __CLASS__, 'api_permission_callback' ],
				'args'                => [
					'id'   => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_key',
					],
					'keys' => [
						'required' => true,
						'type'     => 'array',
					],
				],
			]
		);
	}

	/**
	 * Permission callback for REST API endpoints.
	 *
	 * @return bool True if user has permission, false otherwise.
	 */
	public static function api_permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * API: Get all integrations with their settings and status.
	 *
	 * @return \WP_REST_Response
	 */
	public static function api_get_integrations() {
		$integrations_data = [];

		foreach ( self::$integrations as $integration ) {
			$id = $integration->get_id();

			$integrations_data[] = [
				'id'            => $id,
				'name'          => $integration->get_name(),
				'enabled'       => self::is_enabled( $id ),
				'settings'      => $integration->get_settings(),
				'fields'        => $integration->get_settings_fields(),
				'metadata_keys' => $integration->get_metadata_keys(),
			];
		}

		return rest_ensure_response( $integrations_data );
	}

	/**
	 * API: Toggle integration enabled status.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function api_toggle_integration( $request ) {
		$id      = $request->get_param( 'id' );
		$enabled = $request->get_param( 'enabled' );

		$integration = self::get_integration( $id );

		if ( ! $integration ) {
			return new \WP_Error(
				'integration_not_found',
				__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		if ( $enabled ) {
			$result = self::enable( $id );
		} else {
			$result = self::disable( $id );
		}

		if ( ! $result ) {
			return new \WP_Error(
				'toggle_failed',
				__( 'Failed to update integration status.', 'newspack-plugin' ),
				[ 'status' => 500 ]
			);
		}

		return rest_ensure_response( [
			'success' => true,
			'enabled' => self::is_enabled( $id ),
		] );
	}

	/**
	 * API: Update integration settings.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function api_update_settings( $request ) {
		$id       = $request->get_param( 'id' );
		$settings = $request->get_param( 'settings' );

		$integration = self::get_integration( $id );

		if ( ! $integration ) {
			return new \WP_Error(
				'integration_not_found',
				__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$result = $integration->save_settings( $settings );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [
			'success'  => true,
			'settings' => $integration->get_settings(),
		] );
	}

	/**
	 * API: Update integration metadata keys.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function api_update_metadata_keys( $request ) {
		$id   = $request->get_param( 'id' );
		$keys = $request->get_param( 'keys' );

		$integration = self::get_integration( $id );

		if ( ! $integration ) {
			return new \WP_Error(
				'integration_not_found',
				__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$result = $integration->save_metadata_keys( $keys );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [
			'success'       => true,
			'metadata_keys' => $integration->get_metadata_keys(),
		] );
	}
}

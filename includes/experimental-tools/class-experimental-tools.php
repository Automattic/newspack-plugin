<?php
/**
 * Experimental Tools.
 *
 * Filter-based registration system for experimental tools.
 * External plugins register tools via the `newspack_experimental_tools` filter.
 * This class provides option storage, REST API, and data accessors.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Experimental Tools manager.
 */
class Experimental_Tools {

	/**
	 * Option name for per-tool state.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'newspack_experimental_tools_settings';

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = NEWSPACK_API_NAMESPACE;

	/**
	 * REST route base.
	 *
	 * @var string
	 */
	const REST_ROUTE = '/experimental-tools';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	// ─── REST API ────────────────────────────────────────────────

	/**
	 * Register REST routes.
	 */
	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'api_get_tools' ],
				'permission_callback' => [ __CLASS__, 'check_permission' ],
			]
		);
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE . '/(?P<slug>[a-z0-9-]+)/toggle',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'api_toggle_tool' ],
				'permission_callback' => [ __CLASS__, 'check_permission' ],
				'args'                => [
					'slug'    => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_title',
					],
					'enabled' => [
						'required'          => true,
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
				],
			]
		);
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE . '/(?P<slug>[a-z0-9-]+)/settings',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'api_save_settings' ],
				'permission_callback' => [ __CLASS__, 'check_permission' ],
				'args'                => [
					'slug'   => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_title',
					],
					'fields' => [
						'required' => true,
					],
				],
			]
		);
	}

	/**
	 * Permission callback -- require manage_options.
	 *
	 * @return bool|\WP_Error
	 */
	public static function check_permission() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				__( 'You cannot access this resource.', 'newspack-plugin' ),
				[ 'status' => rest_authorization_required_code() ]
			);
		}
		return true;
	}

	/**
	 * GET handler -- return all registered tools with state.
	 *
	 * @return \WP_REST_Response
	 */
	public static function api_get_tools() {
		return rest_ensure_response( self::get_tools() );
	}

	/**
	 * POST handler -- toggle a tool on/off.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function api_toggle_tool( $request ) {
		$slug    = $request['slug'];
		$enabled = $request['enabled'];

		$tools = self::get_registered_tools();
		if ( ! isset( $tools[ $slug ] ) ) {
			return new \WP_Error(
				'newspack_tool_not_found',
				__( 'Tool not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		// Reject toggle if a constant override is active.
		$tool = $tools[ $slug ];
		if ( ! empty( $tool['constant'] ) && defined( $tool['constant'] ) ) {
			return new \WP_Error(
				'newspack_tool_constant_override',
				/* translators: %s: constant name. */
				sprintf( __( 'This tool is controlled by the %s constant and cannot be toggled.', 'newspack-plugin' ), $tool['constant'] ),
				[ 'status' => 403 ]
			);
		}

		self::toggle_tool( $slug, $enabled );
		return rest_ensure_response( self::get_tools() );
	}

	/**
	 * POST handler -- save tool field values.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function api_save_settings( $request ) {
		$slug   = $request['slug'];
		$fields = $request['fields'];

		$tools = self::get_registered_tools();
		if ( ! isset( $tools[ $slug ] ) ) {
			return new \WP_Error(
				'newspack_tool_not_found',
				__( 'Tool not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		self::save_tool_fields( $slug, $fields );
		return rest_ensure_response( self::get_tools() );
	}

	// ─── Data accessors ──────────────────────────────────────────

	/**
	 * Get registered tools from the filter (raw, without saved state).
	 *
	 * @return array Keyed by slug.
	 */
	private static function get_registered_tools() {
		$raw = apply_filters( 'newspack_experimental_tools', [] );
		$tools = [];
		foreach ( $raw as $tool ) {
			if ( ! empty( $tool['slug'] ) ) {
				$tools[ $tool['slug'] ] = $tool;
			}
		}
		return $tools;
	}

	/**
	 * Get all tools merged with saved state.
	 *
	 * @return array Flat array of tool objects for REST/JS consumption.
	 */
	public static function get_tools() {
		$registered = self::get_registered_tools();
		$all_settings = get_option( self::OPTION_NAME, [] );
		$tools = [];

		foreach ( $registered as $slug => $tool ) {
			$saved = isset( $all_settings[ $slug ] ) ? $all_settings[ $slug ] : [];

			// Determine enabled state.
			$constant_active = ! empty( $tool['constant'] ) && defined( $tool['constant'] );
			if ( $constant_active ) {
				$enabled = (bool) constant( $tool['constant'] );
			} else {
				$enabled = ! empty( $saved['enabled'] );
			}

			// Merge saved field values into declared fields.
			$fields = isset( $tool['fields'] ) ? $tool['fields'] : [];
			$saved_fields = isset( $saved['fields'] ) ? $saved['fields'] : [];
			foreach ( $fields as &$field ) {
				if ( isset( $saved_fields[ $field['key'] ] ) ) {
					$field['value'] = $saved_fields[ $field['key'] ];
				}
			}
			unset( $field );

			$tools[] = [
				'slug'            => $slug,
				'label'           => $tool['label'] ?? $slug,
				'description'     => $tool['description'] ?? '',
				'constant'        => $tool['constant'] ?? null,
				'constant_active' => $constant_active,
				'enabled'         => $enabled,
				'enabled_at'      => $saved['enabled_at'] ?? null,
				'enabled_by'      => $saved['enabled_by'] ?? null,
				'fields'          => $fields,
			];
		}

		return $tools;
	}

	/**
	 * Get saved settings for a single tool.
	 *
	 * @param string $slug Tool slug.
	 * @return array
	 */
	public static function get_tool_settings( $slug ) {
		$all_settings = get_option( self::OPTION_NAME, [] );
		return isset( $all_settings[ $slug ] ) ? $all_settings[ $slug ] : [
			'enabled'    => false,
			'enabled_at' => null,
			'enabled_by' => null,
			'users'      => [],
			'fields'     => [],
		];
	}

	/**
	 * Check if a tool is enabled (option only -- does not check constants).
	 *
	 * @param string $slug Tool slug.
	 * @return bool
	 */
	public static function is_tool_enabled( $slug ) {
		$settings = self::get_tool_settings( $slug );
		return ! empty( $settings['enabled'] );
	}

	/**
	 * Toggle a tool on or off.
	 *
	 * @param string $slug    Tool slug.
	 * @param bool   $enabled Whether to enable.
	 */
	public static function toggle_tool( $slug, $enabled ) {
		$all_settings = get_option( self::OPTION_NAME, [] );
		if ( ! isset( $all_settings[ $slug ] ) ) {
			$all_settings[ $slug ] = [
				'enabled'    => false,
				'enabled_at' => null,
				'enabled_by' => null,
				'users'      => [],
				'fields'     => [],
			];
		}

		$all_settings[ $slug ]['enabled'] = (bool) $enabled;
		if ( $enabled ) {
			$all_settings[ $slug ]['enabled_at'] = time();
			$all_settings[ $slug ]['enabled_by'] = get_current_user_id();
		}

		update_option( self::OPTION_NAME, $all_settings );

		/**
		 * Fires when an experimental tool is toggled.
		 *
		 * @param string $slug    Tool slug.
		 * @param bool   $enabled Whether the tool was enabled or disabled.
		 */
		do_action( 'newspack_experimental_tool_toggled', $slug, $enabled );
	}

	/**
	 * Save field values for a tool.
	 *
	 * @param string $slug   Tool slug.
	 * @param array  $fields Key-value pairs of field values.
	 */
	public static function save_tool_fields( $slug, $fields ) {
		$registered = self::get_registered_tools();
		$all_settings = get_option( self::OPTION_NAME, [] );

		if ( ! isset( $all_settings[ $slug ] ) ) {
			$all_settings[ $slug ] = [
				'enabled'    => false,
				'enabled_at' => null,
				'enabled_by' => null,
				'users'      => [],
				'fields'     => [],
			];
		}

		// Only accept keys declared in the tool registration.
		$valid_keys = [];
		if ( isset( $registered[ $slug ]['fields'] ) ) {
			foreach ( $registered[ $slug ]['fields'] as $field ) {
				if ( ! empty( $field['key'] ) && ( $field['type'] ?? '' ) !== 'display' ) {
					$valid_keys[] = $field['key'];
				}
			}
		}

		foreach ( $fields as $key => $value ) {
			if ( in_array( $key, $valid_keys, true ) ) {
				$all_settings[ $slug ]['fields'][ $key ] = sanitize_textarea_field( $value );
			}
		}

		update_option( self::OPTION_NAME, $all_settings );
	}

	/**
	 * Track usage for a tool by the current user.
	 *
	 * @param string $slug    Tool slug.
	 * @param int    $user_id User ID.
	 */
	public static function track_usage( $slug, $user_id ) {
		$all_settings = get_option( self::OPTION_NAME, [] );
		if ( ! isset( $all_settings[ $slug ] ) ) {
			$all_settings[ $slug ] = [
				'enabled'    => false,
				'enabled_at' => null,
				'enabled_by' => null,
				'users'      => [],
				'fields'     => [],
			];
		}

		$user_id = (string) $user_id;
		if ( ! isset( $all_settings[ $slug ]['users'] ) ) {
			$all_settings[ $slug ]['users'] = [];
		}
		if ( ! isset( $all_settings[ $slug ]['users'][ $user_id ] ) ) {
			$all_settings[ $slug ]['users'][ $user_id ] = [
				'count'     => 0,
				'first_use' => null,
				'last_use'  => null,
			];
		}

		$now = time();
		$all_settings[ $slug ]['users'][ $user_id ]['count']++;
		if ( ! $all_settings[ $slug ]['users'][ $user_id ]['first_use'] ) {
			$all_settings[ $slug ]['users'][ $user_id ]['first_use'] = $now;
		}
		$all_settings[ $slug ]['users'][ $user_id ]['last_use'] = $now;

		update_option( self::OPTION_NAME, $all_settings );
	}

	/**
	 * Get total usage count across all users for a tool.
	 *
	 * @param string $slug Tool slug.
	 * @return int
	 */
	public static function get_total_usage_count( $slug ) {
		$settings = self::get_tool_settings( $slug );
		$total = 0;
		if ( ! empty( $settings['users'] ) ) {
			foreach ( $settings['users'] as $user_data ) {
				$total += (int) ( $user_data['count'] ?? 0 );
			}
		}
		return $total;
	}
}

Experimental_Tools::init();

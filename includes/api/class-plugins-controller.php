<?php
/**
 * Plugin management API endpoints.
 *
 * @package Newspack\API
 */

namespace Newspack\API;

use \WP_Error;
use Newspack\Plugin_Manager;

defined( 'ABSPATH' ) || exit;

/**
 * REST API endpoints for managing plugins.
 */
class Plugins_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = '/newspack/v1';

	/**
	 * Endpoint resource.
	 *
	 * @var string
	 */
	protected $resource_name = 'plugins';

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->resource_name,
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'get_items' ],
					'permission_callback' => [ $this, 'get_items_permissions_check' ],
				],
				'schema' => [ $this, 'get_item_schema' ],
			]
		);
	}

	/**
	 * Get info about all managed plugins.
	 *
	 * @param WP_REST_Request $request API request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		return rest_ensure_response( Plugin_Manager::get_managed_plugins() );
	}

	/**
	 * Check capabilities when getting plugins info.
	 *
	 * @param WP_REST_Request $request API request object.
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'You cannot view this resource.', 'newspack' ),
				[
					'status' => $this->authorization_status_code(),
				]
			);
		}

		return true;
	}

	/**
	 * Get the appropriate status code for errors.
	 *
	 * @return int
	 */
	public function authorization_status_code() {
		$status = 401;
		if ( is_user_logged_in() ) {
			$status = 403;
		}

		return $status;
	}

	/**
	 * Get the REST schema for the endpoints.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return [];
	}
}

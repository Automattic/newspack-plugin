<?php
/**
 * Popups Analytics API endpoints.
 *
 * @package Newspack\API
 */

namespace Newspack\API;

use \WP_REST_Controller;
use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . 'includes/popups-analytics/class-popups-analytics-utils.php';

/**
 * REST API endpoints for managing wizards.
 */
class Popups_Analytics_Controller extends WP_REST_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = NEWSPACK_API_NAMESPACE;

	/**
	 * Endpoint resource.
	 *
	 * @var string
	 */
	protected $resource_name = 'popups-analytics';

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		// Register newspack/v1/wizards/some-wizard endpoint.
		register_rest_route(
			$this->namespace,
			'/' . $this->resource_name . '/report',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'get_report' ],
					'permission_callback' => [ $this, 'get_report_permissions_check' ],
				],
			]
		);
	}

	/**
	 * Get report.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_report( $request ) {
		$options = array(
			'offset'         => $request['offset'],
			'event_label_id' => $request['event_label_id'],
			'event_action'   => $request['event_action'],
		);
		return rest_ensure_response( \Popups_Analytics_Utils::get_report( $options ) );
	}

	/**
	 * Check capabilities when getting info.
	 *
	 * @param WP_REST_Request $request API request object.
	 * @return bool|WP_Error
	 */
	public function get_report_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'newspack_rest_forbidden',
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
}

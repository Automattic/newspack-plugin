<?php
/**
 * Connection to Google services.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Fivetran_Connection {
	/**
	 * Constructor.
	 *
	 * @codeCoverageIgnore
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints.
	 *
	 * @codeCoverageIgnore
	 */
	public function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/fivetran',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_modify_connector' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'connector_id' => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					],
					'paused'       => [
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
				],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/fivetran',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_fivetran_connection_status' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/fivetran/(?P<provider>[\a-z]+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_create_connection' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'service' => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
	}

	/**
	 * Process OAuth proxy URL.
	 *
	 * @param string $path Path to append to base URL.
	 * @param object $query_args Query params.
	 */
	private static function authenticate_proxy_url( $path = '', $query_args = [] ) {
		if ( ! self::is_fivetran_configured() ) {
			return false;
		}
		return add_query_arg(
			array_merge(
				[
					'api_key' => urlencode( OAuth::get_proxy_api_key() ),
				],
				$query_args
			),
			NEWSPACK_FIVETRAN_PROXY . $path
		);
	}

	/**
	 * Get Fivetran connections status.
	 */
	public static function api_get_fivetran_connection_status() {
		$url      = self::authenticate_proxy_url( '/wp-json/newspack-fivetran/v1/connections-status' );
		$response = self::process_proxy_response( \wp_safe_remote_get( $url ) );
		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'newspack_connections_fivetran',
				$response->get_error_message()
			);
		}
		return $response;
	}

	/**
	 * Create a new connection.
	 *
	 * @param WP_REST_Request $request Request.
	 */
	public static function api_create_connection( $request ) {
		$service      = $request->get_param( 'service' );
		$service_data = [];

		// For Google Ad Manager (aka double_click_publishers) - if Newspack Ads knows the network code, let's use it.
		if (
			'double_click_publishers' === $service &&
			method_exists( 'Newspack_Ads_Model', 'get_active_network_code' )
		) {
			$network_code = \Newspack_Ads_Model::get_active_network_code();
			if ( ! empty( $network_code ) ) {
				$service_data['double_click_publishers'] = [
					'network_code' => $network_code,
				];
			}
		}

		$url      = self::authenticate_proxy_url(
			'/wp-json/newspack-fivetran/v1/connect-card',
			[
				'service'        => $service,
				'service_data'   => $service_data,
				'redirect_after' => admin_url( 'admin.php?page=newspack-connections-wizard' ),
			]
		);
		$response = self::process_proxy_response( \wp_safe_remote_post( $url, [ 'timeout' => 30 ] ) ); // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		return \rest_ensure_response( $response );
	}

	/**
	 * Modify a Fivetran connector.
	 *
	 * @param WP_REST_Request $request Request.
	 */
	public static function api_modify_connector( $request ) {
		$payload = [];
		if ( null !== $request->get_param( 'paused' ) ) {
			$payload['paused'] = $request->get_param( 'paused' );
		}
		if ( ! empty( $payload ) ) {
			$url      = self::authenticate_proxy_url(
				'/wp-json/newspack-fivetran/v1/connector',
				[
					'connector_id' => $request->get_param( 'connector_id' ),
				]
			);
			$response = self::process_proxy_response(
				\wp_safe_remote_post(
					$url,
					[
						'timeout' => 30, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
						'headers' => [
							'Content-Type' => 'application/json',
						],
						'body'    => wp_json_encode( $payload ),
					]
				)
			);
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			return \rest_ensure_response( $response );
		}
		\rest_ensure_response( [] );
	}

	/**
	 * Process the proxy response.
	 *
	 * @param object $result Result of a request.
	 * @return WP_Error|object Error or response data.
	 */
	private static function process_proxy_response( $result ) {
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		if ( 400 <= $result['response']['code'] ) {
			$error_body   = json_decode( $result['body'] );
			$error_prefix = __( 'Fivetran proxy error', 'newspack' );
			if ( property_exists( $error_body, 'message' ) ) {
				$error_message = $error_prefix . ': ' . $error_body->message;
			} else {
				$error_message = $error_prefix;
			}
			return new WP_Error(
				'newspack_connections_fivetran',
				$error_message
			);
		}
		return json_decode( $result['body'] );
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @codeCoverageIgnore
	 * @param WP_REST_Request $request API request object.
	 * @return bool|WP_Error
	 */
	public static function api_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack' ),
				[
					'status' => 403,
				]
			);
		}
		return true;
	}

	/**
	 * Is Fivetran configured for this instance?
	 */
	public static function is_fivetran_configured() {
		return defined( 'NEWSPACK_FIVETRAN_PROXY' ) && OAuth::get_proxy_api_key();
	}
}
new Fivetran_Connection();

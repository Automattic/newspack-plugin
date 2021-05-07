<?php
/**
 * WPCOM authorization helpers.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class WPCOM_OAuth {
	const NEWSPACK_WPCOM_ACCESS_TOKEN = '_newspack_wpcom_access_token';
	const NEWSPACK_WPCOM_EXPIRES_IN   = '_newspack_wpcom_expires_in';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints.
	 */
	public function register_api_endpoints() {
		// Handle access token from WPCOM.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/wpcom/token',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_wpcom_access_token' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Validate WPCOM access token.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/wpcom/validate',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_wpcom_validate_access_token' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Check capabilities for using API.
	 *
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
	 * Retrieve WPCOM access token.
	 */
	public static function get_wpcom_access_token() {
		return get_user_meta( get_current_user_id(), self::NEWSPACK_WPCOM_ACCESS_TOKEN, true );
	}

	/**
	 * Validate WPCOM credentials.
	 */
	public function api_wpcom_validate_access_token() {
		$access_token = self::get_wpcom_access_token();
		$client_id    = self::wpcom_client_id();
		$response     = wp_safe_remote_get(
			'https://public-api.wordpress.com/oauth2/token-info?' . http_build_query(
				array(
					'client_id' => $client_id,
					'token'     => $access_token,
				)
			)
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( 200 !== $response['response']['code'] ) {
			return new WP_Error( 'invalid_wpcom_token', __( 'Invalid WPCOM token.', 'newspack' ) );
		}
		return $response;
	}

	/**
	 * Save WPCOM credentials.
	 *
	 * @param WP_REST_Request $request The request.
	 */
	public function api_wpcom_access_token( $request ) {
		if ( isset( $request['access_token'], $request['expires_in'] ) ) {
			$user_id = get_current_user_id();
			update_user_meta( $user_id, self::NEWSPACK_WPCOM_ACCESS_TOKEN, sanitize_text_field( $request['access_token'] ) );
			update_user_meta( $user_id, self::NEWSPACK_WPCOM_EXPIRES_IN, sanitize_text_field( $request['expires_in'] ) );
			return \rest_ensure_response(
				array(
					'status' => 'saved',
				)
			);
		} else {
			return new WP_Error( 'missing_parameters', __( 'Missing parameters in request.', 'newspack' ) );
		}
	}

	/**
	 * Get WPCOM access token.
	 */
	public static function get_access_token() {
		$access_token = get_user_meta( get_current_user_id(), self::NEWSPACK_WPCOM_ACCESS_TOKEN, true );
		if ( ! $access_token ) {
			return new WP_Error(
				'newspack_support_error',
				__( 'Missing WPCOM access token.', 'newspack' )
			);
		}
		return $access_token;
	}

	/**
	 * Perform WPCOM API Request.
	 *
	 * @param string $endpoint endpoint.
	 * @throws \Exception Error message.
	 */
	public static function perform_wpcom_api_request( $endpoint ) {
		$access_token = self::get_access_token();
		if ( is_wp_error( $access_token ) ) {
			return $access_token;
		}
		$response = wp_safe_remote_get(
			'https://public-api.wordpress.com/' . $endpoint,
			array(
				'headers' => [
					'Authorization' => 'Bearer ' . $access_token,
				],
			)
		);
		if ( is_wp_error( $response ) ) {
			throw new \Exception( $response->get_error_message() );
		}
		$response_body = json_decode( $response['body'] );
		if ( $response['response']['code'] >= 300 ) {
			throw new \Exception( $response['response']['message'] );
		}
		return $response_body;
	}

	/**
	 * Return client id of WPCOM auth app.
	 *
	 * @return string client id.
	 */
	public static function wpcom_client_id() {
		return ( defined( 'NEWSPACK_WPCOM_CLIENT_ID' ) && NEWSPACK_WPCOM_CLIENT_ID ) ? NEWSPACK_WPCOM_CLIENT_ID : false;
	}
}
new WPCOM_OAuth();

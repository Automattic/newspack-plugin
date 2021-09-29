<?php
/**
 * Newspack's MailChimp API handeling.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * MailChimp API Settings.
 */
class MailChimp_API {
	/** API Endpoint Placeholder, needs to replace <dc> by the right datacenter. */
	const API_ENDPOINT_PLACEHOLDER = 'https://<dc>.api.mailchimp.com/3.0';
	
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints.
	 */
	public static function register_api_endpoints() {
		// Get MailChimp auth status.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/mailchimp',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_mailchimp_auth_status' ],
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			]
		);

		// Verify and save MailChimp API Key.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/mailchimp',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_mailchimp_save_key' ],
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			]
		);

		// Delete MailChimp API Key.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/oauth/mailchimp',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ __CLASS__, 'api_mailchimp_delete_key' ],
				'permission_callback' => function() {
					return current_user_can( 'manage_options' );
				},
			]
		);
	}

	/**
	 * Check whether we have an API key and its validity.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_mailchimp_auth_status() {
		$mailchimp_api_key = get_option( 'newspack_mailchimp_api_key' );
		$endpoint          = self::get_api_endpoint_from_key( $mailchimp_api_key );
		
		if ( ! $mailchimp_api_key || ! $endpoint ) {
			return \rest_ensure_response( [] );
		}

		$key_is_valid_response = self::is_valid_api_key( $endpoint, $mailchimp_api_key );
			
		// delete API key if not valid.
		if ( is_wp_error( $key_is_valid_response ) ) {
			delete_option( 'newspack_mailchimp_api_key' );
		} 

		return $key_is_valid_response;
	}

	/**
	 * Verify and save MailChimp API key
	 *
	 * @param WP_REST_REQUEST $request call request.
	 * @return WP_REST_Response
	 */
	public static function api_mailchimp_save_key( $request ) {
		if ( isset( $request['api_key'] ) ) {
			$endpoint = self::get_api_endpoint_from_key( $request['api_key'] );
			if ( ! $endpoint ) {
				return new \WP_Error( 'wrong_parameter', __( 'Invalid MailChimp API Key.', 'newspack' ) );
			}

			$key_is_valid_response = self::is_valid_api_key( $endpoint, $request['api_key'] );
			
			if ( ! is_wp_error( $key_is_valid_response ) ) {
				update_option( 'newspack_mailchimp_api_key', $request['api_key'] );
			}

			return $key_is_valid_response;
		} else {
			return new \WP_Error( 'missing_parameters', __( 'Missing parameters in request.', 'newspack' ) );
		}
	}

	/**
	 * Delete MailChimp API Key option.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_mailchimp_delete_key() {
		delete_option( 'newspack_mailchimp_api_key' );
		return \rest_ensure_response( [] );
	}

	/**
	 * Get the right datacenter from the API key and set it in the endpoint.
	 *
	 * @param string $api_key MailChimp API Key.
	 * @return string|boolean the API endpoint with the right datacenter.
	 */
	private static function get_api_endpoint_from_key( $api_key ) {
		list(, $data_center) = explode( '-', $api_key );
		// MailChimp API key format: abc123-datacenter.
		return $data_center ? str_replace( '<dc>', $data_center, self::API_ENDPOINT_PLACEHOLDER ) : false;
	}

	/**
	 * Check API Key validity
	 *
	 * @param string $endpoint MailChimp API Endpoint.
	 * @param string $api_key MailChimp API Key.
	 * @return WP_REST_Response|WP_Error
	 */
	private static function is_valid_api_key( $endpoint, $api_key ) {
		// MailChimp API root endpoint returns details about the Mailchimp user account.
		$response = wp_safe_remote_get(
			$endpoint,
			[
				'headers' => [
					'Accept'        => 'application/json',
					'Content-Type'  => 'application/json',
					'Authorization' => "Basic $api_key",
				],
			]
		);
		
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$parsed_response = json_decode( $response['body'], true );
			
			return new \WP_Error(
				'newspack_mailchimp_api',
				array_key_exists( 'title', $parsed_response ) ? $parsed_response['title'] : __( 'Request failed.', 'newspack' )
			);
		}
		
		$response_body = json_decode( $response['body'], true );
		return \rest_ensure_response( [ 'username' => $response_body['username'] ] );
	}
}

new MailChimp_API();

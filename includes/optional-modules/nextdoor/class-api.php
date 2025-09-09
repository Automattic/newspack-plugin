<?php
/**
 * Nextdoor API client.
 *
 * @package Newspack
 */

namespace Newspack\Nextdoor;

defined( 'ABSPATH' ) || exit;

/**
 * Nextdoor API client class.
 */
class API {

	/**
	 * The single instance of the class.
	 *
	 * @var API
	 */
	protected static $instance = null;

	/**
	 * API base URL.
	 */
	const API_BASE_URL = 'https://nextdoor.com';

	/**
	 * API version.
	 */
	const API_VERSION = 'v1';

	/**
	 * Main API Instance.
	 *
	 * @return API - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Make API request.
	 *
	 * @param string $endpoint API endpoint.
	 * @param array  $args Request arguments.
	 * @param string $method HTTP method.
	 * @return array|WP_Error
	 */
	private function make_request( $endpoint, $args = [], $method = 'GET' ) {
		$url = self::API_BASE_URL . $endpoint;

		$default_args = [
			'method'  => $method,
			'timeout' => 30, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
			'headers' => [
				'accept'       => 'application/json',
				'content-type' => 'application/json',
			],
		];

		$args = wp_parse_args( $args, $default_args );

		// Add authorization header if we have an access token.
		$settings = \Newspack\Nextdoor::get_settings();
		if ( ! empty( $settings['access_token'] ) ) {
			$args['headers']['Authorization'] = 'Bearer ' . $settings['access_token'];
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		$code = wp_remote_retrieve_response_code( $response );

		if ( $code >= 400 ) {
			$error_data = json_decode( $body, true );
			$error_message = isset( $error_data['error_description'] ) ? $error_data['error_description'] : 'Unknown API error';

			return new \WP_Error(
				'nextdoor_api_error',
				$error_message,
				[
					'status'   => $code,
					'response' => $error_data,
				]
			);
		}

		return json_decode( $body, true );
	}

	/**
	 * Create or get publisher account.
	 *
	 * @param string $email_address Publisher email.
	 * @param string $country Country code.
	 * @param string $redirect_uri Optional redirect URI.
	 * @return array|WP_Error
	 */
	public function create_account( $email_address, $country, $redirect_uri = '' ) {
		$body = [
			'country'       => $country,
			'email_address' => $email_address,
		];

		if ( ! empty( $redirect_uri ) ) {
			$body['redirect_uri'] = $redirect_uri;
		}

		$settings = \Newspack\Nextdoor::get_settings();
		if ( empty( $settings['client_secret'] ) ) {
			return new \WP_Error(
				'newspack_nextdoor_client_secret_missing',
				__( 'Client secret not configured.', 'newspack-plugin' ),
				[ 'status' => 400 ]
			);
		}

		return $this->make_request(
			'/partner/v1/entity_page/account',
			[
				'body'    => wp_json_encode( $body ),
				'headers' => [
					'Authorization' => 'Basic ' . base64_encode( $settings['client_id'] . ':' . $settings['client_secret'] ),
				],
			],
			'PUT'
		);
	}

	/**
	 * Claim news page.
	 *
	 * @param string $publication_url Publisher website URL.
	 * @param bool   $test Test mode flag.
	 * @return array|WP_Error
	 */
	public function claim_page( $publication_url, $test = false ) {
		$body = [
			'publication_url'         => $publication_url,
			'publication_name'        => get_bloginfo( 'name' ),
			'publication_description' => get_bloginfo( 'description' ),
			'test'                    => $test,
		];

		return $this->make_request(
			'/external/api/partner/v1/entity_page/claim',
			[
				'body' => wp_json_encode( $body ),
			],
			'PUT'
		);
	}

	/**
	 * Get user profiles.
	 *
	 * @return array|WP_Error
	 */
	public function get_profile() {
		return $this->make_request( '/external/api/partner/v1/me' );
	}

	/**
	 * Create or update article.
	 *
	 * @param array $article_data Article data.
	 * @return array|WP_Error
	 */
	public function create_article( $article_data ) {
		return $this->make_request(
			'/external/api/partner/v1/article/',
			[
				'body' => wp_json_encode( $article_data ),
			],
			'PUT'
		);
	}

	/**
	 * Delete article.
	 *
	 * @param string $guid Article GUID.
	 * @return array|WP_Error
	 */
	public function delete_article( $guid ) {
		return $this->make_request(
			'/external/api/partner/v1/article/',
			[
				'body' => wp_json_encode( [ 'guid' => $guid ] ),
			],
			'DELETE'
		);
	}

	/**
	 * Get ingestion report.
	 *
	 * @param array $guids Array of article GUIDs.
	 * @return array|WP_Error
	 */
	public function get_ingestion_report( $guids ) {
		return $this->make_request(
			'/external/api/partner/v1/ingestion_report',
			[
				'body' => wp_json_encode( [ 'guids' => $guids ] ),
			],
			'POST'
		);
	}

	/**
	 * Test API connection.
	 *
	 * @return bool
	 */
	public function test_connection() {
		$response = $this->get_profile();
		return ! is_wp_error( $response );
	}
}

<?php
/**
 * Nextdoor settings management.
 *
 * @package Newspack
 */

namespace Newspack\Nextdoor;

use Newspack\Nextdoor;

defined( 'ABSPATH' ) || exit;

/**
 * Nextdoor settings management class.
 */
class Settings {

	/**
	 * The single instance of the class.
	 *
	 * @var Settings
	 */
	protected static $instance = null;

	/**
	 * Main Settings Instance.
	 *
	 * @return Settings - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register REST API endpoints.
	 */
	public function register_api_endpoints() {
		// Settings endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/settings',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/settings',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'client_id'     => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'client_secret' => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'allowed_roles' => [
						'required' => false,
						'type'     => 'array',
					],
				],
			]
		);

		// OAuth endpoints.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/oauth/start',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_start_oauth' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'email'   => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_email',
					],
					'country' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);

		// Page claim endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/claim-page',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_claim_page' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'publication_url' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'esc_url_raw',
					],
					'test'            => [
						'required'          => false,
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
				],
			]
		);
	}

	/**
	 * Check if user has permission to manage Nextdoor settings.
	 *
	 * @return bool
	 */
	public function api_permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get Nextdoor settings via API.
	 *
	 * @return WP_REST_Response
	 */
	public function api_get_settings() {
		$settings = Nextdoor::get_settings();

		// Don't expose sensitive data.
		unset( $settings['access_token'] );
		unset( $settings['refresh_token'] );

		return rest_ensure_response( $settings );
	}

	/**
	 * Update Nextdoor settings via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_update_settings( $request ) {
		$settings = Nextdoor::get_settings();
		$params   = $request->get_params();

		if ( isset( $params['client_id'] ) ) {
			$settings['client_id'] = $params['client_id'];
		}

		if ( isset( $params['client_secret'] ) ) {
			$settings['client_secret'] = $params['client_secret'];
		}

		if ( isset( $params['allowed_roles'] ) ) {
			$settings['allowed_roles'] = $params['allowed_roles'];
		}

		$updated = Nextdoor::update_settings( $settings );

		if ( ! $updated ) {
			return new \WP_Error(
				'newspack_nextdoor_settings_update_failed',
				__( 'Failed to update Nextdoor settings.', 'newspack-plugin' ),
				[ 'status' => 500 ]
			);
		}

		return $this->api_get_settings();
	}

	/**
	 * Start OAuth flow via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_start_oauth( $request ) {
		$email   = $request->get_param( 'email' );
		$country = $request->get_param( 'country' );

		$api  = API::instance();
		$auth = Auth::instance();

		// First, create/get account.
		$redirect_uri     = Nextdoor::get_redirect_uri();
		$account_response = $api->create_account( $email, $country, $redirect_uri );

		if ( is_wp_error( $account_response ) ) {
			return $account_response;
		}

		$settings = Nextdoor::get_settings();

		if ( empty( $settings['client_id'] ) ) {
			return new \WP_Error(
				'newspack_nextdoor_client_id_missing',
				__( 'Client ID not configured.', 'newspack-plugin' ),
				[ 'status' => 400 ]
			);
		}

		// Generate OAuth URL.
		$state    = wp_create_nonce( 'nextdoor_oauth_state' );
		$auth_url = $auth->get_authorization_url( $settings['client_id'], $redirect_uri, $state );

		return rest_ensure_response(
			[
				'auth_url'  => $auth_url,
				'login_url' => isset( $account_response['login_url'] ) ? $account_response['login_url'] : null,
			]
		);
	}

	/**
	 * Callback for claiming a page via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_claim_page( $request ) {
		$publication_url = $request->get_param( 'publication_url' );
		$test            = $request->get_param( 'test' );

		// Check if page is already claimed.
		if ( $this->check_page_claim( $publication_url ) ) {
			return rest_ensure_response( [ 'success' => true ] );
		}

		$api    = API::instance();
		$result = $api->claim_page( $publication_url, $test );

		if ( isset( $result['page_id'] ) ) {
			$settings            = Nextdoor::get_settings();
			$settings['page_id'] = $result['page_id'];

			Nextdoor::update_settings( $settings );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [ 'success' => true ] );
	}

	/**
	 * Checks if the current publication URL page has been claimed.
	 *
	 * @param string $publication_url The publication URL to check.
	 * @return bool True if the page is claimed, false otherwise.
	 */
	private function check_page_claim( $publication_url ) {
		$api      = API::instance();
		$profile  = $api->get_profile();

		if ( is_wp_error( $profile ) || empty( $profile ) ) {
			return false;
		}

		if ( isset( $profile['entity_page'] ) && isset( $profile['entity_page']['publication_url'] ) ) {
			$claimed_url = rtrim( $profile['entity_page']['publication_url'], '/' );
			$input_url   = rtrim( $publication_url, '/' );

			if ( $claimed_url === $input_url ) {
				// Save page ID.
				$settings            = Nextdoor::get_settings();
				$settings['page_id'] = $profile['entity_page']['id'];
				Nextdoor::update_settings( $settings );
				return true;
			}
		}

		return false;
	}
}
Settings::instance();

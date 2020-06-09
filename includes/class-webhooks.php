<?php
/**
 * Newspack webhooks management.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Define, deliver, and handle webhooks.
 */
class Webhooks {
	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->salesforce_settings = Salesforce::get_salesforce_settings();

		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints needed to handle webhooks.
	 */
	public function register_api_endpoints() {

		// Handle WooCommerce webhook to sync with Salesforce.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/salesforce/sync',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_sync_salesforce' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'email' => [
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
	}

	/**
	 * Webhook callback handler for syncing data to Salesforce.
	 *
	 * @param WP_REST_Request $request Request containing webhook.
	 * @throws \Exception Error message.
	 * @return WP_REST_Response with the response from Salesforce.
	 */
	public function api_sync_salesforce( $request ) {
		$args             = $request->get_params();
		$fields_to_update = Salesforce::parse_update_data( $args );

		if ( empty( $args['Email'] ) ) {
			throw new \Exception( 'Please provide a valid email address to query with.' );
		}

		$leads = Salesforce::get_leads_by_email( $args['Email'] );

		if ( $leads->totalSize > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			// Update existing lead.
			$response = Salesforce::update_lead( $leads->records[0]->Id, $fields_to_update );
		} else {
			// Create new lead.
			$response = Salesforce::create_lead( $fields_to_update );
		}

		return \rest_ensure_response( $response );
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @param WP_REST_Request $request API request object.
	 * @return bool|WP_Error
	 */
	public function api_permissions_check( $request ) {
		if ( ! current_user_can( $this->capability ) ) {
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
}

new Webhooks();

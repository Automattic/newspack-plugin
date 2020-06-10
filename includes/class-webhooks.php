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
				'methods'  => \WP_REST_Server::EDITABLE,
				'callback' => [ $this, 'api_sync_salesforce' ],
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
		$fields_to_update = Salesforce::parse_wc_order_data( $args );

		if ( empty( $fields_to_update['Email'] ) ) {
			return \rest_ensure_response( 'No valid email address.' );
		}

		$leads = Salesforce::get_leads_by_email( $fields_to_update['Email'] );

		if ( $leads->totalSize > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			// Update existing lead.
			$response = Salesforce::update_lead( $leads->records[0]->Id, $fields_to_update );
		} else {
			// Create new lead.
			$response = Salesforce::create_lead( $fields_to_update );
		}

		return \rest_ensure_response( $response );
	}
}

new Webhooks();

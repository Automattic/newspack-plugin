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
		$args            = $request->get_params();
		$order_details   = Salesforce::parse_wc_order_data( $args );
		$order_contact   = $order_details['contact'];
		$orders          = $order_details['orders'];
		$order_responses = [];

		if ( empty( $order_contact ) || empty( empty( $orders ) ) ) {
			return \rest_ensure_response( 'No valid order details.' );
		}

		if ( empty( $order_contact['Email'] ) ) {
			return \rest_ensure_response( 'No valid email address.' );
		}

		$contacts   = Salesforce::get_contacts_by_email( $order_contact['Email'] );
		$contact_id = '';

		if ( $contacts->totalSize > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			// Update existing contact.
			if ( ! empty( $contacts->records[0]->Description && ! empty( $order_contact['Description'] ) ) ) {
				$order_contact['Description'] .= "\n" . $contacts->records[0]->Description; // Update line items.
			}
			$contact_id       = $contacts->records[0]->Id;
			$contact_response = Salesforce::update_contact( $contact_id, $order_contact );
		} else {
			// Create new contact.
			$contact_response = Salesforce::create_contact( $order_contact );
			$contact_id       = $contact_response['id'];
		}

		if ( is_array( $orders ) ) {

			foreach ( $orders as $order ) {
				$order['BillToContactId'] = $contact_id;
				$order_responses[]        = Salesforce::create_order( $order );
			}
		}

		return \rest_ensure_response(
			[
				'contact' => $contact_response,
				'orders'  => $order_responses,
			]
		);
	}
}

new Webhooks();

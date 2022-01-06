<?php
/**
 * Newspack Salesforce features management.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Handles Salesforce functionality.
 */
class Salesforce {
	const SALESFORCE_CLIENT_ID     = 'newspack_salesforce_client_id';
	const SALESFORCE_CLIENT_SECRET = 'newspack_salesforce_client_secret';
	const SALESFORCE_ACCESS_TOKEN  = 'newspack_salesforce_access_token';
	const SALESFORCE_REFRESH_TOKEN = 'newspack_salesforce_refresh_token';
	const SALESFORCE_INSTANCE_URL  = 'newspack_salesforce_instance_url';
	const SALESFORCE_WEBHOOK_ID    = 'newspack_salesforce_webhook_id';
	const DEFAULT_SETTINGS         = [
		'client_id'     => '',
		'client_secret' => '',
		'access_token'  => '',
		'refresh_token' => '',
		'instance_url'  => '',
		'webhook_id'    => '',
	];

	/**
	 * Add hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints needed to handle Salesforce sync webhooks.
	 */
	public static function register_api_endpoints() {
		// Handle WooCommerce webhook to sync with Salesforce.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/salesforce/sync',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_sync_salesforce' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	/**
	 * Webhook callback handler for syncing data to Salesforce.
	 *
	 * @param WP_REST_Request $request Request containing webhook.
	 * @return WP_REST_Response|WP_Error The response from Salesforce, or WP_Error.
	 */
	public static function api_sync_salesforce( $request ) {
		$args          = $request->get_params();
		$order_details = self::parse_wc_order_data( $args );

		if ( empty( $order_details ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_order',
				__( 'No valid WooCommerce order data.', 'newspack' )
			);
		}

		$contact       = $order_details['contact'];
		$orders        = $order_details['orders'];
		$opportunities = [];

		if ( empty( $contact ) || empty( $orders ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_contact_or_transaction',
				__( 'No valid transaction or contact data.', 'newspack' )
			);
		}

		if ( empty( $contact['Email'] ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_contact_email',
				__( 'No valid contact email address.', 'newspack' )
			);
		}

		$contacts = self::get_contacts_by_email( $contact['Email'] );

		if ( empty( $contacts ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_salesforce_lookup',
				__( 'Could not communicate with Salesforce.', 'newspack' )
			);
		}

		if ( $contacts->totalSize > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$contact_id       = $contacts->records[0]->Id;
			$contact_response = self::update_contact( $contact_id, $contact );
		} else {
			// Create new contact.
			$contact_response = self::create_contact( $contact );

			if ( is_wp_error( $contact_response ) ) {
				return new \WP_Error(
					'newspack_salesforce_contact_failure',
					$contact_response->get_error_message()
				);
			}

			$contact_id = $contact_response->id;
		}

		if ( empty( $contact_id ) ) {
			return new \WP_Error(
				'newspack_salesforce_sync_failure',
				__( 'Could not create or update Salesforce data.', 'newspack' )
			);
		}

		// Sync WooCommerce orders to Salesforce opportunities.
		if ( is_array( $orders ) ) {
			$is_npsp = self::has_field( 'npsp__Primary_Contact__c', 'Opportunity' );

			foreach ( $orders as $order ) {
				// Add the NPSP "Primary Contact" field if the Salesforce instance supports it.
				if ( $is_npsp ) {
					$order['npsp__Primary_Contact__c'] = $contact_id;
				}

				$opportunity_response = self::create_opportunity( $order );

				if ( is_wp_error( $opportunity_response ) ) {
					return new \WP_Error(
						'newspack_salesforce_opportunity_failure',
						$opportunity_response->get_error_message()
					);
				}

				$opportunity_id = $opportunity_response->id;

				if ( ! empty( $opportunity_id ) ) {
					$opportunities[] = $opportunity_response;
					self::create_opportunity_contact_role( $opportunity_id, $contact_id );
				}
			}
		}

		return \rest_ensure_response(
			[
				'contact'       => $contact_response,
				'opportunities' => $opportunities,
			]
		);
	}

	/**
	 * Get the Salesforce settings.
	 *
	 * @return Array of Salesforce settings.
	 */
	private static function get_salesforce_settings() {
		$settings = self::DEFAULT_SETTINGS;

		$client_id = get_option( self::SALESFORCE_CLIENT_ID, 0 );
		if ( ! empty( $client_id ) ) {
			$settings['client_id'] = $client_id;
		}
		$client_secret = get_option( self::SALESFORCE_CLIENT_SECRET, 0 );
		if ( ! empty( $client_secret ) ) {
			$settings['client_secret'] = $client_secret;
		}
		$access_token = get_option( self::SALESFORCE_ACCESS_TOKEN, 0 );
		if ( ! empty( $access_token ) ) {
			$settings['access_token'] = $access_token;
		}
		$refresh_token = get_option( self::SALESFORCE_REFRESH_TOKEN, 0 );
		if ( ! empty( $refresh_token ) ) {
			$settings['refresh_token'] = $refresh_token;
		}
		$instance_url = get_option( self::SALESFORCE_INSTANCE_URL, 0 );
		if ( ! empty( $instance_url ) ) {
			$settings['instance_url'] = $instance_url;
		}

		return $settings;
	}

	/**
	 * Helper to build a request to the Salesforce REST API.
	 * Automatically fetches a refresh token if the access token has expired.
	 *
	 * @param string $endpoint API endpoint, including query params if any. Will add / prefix if not already prefixed.
	 * @param string $method API method (e.g. GET, POST, PATCH, etc.).
	 * @param array  $data Any data to send as the request body, in the form of an associative array.
	 *
	 * @return array|WP_Error Request response, or WP_Error.
	 */
	private static function build_request( $endpoint, $method = 'GET', $data = false ) {
		$salesforce_settings = self::get_salesforce_settings();
		$endpoint            = '/' === substr( $endpoint, 0, 1 ) ? $endpoint : '/' . $endpoint;
		$url                 = $salesforce_settings['instance_url'] . $endpoint;
		$request             = [
			'method'  => $method,
			'headers' => [
				'Authorization' => 'Bearer ' . $salesforce_settings['access_token'],
				'Content-Type'  => 'application/json',
			],
			'timeout' => 30, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
		];

		if ( $data ) {
			$request['body'] = wp_json_encode( $data );
		}

		// Make request to the Salesforce SOAP API.
		$response = wp_safe_remote_request( $url, $request );

		// If our access token has expired, let's get a refresh token and retry.
		if ( wp_remote_retrieve_response_code( $response ) === 401 ) {
			$request['headers']['Authorization'] = 'Bearer ' . self::refresh_salesforce_token();
			$response                            = wp_safe_remote_request( $url, $request );
		}

		return $response;
	}

	/**
	 * Set the Salesforce settings.
	 *
	 * @param array $args Array of settings info.
	 * @return array Updated settings.
	 */
	private static function set_salesforce_settings( $args ) {
		$defaults = self::DEFAULT_SETTINGS;
		$update   = wp_parse_args( $args, $defaults );

		if ( array_key_exists( 'client_id', $args ) ) {
			update_option( self::SALESFORCE_CLIENT_ID, $update['client_id'] );
		}

		if ( array_key_exists( 'client_secret', $args ) ) {
			update_option( self::SALESFORCE_CLIENT_SECRET, $update['client_secret'] );
		}

		if ( array_key_exists( 'access_token', $args ) ) {
			update_option( self::SALESFORCE_ACCESS_TOKEN, $update['access_token'] );
		}

		if ( array_key_exists( 'refresh_token', $args ) ) {
			update_option( self::SALESFORCE_REFRESH_TOKEN, $update['refresh_token'] );
		}

		if ( array_key_exists( 'instance_url', $args ) ) {
			update_option( self::SALESFORCE_INSTANCE_URL, $update['instance_url'] );
		}

		// Get webhook id.
		$webhook_id = get_option( self::SALESFORCE_WEBHOOK_ID, 0 );

		// If we're establishing a new connection and don't have an existing webhook, create a new one.
		if ( empty( $webhook_id ) && ! empty( $args['refresh_token'] ) ) {
			self::create_webhook();
		}

		// If we're resetting, let's delete the existing webhook, if it exists.
		if ( ! empty( $webhook_id ) && isset( $args['refresh_token'] ) && '' === $args['refresh_token'] ) {
			self::delete_webhook( $webhook_id );
		}

		return self::get_salesforce_settings();
	}

	/**
	 * Create a WooCommerce webhook.
	 *
	 * @return void
	 */
	private static function create_webhook() {
		$webhook = new \WC_Webhook();
		$webhook->set_name( 'Sync Salesforce on order checkout' );
		$webhook->set_topic( 'order.created' ); // Trigger on checkout.
		$webhook->set_delivery_url( NEWSPACK_API_URL . '/salesforce/sync' );
		$webhook->set_status( 'active' );
		$webhook->set_user_id( get_current_user_id() );
		$webhook->save();
		$webhook_id = $webhook->get_id();

		update_option( self::SALESFORCE_WEBHOOK_ID, $webhook_id );
	}

	/**
	 * Delete a WooCommerce webhook.
	 *
	 * @param string $webhook_id ID for the webhook to delete.
	 * @return void
	 */
	private static function delete_webhook( $webhook_id ) {
		update_option( self::SALESFORCE_WEBHOOK_ID, '' );
		$webhook = wc_get_webhook( $webhook_id );
		if ( null !== $webhook ) {
			$webhook->delete( true );
		}
	}

	/**
	 * Parse WooCommerce order data to send in an update or create request to Salesforce.
	 * Ensures that the data only contains valid Salesforce field names.
	 *
	 * @param $array $data Raw data to parse.
	 * @return @array|bool Parsed data, or false.
	 */
	private static function parse_wc_order_data( $data ) {
		$contact = [];
		$orders  = [];

		// We need billing and transaction info from the order before we can do anything.
		if ( empty( $data['billing'] ) || empty( $data['line_items'] ) ) {
			return false;
		}

		$billing          = $data['billing'];
		$transactions     = $data['line_items'];
		$transaction_date = $data['date_created_gmt'];

		// Parse billing contact info from WooCommerce.
		if ( ! empty( $billing['email'] ) ) {
			$contact['Email'] = $billing['email'];
		}
		if ( ! empty( $billing['first_name'] ) ) {
			$contact['FirstName'] = $billing['first_name'];
		}
		if ( ! empty( $billing['last_name'] ) ) {
			$contact['LastName'] = $billing['last_name'];
		}
		if ( ! empty( $billing['phone'] ) ) {
			$contact['HomePhone'] = $billing['phone'];
		}
		if ( ! empty( $billing['address_1'] ) ) {
			$contact['MailingStreet'] = $billing['address_1'];
		}
		if ( ! empty( $billing['address_2'] ) ) {
			$contact['MailingStreet'] .= "\n" . $billing['address_2'];
		}
		if ( ! empty( $billing['city'] ) ) {
			$contact['MailingCity'] = $billing['city'];
		}
		if ( ! empty( $billing['state'] ) ) {
			$contact['MailingState'] = $billing['state'];
		}
		if ( ! empty( $billing['postcode'] ) ) {
			$contact['MailingPostalCode'] = $billing['postcode'];
		}
		if ( ! empty( $billing['country'] ) ) {
			$contact['MailingCountry'] = $billing['country'];
		}

		$lead_source = '';

		foreach ( $data['meta_data'] as $meta_field ) {
			if ( in_array( $meta_field['key'], array_keys( Donations::DONATION_ORDER_META_KEYS ) ) ) {
				$meta_label = Donations::DONATION_ORDER_META_KEYS[ $meta_field['key'] ]['label'];
				$meta_value = ! empty( $meta_field['value'] ) ? $meta_field['value'] : 'none';

				if ( ! empty( $lead_source ) ) {
					$lead_source .= '; ';
				}

				$lead_source .= $meta_label . ': ' . $meta_value;
			}
		}

		if ( is_array( $transactions ) ) {
			foreach ( $transactions as $transaction ) {
				$orders[] = [
					'Amount'      => $transaction['total'],
					'CloseDate'   => $transaction_date,
					'Description' => 'WooCommerce Order Number: ' . $data['id'],
					'Name'        => $transaction['name'],
					'StageName'   => 'Closed Won',
					'LeadSource'  => $lead_source,
				];
			}
		}

		return [
			'contact' => $contact,
			'orders'  => $orders,
		];
	}

	/**
	 * Look up existing Contact records by email address.
	 *
	 * @param string $email Email address of the contact.
	 * @return array Array of found records with matching email attributes.
	 */
	private static function get_contacts_by_email( $email ) {
		$query    = [
			'q' => "SELECT Id, FirstName, LastName, Description FROM Contact WHERE Email = '" . $email . "'",
		];
		$endpoint = 'services/data/v48.0/query?' . http_build_query( $query );
		$response = self::build_request( $endpoint );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Update an existing Contact record by Id with the given data.
	 *
	 * @param array $id Unique ID of the record to update in Salesforce.
	 * @param array $data Attributes and values to update in Salesforce.
	 * @return int Response code of the update request.
	 */
	private static function update_contact( $id, $data ) {
		$endpoint = '/services/data/v48.0/sobjects/Contact/' . $id;
		return self::build_request( $endpoint, 'PATCH', $data );
	}

	/**
	 * Create a new contact record in Salesforce.
	 *
	 * @param array $data Data to use in creating the new contact. Keys must be valid Salesforce field names.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function create_contact( $data ) {
		$endpoint = '/services/data/v48.0/sobjects/Contact/';
		$response = self::build_request( $endpoint, 'POST', $data );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Get available fields for sObject type in Salesforce.
	 * This will let us know whether the Salesforce instance has certain fields that can be set.
	 *
	 * @param string $sobject_name Name of the Salesforce sObject type to look up.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function describe_sobject( $sobject_name = null ) {
		$endpoint = '/services/data/v48.0/sobjects/' . $sobject_name . '/describe';
		$response = self::build_request( $endpoint );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Does the given sObject type have the given field name?
	 *
	 * @param string $field_name   Name of the field.
	 * @param string $sobject_name Name of the Salesforce sObject to check for the field.
	 * @return boolean Whether or not the field exists.
	 */
	private static function has_field( $field_name = null, $sobject_name = null ) {
		$has_field = false;

		if ( empty( $field_name ) || empty( $sobject_name ) ) {
			return $has_field;
		}
		$sobject = self::describe_sobject( $sobject_name );

		if ( is_wp_error( $sobject ) || ! is_array( $sobject->fields ) ) {
			return $has_field;
		}

		$primary_content_field = array_filter(
			$sobject->fields,
			function( $field ) use ( $field_name ) {
				return $field_name === $field->name;
			}
		);

		if ( count( $primary_content_field ) > 0 ) {
			$has_field = true;
		}

		return $has_field;
	}

	/**
	 * Create a new opportunity record in Salesforce.
	 *
	 * @param array $data Data to use in creating the new opportunity. Keys must be valid Salesforce field names.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function create_opportunity( $data ) {
		$endpoint = '/services/data/v48.0/sobjects/Opportunity/';
		$response = self::build_request( $endpoint, 'POST', $data );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Create a new opportunity contact role record in Salesforce.
	 * This intermediate object type creates a relationship between the given contact and opportunity.
	 *
	 * @param string $opportunity_id Unique ID for the opportunity to link.
	 * @param string $contact_id Unique ID for the contact to link.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function create_opportunity_contact_role( $opportunity_id, $contact_id ) {
		$endpoint = '/services/data/v48.0/sobjects/OpportunityContactRole/';
		$data     = [
			'ContactId'     => $contact_id,
			'IsPrimary'     => true,
			'OpportunityId' => $opportunity_id,
			'Role'          => 'Hard Credit',
		];
		$response = self::build_request( $endpoint, 'POST', $data );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Get a new Salesforce token using a valid refresh token.
	 *
	 * @throws \Exception Error message.
	 * @return string The new access token.
	 */
	private static function refresh_salesforce_token() {
		$salesforce_settings = self::get_salesforce_settings();

		// Must have a valid API key and secret.
		if ( empty( $salesforce_settings['client_id'] ) || empty( $salesforce_settings['client_secret'] ) ) {
			throw new \Exception( 'Invalid Consumer Key or Secret.' );
		}

		// Must have a valid refresh token.
		if ( empty( $salesforce_settings['refresh_token'] ) ) {
			throw new \Exception( 'Invalid refresh token.' );
		}

		// Hit Salesforce OAuth endpoint to request API tokens.
		$salesforce_response = wp_safe_remote_post(
			'https://login.salesforce.com/services/oauth2/token?' . http_build_query(
				[
					'client_id'     => $salesforce_settings['client_id'],
					'client_secret' => $salesforce_settings['client_secret'],
					'refresh_token' => $salesforce_settings['refresh_token'],
					'grant_type'    => 'refresh_token',
					'format'        => 'json',
				]
			),
			[
				'timeout' => 30, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
			]
		);

		$response_body = json_decode( $salesforce_response['body'] );

		if ( ! empty( $response_body->access_token ) ) {

			// Save tokens.
			$update_response = self::set_salesforce_settings(
				[
					'access_token' => $response_body->access_token,
				]
			);

			return $response_body->access_token;
		}
	}
}

Salesforce::init();

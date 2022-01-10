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
	const SALESFORCE_API_NAMESPACE = 'newspack/salesforce/v1';
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
	 * Register the endpoints needed to handle Salesforce functionality.
	 */
	public static function register_api_endpoints() {
		// Check validity of refresh token with Salesforce.
		register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/connection-status',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_check_salesforce_connection_status' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		// Validate Salesforce client_id and client_secret credentials.
		register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/validate',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_validate_salesforce_creds' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		// Get access and refresh tokens from Salesforce.
		register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/tokens',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_get_salesforce_tokens' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'client_id'     => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'client_secret' => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'redirect_uri'  => [
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);

		// Handle WooCommerce webhook to sync with Salesforce.
		register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/sync',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_sync_salesforce' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @return bool|WP_Error
	 */
	public static function api_permissions_check() {
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
	 * API endpoint for checking validity of a Salesforce refresh token.
	 *
	 * @throws \Exception Error message.
	 * @return WP_REST_Response with the active status.
	 */
	public static function api_check_salesforce_connection_status() {
		$settings = self::get_salesforce_settings();

		// Check if the webhook is configured.
		$webhook_id = get_option( self::SALESFORCE_WEBHOOK_ID, 0 );
		$webhook    = wc_get_webhook( $webhook_id );
		if ( null == $webhook ) {
			return \rest_ensure_response(
				[
					'error' => __(
						'Webhook is not configured. Please try resetting your Salesforce connection and reconnecting.',
						'newspack'
					),
				]
			);
		}

		// Must have a valid API key and secret.
		if (
			empty( $settings['client_id'] ) ||
			empty( $settings['client_secret'] ) ||
			empty( $settings['refresh_token'] )
		) {
			return \rest_ensure_response(
				[
					'error' => __(
						'Invalid Consumer Key, Secret, or Refresh Token.',
						'newspack'
					),
				]
			);
		}

		// Hit Salesforce OAuth endpoint to introspect refresh token.
		$salesforce_response = wp_safe_remote_post(
			'https://login.salesforce.com/services/oauth2/introspect?' . http_build_query(
				array(
					'client_id'     => $settings['client_id'],
					'client_secret' => $settings['client_secret'],
					'token'         => $settings['refresh_token'],
				)
			)
		);

		$response_body = json_decode( $salesforce_response['body'] );

		if ( true !== $response_body->active ) {
			return \rest_ensure_response(
				[
					'error' => __(
						'We couldn’t validate the connection with Salesforce. Please verify the status of the Connected App in Salesforce.',
						'newspack'
					),
				]
			);
		}

		return \rest_ensure_response( $response_body );
	}

	/**
	 * API endpoint for validating Salesforce client id/secret credentials.
	 *
	 * @param WP_REST_Request $request Request containing settings.
	 * @return WP_REST_Response with the latest settings.
	 */
	public static function api_validate_salesforce_creds( $request ) {
		$args  = $request->get_params();
		$valid = false;

		// Must have a valid API key and secret.
		if ( ! empty( $args['client_id'] ) && ! empty( $args['client_secret'] ) ) {
			$url = 'https://login.salesforce.com/services/oauth2/authorize?response_type=code&' . http_build_query(
				[
					'client_id'     => $args['client_id'],
					'client_secret' => $args['client_secret'],
					'redirect_uri'  => $args['redirect_uri'],
				]
			);

			$response = wp_safe_remote_get( $url );
			$valid    = wp_remote_retrieve_response_code( $response ) === 200;
		}

		return \rest_ensure_response( $valid );
	}

	/**
	 * API endpoint for getting Salesforce API tokens.
	 *
	 * @param WP_REST_Request $request Request containing settings.
	 * @throws \Exception Error message.
	 * @return WP_REST_Response with the latest settings.
	 */
	public static function api_get_salesforce_tokens( $request ) {
		$args     = $request->get_params();
		$settings = self::get_salesforce_settings();

		// Must have a valid API key and secret.
		if ( empty( $settings['client_id'] ) || empty( $settings['client_secret'] ) ) {
			throw new \Exception( 'Invalid Consumer Key or Secret.' );
		}

		// Hit Salesforce OAuth endpoint to request API tokens.
		$salesforce_response = wp_safe_remote_post(
			'https://login.salesforce.com/services/oauth2/token?' . http_build_query(
				array(
					'client_id'     => $settings['client_id'],
					'client_secret' => $settings['client_secret'],
					'code'          => $args['code'],
					'redirect_uri'  => $args['redirect_uri'],
					'grant_type'    => 'authorization_code',
					'format'        => 'json',
				)
			)
		);

		$response_body = json_decode( $salesforce_response['body'] );

		if ( ! empty( $response_body->access_token ) && ! empty( $response_body->refresh_token ) ) {
			$update_args = wp_parse_args( $response_body, $settings );

			// Save tokens.
			$update_response = self::set_salesforce_settings( $update_args );
			if ( is_wp_error( $update_response ) ) {
				return \rest_ensure_response( $update_response );
			}

			return \rest_ensure_response( $update_args );
		}
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
	public static function get_salesforce_settings() {
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
		$settings = self::get_salesforce_settings();
		$endpoint = '/' === substr( $endpoint, 0, 1 ) ? $endpoint : '/' . $endpoint;
		$url      = $settings['instance_url'] . $endpoint;
		$request  = [
			'method'  => $method,
			'headers' => [
				'Authorization' => 'Bearer ' . $settings['access_token'],
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
	public static function set_salesforce_settings( $args ) {
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
	 * @param $array|WC_Order $order Raw order data or WC_Order object to parse.
	 * @return @array|bool Parsed data, or false.
	 */
	private static function parse_wc_order_data( $order ) {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return new \WP_Error(
				'newspack_salesforce_no_woocommerce',
				__( 'WooCommerce must be installed and active.', 'newspack' )
			);
		}

		$lead_source = '';

		// Convert raw order data to a WC_Order instance.
		if ( ! is_a( $order, 'WC_Order' ) ) {
			// Raw order data from a webhook may contain extra transaction metadata that we can include in the payload.
			// Let's extract that before converting the data to a WC_Order object.
			if ( isset( $order['meta_data'] ) ) {
				foreach ( $order['meta_data'] as $meta_field ) {
					if ( in_array( $meta_field['key'], array_keys( Donations::DONATION_ORDER_META_KEYS ) ) ) {
						$meta_label = Donations::DONATION_ORDER_META_KEYS[ $meta_field['key'] ]['label'];
						$meta_value = ! empty( $meta_field['value'] ) ? $meta_field['value'] : 'none';

						if ( ! empty( $lead_source ) ) {
							$lead_source .= '; ';
						}

						$lead_source .= $meta_label . ': ' . $meta_value;
					}
				}
			}

			if ( isset( $order['id'] ) ) {
				$order = \wc_get_order( $order['id'] );
			} else {
				return new \WP_Error(
					'newspack_salesforce_order_error',
					__( 'Valid Order ID required.', 'newspack' )
				);
			}
		}

		$contact = [];
		$orders  = [];

		// Parse billing contact info from WooCommerce.
		$contact['Email']             = $order->get_billing_email();
		$contact['FirstName']         = $order->get_billing_first_name();
		$contact['LastName']          = $order->get_billing_last_name();
		$contact['HomePhone']         = $order->get_billing_phone();
		$contact['MailingStreet']     = $order->get_billing_address_1();
		$contact['MailingStreet']    .= "\n" . $order->get_billing_address_2();
		$contact['MailingCity']       = $order->get_billing_city();
		$contact['MailingState']      = $order->get_billing_state();
		$contact['MailingPostalCode'] = $order->get_billing_postcode();
		$contact['MailingCountry']    = $order->get_billing_country();

		foreach ( $order->get_items() as $item_id => $item ) {
			$item_data = [
				'Amount'      => $item->get_total(),
				'CloseDate'   => $order->get_date_created()->date( 'Y-m-d' ),
				'Description' => 'WooCommerce Order Number: ' . $order->get_id(),
				'Name'        => $item->get_name(),
				'StageName'   => 'Closed Won',
			];

			if ( ! empty( $lead_source ) ) {
				$item_data['LeadSource'] = $lead_source;
			}

			$orders[] = $item_data;
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
		$endpoint = '/services/data/v48.0/query?' . http_build_query( $query );
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
		$settings = self::get_salesforce_settings();

		// Must have a valid API key and secret.
		if ( empty( $settings['client_id'] ) || empty( $settings['client_secret'] ) ) {
			throw new \Exception( 'Invalid Consumer Key or Secret.' );
		}

		// Must have a valid refresh token.
		if ( empty( $settings['refresh_token'] ) ) {
			throw new \Exception( 'Invalid refresh token.' );
		}

		// Hit Salesforce OAuth endpoint to request API tokens.
		$salesforce_response = wp_safe_remote_post(
			'https://login.salesforce.com/services/oauth2/token?' . http_build_query(
				[
					'client_id'     => $settings['client_id'],
					'client_secret' => $settings['client_secret'],
					'refresh_token' => $settings['refresh_token'],
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

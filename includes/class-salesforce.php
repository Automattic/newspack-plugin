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
	public static function create_webhook() {
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
	public static function delete_webhook( $webhook_id ) {
		update_option( self::SALESFORCE_WEBHOOK_ID, '' );
		$webhook = wc_get_webhook( $webhook_id );
		$webhook->delete( true );
	}

	/**
	 * Parse WooCommerce order data to send in an update or create request to Salesforce.
	 * Ensures that the data only contains valid Salesforce field names.
	 *
	 * @param $array $data Raw data to parse.
	 * @return @array Parsed data.
	 */
	public static function parse_wc_order_data( $data ) {
		$fields_to_update = [];

		// We need billing info from the order before we can do anything.
		if ( empty( $data['billing'] ) ) {
			return $fields_to_update;
		}

		// Parse billing info from WooCommerce.
		if ( ! empty( $data['billing']['email'] ) ) {
			$fields_to_update['Email'] = $data['billing']['email'];
		}
		if ( ! empty( $data['billing']['first_name'] ) ) {
			$fields_to_update['FirstName'] = $data['billing']['first_name'];
		}
		if ( ! empty( $data['billing']['last_name'] ) ) {
			$fields_to_update['LastName'] = $data['billing']['last_name'];
		}
		if ( ! empty( $data['billing']['company'] ) ) {
			$fields_to_update['Company'] = $data['billing']['company'];
		}
		if ( ! empty( $data['billing']['phone'] ) ) {
			$fields_to_update['Phone'] = $data['billing']['phone'];
		}
		if ( ! empty( $data['billing']['address_1'] ) ) {
			$fields_to_update['Street'] = $data['billing']['address_1'];
		}
		if ( ! empty( $data['billing']['address_2'] ) ) {
			$fields_to_update['Street'] .= "\n" . $data['billing']['address_2'];
		}
		if ( ! empty( $data['billing']['city'] ) ) {
			$fields_to_update['City'] = $data['billing']['city'];
		}
		if ( ! empty( $data['billing']['state'] ) ) {
			$fields_to_update['State'] = $data['billing']['state'];
		}
		if ( ! empty( $data['billing']['postcode'] ) ) {
			$fields_to_update['PostalCode'] = $data['billing']['postcode'];
		}
		if ( ! empty( $data['line_items'] ) ) {
			$fields_to_update['Description'] = wp_json_encode( $data['line_items'] );
		}

		return $fields_to_update;
	}

	/**
	 * Look up existing Lead records by email address.
	 *
	 * @param string $email Email address of the lead.
	 * @return array Array of found records with matching email attributes.
	 */
	public static function get_leads_by_email( $email ) {
		$salesforce_settings = self::get_salesforce_settings();
		$query               = [
			'q' => "SELECT Id, FirstName, LastName FROM Lead WHERE Email = '" . $email . "'",
		];
		$url                 = $salesforce_settings['instance_url'] . '/services/data/v48.0/query?' . http_build_query( $query );

		// Look up leads with a matching email address via Salesforce API, using cached access_token.
		$response = wp_safe_remote_get(
			$url,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $salesforce_settings['access_token'],
				],
			]
		);

		// If our access token has expired, refresh it and re-send the request.
		if ( wp_remote_retrieve_response_code( $response ) === 401 ) {
			$access_token = self::refresh_salesforce_token();
			$response     = wp_safe_remote_get(
				$url,
				[
					'headers' => [
						'Authorization' => 'Bearer ' . $access_token,
					],
				]
			);
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Update an existing Lead record by Id with the given data.
	 *
	 * @param string $id Unique ID of the record to update in Salesforce.
	 * @param array  $data Attributes and values to update in Salesforce.
	 * @return int Response code of the update request.
	 */
	public static function update_lead( $id, $data ) {
		$salesforce_settings = self::get_salesforce_settings();
		$url                 = $salesforce_settings['instance_url'] . '/services/data/v48.0/sobjects/Lead/' . $id;

		// Update lead record via Salesforce API, using cached access_token.
		$response = wp_safe_remote_request(
			$url,
			[
				'method'  => 'PATCH',
				'headers' => [
					'Authorization' => 'Bearer ' . $salesforce_settings['access_token'],
					'Content-Type'  => 'application/json',
				],
				'body'    => wp_json_encode( $data ),
			]
		);

		// If our access token has expired, refresh it and re-send the request.
		if ( wp_remote_retrieve_response_code( $response ) === 401 ) {
			$access_token = self::refresh_salesforce_token();
			$response     = wp_safe_remote_request(
				$url,
				[
					'method'  => 'PATCH',
					'headers' => [
						'Authorization' => 'Bearer ' . $access_token,
						'Content-Type'  => 'application/json',
					],
					'body'    => wp_json_encode( $data ),
				]
			);
		}

		return $response;
	}

	/**
	 * Create a new lead record in Salesforce.
	 *
	 * @param array $data Data to use in creating the new lead. Keys must be valid Salesforce field names.
	 * @return array Response from Salesforce API.
	 */
	public static function create_lead( $data ) {
		$salesforce_settings = self::get_salesforce_settings();
		$url                 = $salesforce_settings['instance_url'] . '/services/data/v48.0/sobjects/Lead/';

		// Company is a required field for Salesforce leads, but not for WooCommerce.
		if ( empty( $data['Company'] ) ) {
			$data['Company'] = 'Unknown';
		}

		// Create lead record via Salesforce API, using cached access_token.
		$response = wp_safe_remote_post(
			$url,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $salesforce_settings['access_token'],
					'Content-Type'  => 'application/json',
				],
				'body'    => wp_json_encode( $data ),
			]
		);

		// If our access token has expired, refresh it and re-send the request.
		if ( wp_remote_retrieve_response_code( $response ) === 401 ) {
			$access_token = self::refresh_salesforce_token();
			$response     = wp_safe_remote_post(
				$url,
				[
					'headers' => [
						'Authorization' => 'Bearer ' . $access_token,
						'Content-Type'  => 'application/json',
					],
					'body'    => wp_json_encode( $data ),
				]
			);
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Get a new Salesforce token using a valid refresh token.
	 *
	 * @throws \Exception Error message.
	 * @return string The new access token.
	 */
	public static function refresh_salesforce_token() {
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
			)
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

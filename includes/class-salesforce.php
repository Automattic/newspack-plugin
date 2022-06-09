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
	const SALESFORCE_CRON_HOOK     = 'newspack_salesforce_failed_sync_checker';
	const DEFAULT_SETTINGS         = [
		'client_id'     => '',
		'client_secret' => '',
		'access_token'  => '',
		'refresh_token' => '',
		'instance_url'  => '',
		'webhook_id'    => '',
	];
	const LEGACY_CUTOFF_DATE       = '2022-05-01'; // Date marking the cutoff after which orders are synced to Salesforce with order ID in the name.

	/**
	 * If this site is a duplicate (staging or dev clone) site,
	 * don't handle webhooks which communicate with external services.
	 *
	 * @var boolean
	 */
	protected static $is_duplicate_site = false;

	/**
	 * Whether the WP CLI sync script is running as a dry-run.
	 *
	 * @var $is_dry_run
	 */
	public static $is_dry_run = false;

	/**
	 * Add hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'register_admin_scripts' ] );
		add_action( 'woocommerce_order_actions_start', [ __CLASS__, 'wc_order_show_sync_status' ] );
		add_filter( 'woocommerce_order_actions', [ __CLASS__, 'wc_order_manual_sync' ] );
		add_action( 'woocommerce_order_action_newspack_sync_order_to_salesforce', [ __CLASS__, 'wc_order_manual_sync_action' ] );
		add_action( 'init', [ __CLASS__, 'add_cli_command' ] );
		// add_action( 'admin_init', [ __CLASS__, 'cron_init' ] );
		// add_action( self::SALESFORCE_CRON_HOOK, [ __CLASS__, 'check_failed_order_syncs' ] );
	}

	/**
	 * Register the endpoints needed to handle Salesforce functionality.
	 */
	public static function register_api_endpoints() {
		// Check validity of refresh token with Salesforce.
		\register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/settings',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_settings' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		// Check validity of refresh token with Salesforce.
		\register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/settings',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_settings' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		// Check validity of refresh token with Salesforce.
		\register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/connection-status',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_check_salesforce_connection_status' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		// Validate Salesforce client_id and client_secret credentials.
		\register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/validate',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_validate_salesforce_creds' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		// Get access and refresh tokens from Salesforce.
		\register_rest_route(
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

		// Fetch order sync status.
		\register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/order',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_order_status' ],
				'permission_callback' => function() {
					return current_user_can( 'edit_others_shop_orders' );
				},
			]
		);

		// Handle WooCommerce webhook to sync with Salesforce.
		\register_rest_route(
			self::SALESFORCE_API_NAMESPACE,
			'/sync',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_sync_salesforce' ],
				'permission_callback' => [ __CLASS__, 'api_validate_webhook' ],
			]
		);

		// Legacy namespace handler.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/salesforce/sync',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_sync_salesforce' ],
				'permission_callback' => [ __CLASS__, 'api_validate_webhook' ],
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
	 * Check validity of webhook requester before processing the webhook callback handler.
	 *
	 * @param WP_REST_Request $request API request object.
	 *
	 * @return bool|WP_Error
	 */
	public static function api_validate_webhook( $request ) {
		$is_valid   = false;
		$webhook_id = $request->get_header( 'X-WC-Webhook-ID' );

		if ( $webhook_id ) {
			$is_valid = (int) \get_option( self::SALESFORCE_WEBHOOK_ID, 0 ) === (int) $webhook_id;
		}

		if ( $is_valid ) {
			return true;
		}

		return new \WP_Error(
			'newspack_rest_forbidden',
			esc_html__( 'Invalid webhook request.', 'newspack' ),
			[
				'status' => 403,
			]
		);
	}

	/**
	 * Register admin scripts for Salesforce functionality.
	 */
	public static function register_admin_scripts() {
		if ( 'shop_order' !== \get_post_type() ) {
			return;
		}

		$settings = self::get_salesforce_settings();
		Newspack::load_common_assets();

		wp_enqueue_script(
			'newspack-salesforce-sync-status',
			Newspack::plugin_url() . '/dist/other-scripts/salesforce.js',
			[],
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'newspack-salesforce-sync-status',
			'newspack_salesforce_data',
			[
				'base_url'       => get_rest_url(),
				'order_id'       => get_the_id(),
				'salesforce_url' => $settings['instance_url'],
				'nonce'          => wp_create_nonce( 'wp_rest' ),
			]
		);
	}

	/**
	 * Get settings list.
	 *
	 * @return WP_REST_Response containing the settings list.
	 */
	public static function api_get_settings() {
		return \rest_ensure_response( self::get_settings_list( true ) );
	}

	/**
	 * Get settings list.
	 *
	 * @param boolean $assoc If true, return settings as an associative array keyed by setting key, otherwise return as a flat array.
	 *
	 * return array Array of settings.
	 */
	private static function get_settings_list( $assoc = false ) {
		$settings      = self::get_salesforce_settings();
		$client_key    = $settings['client_id'];
		$client_secret = $settings['client_secret'];
		$settings_list = [
			[
				'description' => __( 'Connected App Settings', 'newspack' ),
				'help'        => __( 'Settings for your Salesforce connected app.', 'newspack' ),
				'section'     => 'salesforce',
				'key'         => 'active',
				'type'        => 'boolean',
				'default'     => true,
				'public'      => false,
				'value'       => null,
			],
			[
				'description' => __( 'Consumer Key', 'newspack' ),
				'help'        => __( 'The connected app’s Consumer Key.', 'newspack' ),
				'section'     => 'salesforce',
				'key'         => self::SALESFORCE_CLIENT_ID,
				'type'        => 'string',
				'default'     => true,
				'public'      => false,
				'value'       => $client_key,
			],
			[
				'description' => __( 'Consumer Secret', 'newspack' ),
				'help'        => __( 'The connected app’s Consumer Secret.', 'newspack' ),
				'section'     => 'salesforce',
				'key'         => self::SALESFORCE_CLIENT_SECRET,
				'type'        => 'password',
				'default'     => true,
				'public'      => false,
				'value'       => $client_secret,
			],
		];

		if ( $assoc ) {
			$settings_list = array_reduce(
				$settings_list,
				function ( $carry, $item ) {
					$carry[ $item['section'] ][] = $item;
					return $carry;
				},
				[]
			);
		}

		return $settings_list;
	}

	/**
	 * Update settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response containing the settings list.
	 */
	public static function api_update_settings( $request ) {
		$data          = $request['settings'];
		$client_id     = $data[ self::SALESFORCE_CLIENT_ID ];
		$client_secret = $data[ self::SALESFORCE_CLIENT_SECRET ];

		// If saving with empty values, reset the connection.
		if ( empty( $client_id ) && empty( $client_secret ) ) {
			self::set_salesforce_settings(
				[
					'access_token'  => '',
					'client_id'     => '',
					'client_secret' => '',
					'refresh_token' => '',
				]
			);
			return \rest_ensure_response( self::get_settings_list( true ) );
		}

		// Validate and save client ID and secret.
		$valid_credentials = self::validate_salesforce_creds( $client_id, $client_secret );
		if ( $valid_credentials ) {
			self::set_salesforce_settings(
				[
					'client_id'     => $client_id,
					'client_secret' => $client_secret,
				]
			);
			return \rest_ensure_response( self::get_settings_list( true ) );
		} else {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_invalid_credentials',
					__( 'Could not validate credentials with Salesforce. Please verify your consumer key and secret and try again.', 'newspack' )
				)
			);
		}
	}

	/**
	 * API endpoint for checking validity of a Salesforce refresh token.
	 *
	 * @return WP_REST_Response with the active status.
	 */
	public static function api_check_salesforce_connection_status() {
		$settings = self::get_salesforce_settings();

		// Check if the webhook is configured.
		$webhook_id = \get_option( self::SALESFORCE_WEBHOOK_ID, 0 );
		$webhook    = \wc_get_webhook( $webhook_id );
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
		$salesforce_response = \wp_safe_remote_post(
			'https://login.salesforce.com/services/oauth2/introspect?' . http_build_query(
				[
					'client_id'     => $settings['client_id'],
					'client_secret' => $settings['client_secret'],
					'token'         => $settings['refresh_token'],
				]
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
		$client_id     = $request->get_param( 'client_id' );
		$client_secret = $request->get_param( 'client_secret' );
		$valid         = self::validate_salesforce_creds( $client_id, $client_secret );

		return \rest_ensure_response( $valid );
	}

	/**
	 * Validate consumer key and secret credentials.
	 *
	 * @param string $client_id Consumer Key.
	 * @param string $client_secret Consumer Secret.
	 *
	 * @return boolean True if valid, otherwise false.
	 */
	private static function validate_salesforce_creds( $client_id, $client_secret ) {
		$valid = false;

		// Must have a valid API key and secret.
		if ( ! empty( $client_id ) && ! empty( $client_secret ) ) {
			$url = 'https://login.salesforce.com/services/oauth2/authorize?response_type=code&' . http_build_query(
				[
					'client_id'     => $client_id,
					'client_secret' => $client_secret,
					'redirect_uri'  => self::get_redirect_url(),
				]
			);

			$response = \wp_safe_remote_get( $url );
			$valid    = \wp_remote_retrieve_response_code( $response ) === 200;
		}

		return $valid;
	}

	/**
	 * API endpoint for getting Salesforce API tokens.
	 *
	 * @param WP_REST_Request $request Request containing settings.
	 * @return WP_REST_Response with the latest settings.
	 */
	public static function api_get_salesforce_tokens( $request ) {
		$args     = $request->get_params();
		$settings = self::get_salesforce_settings();

		// Must have a valid API key and secret.
		if ( empty( $settings['client_id'] ) || empty( $settings['client_secret'] ) ) {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_invalid_credentials',
					__( 'Invalid Consumer Key or Secret.', 'newspack' )
				)
			);
		}

		// Hit Salesforce OAuth endpoint to request API tokens.
		$salesforce_response = \wp_safe_remote_post(
			'https://login.salesforce.com/services/oauth2/token?' . http_build_query(
				[
					'client_id'     => $settings['client_id'],
					'client_secret' => $settings['client_secret'],
					'code'          => $args['code'],
					'redirect_uri'  => $args['redirect_uri'],
					'grant_type'    => 'authorization_code',
					'format'        => 'json',
				]
			)
		);

		$response_body = json_decode( $salesforce_response['body'] );

		// If we're not issued an access or refresh token, the connection is broken and the user needs to reconnect.
		if ( empty( $response_body->access_token ) || empty( $response_body->refresh_token ) ) {
			self::set_salesforce_settings( [ 'refresh_token' => '' ] );
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_invalid_connection',
					__( 'Could not verify the Salesforce connected app. Please check your Consumer Key and Secret and try connecting again.', 'newspack' )
				)
			);
		} else {
			$update_args = \wp_parse_args( $response_body, $settings );

			// Save tokens.
			$update_response = self::set_salesforce_settings( $update_args );
			if ( \is_wp_error( $update_response ) ) {
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
		$args     = $request->get_params();
		$response = self::sync_salesforce( $args );
		$order_id = isset( $args['id'] ) ? $args['id'] : 0;
		$order    = \wc_get_order( $order_id );

		if ( \is_wp_error( $response ) ) {
			$order->add_order_note(
				sprintf(
					// Translators: Note added to order when sync is unsuccessful.
					__( 'Error syncing order to Salesforce. %s' ),
					$response->get_error_message()
				)
			);
		} else {
			$order->add_order_note( __( 'Order successfully synced to Salesforce.', 'newspack' ) );
		}

		return \rest_ensure_response( $response );
	}

	/**
	 * API request handler for fetching sync status for a given order.
	 *
	 * @param WP_REST_Request $request Request containing webhook.
	 * @return WP_REST_Response|WP_Error The response from Salesforce, or WP_Error.
	 */
	public static function api_get_order_status( $request ) {
		$order_id       = $request->get_param( 'orderId' );
		$opportunity_id = self::get_opportunity_by_order_id( $order_id );

		if ( \is_wp_error( $opportunity_id ) ) {
			return false;
		}

		return \rest_ensure_response( $opportunity_id );
	}

	/**
	 * Check if the given order should be synced in legacy fashion or not.
	 * Legacy sync means the Opportunity name does not contain the order ID.
	 * All orders synced prior to April 6, 2022 are legacy.
	 *
	 * @param int $order_id ID of the order to check.
	 *
	 * @return boolean True if the order was synced to Salesforce without order ID in the Name field.
	 */
	private static function is_legacy_order_sync( $order_id ) {
		$order = \wc_get_order( $order_id );
		if ( ! $order ) {
			return false;
		}

		$legacy_cutoff_date = strtotime( self::LEGACY_CUTOFF_DATE );
		$order_date         = $order->get_date_created();
		if ( ! $order_date ) {
			return false;
		}

		return $order_date->getTimestamp() > $legacy_cutoff_date;
	}

	/**
	 * Given raw order data or an WC_Order instance, sync the data to Salesforce.
	 *
	 * @param array|WC_Order $order Raw order data or WC_Order instance to sync.
	 *
	 * @return array|WP_Error Array containing synced contact and opportunity data, or WP_Error.
	 */
	private static function sync_salesforce( $order ) {
		$order_id      = is_a( $order, 'WC_Order' ) ? $order->get_id() : $order['id'];
		$order_details = self::parse_wc_order_data( $order );

		if ( empty( $order_details ) ) {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_invalid_order',
					__( 'No valid WooCommerce order data.', 'newspack' )
				)
			);
		}

		$contact       = $order_details['contact'];
		$orders        = $order_details['orders'];
		$opportunities = [];

		if ( empty( $contact ) || empty( $orders ) ) {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_invalid_contact_or_transaction',
					__( 'No valid transaction or contact data.', 'newspack' )
				)
			);
		}

		if ( empty( $contact['Email'] ) ) {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_invalid_contact_email',
					__( 'No valid contact email address.', 'newspack' )
				)
			);
		}

		// Create new contact.
		$contact_response = self::upsert_items( 'Contact', [ $contact ] );
		if ( \is_wp_error( $contact_response ) ) {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_contact_failure',
					$contact_response->get_error_message()
				)
			);
		}

		// We're upserting a single contact, so we only need the first result.
		$contact_response = $contact_response[0];
		$contact_id       = isset( $contact_response->id ) ? $contact_response->id : null;
		$existing_contact = ! boolval( $contact_response->created );

		if ( empty( $contact_id ) ) {
			return \rest_ensure_response(
				new \WP_Error(
					'newspack_salesforce_sync_failure',
					__( 'Could not create or update Salesforce data.', 'newspack' )
				)
			);
		}

		// Sync WooCommerce orders to Salesforce opportunities.
		if ( is_array( $orders ) ) {
			$is_npsp = self::has_field( 'npsp__Primary_Contact__c', 'Opportunity' );

			foreach ( $orders as $order_item ) {
				// Add the NPSP "Primary Contact" field if the Salesforce instance supports it.
				if ( $is_npsp ) {
					$order_item['npsp__Primary_Contact__c'] = $contact_id;
				}

				$existing_opportunity = null;

				// We can use the new Salesforce API's upsert functionality, but only if the item wasn't synced in legacy fashion.
				if ( ! self::is_legacy_order_sync( $order_id ) ) {
					$opportunity_response = self::upsert_items( 'Opportunity', [ $order_item ] );

					// We only upserted a single opportunity, so we only need to get the first item from the response.
					if ( isset( $opportunity_response[0] ) ) {
						$opportunity_response = $opportunity_response[0];
						$existing_opportunity = ! boolval( $opportunity_response->created ); // Response will have 'created' => true if newly created.
					}
				} else {
					// If the order Name field lacks the order ID, it was synced in the legacy way. Look up by Description.
					$existing_opportunity = self::get_opportunity_by_order_id( $order_id, $order_item );
					if ( $existing_opportunity ) {
						$opportunity_response = self::update_opportunity( $existing_opportunity, $order_item );
					} else {
						$opportunity_response = self::create_opportunity( $order_item );
					}
				}

				if ( \is_wp_error( $opportunity_response ) ) {
					return \rest_ensure_response(
						new \WP_Error(
							'newspack_salesforce_opportunity_failure',
							$opportunity_response->get_error_message()
						)
					);
				}

				$opportunity_id = isset( $opportunity_response->id ) ? $opportunity_response->id : null;
				if ( ! empty( $opportunity_id ) ) {
					$opportunities[] = $opportunity_id;

					// We only want to create an Opportunity Contact Role if creating a new Opportunity, or changing the customer's email address.
					if ( ! $existing_opportunity || ! $existing_contact ) {
						self::create_opportunity_contact_role( $opportunity_id, $contact_id );
					}
				}
			}
		}

		// Save synced opportunity IDs to order as post meta.
		self::save_opportunity_ids( $order_id, $opportunities );

		return [
			'contact'       => $contact_id,
			'opportunities' => $opportunities,
		];
	}

	/**
	 * Get the redirect URL for the Salesforce OAuth flow.
	 *
	 * @return string Redirect URL.
	 */
	public static function get_redirect_url() {
		return \get_admin_url( null, 'admin.php?page=newspack-reader-revenue-wizard#/salesforce' );
	}

	/**
	 * Get the Salesforce settings.
	 *
	 * @return Array of Salesforce settings.
	 */
	public static function get_salesforce_settings() {
		$settings = self::DEFAULT_SETTINGS;

		$client_id = \get_option( self::SALESFORCE_CLIENT_ID, 0 );
		if ( ! empty( $client_id ) ) {
			$settings['client_id'] = $client_id;
		}
		$client_secret = \get_option( self::SALESFORCE_CLIENT_SECRET, 0 );
		if ( ! empty( $client_secret ) ) {
			$settings['client_secret'] = $client_secret;
		}
		$access_token = \get_option( self::SALESFORCE_ACCESS_TOKEN, 0 );
		if ( ! empty( $access_token ) ) {
			$settings['access_token'] = $access_token;
		}
		$refresh_token = \get_option( self::SALESFORCE_REFRESH_TOKEN, 0 );
		if ( ! empty( $refresh_token ) ) {
			$settings['refresh_token'] = $refresh_token;
		}
		$instance_url = \get_option( self::SALESFORCE_INSTANCE_URL, 0 );
		if ( ! empty( $instance_url ) ) {
			$settings['instance_url'] = $instance_url;
		}

		return $settings;
	}

	/**
	 * Helper function to determine whether the site has been previously connected to Salesforce via OAuth.
	 * This helper doesn't check whether the connection is still valid, it just checks that we have the necessary credentials for a connection.
	 *
	 * @return boolean True if we have credentials, false otherwise.
	 */
	private static function is_connected() {
		$settings = self::get_salesforce_settings();
		return ! empty( $settings['client_id'] ) && ! empty( $settings['client_secret'] ) && ! empty( $settings['refresh_token'] );
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
		$base_url = '/services/data/v54.0'; // The version number may be updated to target different Salesforce API versions.
		$url      = $settings['instance_url'] . $base_url . $endpoint;
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
		$response = \wp_safe_remote_request( $url, $request );

		// If our access token has expired, let's get a refresh token and retry.
		if ( \wp_remote_retrieve_response_code( $response ) === 401 ) {
			$token = self::refresh_salesforce_token();

			if ( \is_wp_error( $token ) ) {
				return $token;
			}

			$request['headers']['Authorization'] = 'Bearer ' . $token;
			$response                            = \wp_safe_remote_request( $url, $request );
		}

		if (
			! $response ||
			! isset( $response['body'] ) ||
			! isset( $response['response'] ) ||
			200 !== intval( $response['response']['code'] )
		) {
			$message = '';
			if ( isset( $response['response'] ) && isset( $response['response']['message'] ) ) {
				$message = $response['response']['message'];
			}
			if ( isset( $response['body'] ) ) {
				$body    = json_decode( $response['body'] );
				$message = isset( $body[0]->message ) ? $body[0]->message : $message;
			}
			return new \WP_Error(
				'newspack_salesforce_api_error',
				sprintf(
					// Translators: error message from Salesforce API.
					__( 'Error from Salesforce API. %s' ),
					$message
				)
			);
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
		$update   = \wp_parse_args( $args, $defaults );

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
		$webhook_id = \get_option( self::SALESFORCE_WEBHOOK_ID, 0 );

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
		$webhook->set_delivery_url( get_rest_url( null, '/' . self::SALESFORCE_API_NAMESPACE . '/sync' ) );
		$webhook->set_status( 'active' );
		$webhook->set_user_id( get_current_user_id() );
		$webhook->save();
		$webhook_id = $webhook->get_id();

		\update_option( self::SALESFORCE_WEBHOOK_ID, $webhook_id );
	}

	/**
	 * Delete a WooCommerce webhook.
	 *
	 * @param string $webhook_id ID for the webhook to delete.
	 * @return void
	 */
	private static function delete_webhook( $webhook_id ) {
		\update_option( self::SALESFORCE_WEBHOOK_ID, '' );
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
		$contact['Email']         = $order->get_billing_email();
		$contact['FirstName']     = $order->get_billing_first_name();
		$contact['LastName']      = $order->get_billing_last_name();
		$contact['HomePhone']     = $order->get_billing_phone();
		$contact['MailingStreet'] = $order->get_billing_address_1();

		$billing_address_2 = $order->get_billing_address_2();
		if ( ! empty( $billing_address_2 ) ) {
			$contact['MailingStreet'] .= "\n" . $billing_address_2;
		}

		$contact['MailingCity']       = $order->get_billing_city();
		$contact['MailingState']      = $order->get_billing_state();
		$contact['MailingPostalCode'] = $order->get_billing_postcode();
		$contact['MailingCountry']    = $order->get_billing_country();

		/**
		 * Orders should be synced to Salesforce with the order ID in the name, for easy lookup.
		 * However, this wasn't the case in earlier iterations of the sync feature.
		 */
		$order_id    = $order->get_id();
		$name_suffix = self::is_legacy_order_sync( $order_id ) ? ' ' . $order_id : '';

		foreach ( $order->get_items() as $item_id => $item ) {
			$item_data = [
				'Amount'      => $item->get_total(),
				'CloseDate'   => $order->get_date_created()->date( 'Y-m-d' ),
				'Description' => 'WooCommerce Order Number: ' . $order_id,
				'Name'        => $item->get_name() . $name_suffix,
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
	 * Given a parsed order object, look up existing Opportunities in Salesforce with a matching order ID.
	 *
	 * Because we store the order IDs in the Description field, which isn't queryable in SOQL,
	 * we need to get all opportunities that might match and then iterate through the results
	 * to find the one with a matching ID in the Description field, if any.
	 *
	 * @param int        $order_id Order ID to look up.
	 * @param array|null $order_item Order data as parsed by the parse_wc_order_data method.
	 *                               Will use the order's first line item if not passed.
	 *
	 * @return string|boolean Matching opportunity ID, or false if none.
	 */
	private static function get_opportunity_by_order_id( $order_id, $order_item = null ) {
		if ( null === $order_item ) {
			$order_details = self::parse_wc_order_data( \wc_get_order( $order_id ) );
			$order_item    = reset( $order_details['orders'] );
		}

		// If the order has opportunity IDs saved in post meta, query using those IDs.
		// Otherwise, we'll have to query by matching order details.
		$opportunities = \get_post_meta( $order_id, 'newspack_salesforce_opportunities', true );
		if ( is_array( $opportunities ) ) {
			$opportunities = array_map(
				function( $opportunity_id ) {
					return "'$opportunity_id'";
				},
				$opportunities
			);
		}

		$opportunity_ids = is_array( $opportunities ) && ! empty( $opportunities ) ? implode( ',', $opportunities ) : false;

		$name        = $order_item['Name'];
		$amount      = $order_item['Amount'];
		$description = $order_item['Description'];
		$close_date  = $order_item['CloseDate'];
		$query       = $opportunity_ids ?
			[ 'q' => "SELECT Id, Description FROM Opportunity WHERE Id IN ($opportunity_ids)" ] :
			[ 'q' => "SELECT Id, Description FROM Opportunity WHERE Name = '$name' AND Amount = $amount AND CloseDate = $close_date" ];
		$endpoint    = '/query?' . http_build_query( $query );
		$response    = self::build_request( $endpoint );

		if ( \is_wp_error( $response ) ) {
			return $response;
		}

		$results = json_decode( $response['body'] );
		if ( 0 === $results->totalSize ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			return false;
		}

		$matching_id = array_reduce(
			$results->records,
			function( $acc, $result ) use ( $description ) {
				if ( $description === $result->Description ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$acc = $result->Id; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				}
				return $acc;
			},
			false
		);

		return $matching_id;
	}

	/**
	 * Get available fields for sObject type in Salesforce.
	 * This will let us know whether the Salesforce instance has certain fields that can be set.
	 *
	 * @param string $sobject_name Name of the Salesforce sObject type to look up.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function describe_sobject( $sobject_name = null ) {
		$endpoint = '/sobjects/' . $sobject_name . '/describe';
		$response = self::build_request( $endpoint );

		if ( \is_wp_error( $response ) ) {
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

		if ( \is_wp_error( $sobject ) || ! is_array( $sobject->fields ) ) {
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
	 * Upsert (create or update) one or more records in Salesforce.
	 * This function assumes that the orders have been synced to Salesforce
	 * with the WooCommerce order ID in the opportunity record's name.
	 *
	 * Endpoint to upsert (create or update) up to 200 records with lookup by field:
	 * https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobjects_collections_upsert.htm
	 *
	 * @param string $sobject The type of record to upsert: Contact or Opportunity.
	 * @param array  $data Array of opportunities data to use to upsert new opportunities. Keys must be valid Salesforce field names.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function upsert_items( $sobject = null, $data = [] ) {
		$sobjects = [ 'Contact', 'Opportunity' ];
		if ( ! in_array( $sobject, $sobjects, true ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_sobject',
				__( 'sObject type must be one of: Opportunity or Contact.', 'newspack' )
			);
		}

		$upsert_args = [
			'allOrNone' => false,
			'records'   => array_map(
				function ( $item ) use ( $sobject ) {
					$item['attributes'] = [
						'type' => $sobject,
					];
					return $item;
				},
				$data
			),
		];

		$field    = 'Contact' === $sobject ? 'Email' : 'Name'; // Set the field to look up by.
		$endpoint = "/composite/sobjects/$sobject/$field";
		$response = self::build_request( $endpoint, 'PATCH', $upsert_args );

		if ( \is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * LEGACY FUNCTION. For new code, use the upsert_opportunities function instead.
	 * Update an existing Opportunity record by Id with the given data.
	 * Only the CloseDate and primary contact (if email is changed) will be updated.
	 *
	 * @param array $id Unique ID of the record to update in Salesforce.
	 * @param array $data Attributes and values to update in Salesforce.
	 * @return int Response code of the update request.
	 */
	private static function update_opportunity( $id, $data ) {
		$endpoint = '/sobjects/Opportunity/' . $id;
		$response = self::build_request( $endpoint, 'PATCH', $data );

		if ( \is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * LEGACY FUNCTION. For new code, use the upsert_opportunities function instead.
	 * Create a new opportunity record in Salesforce.
	 *
	 * @param array $data Data to use in creating the new opportunity. Keys must be valid Salesforce field names.
	 * @return array|WP_Error Response from Salesforce API.
	 */
	private static function create_opportunity( $data ) {
		$endpoint = '/sobjects/Opportunity/';
		$response = self::build_request( $endpoint, 'POST', $data );

		if ( \is_wp_error( $response ) ) {
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
		$endpoint = '/sobjects/OpportunityContactRole/';
		$data     = [
			'ContactId'     => $contact_id,
			'IsPrimary'     => true,
			'OpportunityId' => $opportunity_id,
			'Role'          => 'Hard Credit',
		];
		$response = self::build_request( $endpoint, 'POST', $data );

		if ( \is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	private static function create_opportunity_contact_roles( $opportunity_contact_roles ) {
		$endpoint = '/composite/tree/OpportunityContactRole/';
		$data     = [ 'records' => $opportunity_contact_roles ];
		$response = self::build_request( $endpoint, 'POST', $data );
		$response = self::build_request( $endpoint, 'POST', $data );
		error_log( $endpoint );
		error_log( print_r( $data, true ) );

		if ( \is_wp_error( $response ) ) {
			return $response;
		}

		return json_decode( $response['body'] );
	}

	/**
	 * Get a new Salesforce token using a valid refresh token.
	 *
	 * @return string The new access token.
	 */
	private static function refresh_salesforce_token() {
		$settings = self::get_salesforce_settings();

		// Must have a valid API key and secret.
		if ( empty( $settings['client_id'] ) || empty( $settings['client_secret'] ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_credentials',
				__( 'Invalid Consumer Key or Secret.', 'newspack' )
			);
		}

		// Must have a valid refresh token.
		if ( empty( $settings['refresh_token'] ) ) {
			return new \WP_Error(
				'newspack_salesforce_invalid_connection',
				__( 'Invalid refresh token.', 'newspack' )
			);
		}

		// Hit Salesforce OAuth endpoint to request API tokens.
		$salesforce_response = \wp_safe_remote_post(
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

	/**
	 * Use WC order actions metabox to display the sync status of this order.
	 *
	 * @param int $order_id ID of the order being edited.
	 */
	public static function wc_order_show_sync_status( $order_id ) {
		if ( ! self::is_connected() ) {
			return;
		}
		?>
		<li class="wide" style="padding-bottom: 1em">
			<h4 style="margin-bottom: 0.5em;margin-top: 0"><?php echo esc_html__( 'Salesforce sync status', 'newspack' ); ?></h4>
			<mark id="newspack-salesforce-sync-status" class="order-status"><span><?php echo esc_html__( 'Fetching…', 'newspack' ); ?></span></mark>
		</li>
		<?php
	}

	/**
	 * Add an action to the WooCommerce order admin page to manually sync orders to Salesforce.
	 *
	 * @param array $actions Associative array of order actions.
	 *
	 * @return array Filtered array of order actions.
	 */
	public static function wc_order_manual_sync( $actions ) {
		if ( self::is_connected() ) {
			$actions['newspack_sync_order_to_salesforce'] = __( 'Sync order to Salesforce', 'newspack' );
		}

		return $actions;
	}

	/**
	 * Handler to manually sync an order from the WC order admin screen.
	 *
	 * @param WC_Order $order Order being edited in the WP dashboard.
	 */
	public static function wc_order_manual_sync_action( $order ) {
		$response = self::sync_salesforce( $order );

		// Add a note on sync failure.
		if ( \is_wp_error( $response ) ) {
			$order->add_order_note(
				sprintf(
					// Translators: Note added to order when sync is unsuccessful.
					__( 'Error syncing order to Salesforce. %s' ),
					$response->get_error_message()
				)
			);
		} else {
			$order->add_order_note( __( 'Order successfully synced to Salesforce.', 'newspack' ) );
		}
	}

	/**
	 * Save the synced opportunity IDs as post meta on the given order.
	 *
	 * @param int   $order_id Order ID.
	 * @param array $opportunities Array of Opportunity IDs from Salesforce.
	 */
	private static function save_opportunity_ids( $order_id, $opportunities ) {
		update_post_meta( $order_id, 'newspack_salesforce_opportunities', $opportunities );
	}

	/**
	 * Get the UNIX timestamp for the next occurrence of midnight in the site's local timezone.
	 */
	private static function get_next_midnight() {
		$timezone = \get_option( 'timezone_string', 'UTC' );

		// Guard against 'Unknown or bad timezone' PHP error.
		if ( empty( trim( $timezone ) ) ) {
			$timezone = 'UTC';
		}

		$next_midnight = new \DateTime( 'tomorrow', new \DateTimeZone( $timezone ) );
		return $next_midnight->getTimestamp();
	}


	/**
	 * Register the WP CLI command.
	 */
	public static function add_cli_command() {
		if ( ! class_exists( 'WP_CLI' ) ) {
			return;
		}

		\WP_CLI::add_command(
			'newspack salesforce sync',
			[ __CLASS__, 'run_cli_command' ],
			[
				'shortdesc' => 'Sync all unsynced WooCommerce orders to Salesforce.',
				'synopsis'  => [
					[
						'type'        => 'flag',
						'name'        => 'dry-run',
						'description' => 'Whether to do a dry run.',
						'optional'    => true,
						'repeating'   => false,
					],
				],
			]
		);
	}

	/**
	 * Run the 'newspack-listings import' WP CLI command.
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Associative args.
	 */
	public static function run_cli_command( $args, $assoc_args ) {
		// If a dry run, we won't persist any data.
		self::$is_dry_run = isset( $assoc_args['dry-run'] ) ? true : false;

		if ( self::$is_dry_run ) {
			\WP_CLI::log( "\n===================\n=     Dry Run     =\n===================\n" );
		}

		if ( ! self::is_connected() ) {
		} else {
			self::check_failed_order_syncs( true );
		}
	}

	/**
	 * Set up the cron job. Will run once daily and check for failed order syncs, and attempt to resync them.
	 */
	public static function cron_init() {
		\register_deactivation_hook( NEWSPACK_PLUGIN_FILE, [ __CLASS__, 'cron_deactivate' ] );

		if ( ! wp_next_scheduled( self::SALESFORCE_CRON_HOOK ) ) {
			\wp_schedule_event( self::get_next_midnight(), 'daily', self::SALESFORCE_CRON_HOOK );
		}
	}

	/**
	 * Clear the cron job when this plugin is deactivated.
	 */
	public static function cron_deactivate() {
		\wp_clear_scheduled_hook( self::SALESFORCE_CRON_HOOK );
	}

	/**
	 * Check for failed or unsynced orders and attempt to resync.
	 * In order to limit the number of requests, we'll try to create Contact and Opportunity
	 * records in batches of 200, then create batches of OpportunityContactRoles to tie them
	 * together after they're created. Otherwise, the Salesforce API has a limit of 1000
	 * requests per 24-hour period.
	 * https://developer.salesforce.com/docs/atlas.en-us.salesforce_app_limits_cheatsheet.meta/salesforce_app_limits_cheatsheet/salesforce_app_limits_platform_api.htm
	 *
	 * @param boolean $is_cli True if the command is being executed via WP CLI.
	 *                        Otherwise, it's probably being run by cron job.
	 */
	public static function check_failed_order_syncs( $is_cli = false ) {
		// Start with first page of 100 results, then we'll see if there are more pages to iterate through.
		$current_page = 1;
		$query_args   = [
			'fields'         => 'ids',
			'post_type'      => 'shop_order',
			'post_status'    => 'wc-completed',
			'posts_per_page' => 100,
			'meta_query'     => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'key'     => 'newspack_salesforce_opportunities',
				'compare' => 'NOT EXISTS',
				'value'   => 'WP bug #23268', // See https://core.trac.wordpress.org/ticket/23268 for details on the fake value string required when using 'NOT EXISTS'.
			],
		];

		// Get query results.
		$results         = new \WP_Query( $query_args );
		$number_of_pages = $results->max_num_pages;
		$total_count     = $results->found_posts;
		$total_results   = [];

		if ( 0 === $total_count ) {
			if ( $is_cli ) {
				\WP_CLI::log(
					__( 'No unsynced orders found.', 'newspack' )
				);
			}
			return;
		}

		if ( $is_cli ) {
			\WP_CLI::log(
				sprintf(
					// Translators: help message for WP CLI showing number of total orders to be synced.
					_n( 'Processing %d unsynced order...', 'Processing %d unsynced orders...', $total_count, 'newspack' ),
					$total_count
				)
			);
		}

		$total_results = array_merge( $total_results, $results->posts );

		// If there were more than 1 page of results, repeat with subsequent pages until all posts are processed.
		if ( $current_page < $number_of_pages ) {
			while ( $current_page < $number_of_pages ) {
				$current_page        ++;
				$query_args['paged'] = $current_page;
				$results             = new \WP_Query( $query_args );
				$total_results       = array_merge( $total_results, $results->posts );
			}
		}

		$contacts_data = [];
		$orders_data   = [];

		// Keep count of the number of items updated.
		$contacts_count = 0;
		$orders_count   = 0;

		foreach ( $total_results as $order_id ) {
			$order = \wc_get_order( $order_id );
			$order = $order ? self::parse_wc_order_data( $order ) : null;
			if ( $order && isset( $order['contact'] ) ) {
				$contact_data             = $order['contact'];
				$contact_data['order_id'] = $order_id; // So we can later link up to the Opportunity via an OpportunityContactRole.
				$contacts_data[]          = $contact_data;
			}
			if ( $order && isset( $order['orders'] ) ) {
				$order_data  = array_map(
					function( $o ) use ( $order_id ) {
						$o['order_id'] = $order_id;
						return $o;
					},
					$order['orders']
				);
				$orders_data = array_values(
					array_merge( $orders_data, $order_data )
				);
			}
		}

		/**
		 * Salesforce API has a limit of creating 200 items per request.
		 * Successfully created records are returned with their IDs in the order
		 * in which they were received, so we can assume that the numeric index
		 * of each record ID in the response matches that of the request body.
		 * This is how we'll associate Contacts with Opportunities.
		 *
		 * See: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_composite_sobject_tree_flat.htm.
		 */
		$batched_contacts = array_chunk( $contacts_data, 200 );
		$batched_orders   = array_chunk( $orders_data, 200 );

		/**
		 * Sync customers to Contact records.
		 */
		$contact_index = 0;
		foreach ( $batched_contacts as $batch ) {
			$contacts_to_sync = [];
			foreach ( $batch as $contact_to_sync ) {
				// Remove temporary order ID reference.
				unset( $contact_to_sync['order_id'] );
				$contacts_to_sync[] = $contact_to_sync;
			}

			/**
			 * Endpoint to upsert (create or update) up to 200 Contacts with lookup by Email field:
			 * https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/resources_composite_sobjects_collections_upsert.htm
			 */
			$response = self::upsert_items( 'Contact', $contacts_to_sync );
			if ( \is_wp_error( $response ) ) {
				error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					sprintf(
						// Translators: error message logged to debug.log if running via cron or command line if running via CLI.
						__( 'Error syncing contacts. %s' ),
						$response->get_error_message()
					)
				);
			} else {
				foreach ( $response as $synced_contact ) {
					if ( ! empty( $synced_contact->id ) && ! empty( $synced_contact->success ) ) {
						$contacts_count ++;
						$contacts_data[ $contact_index ]['ContactId'] = $synced_contact->id;
					} else {
						error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
							sprintf(
								// Translators: error message logged to debug.log if running via cron or command line if running via CLI.
								__( 'Error syncing contact %1$s. %2$s' ),
								$contacts_data[ $contact_index ]['Email'],
								isset( $synced_contact->errors ) ? \wp_json_encode( $synced_contact->errors ) : ''
							)
						);
					}
					$contact_index ++;
				}
			}
		}

		/**
		 * Sync orders to Opportunity records.
		 */
		$order_index = 0;
		foreach ( $batched_orders as $batch ) {
			$orders_to_sync = [];
			foreach ( $batch as $order_to_sync ) {
				// Remove temporary order ID reference.
				unset( $order_to_sync['order_id'] );
				$orders_to_sync[] = $order_to_sync;
			}

			$response = self::upsert_items( 'Opportunity', $orders_to_sync );
			if ( \is_wp_error( $response ) ) {
				error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					sprintf(
						// Translators: error message logged to debug.log if running via cron or command line if running via CLI.
						__( 'Error syncing orders. %s' ),
						$response->get_error_message()
					)
				);
			} else {
				foreach ( $response as $synced_order ) {
					if ( ! empty( $synced_order->id ) && ! empty( $synced_order->success ) ) {
						$orders_count ++;
						$orders_data[ $order_index ]['OpportunityId'] = $synced_order->id;
						if ( ! boolval( $synced_order->created ) ) {
							$orders_data[ $order_index ]['updated'] = true;
						}
					} else {
						error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
							sprintf(
								// Translators: error message logged to debug.log if running via cron or command line if running via CLI.
								__( 'Error syncing order %1$s. %2$s' ),
								$orders_data[ $order_index ]['order_id'],
								isset( $synced_order->errors ) ? \wp_json_encode( $synced_order->errors ) : ''
							)
						);
					}
					$order_index ++;
				}
			}
		}

		/**
		 * Create OpportunityContactRoles to link upserted Contacts and Opportunities.
		 */
		$opportunity_contact_roles = [];
		$contact_role_index        = 0;
		foreach ( $orders_data as $order ) {
			if ( isset( $order['OpportunityId'] ) ) {
				$contact_index = array_search( $order['order_id'], array_column( $contacts_data, 'order_id' ) );
				if ( ! empty( $contacts_data[ $contact_index ] ) && isset( $contacts_data[ $contact_index ]['ContactId'] ) ) {
					$opportunity_contact_roles[] = [
						'attributes'    => [
							'referenceId' => $order['order_id'],
							'type'        => 'OpportunityContactRole',
						],
						'ContactId'     => $contacts_data[ $contact_index ]['ContactId'],
						'IsPrimary'     => true,
						'OpportunityId' => $order['OpportunityId'],
						'Role'          => 'Hard Credit',
					];
				}
			}

			$contact_role_index ++;
		}
		$batched_opportunity_contact_roles = array_chunk( $opportunity_contact_roles, 200 );
		foreach ( $batched_opportunity_contact_roles as $opportunity_contact_roles_to_sync ) {
			$response = self::create_opportunity_contact_roles( $opportunity_contact_roles );
			if ( \is_wp_error( $response ) ) {
				error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					sprintf(
						// Translators: error message logged to debug.log if running via cron or command line if running via CLI.
						__( 'Error syncing contact roles. %s' ),
						$response->get_error_message()
					)
				);
			}
			error_log( print_r( $response, true ) );
		}

		if ( $is_cli ) {
			\WP_CLI::success(
				sprintf(
					// Translators: WP CLI success message.
					__( 'Synced %1$d contact(s) and %2$d order(s).', 'newspack' ),
					$contacts_count,
					$orders_count
				)
			);
		}
	}
}

Salesforce::init();

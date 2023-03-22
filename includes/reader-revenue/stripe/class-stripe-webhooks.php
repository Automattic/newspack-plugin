<?php
/**
 * Stripe Webhooks.
 *
 * @package Newspack
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Stripe Webhooks.
 */
class Stripe_Webhooks {
	/**
	 * Cache.
	 *
	 * @var array
	 */
	private static $cache = [
		'webhooks' => false,
	];

	const STRIPE_WEBHOOK_OPTION_NAME = 'newspack_stripe_webhook';

	const WEBHOOK_EVENTS = [
		'charge.failed',
		'charge.succeeded',
		'customer.subscription.deleted',
		'customer.subscription.updated',
	];

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
	}

	/**
	 * Serialize a webhook for the API.
	 *
	 * @param array $webhook Webhook.
	 */
	private static function serialize_webhook( $webhook ) {
		return [
			'id'          => $webhook->id,
			'url'         => $webhook->url,
			'status'      => $webhook->status,
			'livemode'    => $webhook->livemode,
			'matches_url' => str_replace( [ 'http://', 'https://' ], '', self::get_webhook_url() ) === str_replace( [ 'http://', 'https://' ], '', $webhook->url ),
		];
	}

	/**
	 * Get all (first 100) Stripe webhooks.
	 */
	public static function get_all_webhooks() {
		if ( false !== self::$cache['webhooks'] ) {
			return self::$cache['webhooks'];
		}
		$response    = [];
		$stripe_data = Stripe_Connection::get_stripe_data();

		try {
			$stripe = Stripe_Connection::get_stripe_client();
			if ( ! $stripe ) {
				return $response;
			}
			$webhooks = $stripe->webhookEndpoints->all( [ 'limit' => 100 ] );
			foreach ( $webhooks as $webhook ) {
				$response[] = self::serialize_webhook( $webhook );
			}
			return $response;
		} catch ( \Throwable $th ) {
			Logger::log( 'Could not reset Stripe webhooks: ' . $th->getMessage() );
			return self::get_error( __( 'Could not fetch webhooks:', 'newspack' ) . ' ' . $th->getMessage(), 'newspack_stripe_webhook_list_error' );
		}
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 *
	 * @codeCoverageIgnore
	 */
	public static function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/webhook',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'receive_webhook' ],
				'permission_callback' => '__return_true',
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/webhooks',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'api_get_all_webhooks' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/webhook/(?P<id>[\w_]+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'update_webhook' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'id'     => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'status' => [
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/webhook/(?P<id>[\w_]+)',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ __CLASS__, 'delete_webhook' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/reset-webhook',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ __CLASS__, 'api_reset_webhoooks' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @codeCoverageIgnore
	 * @param WP_REST_Request $request API request object.
	 * @return bool|WP_Error
	 */
	public static function api_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) || ! Donations::is_using_streamlined_donate_block() ) {
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
	 * Update Stripe webhook.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public static function update_webhook( $request ) {
		$id = $request->get_param( 'id' );
		try {
			$stripe   = Stripe_Connection::get_stripe_client();
			$response = $stripe->webhookEndpoints->update( $id, [ 'disabled' => 'disabled' === $request->get_param( 'status' ) ] );
			return rest_ensure_response( self::serialize_webhook( $response ) );
		} catch ( \Throwable $th ) {
			Logger::log( 'Could not update Stripe webhook: ' . $th->getMessage() );
			return self::get_error( __( 'Could not update Stripe webhook:', 'newspack' ) . ' ' . $th->getMessage() );
		}
	}

	/**
	 * Delete Stripe webhook.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public static function delete_webhook( $request ) {
		$id = $request->get_param( 'id' );
		try {
			$stripe   = Stripe_Connection::get_stripe_client();
			$response = $stripe->webhookEndpoints->delete( $id );
			if ( $response->deleted ) {
				return rest_ensure_response( [ 'id' => $id ] );
			} else {
				return self::get_error( __( 'Could not delete Stripe webhook.', 'newspack' ) );
			}
		} catch ( \Throwable $th ) {
			Logger::log( 'Could not delete Stripe webhook: ' . $th->getMessage() );
			return self::get_error( __( 'Could not delete Stripe webhook:', 'newspack' ) . ' ' . $th->getMessage() );
		}
	}

	/**
	 * Receive Stripe webhook.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public static function receive_webhook( $request ) {
		if ( ! Donations::is_using_streamlined_donate_block() ) {
			return;
		}
		// Verify the webhook signature (https://stripe.com/docs/webhooks/signatures).
		$webhook = get_option( self::STRIPE_WEBHOOK_OPTION_NAME, false );
		if ( false === $webhook || ! isset( $webhook['secret'], $_SERVER['HTTP_STRIPE_SIGNATURE'] ) ) {
			return new \WP_Error( 'newspack_webhook_missing_verification_data' );
		}
		try {
			$sig_header = sanitize_text_field( $_SERVER['HTTP_STRIPE_SIGNATURE'] );
			$payload    = @file_get_contents( 'php://input' ); // phpcs:ignore WordPressVIPMinimum.Performance.FetchingRemoteData.FileGetContentsRemoteFile, WordPress.PHP.NoSilencedErrors.Discouraged
			$event      = \Stripe\Webhook::constructEvent(
				$payload,
				$sig_header,
				$webhook['secret']
			);
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'newspack_webhook_verification_error' );
		}

		$payload = $request['data']['object'];

		// If order_id is set in the metadata, this is a charge created by WC.
		if ( isset( $payload['metadata']['order_id'] ) ) {
			// Update the associated order and subscription.
			if ( isset( $payload['metadata']['origin'] ) && 'newspack' === $payload['metadata']['origin'] && Donations::is_woocommerce_suite_active() ) {
				$balance_transaction = Stripe_Connection::get_balance_transaction( $payload['balance_transaction'] );
				WooCommerce_Connection::update_order(
					$payload['metadata']['order_id'],
					[
						// On order completed, the connected subscription will be activated if it exists.
						'status'     => 'completed',
						'stripe_id'  => $payload['id'],
						'stripe_fee' => Stripe_Connection::normalise_amount( $balance_transaction['fee'], $payload['currency'] ),
						'stripe_net' => Stripe_Connection::normalise_amount( $balance_transaction['net'], $payload['currency'] ),
					]
				);
			}
			return;
		}

		switch ( $request['type'] ) {
			case 'charge.succeeded':
				$payment  = $payload;
				$metadata = $payment['metadata'];
				$customer = Stripe_Connection::get_customer_by_id( $payment['customer'] );
				if ( \is_wp_error( $customer ) ) {
					return $customer;
				}
				$amount_normalised = Stripe_Connection::normalise_amount( $payment['amount'], $payment['currency'] );
				$client_id         = isset( $customer['metadata']['clientId'] ) ? $customer['metadata']['clientId'] : null;
				$origin            = isset( $customer['metadata']['origin'] ) ? $customer['metadata']['origin'] : null;

				$referer                   = $metadata['referer'] ?? '';
				$newspack_popup_id         = $metadata['newspack_popup_id'] ?? '';
				$invoice_newspack_metadata = [];
				$payment_newspack_metadata = array_filter(
					$metadata,
					function( $key ) {
						return 0 === strpos( $key, 'newspack_' );
					},
					ARRAY_FILTER_USE_KEY
				);

				if ( $payment['invoice'] ) {
					$invoice = Stripe_Connection::get_invoice( $payment['invoice'] );
					if ( ! \is_wp_error( $invoice ) ) {
						$referer = $invoice['metadata']['referer'] ?? $referer;
						foreach ( $invoice['metadata']->keys() as $meta_key ) {
							if ( 0 === strpos( $meta_key, 'newspack_' ) ) {
								$invoice_newspack_metadata[ $meta_key ] = $invoice['metadata'][ $meta_key ];
							}
						}
					}
				}
				$payment['referer'] = $referer;

				$newspack_metadata = array_merge( $payment_newspack_metadata, $invoice_newspack_metadata );

				$payment = array_merge( $payment, $newspack_metadata );

				$frequency = Stripe_Connection::get_frequency_of_payment( $payment );

				// Update data in Campaigns plugin.
				if ( ! empty( $client_id ) ) {
					/**
					 * When a new Stripe transaction occurs that can be associated with a client ID,
					 * fire an action with the client ID and the relevant donation info.
					 *
					 * @param string      $client_id Client ID.
					 * @param array       $donation_data Info about the transaction.
					 * @param string|null $newsletter_email If the user signed up for a newsletter as part of the transaction, the subscribed email address. Otherwise, null.
					 */
					do_action(
						'newspack_stripe_new_donation',
						$client_id,
						[
							'stripe_id'          => $payment['id'],
							'stripe_customer_id' => $customer['id'],
							'amount'             => $amount_normalised,
							'frequency'          => $frequency,
						],
						$was_customer_added_to_mailing_list ? $customer['email'] : null
					);
				}

				$label = $frequency;
				if ( ! empty( $origin ) ) {
					$label .= ' - ' . $origin;
				}

				// Send custom event to GA.
				\Newspack\Google_Services_Connection::send_custom_event(
					[
						'category' => __( 'Newspack Donation', 'newspack' ),
						'action'   => __( 'Stripe', 'newspack' ),
						'label'    => $label,
						'value'    => $amount_normalised,
						'referer'  => $referer,
					]
				);

				// Add a transaction to WooCommerce.
				if ( Donations::is_woocommerce_suite_active() ) {
					WooCommerce_Connection::create_transaction( Stripe_Connection::create_wc_transaction_payload( $customer, $payment ) );
				}

				// Send email to the donor.
				Stripe_Connection::send_email_to_customer( $customer, $payment );

				break;
			case 'charge.failed':
				break;
			default:
				return new \WP_Error( 'newspack_unsupported_webhook' );
		}
	}

	/**
	 * Get URL of the webhook for this site.
	 */
	public static function get_webhook_url() {
		return get_rest_url( null, NEWSPACK_API_NAMESPACE . '/stripe/webhook' );
	}

	/**
	 * Reset Stripe webhooks.
	 */
	private static function reset_webhooks() {
		Logger::log( 'Resetting Stripe webhooks…' );
		delete_option( self::STRIPE_WEBHOOK_OPTION_NAME );
		try {
			$stripe = Stripe_Connection::get_stripe_client();
			if ( ! $stripe ) {
				return false;
			}
			$webhooks = $stripe->webhookEndpoints->all( [ 'limit' => 100 ] );
			foreach ( $webhooks as $webhook ) {
				if ( self::get_webhook_url() === $webhook->url ) {
					$stripe->webhookEndpoints->delete( $webhook->id );
				}
			}
			return self::create_webhooks();
		} catch ( \Throwable $th ) {
			Logger::log( 'Could not reset Stripe webhooks: ' . $th->getMessage() );
			return false;
		}
	}

	/**
	 * Get all webhooks.
	 */
	public static function api_get_all_webhooks() {
		return rest_ensure_response( self::get_all_webhooks() );
	}

	/**
	 * Handle webhook reset API request.
	 */
	public static function api_reset_webhoooks() {
		$result = self::reset_webhooks();
		if ( true === $result ) {
			return self::api_get_all_webhooks();
		} else {
			return self::get_error( __( 'Webhook reset failed ', 'newspack' ) );
		}
	}

	/**
	 * Create the necessary webhooks.
	 */
	private static function create_webhooks() {
		$stripe = Stripe_Connection::get_stripe_client();
		if ( ! $stripe ) {
			return;
		}
		Logger::log( 'Creating Stripe webhooks…' );
		try {
			$webhook = $stripe->webhookEndpoints->create(
				[
					'url'            => self::get_webhook_url(),
					'enabled_events' => self::WEBHOOK_EVENTS,
				]
			);
			update_option(
				self::STRIPE_WEBHOOK_OPTION_NAME,
				[
					'id'     => $webhook->id,
					'secret' => $webhook->secret,
				]
			);
			return true;
		} catch ( \Throwable $e ) {
			return self::get_error( __( 'Webhook creation failed: ', 'newspack' ) . $e->getMessage(), 'newspack_plugin_stripe_webhooks' );
		}
	}

	/**
	 * Create Stripe webhooks if they are missing. Otherwise, validate the webhhooks.
	 *
	 * @param bool $validate_existence_only If true, only validate the existence of the webhooks.
	 */
	public static function validate_or_create_webhooks( $validate_existence_only = false ) {
		$is_valid        = true;
		$created_webhook = get_option( self::STRIPE_WEBHOOK_OPTION_NAME );

		if ( true === $validate_existence_only ) {
			if ( false === $created_webhook ) {
				// If the webhook does not exist, do the full validation & creation.
				self::validate_or_create_webhooks( false );
			}
			return;
		}

		$stripe = Stripe_Connection::get_stripe_client();
		if ( ! $stripe ) {
			return;
		}
		if ( ! $created_webhook ) {
			return self::create_webhooks();
		} elseif ( isset( $created_webhook['id'] ) ) {
			try {
				$webhook = $stripe->webhookEndpoints->retrieve( $created_webhook['id'] );
				if ( self::WEBHOOK_EVENTS !== $webhook->enabled_events ) {
					$is_valid = false;
				}
				if ( 'enabled' !== $webhook['status'] ) {
					$is_valid = false;
				}
				if ( self::get_webhook_url() !== $webhook['url'] ) {
					$is_valid = false;
				}
			} catch ( \Throwable $e ) {
				$message = $e->getMessage();
				if ( strpos( $message, 'No such webhook endpoint' ) !== false ) {
					$is_valid = false;
				} else {
					return self::get_error( __( 'Webhook validation failed: ', 'newspack' ) . $message, 'newspack_plugin_stripe_webhooks' );
				}
			}
		} else {
			$is_valid = false;
		}
		if ( ! $is_valid ) {
			self::reset_webhooks();
		}
	}

	/**
	 * Get error response.
	 *
	 * @param string $message Error message.
	 * @param string $code Error code.
	 */
	private static function get_error( $message, $code = 'newspack_stripe_webhooks' ) {
		return new \WP_Error(
			$code,
			$message,
			[
				'level' => 'notice',
			]
		);
	}
}

Stripe_Webhooks::init();

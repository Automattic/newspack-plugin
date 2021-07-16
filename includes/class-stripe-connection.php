<?php
/**
 * All things Stripe.
 *
 * @package Newspack
 */

namespace Newspack;

use Stripe\Stripe;

defined( 'ABSPATH' ) || exit;

/**
 * All things Stripe.
 */
class Stripe_Connection {
	const STRIPE_DATA_OPTION_NAME = 'newspack_stripe_data';

	/**
	 * Initialize.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public static function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/create-webhooks/',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'create_webhooks' ],
				'permission_callback' => [ __CLASS__, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/stripe/webhook',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'receive_webhook' ],
				'permission_callback' => '__return_true',
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
	 * Get Stripe data blueprint.
	 */
	public static function get_default_stripe_data() {
		return [
			'enabled'            => false,
			'testMode'           => false,
			'publishableKey'     => '',
			'secretKey'          => '',
			'testPublishableKey' => '',
			'testSecretKey'      => '',
			'currency'           => 'USD',
		];
	}

	/**
	 * Get Stripe data, either from WC, or saved in options table.
	 */
	public static function get_stripe_data() {
		$stripe_data             = self::get_saved_stripe_data();
		$stripe_data['webhooks'] = [];
		if ( self::get_stripe_secret_key() ) {
			$stripe_data['webhooks'] = self::list_webhooks();
		}
		return $stripe_data;
	}

	/**
	 * Update Stripe data. Either in WC, or in options table.
	 *
	 * @param object $updated_stripe_data Updated Stripe data to be saved.
	 */
	public static function update_stripe_data( $updated_stripe_data ) {
		if ( Donations::is_platform_wc() ) {
			// If WC is configured, set Stripe data in WC.
			$wc_configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'woocommerce' );
			$wc_configuration_manager->update_stripe_settings( $updated_stripe_data );
		}
		// Otherwise, save it in options table.
		return update_option( self::STRIPE_DATA_OPTION_NAME, $updated_stripe_data );
	}

	/**
	 * List Stripe webhooks.
	 */
	private static function list_webhooks() {
		$stripe = self::get_stripe_client();
		try {
			return $stripe->webhookEndpoints->all()['data']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		} catch ( \Exception $e ) {
			return new WP_Error( 'stripe_webhooks', __( 'Could not fetch webhooks.', 'newspack' ), $e->getMessage() );
		}
	}

	/**
	 * Receive Stripe webhook.
	 */
	public static function receive_webhook( $request ) {
		switch ( $request['type'] ) {
			case 'charge.succeeded':
				$payment  = $request['data']['object'];
				$metadata = $payment['metadata'];

				// Update data in Campaigns plugin.
				if ( isset( $metadata['clientId'] ) && ! empty( $metadata['clientId'] ) && class_exists( 'Newspack_Popups_Segmentation' ) ) {
					$donation_data = [
						'stripe_id'     => $payment['id'],
						'date'          => date( 'Y-m-d H:i:s', $payment['created'] ),
						'amount'        => $payment['amount'],
						'receipt_email' => $payment['receipt_email'],
					];
					if ( isset( $payment['metadata']['Frequency'] ) ) {
						$donation_data['frequency'] = $payment['metadata']['Frequency'];
					}
					\Newspack_Popups_Segmentation::update_client_data(
						$metadata['clientId'],
						[
							'donation' => $donation_data,
						]
					);
				}
			case 'charge.failed':
				break;
			default:
				return new WP_Error( 'newspack_unsupported_webhook' );
		}
	}

	/**
	 * Create Stripe webhooks.
	 */
	public static function create_webhooks() {
		$stripe = self::get_stripe_client();
		try {
			$stripe->webhookEndpoints->create( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				[
					'url'            => get_rest_url( null, NEWSPACK_API_NAMESPACE . '/stripe/webhook' ),
					'enabled_events' => [
						'charge.failed',
						'charge.succeeded',
					],
				]
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'newspack_plugin_webhooks', __( 'Problem creating webhooks.', 'newspack' ), $e->getMessage() );
		}
		return self::list_webhooks();
	}

	/**
	 * Get saved Stripe data.
	 */
	private static function get_saved_stripe_data() {
		$stripe_data = self::get_default_stripe_data();
		if ( Donations::is_platform_wc() ) {
			// If WC is configured, get Stripe data from WC.
			$wc_configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'woocommerce' );
			$stripe_data              = $wc_configuration_manager->stripe_data();
		} else {
			$stripe_data = get_option( self::STRIPE_DATA_OPTION_NAME, self::get_default_stripe_data() );
		}
		$stripe_data['usedPublishableKey'] = $stripe_data['testMode'] ? $stripe_data['testPublishableKey'] : $stripe_data['publishableKey'];
		$stripe_data['usedSecretKey']      = $stripe_data['testMode'] ? $stripe_data['testSecretKey'] : $stripe_data['secretKey'];
		return $stripe_data;
	}

	/**
	 * Get Stripe secret key.
	 */
	private static function get_stripe_secret_key() {
		$stripe_data = self::get_saved_stripe_data();
		return $stripe_data['usedSecretKey'];
	}

	/**
	 * Get Stripe client.
	 */
	public static function get_stripe_client() {
		$secret_key = self::get_stripe_secret_key();
		if ( $secret_key ) {
			return new \Stripe\StripeClient( $secret_key );
		}
	}
}

Stripe_Connection::init();

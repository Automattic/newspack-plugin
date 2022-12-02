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
	const STRIPE_WEBHOOK_OPTION_NAME = 'newspack_stripe_webhook';

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_api_endpoints' ] );
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
	}

	/**
	 * Receive Stripe webhook.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public static function receive_webhook( $request ) {
		if ( ! Donations::is_platform_stripe() ) {
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

		// If order_id is set in the metadata, this was not created by this integration.
		// This can happen when WC Subscriptions w/ Stripe Gateway was active before using this integration.
		// In such a situation, WCS continues to charge subscribers, but since the platform is set to this integration,
		// the webhook will still be exectuted for these payments, resulting in duplicate WC orders.
		if ( isset( $payload['metadata']['order_id'] ) ) {
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

				$referer = '';
				if ( isset( $metadata['referer'] ) ) {
					$referer = $metadata['referer'];
				}

				$frequency = Stripe_Connection::get_frequency_of_payment( $payment );

				if ( $payment['invoice'] ) {
					$invoice = Stripe_Connection::get_invoice( $payment['invoice'] );
					if ( ! \is_wp_error( $invoice ) && isset( $invoice['metadata']['referer'] ) ) {
						$referer = $invoice['metadata']['referer'];
					}
				}

				// Update data in Newsletters provider.
				$was_customer_added_to_mailing_list = false;
				$stripe_data                        = Stripe_Connection::get_stripe_data();
				$has_opted_in_to_newsletters        = Stripe_Connection::has_customer_opted_in_to_newsletters( $customer );
				if (
					method_exists( '\Newspack_Newsletters_Subscription', 'add_contact' )
					&& (
						$has_opted_in_to_newsletters
						|| Reader_Activation::is_enabled()
					)
				) {
					$contact = [
						'email'    => $customer['email'],
						'name'     => $customer['name'],
						'metadata' => [],
					];

					if ( Reader_Activation::is_enabled() ) {
						$payment_date = gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT, $payment['created'] );
						$customer_ltv = Stripe_Connection::get_customer_ltv( $customer['id'] );
						if ( ! \is_wp_error( $customer_ltv ) ) {
							$total_paid = $customer_ltv + $amount_normalised;
							$contact['metadata'][ Newspack_Newsletters::$metadata_keys['total_paid'] ] = $total_paid;
						}

						$contact['metadata'] = array_merge(
							$contact['metadata'],
							[
								Newspack_Newsletters::$metadata_keys['last_payment_date']   => $payment_date,
								Newspack_Newsletters::$metadata_keys['last_payment_amount'] => $amount_normalised,
							]
						);

						$metadata[ Newspack_Newsletters::$metadata_keys['membership_status'] ] = Stripe_Connection::get_membership_status_field_value( $frequency );
						if ( 'once' !== $frequency ) {
							$contact['metadata'] = array_merge(
								Stripe_Connection::create_recurring_payment_metadata( $frequency, $payment['amount'], $payment['currency'], $payment['created'] ),
								$contact['metadata']
							);
						}
						if ( isset( $customer['metadata']['userId'] ) ) {
							$contact['metadata'][ Newspack_Newsletters::$metadata_keys['account'] ] = $customer['metadata']['userId'];
						}
						if ( isset( $customer['metadata']['current_page_url'] ) ) {
							$contact['metadata']['current_page_url'] = $customer['metadata']['current_page_url'];
						}

						if ( Donations::is_woocommerce_suite_active() ) {
							$wc_product_id = Donations::get_donation_product( $frequency );
							try {
								$wc_product = \wc_get_product( $wc_product_id );
								$contact['metadata'][ Newspack_Newsletters::$metadata_keys['product_name'] ] = $wc_product->get_name();
							} catch ( \Throwable $th ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
								// Fail silently.
							}
						}
					}

					if ( ! empty( $client_id ) ) {
						$contact['client_id'] = $client_id;
					}

					// Note: With Mailchimp, this is adding the contact as 'pending' - the subscriber has to confirm.
					if ( ! empty( $stripe_data['newsletter_list_id'] ) && $has_opted_in_to_newsletters ) {
						\Newspack_Newsletters_Subscription::add_contact( $contact, $stripe_data['newsletter_list_id'] );
					} else {
						\Newspack_Newsletters_Subscription::add_contact( $contact );
					}
					$was_customer_added_to_mailing_list = true;
				}

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
			case 'customer.subscription.deleted':
				$customer = Stripe_Connection::get_customer_by_id( $payload['customer'] );
				if ( \is_wp_error( $customer ) ) {
					return $customer;
				}

				$active_subs = 0;
				if ( Donations::is_woocommerce_suite_active() ) {
					if ( $payload['ended_at'] ) {
						$active_subs = WooCommerce_Connection::end_subscription(
							$payload['id'],
							$payload['ended_at']
						);
					}
				}

				if ( Reader_Activation::is_enabled() && method_exists( '\Newspack_Newsletters_Subscription', 'add_contact' ) ) {
					$contact_exists = ! \is_wp_error( \Newspack_Newsletters_Subscription::get_contact_data( $customer['email'] ) );
					// Only handle subscription deletion of an existing contact.
					if ( $contact_exists ) {
						$sub_end_date = gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT, $payload['ended_at'] );
						$contact      = [
							'email'    => $customer['email'],
							'metadata' => [
								Newspack_Newsletters::$metadata_keys['sub_end_date']   => $sub_end_date,
							],
						];
						if ( 0 === $active_subs && in_array( $payload['plan']['interval'], [ 'month', 'year' ] ) ) {
							$membership_status = 'Ex-' . Stripe_Connection::get_membership_status_field_value( $payload['plan']['interval'] );
							$contact['metadata'][ Newspack_Newsletters::$metadata_keys['membership_status'] ] = $membership_status;
						}
						\Newspack_Newsletters_Subscription::add_contact( $contact );
					}
				}

				// Update data in Campaigns plugin.
				$client_id = isset( $customer['metadata']['clientId'] ) ? $customer['metadata']['clientId'] : null;
				if ( ! empty( $client_id ) ) {
					/**
					 * When a Stripe subscription is cancelled that can be associated with a client ID,
					 * fire an action with the client ID and the relevant info.
					 *
					 * @param string      $client_id Client ID.
					 * @param array       $cancellation_data Info about the event.
					 */
					do_action(
						'newspack_stripe_donation_cancellation',
						$client_id,
						[
							'stripe_id'          => $payload['id'],
							'stripe_customer_id' => $customer['id'],
							'frequency'          => $payload['plan']['interval'],
						]
					);
				}

				break;
			case 'customer.subscription.updated':
				if ( Donations::is_woocommerce_suite_active() ) {
					if ( $payload['cancel_at'] ) {
						WooCommerce_Connection::set_pending_cancellation_subscription( $payload['id'], $payload['canceled_at'], $payload['cancel_at'] );
					} elseif ( ! empty( $payload['pause_collection'] ) ) {
						$reactivation_date = $payload['pause_collection']['resumes_at'];
						WooCommerce_Connection::put_subscription_on_hold(
							$payload['id'],
							$payload['pause_collection']['resumes_at']
						);
					} elseif ( 'active' === $payload['status'] ) {
						// An un-canceled subscription, or resumed after pausing.
						WooCommerce_Connection::reactivate_subscription( $payload['id'] );
					}
				}

				if ( Reader_Activation::is_enabled() && method_exists( '\Newspack_Newsletters_Subscription', 'add_contact' ) ) {
					$customer = Stripe_Connection::get_customer_by_id( $payload['customer'] );
					if ( \is_wp_error( $customer ) ) {
						return $customer;
					}
					$contact_exists = ! \is_wp_error( \Newspack_Newsletters_Subscription::get_contact_data( $customer['email'] ) );
					// Only handle subscription update of an existing contact.
					if ( $contact_exists ) {
						$sub_end_date = gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT, $payload['ended_at'] );
						$contact      = [
							'email'    => $customer['email'],
							'metadata' => [],
						];
						if ( $payload['cancel_at'] ) {
							// Cancellation was scheduled.
							$sub_end_date = gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT, $payload['cancel_at'] );
							$contact['metadata'][ Newspack_Newsletters::$metadata_keys['sub_end_date'] ] = $sub_end_date;
						} elseif ( 'active' === $payload['status'] ) {
							// An update to an active subscription (or activation of it).
							$plan                = $payload['plan'];
							$contact['metadata'] = array_merge(
								Stripe_Connection::create_recurring_payment_metadata( $plan['interval'], $payload['quantity'], $payload['currency'], $payload['start_date'] ),
								$contact['metadata']
							);
						}
						if ( count( $contact['metadata'] ) ) {
							\Newspack_Newsletters_Subscription::add_contact( $contact );
						}
					}
				}
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
			return true;
		} catch ( \Throwable $th ) {
			Logger::log( 'Could not reset Stripe webhooks: ' . $th->getMessage() );
			return false;
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
		$webhook_events = [
			'charge.failed',
			'charge.succeeded',
			'customer.subscription.deleted',
			'customer.subscription.updated',
		];
		if ( ! $created_webhook ) {
			Logger::log( 'Creating Stripe webhooks…' );
			try {
				$webhook = $stripe->webhookEndpoints->create(
					[
						'url'            => self::get_webhook_url(),
						'enabled_events' => $webhook_events,
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
				return new \WP_Error( 'newspack_plugin_stripe_webhooks', __( 'Webhook creation failed: ', 'newspack' ) . $e->getMessage() );
			}
		} elseif ( isset( $created_webhook['id'] ) ) {
			try {
				$webhook = $stripe->webhookEndpoints->retrieve( $created_webhook['id'] );
				if ( $webhook->enabled_events !== $webhook_events ) {
					$is_valid = false;
				}
				if ( 'enabled' !== $webhook['status'] ) {
					$is_valid = false;
				}
				if ( self::get_webhook_url() !== $webhook['url'] ) {
					$is_valid = false;
				}
			} catch ( \Throwable $e ) {
				return new \WP_Error( 'newspack_plugin_stripe_webhooks', __( 'Webhook validation failed: ', 'newspack' ) . $e->getMessage() );
			}
		} else {
			$is_valid = false;
		}
		if ( ! $is_valid ) {
			self::reset_webhooks();
		}
	}
}

Stripe_Webhooks::init();

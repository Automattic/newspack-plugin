<?php
/**
 * Stripe Syncs.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Stripe Syncs.
 */
class Stripe_Sync {
	/**
	 * The final results object.
	 *
	 * @var array
	 * @codeCoverageIgnore
	 */
	private static $results = [
		'processed'            => 0,
		'wc_created'           => 0,
		'wc_found'             => 0,
		'wc_orders_updated'    => 0,
		'wc_orders_created'    => 0,
		'wc_skipped_customers' => 0,
	];

	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		\add_action( 'init', [ __CLASS__, 'wp_cli' ] );
	}

	/**
	 * Process a Stripe customer.
	 *
	 * @param array $customer Customer object.
	 * @param array $args Arguments.
	 */
	private static function sync_to_wc( $customer, $args ) {
		$email_address = $customer->email;
		$is_dry_run    = false !== $args['dry-run'];

		$all_charges = Stripe_Connection::get_customer_charges( $customer->id );

		// Skip charges created by WC.
		$charges = array_filter(
			$all_charges,
			function( $charge ) {
				return ! isset( $charge->metadata->order_id );
			}
		);
		if ( empty( $charges ) ) {
			self::$results['wc_skipped_customers']++;
			return;
		}

		$wp_user = get_user_by( 'email', $email_address );
		$user_id = false;
		if ( $wp_user ) {
			$user_id = $wp_user->ID;
			self::$results['wc_found']++;
		} else {
			// Create the WC Customer and update past orders (lookup is done by email).
			if ( ! $is_dry_run ) {
				$full_name  = $customer->name;
				$user_login = \sanitize_title( $full_name );
				if ( username_exists( $user_login ) ) {
					$user_login = $user_login . '-' . uniqid();
				}
				$user_id = \wc_create_new_customer( $email_address, $user_login, '', [ 'display_name' => $full_name ] );
				if ( is_wp_error( $user_id ) ) {
					\WP_CLI::warning( __( 'Error processing customer', 'newspack' ) . ' ' . $email_address . ': ' . $user_id->get_error_message() );
					$user_id = false;
				} else {
					$linked_orders_count                 = \wc_update_new_customer_past_orders( $user_id );
					self::$results['wc_orders_updated'] += $linked_orders_count;

					// translators: Customer email, linked orders count.
					\WP_CLI::success( sprintf( __( 'Created WC Customer with email: %1$s and linked %2$d order(s) to them.', 'newspack' ), $email_address, $linked_orders_count ) );
					self::$results['wc_created']++;
				}
			}
		}

		if ( false !== $user_id ) {
			foreach ( $charges as $charge ) {
				// Find the order associated with this charge.
				$found_order = \WC_Stripe_Helper::get_order_by_charge_id( $charge->id );
				if ( $found_order ) {
					$order_customer_id = $found_order->get_customer_id();
					if ( ! $order_customer_id ) {
						// The order and the customer exist, but the order is not linked to the customer. Link them.
						if ( ! $is_dry_run ) {
							$found_order->set_customer_id( $user_id );
							$found_order->save();
							// translators: Order ID.
							\WP_CLI::success( sprintf( __( 'Updated WC order: %d.', 'newspack' ), $found_order->get_id() ) );
							self::$results['wc_orders_updated'] ++;
						}
					}
				} else {
					// This is a charge without an order. Create a new order.
					if ( ! $is_dry_run ) {
						$wc_transaction_payload            = Stripe_Connection::create_wc_transaction_payload( $customer, $charge );
						$wc_transaction_payload['user_id'] = $user_id;
						$order_id                          = WooCommerce_Connection::create_transaction( $wc_transaction_payload );
						// translators: Order ID.
						\WP_CLI::success( sprintf( __( 'Created WC order: %d.', 'newspack' ), $order_id ) );
						self::$results['wc_orders_created'] ++;
					}
				}
			}
		}

		self::$results['processed']++;
	}

	/**
	 * Sync Stripe customers to ESP.
	 *
	 * @param array $customer Customer object.
	 * @param array $args Arguments.
	 */
	private static function sync_to_esp( $customer, $args ) {
		$email_address = $customer->email;
		$is_dry_run    = false !== $args['dry-run'];
		$contact       = [
			'email' => $email_address,
			'name'  => $customer->name,
		];

		$metadata_keys = Newspack_Newsletters::$metadata_keys;
		$metadata      = [
			$metadata_keys['total_paid'] => Stripe_Connection::get_customer_ltv( $customer->id ),
		];

		$last_payments = Stripe_Connection::get_customer_charges( $customer->id, false, 1 );
		if ( ! empty( $last_payments ) ) {
			$payment           = $last_payments[0];
			$amount_normalised = Stripe_Connection::normalise_amount( $payment['amount'], $payment['currency'] );
			$frequency         = Stripe_Connection::get_frequency_of_payment( $payment );
			$metadata[ $metadata_keys['last_payment_date'] ]   = gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT, $payment['created'] );
			$metadata[ $metadata_keys['last_payment_amount'] ] = $amount_normalised;
			if ( 'once' !== $frequency ) {
				$metadata[ $metadata_keys['billing_cycle'] ] = $frequency;
			}
			$membership_status                               = Stripe_Connection::get_membership_status_field_value( $frequency );
			$metadata[ $metadata_keys['membership_status'] ] = $membership_status;

			if ( Donations::is_woocommerce_suite_active() ) {
				$wc_product_id = Donations::get_donation_product( $frequency );
				try {
					$metadata[ $metadata_keys['product_name'] ] = \wc_get_product( $wc_product_id )->get_name();
				} catch ( \Throwable $th ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
					// Fail silently.
				}
			}

			$subscription = Stripe_Connection::get_subscription_from_payment( $payment );
			if ( $subscription ) {
				$recurring_related_metadata = Stripe_Connection::create_recurring_payment_metadata(
					$frequency,
					$payment['amount'],
					$payment['currency'],
					$subscription['start_date']
				);
				$metadata                   = array_merge( $recurring_related_metadata, $metadata );
				if ( 'active' !== $subscription['status'] ) {
					$metadata[ $metadata_keys['membership_status'] ] = 'Ex-' . $membership_status;
				}
				if ( $subscription['ended_at'] ) {
					$metadata[ $metadata_keys['sub_end_date'] ] = gmdate( Newspack_Newsletters::METADATA_DATE_FORMAT, $subscription['ended_at'] );
				} else {
					unset( $metadata[ $metadata_keys['sub_end_date'] ] );
				}
			}
		}

		$wp_user = get_user_by( 'email', $email_address );
		if ( $wp_user ) {
			$metadata[ $metadata_keys['account'] ]           = $wp_user->ID;
			$metadata[ $metadata_keys['registration_date'] ] = date_format( date_create( $wp_user->data->user_registered ), Newspack_Newsletters::METADATA_DATE_FORMAT );
		}

		$contact['metadata'] = $metadata;

		if ( ! $is_dry_run ) {
			// This method is idempotent, so it's safe to call it even if the contact already exists.
			\Newspack_Newsletters_Subscription::add_contact( $contact );
		}
	}

	/**
	 * Fetch Stripe customers.
	 *
	 * @param array  $args Arguments.
	 * @param string $last_id Customer ID.
	 */
	private static function process_all_stripe_customers( $args, $last_id = false ) {
		$stripe = Stripe_Connection::get_stripe_client();
		try {
			$params = [ 'limit' => $args['batch-size'] ];
			if ( $last_id ) {
				$params['starting_after'] = $last_id;
			}
			$response = $stripe->customers->all( $params );

			// translators: Number of customers processed.
			\WP_CLI::log( sprintf( __( 'Processing a batch of %d Stripe customers.', 'newspack' ), count( $response['data'] ) ) );
			foreach ( $response['data'] as $customer ) {
				if ( $args['sync-to-esp'] ) {
					self::sync_to_esp( $customer, $args );
				} elseif ( $args['sync-to-wc'] ) {
					self::sync_to_wc( $customer, $args );
				}
			}

			if ( $response['has_more'] ) {
				$last_id             = $response['data'][ count( $response['data'] ) - 1 ]->id;
				$intermediate_result = self::process_all_stripe_customers( $args, $last_id );
				if ( \is_wp_error( $intermediate_result ) ) {
					\WP_CLI::error( $intermediate_result->get_error_message() );
				}
			}
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'stripe_newspack', __( 'Could not process all customers:', 'newspack' ) . ' ' . $e->getMessage() );
		}
	}

	/**
	 * Add CLI commands.
	 */
	public static function wp_cli() {
		if ( ! defined( 'WP_CLI' ) ) {
			return;
		}

		$sync_to_wc = function ( $args, $assoc_args ) {
			$default_args = [
				'batch-size'  => 10,
				'sync-to-wc'  => true, // Sync data to WooCommerce.
				'sync-to-esp' => false, // Sync data to the ESP.
				'dry-run'     => false,
			];
			$passed_args  = array_merge( $default_args, $assoc_args );
			if ( false !== $passed_args['dry-run'] ) {
				\WP_CLI::warning( __( 'This is a dry run, no changes will be made.', 'newspack' ) );
			}

			if ( $passed_args['sync-to-wc'] ) {
				if ( ! class_exists( 'WC_Stripe_Helper' ) || ! method_exists( 'WC_Stripe_Helper', 'get_order_by_charge_id' ) ) {
					\WP_CLI::error( __( 'WC Stripe Gateway plugin has to be active.', 'newspack' ) );
					return;
				}

				if ( ! function_exists( 'wc_create_new_customer' ) ) {
					\WP_CLI::error( __( 'WooCommerce plugin has to be active.', 'newspack' ) );
					return;
				}
			}

			if ( $passed_args['sync-to-esp'] ) {
				if ( ! method_exists( '\Newspack_Newsletters_Subscription', 'add_contact' ) ) {
					\WP_CLI::error( __( 'Newspack Newsletters has to be active.', 'newspack' ) );
					return;
				}
			}

			$result = self::process_all_stripe_customers( $passed_args );

			if ( \is_wp_error( $result ) ) {
				\WP_CLI::error( $result->get_error_message() );
			}

			// translators: Number of Stripe customers processed.
			\WP_CLI::success( sprintf( __( 'Processed %d Stripe customers.', 'newspack' ), self::$results['processed'] ) );

			if ( $passed_args['sync-to-wc'] ) {
				// translators: Number of customers found.
				\WP_CLI::success( sprintf( __( 'Found %d WC customers linked to Stripe customers.', 'newspack' ), self::$results['wc_found'] ) );
				// translators: Number of customers created.
				\WP_CLI::success( sprintf( __( 'Created %d WC customers from Stripe customers.', 'newspack' ), self::$results['wc_created'] ) );
				// translators: Number of orders updated.
				\WP_CLI::success( sprintf( __( 'Updated %d WC orders linked to Stripe charges.', 'newspack' ), self::$results['wc_orders_updated'] ) );
				// translators: Number of orders created.
				\WP_CLI::success( sprintf( __( 'Created %d WC orders from Stripe charges.', 'newspack' ), self::$results['wc_orders_created'] ) );
				// translators: Number of Stripe customers skipped.
				\WP_CLI::success( sprintf( __( 'Skipped %d Stripe customers.', 'newspack' ), self::$results['wc_skipped_customers'] ) );
			}
		};

		\WP_CLI::add_command(
			'newspack stripe sync-customers',
			$sync_to_wc,
			[
				'shortdesc' => __( 'Backfill WC Customers from Stripe database.', 'newspack' ),
			]
		);
	}
}

Stripe_Sync::init();


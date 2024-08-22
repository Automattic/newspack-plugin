<?php
/**
 * Reader contact data syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Donations;
use Newspack\WooCommerce_Connection;
use Newspack\WooCommerce_Order_UTM;
use Newspack\Reader_Activation;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Sync Class.
 */
abstract class Sync {

	const METADATA_DATE_FORMAT = 'Y-m-d';

	/**
	 * Should a WooCommerce order be synchronized?
	 *
	 * @param WC_Order $order Order object.
	 */
	public static function should_sync_order( $order ) {
		// $order is not a valid WC_Order object, so don't try to sync.
		if ( ! is_a( $order, 'WC_Order' ) ) {
			return false;
		}
		// If the order lacks a customer.
		if ( ! $order->get_customer_id() ) {
			return [];
		}
		if ( $order->get_meta( '_subscription_switch' ) ) {
			// This is a "switch" order, which is just recording a subscription update. It has value of 0 and
			// should not be synced anywhere.
			return false;
		}
		return true;
	}

	/**
	 * Get basic metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_basic_metadata_fields() {
		return [
			'account'              => 'Account',
			'registration_date'    => 'Registration Date',
			'connected_account'    => 'Connected Account',
			'signup_page'          => 'Signup Page',
			'signup_page_utm'      => 'Signup UTM: ',
			'newsletter_selection' => 'Newsletter Selection',
			'referer'              => 'Referrer Path',
			'registration_page'    => 'Registration Page',
			'current_page_url'     => 'Registration Page',
			'registration_method'  => 'Registration Method',
		];
	}

	/**
	 * Get payment-related metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_payment_metadata_fields() {
		return [
			'membership_status'   => 'Membership Status',
			'payment_page'        => 'Payment Page',
			'payment_page_utm'    => 'Payment UTM: ',
			'sub_start_date'      => 'Current Subscription Start Date',
			'sub_end_date'        => 'Current Subscription End Date',
			'billing_cycle'       => 'Billing Cycle',
			'recurring_payment'   => 'Recurring Payment',
			'last_payment_date'   => 'Last Payment Date',
			'last_payment_amount' => 'Last Payment Amount',
			'product_name'        => 'Product Name',
			'next_payment_date'   => 'Next Payment Date',
			'total_paid'          => 'Total Paid',
		];
	}

	/**
	 * Get all metadata fields.
	 *
	 * @return array List of fields.
	 */
	public static function get_all_metadata_fields() {
		return array_merge( self::get_basic_metadata_fields(), self::get_payment_metadata_fields() );
	}

	/**
	 * The field name for a given key.
	 *
	 * @param string $key Metadata field to fetch.
	 *
	 * @return string Prefixed field name.
	 */
	protected static function get_metadata_key( $key ) {
		return ucfirst( $key );
	}

	/**
	 * Get data about a customer's order to sync to the connected ESP.
	 *
	 * @param \WC_Order|int $order WooCommerce order or order ID.
	 * @param bool|string   $payment_page_url Payment page URL. If not provided, checkout URL will be used.
	 * @param bool          $is_new Whether the order is new and should count as the last payment amount.
	 *
	 * @return array Contact order metadata.
	 */
	private static function get_order_metadata( $order, $payment_page_url = false, $is_new = false ) {
		if ( ! is_a( $order, 'WC_Order' ) ) {
			$order = \wc_get_order( $order );
		}

		if ( ! self::should_sync_order( $order ) ) {
			return [];
		}

		// Only update last payment data if new payment has been received.
		$payment_received = $is_new && $order->has_status( [ 'processing', 'completed' ] );

		$metadata = [];

		if ( empty( $payment_page_url ) ) {
			$referer_from_order = $order->get_meta( '_newspack_referer' );
			if ( empty( $referer_from_order ) ) {
				$payment_page_url = \wc_get_checkout_url();
			} else {
				$payment_page_url = $referer_from_order;
			}
		}
		$metadata[ static::get_metadata_key( 'payment_page' ) ] = $payment_page_url;

		$utm = $order->get_meta( 'utm' );
		if ( ! empty( $utm ) ) {
			foreach ( $utm as $key => $value ) {
				$metadata[ static::get_metadata_key( 'payment_page_utm' ) . $key ] = $value;
			}
		}

		$order_subscriptions = \wcs_is_subscription( $order ) ? [ $order ] : \wcs_get_subscriptions_for_order( $order->get_id(), [ 'order_type' => 'any' ] );
		$is_donation_order   = Donations::is_donation_order( $order );

		// One-time transaction.
		if ( empty( $order_subscriptions ) ) {

			/**
			 * For donation-type products, use donation membership status as defined by BlueLena.
			 * For non-donation-type products, we just need to know that the reader is a customer.
			 */
			if ( $is_donation_order ) {
				$metadata[ static::get_metadata_key( 'membership_status' ) ] = 'Donor';
			} else {
				$metadata[ static::get_metadata_key( 'membership_status' ) ] = 'customer';
			}

			$metadata[ static::get_metadata_key( 'product_name' ) ] = '';
			$order_items = $order->get_items();
			if ( $order_items ) {
				$metadata[ static::get_metadata_key( 'product_name' ) ] = reset( $order_items )->get_name();
			}
			$order_date_paid = $order->get_date_paid();
			if ( $payment_received && ! empty( $order_date_paid ) ) {
				$metadata[ static::get_metadata_key( 'last_payment_amount' ) ] = \wc_format_localized_price( $order->get_total() );
				$metadata[ static::get_metadata_key( 'last_payment_date' ) ]   = $order_date_paid->date( self::METADATA_DATE_FORMAT );
			}

			// Subscription transaction.
		} else {
			$current_subscription = reset( $order_subscriptions );

			/**
			 * For donation-type products, use donation membership status as defined by BlueLena.
			 * For non-donation-type products, use the subscription's current status.
			 */
			if ( $is_donation_order ) {
				$donor_status = 'Donor';
				if ( 'month' === $current_subscription->get_billing_period() ) {
					$donor_status = 'Monthly ' . $donor_status;
				}
				if ( 'year' === $current_subscription->get_billing_period() ) {
					$donor_status = 'Yearly ' . $donor_status;
				}

				// If the subscription has moved to a cancelled or expired status.
				if ( $current_subscription->has_status( [ 'cancelled', 'expired' ] ) ) {
					$donor_status = 'Ex-' . $donor_status;
				}
				$metadata[ static::get_metadata_key( 'membership_status' ) ] = $donor_status;
			} else {
				$metadata[ static::get_metadata_key( 'membership_status' ) ] = $current_subscription->get_status();
			}

			$metadata[ static::get_metadata_key( 'sub_start_date' ) ]    = $current_subscription->get_date( 'start' );
			$metadata[ static::get_metadata_key( 'sub_end_date' ) ]      = $current_subscription->get_date( 'end' ) ? $current_subscription->get_date( 'end' ) : '';
			$metadata[ static::get_metadata_key( 'billing_cycle' ) ]     = $current_subscription->get_billing_period();
			$metadata[ static::get_metadata_key( 'recurring_payment' ) ] = $current_subscription->get_total();

			if ( $payment_received ) {
				$metadata[ static::get_metadata_key( 'last_payment_amount' ) ] = \wc_format_localized_price( $current_subscription->get_total() );
				$metadata[ static::get_metadata_key( 'last_payment_date' ) ]   = $current_subscription->get_date( 'last_order_date_paid' ) ? $current_subscription->get_date( 'last_order_date_paid' ) : gmdate( static::METADATA_DATE_FORMAT );
			}

			// When a WC Subscription is terminated, the next payment date is set to 0. We don't want to sync that – the next payment date should remain as it was
			// in the event of cancellation.
			$next_payment_date = $current_subscription->get_date( 'next_payment' );
			if ( $next_payment_date ) {
				$metadata[ static::get_metadata_key( 'next_payment_date' ) ] = $next_payment_date;
			}

			$metadata[ static::get_metadata_key( 'product_name' ) ] = '';
			if ( $current_subscription ) {
				$subscription_order_items = $current_subscription->get_items();
				if ( $subscription_order_items ) {
					$metadata[ static::get_metadata_key( 'product_name' ) ] = reset( $subscription_order_items )->get_name();
				}
			}
		}

		// Clear out any payment-related fields that don't relate to the current order.
		$payment_fields = array_keys( static::get_payment_metadata_fields() );
		foreach ( $payment_fields as $meta_key ) {
			$meta_field = static::get_metadata_key( $meta_key );
			if ( ! isset( $metadata[ $meta_field ] ) ) {
				if ( 'payment_page_utm' === $meta_key ) {
					foreach ( WooCommerce_Order_UTM::$params as $param ) {
						$metadata[ $meta_field . $param ] = '';
					}
				} else {
					$metadata[ $meta_field ] = '';
				}
			}
		}

		return $metadata;
	}

	/**
	 * Get the contact data from a WooCommerce customer.
	 *
	 * @param \WC_Customer    $customer Customer object.
	 * @param \WC_Order|false $order Order object to sync with. If not given, the last successful order will be used.
	 * @param bool|string     $payment_page_url Payment page URL. If not provided, checkout URL will be used.
	 * @param bool            $is_new Whether the order is new and should count as the last payment amount.
	 *
	 * @return array|false Contact data or false.
	 */
	protected static function get_contact_from_customer( $customer, $order = false, $payment_page_url = false, $is_new = false ) {
		if ( ! is_a( $customer, 'WC_Customer' ) ) {
			return false;
		}

		$metadata       = [];
		$order_metadata = [];
		$last_order     = WooCommerce_Connection::get_last_successful_order( $customer );

		$metadata[ static::get_metadata_key( 'account' ) ]           = $customer->get_id();
		$metadata[ static::get_metadata_key( 'registration_date' ) ] = $customer->get_date_created()->date( static::METADATA_DATE_FORMAT );
		$metadata[ static::get_metadata_key( 'total_paid' ) ]        = \wc_format_localized_price( $customer->get_total_spent() );

		// If a more recent order exists, use it to sync.
		if ( ! $order || ( $last_order && $order->get_id() !== $last_order->get_id() ) ) {
			$order = $last_order;
		}

		// Get the order metadata.
		if ( $order ) {
			$order_metadata = self::get_order_metadata( $order, $payment_page_url, $is_new );
		} else {
			// If the customer has no successful orders, clear out subscription-related fields.
			$payment_fields = array_keys( static::get_payment_metadata_fields() );
			foreach ( $payment_fields as $meta_key ) {
				$metadata[ static::get_metadata_key( $meta_key ) ] = '';
			}
		}

		$metadata = array_merge( $order_metadata, $metadata );

		$first_name = $customer->get_billing_first_name();
		$last_name  = $customer->get_billing_last_name();
		$full_name  = trim( "$first_name $last_name" );
		$contact    = [
			'email'    => $customer->get_billing_email(),
			'metadata' => $metadata,
		];
		if ( ! empty( $full_name ) ) {
			$contact['name'] = $full_name;
		}
		return $contact;
	}

	/**
	 * Get the contact data from a WooCommerce order.
	 *
	 * @param \WC_Order|int $order WooCommerce order or order ID.
	 * @param bool|string   $payment_page_url Payment page URL. If not provided, checkout URL will be used.
	 * @param bool          $is_new Whether the order is new and should count as the last payment amount.
	 *
	 * @return array|false Contact data or false.
	 */
	protected static function get_contact_from_order( $order, $payment_page_url = false, $is_new = false ) {
		if ( ! is_a( $order, 'WC_Order' ) ) {
			$order = \wc_get_order( $order );
		}

		if ( ! self::should_sync_order( $order ) ) {
			return;
		}

		$user_id  = $order->get_customer_id();
		$customer = new \WC_Customer( $user_id );

		return self::get_contact_from_customer( $customer, $order, $payment_page_url, $is_new );
	}
}

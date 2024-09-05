<?php
/**
 * Reader Activation Sync WooCommerce.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync;

use Newspack\Donations;
use Newspack\WooCommerce_Connection;
use Newspack\WooCommerce_Order_UTM;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Class.
 */
class WooCommerce {

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
	 * Get data about a customer's order to sync to the connected ESP.
	 *
	 * @param \WC_Order|int $order WooCommerce order or order ID.
	 * @param bool|string   $payment_page_url Payment page URL. If not provided, checkout URL will be used.
	 *
	 * @return array Contact order metadata.
	 */
	private static function get_order_metadata( $order, $payment_page_url = false ) {
		if ( ! is_a( $order, 'WC_Order' ) ) {
			$order = \wc_get_order( $order );
		}

		if ( ! self::should_sync_order( $order ) ) {
			return [];
		}

		$is_subscription = false;
		if ( function_exists( 'wcs_is_subscription' ) ) {
			$is_subscription = \wcs_is_subscription( $order );
		}

		// Only update last payment data if new payment has been received.
		$active_statuses = $is_subscription ? WooCommerce_Connection::ACTIVE_SUBSCRIPTION_STATUSES : WooCommerce_Connection::ACTIVE_ORDER_STATUSES;
		$payment_received = $order->has_status( $active_statuses );

		$metadata = [];

		if ( empty( $payment_page_url ) ) {
			$referer_from_order = $order->get_meta( '_newspack_referer' );
			if ( empty( $referer_from_order ) ) {
				$payment_page_url = \wc_get_checkout_url();
			} else {
				$payment_page_url = $referer_from_order;
			}
		}
		$metadata['payment_page'] = $payment_page_url;

		$utm = $order->get_meta( 'utm' );
		if ( empty( $utm ) ) {
			$utm = [];
			// Try the explicit `utm_<name>` meta.
			foreach ( WooCommerce_Order_UTM::$params as $param ) {
				$param_name = 'utm_' . $param;
				$utm_value = $order->get_meta( $param_name );
				if ( ! empty( $utm_value ) ) {
					$utm[ $param ] = $utm_value;
				}
			}
		}
		if ( ! empty( $utm ) ) {
			foreach ( $utm as $key => $value ) {
				$metadata[ 'payment_page_utm_' . $key ] = $value;
			}
		}

		$order_subscriptions = [];
		if ( function_exists( 'wcs_is_subscription' ) ) {
			$order_subscriptions = \wcs_is_subscription( $order ) ? [ $order ] : \wcs_get_subscriptions_for_order( $order->get_id(), [ 'order_type' => 'any' ] );
		}
		$is_donation_order = Donations::is_donation_order( $order );

		// One-time transaction.
		if ( empty( $order_subscriptions ) ) {

			/**
			 * For donation-type products, use donation membership status as defined by BlueLena.
			 * For non-donation-type products, we just need to know that the reader is a customer.
			 */
			if ( $is_donation_order ) {
				$metadata['membership_status'] = 'Donor';
			} else {
				$metadata['membership_status'] = 'customer';
			}

			$metadata['product_name'] = '';
			$order_items = $order->get_items();
			if ( $order_items ) {
				$metadata['product_name'] = reset( $order_items )->get_name();
			}
			$order_date_paid = $order->get_date_paid();
			if ( $payment_received && ! empty( $order_date_paid ) ) {
				$metadata['last_payment_amount'] = \wc_format_localized_price( $order->get_total() );
				$metadata['last_payment_date']   = $order_date_paid->date( Metadata::DATE_FORMAT );
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
				$metadata['membership_status'] = $donor_status;
			} else {
				$metadata['membership_status'] = $current_subscription->get_status();
			}

			$metadata['sub_start_date']    = $current_subscription->get_date( 'start' );
			$metadata['sub_end_date']      = $current_subscription->get_date( 'end' ) ? $current_subscription->get_date( 'end' ) : '';
			$metadata['billing_cycle']     = $current_subscription->get_billing_period();
			$metadata['recurring_payment'] = $current_subscription->get_total();

			if ( $payment_received ) {
				$metadata['last_payment_amount'] = \wc_format_localized_price( $current_subscription->get_total() );
				$metadata['last_payment_date']   = $current_subscription->get_date( 'last_order_date_paid' ) ? $current_subscription->get_date( 'last_order_date_paid' ) : gmdate( Metadata::DATE_FORMAT );
			}

			// When a WC Subscription is terminated, the next payment date is set to 0. We don't want to sync that – the next payment date should remain as it was
			// in the event of cancellation.
			$next_payment_date = $current_subscription->get_date( 'next_payment' );
			if ( $next_payment_date ) {
				$metadata['next_payment_date'] = $next_payment_date;
			}

			$metadata['product_name'] = '';
			if ( $current_subscription ) {
				$subscription_order_items = $current_subscription->get_items();
				if ( $subscription_order_items ) {
					$metadata['product_name'] = reset( $subscription_order_items )->get_name();
				}
			}
		}

		// Clear out any payment-related fields that don't relate to the current order.
		$payment_fields = array_keys( Metadata::get_payment_fields() );
		foreach ( WooCommerce_Order_UTM::$params as $param ) {
			if ( ! isset( $metadata[ 'payment_page_utm_' . $param ] ) ) {
				$metadata[ 'payment_page_utm_' . $param ] = '';
			}
		}
		foreach ( $payment_fields as $meta_key ) {
			if ( ! isset( $metadata[ $meta_key ] ) && 'payment_page_utm' !== $meta_key ) {
				$metadata[ $meta_key ] = '';
			}
		}
		return $metadata;
	}

	/**
	 * Get the contact data from a WooCommerce customer.
	 *
	 * @param \WC_Customer $customer Customer object.
	 * @param bool|string  $payment_page_url Payment page URL. If not provided, checkout URL will be used.
	 *
	 * @return array|false Contact data or false.
	 */
	public static function get_contact_from_customer( $customer, $payment_page_url = false ) {
		if ( ! is_a( $customer, 'WC_Customer' ) ) {
			$customer = new \WC_Customer( $customer );
		}

		$metadata = [];

		$metadata['account']           = $customer->get_id();
		$metadata['registration_date'] = $customer->get_date_created()->date( Metadata::DATE_FORMAT );
		$metadata['total_paid']        = \wc_format_localized_price( $customer->get_total_spent() );

		$order = WooCommerce_Connection::get_last_successful_order( $customer );

		// Get the order metadata.
		$order_metadata = [];
		if ( $order ) {
			$order_metadata = self::get_order_metadata( $order, $payment_page_url );
		} else {
			// If the customer has no successful orders, clear out subscription-related fields.
			$payment_fields = array_keys( Metadata::get_payment_fields() );
			foreach ( $payment_fields as $meta_key ) {
				$metadata[ $meta_key ] = '';
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
	 *
	 * @return array|false Contact data or false.
	 */
	public static function get_contact_from_order( $order, $payment_page_url = false ) {
		if ( ! is_a( $order, 'WC_Order' ) ) {
			$order = \wc_get_order( $order );
		}

		if ( ! self::should_sync_order( $order ) ) {
			return;
		}

		return self::get_contact_from_customer( $order->get_customer_id(), $payment_page_url );
	}
}

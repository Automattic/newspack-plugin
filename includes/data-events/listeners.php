<?php
/**
 * Newspack data events listeners.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

use Newspack\Data_Events;
use Newspack\Reader_Activation;
use Newspack\Donations;

/**
 * For when a reader registers.
 */
Data_Events::register_listener(
	'newspack_registered_reader',
	'reader_registered',
	function( $email, $authenticate, $user_id, $existing_user, $metadata ) {
		if ( $existing_user ) {
			return null;
		}
		return [
			'user_id'  => $user_id,
			'email'    => $email,
			'metadata' => $metadata,
		];
	}
);

/**
 * For when a reader logs in.
 */
Data_Events::register_listener(
	'wp_login',
	'reader_logged_in',
	function( $user_login, $user ) {
		if ( ! Reader_Activation::is_user_reader( $user ) ) {
			return;
		}
		return [
			'user_id' => $user->ID,
			'email'   => $user->user_email,
		];
	}
);

/**
 * For when a reader is marked as verified.
 */
Data_Events::register_listener(
	'newspack_reader_verified',
	'reader_verified',
	function( $user ) {
		return [
			'user_id' => $user->ID,
			'email'   => $user->user_email,
		];
	}
);

/**
 * For when a contact is added to newsletter lists.
 */
Data_Events::register_listener(
	'newspack_newsletters_add_contact',
	'newsletter_subscribed',
	function( $provider, $contact, $lists, $result ) {
		if ( empty( $lists ) ) {
			return;
		}
		if ( true !== $result ) {
			return;
		}
		$user = get_user_by( 'email', $contact['email'] );
		return [
			'user_id'  => $user ? $user->ID : null,
			'email'    => $contact['email'],
			'provider' => $provider,
			'contact'  => $contact,
			'lists'    => $lists,
		];
	}
);

/**
 * For when a contact newsletter subscription is updated.
 */
Data_Events::register_listener(
	'newspack_newsletters_update_contact_lists',
	'newsletter_updated',
	function( $provider, $email, $lists_added, $lists_removed, $result ) {
		if ( empty( $lists_added ) && empty( $lists_removed ) ) {
			return;
		}
		if ( true !== $result ) {
			return;
		}
		$user = get_user_by( 'email', $email );
		return [
			'user_id'       => $user ? $user->ID : null,
			'email'         => $email,
			'provider'      => $provider,
			'lists_added'   => $lists_added,
			'lists_removed' => $lists_removed,
		];
	}
);


/**
 * For when a Subscription is confirmed.
 */
Data_Events::register_listener(
	'woocommerce_subscription_status_updated',
	'donation_subscription_new',
	function( $subscription, $status_to, $status_from ) {
		if ( 'active' !== $status_to || 'pending' !== $status_from ) {
			return;
		}
		$product_id = Donations::get_order_donation_product_id( $subscription->get_id() );
		error_log( 'checking subcription is a product donation' );
		error_log( print_r( $product_id, true ) );
		if ( ! $product_id ) {
			return;
		}
		return [
			'user_id'         => $subscription->get_customer_id(),
			'email'           => $subscription->get_billing_email(),
			'subscription_id' => $subscription->get_id(),
			'amount'          => (float) $subscription->get_total(),
			'currency'        => $subscription->get_currency(),
			'recurrence'      => get_post_meta( $product_id, '_subscription_period', true ),
			'platform'        => Donations::get_platform_slug(),
		];
	}
);

/**
 * For when there's a new donation through the Stripe platform.
 */
Data_Events::register_listener(
	'woocommerce_order_status_pending_to_completed',
	'donation_new',
	function( $order_id, $order ) {
		$product_id = Donations::get_order_donation_product_id( $order_id );
		if ( ! $product_id ) {
			return;
		}
		return [
			'user_id'       => $order->get_customer_id(),
			'email'         => $order->get_billing_email(),
			'amount'        => (float) $order->get_total(),
			'currency'      => $order->get_currency(),
			'recurrence'    => \get_post_meta( $product_id, '_subscription_period', true ),
			'platform'      => Donations::get_platform_slug(),
			'platform_data' => [
				'order_id'   => $order_id,
				'product_id' => $product_id,
				'client_id'  => $order->get_meta( NEWSPACK_CLIENT_ID_COOKIE_NAME ),
			],
		];
	}
);

/**
 * For when a WooCommerce Subscription is cancelled.
 */
Data_Events::register_listener(
	'woocommerce_subscription_status_updated',
	'donation_subscription_cancelled',
	function( $subscription, $status_to, $status_from ) {
		if ( 'cancelled' !== $status_to ) {
			return;
		}
		$product_id = Donations::get_order_donation_product_id( $subscription->get_id() );
		if ( ! $product_id ) {
			return;
		}
		return [
			'user_id'         => $subscription->get_customer_id(),
			'email'           => $subscription->get_billing_email(),
			'subscription_id' => $subscription->get_id(),
			'amount'          => (float) $subscription->get_total(),
			'currency'        => $subscription->get_currency(),
			'recurrence'      => get_post_meta( $product_id, '_subscription_period', true ),
			'platform'        => Donations::get_platform_slug(),
		];
	}
);

/**
 * For when a WooCommerce Subscription status changes.
 */
Data_Events::register_listener(
	'woocommerce_subscription_status_updated',
	'donation_subscription_changed',
	function( $subscription, $status_to, $status_from ) {
		$product_id = Donations::get_order_donation_product_id( $subscription->get_id() );
		if ( ! $product_id ) {
			return;
		}
		return [
			'user_id'         => $subscription->get_customer_id(),
			'email'           => $subscription->get_billing_email(),
			'subscription_id' => $subscription->get_id(),
			'status_before'   => $status_from,
			'status_after'    => $status_to,
			'amount'          => (float) $subscription->get_total(),
			'currency'        => $subscription->get_currency(),
			'recurrence'      => get_post_meta( $product_id, '_subscription_period', true ),
			'platform'        => Donations::get_platform_slug(),
		];
	}
);

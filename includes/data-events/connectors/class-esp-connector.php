<?php
/**
 * Newspack Data Events ESP Connector.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events\Connectors;

use Newspack\Data_Events;
use Newspack\Reader_Activation;
use Newspack_Newsletters_Contacts;

defined( 'ABSPATH' ) || exit;

/**
 * ESP Connector Class.
 */
class ESP_Connector extends Reader_Activation\ESP_Sync {
	/**
	 * Initialize hooks.
	 */
	public static function init_hooks() {
		add_action( 'init', [ __CLASS__, 'register_handlers' ] );
	}

	/**
	 * Register handlers.
	 */
	public static function register_handlers() {
		if ( ! static::can_esp_sync() ) {
			return;
		}
		Data_Events::register_handler( [ __CLASS__, 'reader_registered' ], 'reader_registered' );
		Data_Events::register_handler( [ __CLASS__, 'reader_deleted' ], 'reader_deleted' );
		Data_Events::register_handler( [ __CLASS__, 'reader_logged_in' ], 'reader_logged_in' );
		Data_Events::register_handler( [ __CLASS__, 'order_completed' ], 'order_completed' );
		Data_Events::register_handler( [ __CLASS__, 'subscription_updated' ], 'donation_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'subscription_updated' ], 'product_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'newsletter_updated' ], 'newsletter_subscribed' );
		Data_Events::register_handler( [ __CLASS__, 'newsletter_updated' ], 'newsletter_updated' );
		Data_Events::register_handler( [ __CLASS__, 'network_new_reader' ], 'network_new_reader' );
	}

	/**
	 * Handle a reader registering.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function reader_registered( $timestamp, $data, $client_id ) {
		$account_key           = static::get_metadata_key( 'account' );
		$registration_date_key = static::get_metadata_key( 'registration_date' );
		$metadata              = [
			$account_key           => $data['user_id'],
			$registration_date_key => gmdate( static::METADATA_DATE_FORMAT, $timestamp ),
		];
		if ( isset( $data['metadata']['current_page_url'] ) ) {
			$metadata[ static::get_metadata_key( 'registration_page' ) ] = $data['metadata']['current_page_url'];
		}
		if ( isset( $data['metadata']['registration_method'] ) ) {
			$metadata[ static::get_metadata_key( 'registration_method' ) ] = $data['metadata']['registration_method'];
		}
		/**
		 * Filters the contact metadata sent to the ESP when a reader account is registered for the first time.
		 *
		 * @param array $metadata The contact metadata.
		 * @param int   $user_id The ID of the user.
		 *
		 * @return array The modified contact metadata.
		 */
		$metadata = \apply_filters( 'newspack_data_events_reader_registered_metadata', $metadata, $data['user_id'] );
		$contact  = [
			'email'    => $data['email'],
			'metadata' => $metadata,
		];

		static::sync( $contact, 'RAS Reader registration' );
	}

	/**
	 * Sync reader data on login.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function reader_logged_in( $timestamp, $data, $client_id ) {
		if ( empty( $data['email'] ) || empty( $data['user_id'] ) ) {
			return;
		}

		$customer = new \WC_Customer( $data['user_id'] );

		// If user is not a Woo customer, don't need to sync them.
		if ( ! $customer->get_order_count() ) {
			return;
		}

		$contact = static::get_contact_from_customer( $customer );

		static::sync( $contact, 'RAS Reader login' );
	}

	/**
	 * Handle a completed order of any type.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function order_completed( $timestamp, $data, $client_id ) {
		if ( ! isset( $data['platform_data']['order_id'] ) ) {
			return;
		}

		// If order is a subscription renewal, ignore it here as it's handled by
		// the subscription_updated event.
		if ( ! empty( $data['is_renewal'] ) ) {
			return;
		}

		$order_id = $data['platform_data']['order_id'];
		$contact  = static::get_contact_from_order( $order_id, $data['referer'], true );

		if ( ! $contact ) {
			return;
		}

		static::sync( $contact, 'RAS Order completed' );
	}

	/**
	 * Handle a change in subscription status.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function subscription_updated( $timestamp, $data, $client_id ) {
		if ( empty( $data['status_before'] ) || empty( $data['status_after'] ) || empty( $data['subscription_id'] ) ) {
			return;
		}

		$contact = static::get_contact_from_order( $data['subscription_id'] );

		if ( ! $contact ) {
			return;
		}

		static::sync( $contact, sprintf( 'RAS Woo Subscription updated. Status changed from %s to %s', $data['status_before'], $data['status_after'] ) );
	}

	/**
	 * Handle a user deletion.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function reader_deleted( $timestamp, $data, $client_id ) {
		if ( true === Reader_Activation::get_setting( 'sync_esp_delete' ) ) {
			return Newspack_Newsletters_Contacts::delete( $data['user_id'], 'RAS Reader deleted' );
		}
	}

	/**
	 * Handle newsletter subscription update.
	 *
	 * @param int   $timestamp Timestamp.
	 * @param array $data      Data.
	 */
	public static function newsletter_updated( $timestamp, $data ) {
		if ( empty( $data['user_id'] ) || empty( $data['email'] ) ) {
			return;
		}
		$subscribed_lists = \Newspack_Newsletters_Subscription::get_contact_lists( $data['email'] );
		if ( is_wp_error( $subscribed_lists ) || ! is_array( $subscribed_lists ) ) {
			return;
		}
		$lists = \Newspack_Newsletters_Subscription::get_lists();
		if ( is_wp_error( $lists ) ) {
			return;
		}
		$lists_names = [];
		foreach ( $subscribed_lists as $subscribed_list_id ) {
			foreach ( $lists as $list ) {
				if ( $list['id'] === $subscribed_list_id ) {
					$lists_names[] = $list['name'];
				}
			}
		}

		$account_key              = static::get_metadata_key( 'account' );
		$newsletter_selection_key = static::get_metadata_key( 'newsletter_selection' );

		$metadata = [
			$account_key              => $data['user_id'],
			$newsletter_selection_key => implode( ', ', $lists_names ),
		];
		$contact  = [
			'email'    => $data['email'],
			'metadata' => $metadata,
		];
		static::sync( $contact, 'Updating the account and newsletter_selection fields after a change in the subscription lists.' );
	}

	/**
	 * Handle a a new network added in the Newspack Network plugin.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function network_new_reader( $timestamp, $data, $client_id ) {
		$user_id = $data['user_id'];
		$registration_site = $data['registration_site'];

		$contact = static::get_contact_from_customer( new \WC_Customer( $user_id ) );

		if ( ! $contact ) {
			return;
		}

		// Ensure email is set as the user probably won't have a billing email.
		if ( empty( $contact['email'] ) ) {
			$user = get_userdata( $user_id );
			$contact['email'] = $user->user_email;
		}

		if ( empty( $contact['metadata'] ) ) {
			$contact['metadata'] = [];
		}

		$contact['metadata']['network_registration_site'] = $registration_site;

		$site_url = get_site_url();
		static::sync( $contact, sprintf( 'RAS Newspack Network: User propagated from another site in the network. Propagated from %s to %s.', $registration_site, $site_url ) );
	}
}
ESP_Connector::init_hooks();

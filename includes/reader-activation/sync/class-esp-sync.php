<?php
/**
 * Reader contact data syncing with the connected ESP.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * ESP Sync Class.
 */
abstract class ESP_Sync extends Sync {

	/**
	 * Context of the sync.
	 *
	 * @var string
	 */
	protected static $context = 'ESP Sync';

	/**
	 * Log a message to the Newspack Logger.
	 *
	 * @param string $message The message to log.
	 */
	protected static function log( $message ) {
		Logger::log( $message );
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	protected static function can_sync_contacts( $return_errors = false ) {
		$errors = new \WP_Error();

		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			$errors->add(
				'newspack_newsletters_contacts_not_found',
				__( 'Newspack Newsletters is not available.', 'newspack-plugin' )
			);
		}

		if ( ! Reader_Activation::is_enabled() ) {
			$errors->add(
				'ras_not_enabled',
				__( 'Reader Activation is not enabled.', 'newspack-plugin' )
			);
		}

		if ( ! Reader_Activation::get_setting( 'sync_esp' ) ) {
			$errors->add(
				'ras_esp_sync_not_enabled',
				__( 'ESP sync is not enabled.', 'newspack-plugin' )
			);
		}

		if ( ! Reader_Activation::get_esp_master_list_id() ) {
			$errors->add(
				'ras_esp_master_list_id_not_found',
				__( 'ESP master list ID is not set.', 'newspack-plugin' )
			);
		}

		// If not a production site, only sync if the NEWSPACK_SUBSCRIPTION_MIGRATIONS_ALLOW_ESP_SYNC constant is set.
		if (
			( ! method_exists( 'Newspack_Manager', 'is_connected_to_production_manager' ) || ! \Newspack_Manager::is_connected_to_production_manager() ) &&
			( ! defined( 'NEWSPACK_SUBSCRIPTION_MIGRATIONS_ALLOW_ESP_SYNC' ) || ! NEWSPACK_SUBSCRIPTION_MIGRATIONS_ALLOW_ESP_SYNC )
		) {
			$errors->add(
				'esp_sync_not_allowed',
				__( 'ESP sync is disabled for non-production sites. Set NEWSPACK_SUBSCRIPTION_MIGRATIONS_ALLOW_ESP_SYNC to allow sync.', 'newspack-plugin' )
			);
		}

		if ( $return_errors ) {
			return $errors;
		}

		if ( $errors->has_errors() ) {
			return false;
		}

		return true;
	}

	/**
	 * Sync contact to the ESP.
	 *
	 * @param array  $contact The contact data to sync.
	 * @param string $context The context of the sync. Defaults to static::$context.
	 *
	 * @return true|\WP_Error True if succeeded or WP_Error.
	 */
	protected static function sync( $contact, $context = '' ) {
		$can_sync = static::can_sync_contacts( true );
		if ( $can_sync->has_errors() ) {
			return $can_sync;
		}

		if ( empty( $context ) ) {
			$context = static::$context;
		}

		$master_list_id = Reader_Activation::get_esp_master_list_id();

		/**
		 * Filters the contact data before syncing to the ESP.
		 *
		 * @param array  $contact The contact data to sync.
		 * @param string $context The context of the sync.
		 */
		$contact = \apply_filters( 'newspack_esp_sync_contact', $contact, $context );

		$result = \Newspack_Newsletters_Contacts::upsert( $contact, $master_list_id, $context );

		return \is_wp_error( $result ) ? $result : true;
	}

	/**
	 * Given a user ID or WooCommerce Order, sync that reader's contact data to
	 * the connected ESP.
	 *
	 * @param int|\WC_order $user_id_or_order User ID or WC_Order object.
	 * @param bool          $is_dry_run       True if a dry run.
	 *
	 * @return true|\WP_Error True if the contact was synced successfully, WP_Error otherwise.
	 */
	protected static function sync_contact( $user_id_or_order, $is_dry_run = false ) {
		$can_sync = static::can_sync_contacts( true );
		if ( ! $is_dry_run && $can_sync->has_errors() ) {
			return $can_sync;
		}

		$is_order = $user_id_or_order instanceof \WC_Order;
		$order    = $is_order ? $user_id_or_order : false;
		$user_id  = $is_order ? $order->get_customer_id() : $user_id_or_order;
		$user     = \get_userdata( $user_id );

		// Backfill Network Registration Site field if needed.
		$registration_site = false;
		if ( $user && defined( 'NEWSPACK_NETWORK_READER_ROLE' ) && defined( 'Newspack_Network\Utils\Users::USER_META_REMOTE_SITE' ) ) {
			if ( ! empty( array_intersect( $user->roles, \Newspack_Network\Utils\Users::get_synced_user_roles() ) ) ) {
				$registration_site = \esc_url( \get_site_url() ); // Default to current site.
				$remote_site       = \get_user_meta( $user->ID, \Newspack_Network\Utils\Users::USER_META_REMOTE_SITE, true );
				if ( ! empty( \wp_http_validate_url( $remote_site ) ) ) {
					$registration_site = \esc_url( $remote_site );
				}
			}
		}

		$customer = new \WC_Customer( $user_id );
		if ( ! $customer || ! $customer->get_id() ) {
			return new \WP_Error(
				'newspack_esp_sync_contact',
				sprintf(
				// Translators: %d is the user ID.
					__( 'Customer with ID %d does not exist.', 'newspack-plugin' ),
					$user_id
				)
			);
		}

		// Ensure the customer has a billing address.
		if ( ! $customer->get_billing_email() && $customer->get_email() ) {
			$customer->set_billing_email( $customer->get_email() );
			$customer->save();
		}

		$contact = $is_order ? static::get_contact_from_order( $order ) : static::get_contact_from_customer( $customer );
		if ( $registration_site ) {
			$contact['metadata']['network_registration_site'] = $registration_site;
		}
		$result = $is_dry_run ? true : self::sync( $contact );

		if ( $result && ! \is_wp_error( $result ) ) {
			static::log(
				sprintf(
					// Translators: %1$s is the status and %2$s is the contact's email address.
					__( '%1$s contact data for %2$s.', 'newspack-plugin' ),
					$is_dry_run ? __( 'Would sync', 'newspack-plugin' ) : __( 'Synced', 'newspack-plugin' ),
					$customer->get_email()
				)
			);
			if ( ! empty( static::$results ) ) {
				static::$results['processed']++;
			}
		}

		return $result;
	}
}

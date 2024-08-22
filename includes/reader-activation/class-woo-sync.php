<?php
/**
 * WooCommerce Reader Revenue data syncing with the connected ESP.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;
use Newspack\Logger;
use Newspack\WooCommerce_Connection;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Sync Class.
 */
abstract class Woo_Sync {
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
	 * @param array $contact The contact data to sync.
	 *
	 * @return true|\WP_Error True if succeeded or WP_Error.
	 */
	private static function sync( $contact ) {
		$master_list_id = Reader_Activation::get_esp_master_list_id();
		$result         = \Newspack_Newsletters_Contacts::upsert( $contact, $master_list_id, 'WooCommerce Sync' );
		return \is_wp_error( $result ) ? $result : true;
	}

	/**
	 * Given a WP user ID for a Woo customer or order ID, resync that customer's
	 * contact data in the connected ESP.
	 *
	 * @param int|\WC_order $user_id_or_order User ID or WC_Order object.
	 * @param bool          $is_dry_run       True if a dry run.
	 *
	 * @return true|\WP_Error True if the contact was resynced successfully, WP_Error otherwise.
	 */
	protected static function resync_contact( $user_id_or_order = 0, $is_dry_run = false ) {
		$can_sync = static::can_sync_contacts( true );
		if ( ! $is_dry_run && $can_sync->has_errors() ) {
			return $can_sync;
		}

		if ( ! $user_id_or_order ) {
			return new \WP_Error( 'newspack_woo_resync_contact', __( 'Must pass either a user ID or order.', 'newspack-plugin' ) );
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
				'newspack_woo_resync_contact',
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

		$contact = $is_order ? WooCommerce_Connection::get_contact_from_order( $order ) : WooCommerce_Connection::get_contact_from_customer( $customer );
		if ( $registration_site ) {
			$contact['metadata']['network_registration_site'] = $registration_site;
		}
		$result = $is_dry_run ? true : static::sync( $contact );

		if ( $result && ! \is_wp_error( $result ) ) {
			static::log(
				sprintf(
					// Translators: %1$s is the resync status and %2$s is the contact's email address.
					__( '%1$s contact data for %2$s.', 'newspack-plugin' ),
					$is_dry_run ? __( 'Would resync', 'newspack-plugin' ) : __( 'Resynced', 'newspack-plugin' ),
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

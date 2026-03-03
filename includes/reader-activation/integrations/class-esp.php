<?php
/**
 * ESP integration
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Integrations;

use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation;
use Newspack_Newsletters_Contacts;
use Newspack_Newsletters_Subscription;

defined( 'ABSPATH' ) || exit;

/**
 * ESP Integration Class.
 *
 * Generic integration for ESPs using Newspack Newsletters plugin.
 */
class ESP extends Integration {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'esp', __( 'ESPs Integration', 'newspack-plugin' ) );
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	public function can_sync( $return_errors = false ) {
		$errors = new \WP_Error();

		/**
		 * Forces ESP sync to be allowed, bypassing all validation checks.
		 * Use with caution - may sync data to production ESP from staging.
		 *
		 * @constant NEWSPACK_FORCE_ALLOW_ESP_SYNC
		 * @type     bool
		 * @default  ESP sync follows normal validation rules
		 * @status   draft
		 *
		 * @example define( 'NEWSPACK_FORCE_ALLOW_ESP_SYNC', true );
		 */
		if ( defined( 'NEWSPACK_FORCE_ALLOW_ESP_SYNC' ) && NEWSPACK_FORCE_ALLOW_ESP_SYNC ) {
			return $return_errors ? $errors : true;
		}

		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			$errors->add(
				'newspack_newsletters_contacts_not_found',
				__( 'Newspack Newsletters is not available.', 'newspack-plugin' )
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

		if ( $return_errors ) {
			return $errors;
		}

		if ( $errors->has_errors() ) {
			return false;
		}

		return true;
	}

	/**
	 * Push contact data to the integration destination.
	 *
	 * @param array      $contact The contact data to push.
	 * @param string     $context Optional. The context of the sync.
	 * @param array|null $existing_contact Optional. Existing contact data if available.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	public function push_contact_data( $contact, $context = '', $existing_contact = null ) {

		$can_sync = $this->can_sync( true );
		if ( $can_sync->has_errors() ) {
			return $can_sync;
		}

		$master_list_id = Reader_Activation::get_esp_master_list_id();

		return Newspack_Newsletters_Contacts::upsert( $contact, $master_list_id, $context, $existing_contact );
	}

	/**
	 * Pull contact data from the ESP for a given user.
	 *
	 * @param int $user_id WordPress user ID.
	 *
	 * @return array|\WP_Error Associative array of field_key => value pairs on success, WP_Error on failure.
	 */
	public function pull_contact_data( $user_id ) {
		$can_sync = $this->can_sync( true );
		if ( $can_sync->has_errors() ) {
			return $can_sync;
		}

		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return new \WP_Error( 'user_not_found', __( 'User not found.', 'newspack-plugin' ) );
		}

		$contact_data = Newspack_Newsletters_Subscription::get_contact_data( $user->user_email, true );

		if ( is_wp_error( $contact_data ) ) {
			return $contact_data;
		}

		if ( ! empty( $contact_data['metadata'] ) ) {
			return $contact_data['metadata'];
		}

		return [];
	}

	/**
	 * Get incoming available contact fields from the integration.
	 *
	 * @return Incoming_Contact_Field[]|\WP_Error Array of incoming contact field objects or WP_Error on failure.
	 */
	public function get_incoming_available_contact_fields() {

		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			return new \WP_Error(
				'newspack_newsletters_contacts_not_found',
				__( 'Newspack Newsletters is not available.', 'newspack-plugin' )
			);
		}

		$master_list_id = Reader_Activation::get_esp_master_list_id();

		if ( empty( $master_list_id ) ) {
			return new \WP_Error(
				'ras_esp_master_list_id_not_found',
				__( 'ESP master list ID is not set.', 'newspack-plugin' )
			);
		}

		$fields = Newspack_Newsletters_Contacts::get_fields( $master_list_id );

		if ( is_wp_error( $fields ) ) {
			return $fields;
		}

		return array_map(
			function( $field ) {
				return new Incoming_Contact_Field( $field['key'] );
			},
			$fields
		);
	}
}

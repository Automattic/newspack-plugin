<?php
/**
 * ESP integration
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Integrations;

use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation\Sync;
use Newspack\Reader_Activation\Sync\Metadata;
use Newspack\Reader_Activation\Integrations;
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
		parent::__construct(
			'esp',
			__( 'ESP', 'newspack-plugin' ),
			__( 'Sync reader data and activity to the connected email service provider.', 'newspack-plugin' )
		);
	}

	/**
	 * Register the settings fields declared by this integration.
	 *
	 * Dynamically builds the field list based on the active ESP provider.
	 * Only returns fields when ESP is configured.
	 *
	 * @return array Array of settings field declarations.
	 */
	public function register_settings_fields() {
		$fields = [];
		if ( ! Reader_Activation::is_esp_configured() ) {
			return $fields;
		}
		$list_options = $this->get_list_options();
		$provider     = $this->get_provider();
		if ( $provider ) {
			switch ( $provider->service ) {
				case 'mailchimp':
					$fields[] = [
						'key'         => 'mailchimp_audience_id',
						'type'        => 'select',
						'label'       => __( 'Mailchimp Audience', 'newspack-plugin' ),
						'description' => __( 'Choose an audience to receive reader activity data.', 'newspack-plugin' ),
						'options'     => $list_options,
						'default'     => '',
					];
					$fields[] = [
						'key'         => 'mailchimp_reader_default_status',
						'type'        => 'select',
						'label'       => __( 'Default reader status', 'newspack-plugin' ),
						'description' => __( 'Choose which Mailchimp status readers should have by default if they are not subscribed to any newsletters.', 'newspack-plugin' ),
						'options'     => [
							[
								'label' => __( 'Transactional/Non-Subscribed', 'newspack-plugin' ),
								'value' => 'transactional',
							],
							[
								'label' => __( 'Subscribed', 'newspack-plugin' ),
								'value' => 'subscribed',
							],
						],
						'default'     => 'transactional',
					];
					break;
				case 'active_campaign':
					$fields[] = [
						'key'         => 'active_campaign_master_list',
						'type'        => 'select',
						'label'       => __( 'ActiveCampaign Master List', 'newspack-plugin' ),
						'description' => __( 'Choose a master list to which all registered readers will be added.', 'newspack-plugin' ),
						'options'     => $list_options,
						'default'     => '',
					];
					break;
				case 'constant_contact':
					$fields[] = [
						'key'         => 'constant_contact_list_id',
						'type'        => 'select',
						'label'       => __( 'Constant Contact Master List', 'newspack-plugin' ),
						'description' => __( 'Choose a master list to which all registered readers will be added.', 'newspack-plugin' ),
						'options'     => $list_options,
						'default'     => '',
					];
					break;
			}
		}
		$fields[] = [
			'key'         => 'sync_esp_delete',
			'type'        => 'checkbox',
			'label'       => __( 'Sync user account deletion', 'newspack-plugin' ),
			'description' => __( 'When a reader account is deleted, also remove the contact from the ESP.', 'newspack-plugin' ),
			'default'     => true,
		];
		return $fields;
	}

	/**
	 * Get the active ESP provider name.
	 *
	 * @return Newspack_Newsletters_Service_Provider|null The service provider object or null if not available.
	 */
	private function get_provider() {
		if ( class_exists( 'Newspack_Newsletters' ) ) {
			return \Newspack_Newsletters::get_service_provider();
		}
		return null;
	}

	/**
	 * Get list options from the Newsletters API for select fields.
	 *
	 * @return array Array of options with label and value keys.
	 */
	private function get_list_options() {
		if ( ! method_exists( 'Newspack_Newsletters_Subscription', 'get_lists' ) ) {
			return [];
		}

		$lists = Newspack_Newsletters_Subscription::get_lists();
		if ( is_wp_error( $lists ) || ! is_array( $lists ) ) {
			return [];
		}

		$provider = $this->get_provider();

		// For Mailchimp, filter out groups and tags, only include remote lists.
		if ( 'mailchimp' === $provider->service ) {
			$lists = $provider->get_lists( true );
		}

		$options = [
			[
				'label' => __( 'None', 'newspack-plugin' ),
				'value' => '',
			],
		];
		foreach ( $lists as $list ) {
			$options[] = [
				'label' => $list['name'] ?? $list['id'],
				'value' => $list['id'],
			];
		}

		return $options;
	}

	/**
	 * Get the master list ID from integration settings.
	 *
	 * @return string|false The master list ID or false.
	 */
	public function get_master_list_id() {
		$provider = $this->get_provider();
		if ( ! $provider ) {
			return false;
		}
		switch ( $provider->service ) {
			case 'mailchimp':
				$audience_id = $this->get_settings_field_value( 'mailchimp_audience_id' );
				return ! empty( $audience_id ) ? $audience_id : false;
			case 'active_campaign':
				$list_id = $this->get_settings_field_value( 'active_campaign_master_list' );
				return ! empty( $list_id ) ? $list_id : false;
			case 'constant_contact':
				$list_id = $this->get_settings_field_value( 'constant_contact_list_id' );
				return ! empty( $list_id ) ? $list_id : false;
			default:
				return false;
		}
	}

	/**
	 * Get the enabled outgoing metadata fields for the ESP integration.
	 *
	 * Overrides the parent to provide lazy migration from the legacy global
	 * option (Metadata::FIELDS_OPTION) to the per-integration option.
	 *
	 * @return string[] List of enabled field names.
	 */
	public function get_enabled_outgoing_fields() {
		$fields = \get_option( self::OUTGOING_FIELDS_OPTION_PREFIX . $this->id, null );
		if ( null !== $fields && is_array( $fields ) ) {
			return $fields;
		}

		// Migrate from legacy global option.
		$legacy = \get_option( Sync\Metadata::FIELDS_OPTION, null );
		if ( null !== $legacy && is_array( $legacy ) ) {
			$this->update_enabled_outgoing_fields( $legacy );
			return $legacy;
		}

		return Sync\Metadata::get_default_fields();
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

		if ( ! Integrations::is_enabled( $this->get_id() ) ) {
			$errors->add(
				'ras_esp_sync_not_enabled',
				__( 'ESP sync is not enabled.', 'newspack-plugin' )
			);
		}
		if ( ! $this->get_master_list_id() ) {
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

		$master_list_id = $this->get_master_list_id();

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
	 * Test the live connection to the ESP.
	 *
	 * Delegates to Newspack_Newsletters::test_connection() if available.
	 * By the time this runs, can_sync() has already passed.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function test_connection() {
		if ( ! method_exists( 'Newspack_Newsletters', 'test_connection' ) ) {
			return true;
		}
		return \Newspack_Newsletters::test_connection();
	}

	/**
	 * Get incoming available contact fields from the integration.
	 *
	 * @return Incoming_Contact_Field[]|\WP_Error Array of incoming contact field objects or WP_Error on failure.
	 */
	public function get_available_incoming_contact_fields() {
		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			return new \WP_Error(
				'newspack_newsletters_contacts_not_found',
				__( 'Newspack Newsletters is not available.', 'newspack-plugin' )
			);
		}

		$master_list_id = $this->get_master_list_id();

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

<?php
/**
 * Base integration class for contact data syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Base Integration Class.
 *
 * This class should be extended by specific integration implementations.
 */
abstract class Integration {
	/**
	 * Option name prefix for storing selected fields per integration.
	 *
	 * @var string
	 */
	const OPTION_PREFIX = 'newspack_integration_selected_fields_';

	/**
	 * The unique identifier for this integration.
	 *
	 * @var string
	 */
	protected $id;

	/**
	 * The display name for this integration.
	 *
	 * @var string
	 */
	protected $name;

	/**
	 * Settings fields for this integration.
	 *
	 * @var array
	 */
	protected $settings_fields = [];

	/**
	 * Constructor.
	 *
	 * @param string $id              The unique identifier for this integration.
	 * @param string $name            The display name for this integration.
	 */
	public function __construct( $id, $name ) {
		$this->id   = $id;
		$this->name = $name;
	}

	/**
	 * Get the integration ID.
	 *
	 * @return string The integration ID.
	 */
	public function get_id() {
		return $this->id;
	}

	/**
	 * Get the integration name.
	 *
	 * @return string The integration name.
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	abstract public function can_sync( $return_errors = false );

	/**
	 * Push contact data to the integration destination.
	 *
	 * This method should be implemented by child classes to send
	 * contact data to their specific integration destination.
	 *
	 * @param array      $contact The contact data to push.
	 * @param string     $context Optional. The context of the sync.
	 * @param array|null $existing_contact Optional. Existing contact data if available.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	abstract public function push_contact_data( $contact, $context = '', $existing_contact = null );

	/**
	 * Pull contact data from the integration for a given user.
	 *
	 * Integrations that support pulling contact data should implement this method.
	 *
	 * @param int $user_id WordPress user ID.
	 *
	 * @return array|\WP_Error Associative array of field_key => value pairs on success, WP_Error on failure.
	 */
	public function pull_contact_data( $user_id ) {
		return [];
	}

	/**
	 * Get incoming available contact fields from the integration.
	 *
	 * This method should be implemented by child classes to return
	 * an array of available contact fields from their integration.
	 *
	 * Integrations that support pulling contact data should implement this method.
	 *
	 * @return Integrations\Incoming_Contact_Field[]|\WP_Error Array of incoming contact field objects or WP_Error on failure.
	 */
	public function get_incoming_available_contact_fields() {
		return [];
	}

	/**
	 * Get incoming contact fields that are not already in the metadata.
	 *
	 * This method filters the available contact fields to exclude fields
	 * whose keys already exist in the synced metadata.
	 *
	 * @return Integrations\Incoming_Contact_Field[]|\WP_Error Array of filtered incoming contact field objects or WP_Error on failure.
	 */
	public function get_incoming_contact_fields() {
		$available_fields = $this->get_incoming_available_contact_fields();

		if ( is_wp_error( $available_fields ) ) {
			return $available_fields;
		}

		$prefixed_keys = Sync\Metadata::get_all_prefixed_keys();

		return array_filter(
			$available_fields,
			function( $field ) use ( $prefixed_keys ) {
				return ! in_array( $field->get_key(), $prefixed_keys, true );
			}
		);
	}

	/**
	 * Get the selected fields for this integration.
	 *
	 * @return array Array of selected field keys.
	 */
	public function get_selected_fields() {
		return \get_option( self::OPTION_PREFIX . $this->id, [] );
	}

	/**
	 * Set the selected fields for this integration.
	 *
	 * @param array $fields Array of field keys to store.
	 * @return bool True if the option was updated, false otherwise.
	 */
	public function set_selected_fields( $fields ) {
		return \update_option( self::OPTION_PREFIX . $this->id, array_values( $fields ) );
	}
}

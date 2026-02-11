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
	 * Get incoming available contact fields from the integration.
	 *
	 * This method should be implemented by child classes to return
	 * an array of available contact fields from their integration.
	 *
	 * @return Integrations\Incoming_Contact_Field[]|\WP_Error Array of incoming contact field objects or WP_Error on failure.
	 */
	abstract public function get_incoming_available_contact_fields();

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
}

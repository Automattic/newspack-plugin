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
	 * Option name prefix for storing enabled outgoing metadata fields per integration.
	 *
	 * @var string
	 */
	const OUTGOING_FIELDS_OPTION_PREFIX = 'newspack_integration_outgoing_fields_';

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
	 * @return bool|\WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
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
	 * Register data event handlers for this integration.
	 *
	 * Called by Integrations after all integrations have been registered.
	 * Concrete classes should override this and call $this->register_handler()
	 * for each data event they need to handle.
	 */
	public function register_handlers() {}

	/**
	 * Register a data event handler for this integration.
	 *
	 * Delegates to Integrations which owns the handler map and
	 * registers a serializable static callable with Data Events.
	 *
	 * The referenced method must have the following signature:
	 *   public function $method( int $timestamp, array $data, string $client_id ): void
	 *
	 * @param string $action_name The data event action name.
	 * @param string $method      The instance method to call on this integration.
	 */
	final protected function register_handler( $action_name, $method ) {
		Integrations::register_data_event_handler( $this, static::class, $action_name, $method );
	}

	/**
	 * Static dispatcher called by Data Events.
	 *
	 * Thin trampoline that delegates to Integrations::dispatch_data_event_handler().
	 * This method must live on Integration so that late static binding
	 * (static::class) produces a unique serializable callable per concrete
	 * subclass, which Data Events needs for independent handler retries.
	 *
	 * @param int    $timestamp Timestamp of the event.
	 * @param array  $data      Data associated with the event.
	 * @param string $client_id Client ID.
	 *
	 * @throws \RuntimeException When the handler cannot be dispatched.
	 */
	final public static function dispatch_data_event_handler( $timestamp, $data, $client_id ) {
		Integrations::dispatch_data_event_handler( static::class, $timestamp, $data, $client_id );
	}

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

	/**
	 * Get the enabled outgoing metadata fields for this integration.
	 *
	 * @return string[] List of enabled field names.
	 */
	public function get_enabled_outgoing_fields() {
		return array_values( \get_option( self::OUTGOING_FIELDS_OPTION_PREFIX . $this->id, Sync\Metadata::get_default_fields() ) );
	}

	/**
	 * Update the enabled outgoing metadata fields for this integration.
	 *
	 * @param array $fields List of field names to enable.
	 * @return bool True if updated, false otherwise.
	 */
	public function update_enabled_outgoing_fields( $fields ) {
		// Only allow fields that are in the metadata keys map.
		$fields = array_intersect( Sync\Metadata::get_default_fields(), $fields );
		return \update_option( self::OUTGOING_FIELDS_OPTION_PREFIX . $this->id, array_values( $fields ) );
	}

	/**
	 * Filter metadata keys to only those whose field name is enabled for outgoing sync.
	 *
	 * @param string[] $keys Array of raw metadata keys to filter.
	 * @return array Filtered key-value pairs from Metadata::get_keys().
	 */
	public function filter_enabled_outgoing_fields( $keys ) {
		$enabled_fields = $this->get_enabled_outgoing_fields();
		return array_filter(
			Sync\Metadata::get_keys(),
			function( $val, $key ) use ( $keys, $enabled_fields ) {
				return in_array( $key, $keys ) && in_array( $val, $enabled_fields );
			},
			ARRAY_FILTER_USE_BOTH
		);
	}

	/**
	 * Get the raw (unprefixed) metadata keys enabled for outgoing sync.
	 *
	 * @return string[] List of raw metadata keys.
	 */
	public function get_enabled_outgoing_fields_raw_keys() {
		$enabled_fields = $this->get_enabled_outgoing_fields();
		$raw_keys       = [];

		foreach ( Sync\Metadata::get_keys() as $raw_key => $field_name ) {
			if ( in_array( $field_name, $enabled_fields, true ) ) {
				$raw_keys[] = $raw_key;
			}
		}

		return array_unique( $raw_keys );
	}

	/**
	 * Get the prefixed metadata keys enabled for outgoing sync.
	 *
	 * @return string[] List of prefixed metadata keys.
	 */
	public function get_enabled_outgoing_fields_prefixed_keys() {
		$enabled_fields = $this->get_enabled_outgoing_fields();
		$prefixed_keys  = [];

		foreach ( Sync\Metadata::get_keys() as $raw_key => $field_name ) {
			if ( in_array( $field_name, $enabled_fields, true ) ) {
				$prefixed_keys[] = Sync\Metadata::get_key( $raw_key );
			}
		}

		return array_unique( $prefixed_keys );
	}
}

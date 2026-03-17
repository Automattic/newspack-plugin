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
	 * Map of ESP setting keys to their legacy option names.
	 *
	 * @var array<string, string>
	 */
	private static $legacy_option_map = [
		'mailchimp_audience_id'           => 'newspack_reader_activation_mailchimp_audience_id',
		'mailchimp_reader_default_status' => 'newspack_reader_activation_mailchimp_reader_default_status',
		'active_campaign_master_list'     => 'newspack_reader_activation_active_campaign_master_list',
		'constant_contact_list_id'        => 'newspack_reader_activation_constant_contact_list_id',
		'sync_esp_delete'                 => 'newspack_reader_activation_sync_esp_delete',
	];

	/**
	 * Option name prefix for storing enabled incoming metadata fields per integration.
	 *
	 * @var string
	 */
	const INCOMING_FIELDS_OPTION_PREFIX = 'newspack_integration_incoming_fields_';

	/**
	 * Option name prefix for storing enabled outgoing metadata fields per integration.
	 *
	 * @var string
	 */
	const OUTGOING_FIELDS_OPTION_PREFIX = 'newspack_integration_outgoing_fields_';

	/**
	 * Option name prefix for storing all integration settings.
	 *
	 * @var string
	 */
	const SETTINGS_OPTION_PREFIX = 'newspack_integration_settings_';

	/**
	 * Option name prefix for storing metadata prefix per integration.
	 *
	 * @var string
	 */
	const METADATA_PREFIX_OPTION_PREFIX = 'newspack_integration_metadata_prefix_';

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
	 * A short description for this integration.
	 *
	 * @var string
	 */
	protected $description = '';

	/**
	 * Settings fields for this integration.
	 *
	 * @var array
	 */
	protected $settings_fields = [];

	/**
	 * Constructor.
	 *
	 * @param string $id          The unique identifier for this integration.
	 * @param string $name        The display name for this integration.
	 * @param string $description Optional. A short description for this integration.
	 */
	public function __construct( $id, $name, $description = '' ) {
		$this->id          = $id;
		$this->name        = $name;
		$this->description = $description;

		$this->settings_fields = $this->register_settings_fields();
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
	 * Get the integration description.
	 *
	 * @return string The integration description.
	 */
	public function get_description() {
		return $this->description;
	}

	/**
	 * Register settings fields for this integration.
	 *
	 * Child classes should override this method to return static field
	 * declarations (key, type, default at minimum). No API calls, no conditional
	 * logic based on external state. Called directly in the constructor.
	 *
	 * @return array Array of settings field declarations.
	 */
	abstract public function register_settings_fields();

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
	public function get_available_incoming_contact_fields() {
		return [];
	}

	/**
	 * Get filtered incoming contact fields from the integration.
	 *
	 * @return Integrations\Incoming_Contact_Field[] Array of incoming contact field objects.
	 */
	public function get_filtered_incoming_contact_fields() {
		$fields = $this->get_available_incoming_contact_fields();
		if ( is_wp_error( $fields ) ) {
			return [];
		}
		$keys_to_filter = Sync\Metadata::get_all_prefixed_keys();
		return array_values(
			array_filter(
				$fields,
				function( $field ) use ( $keys_to_filter ) {
					foreach ( $keys_to_filter as $key_to_filter ) {
						if ( strpos( $field->get_key(), $key_to_filter ) === 0 ) {
							return false;
						}
					}
					return true;
				}
			)
		);
	}

	/**
	 * Test the live connection to the integration service.
	 *
	 * Subclasses should override this to perform a lightweight API call
	 * verifying credentials and reachability.
	 *
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function test_connection() {
		return true;
	}

	/**
	 * Run a full health check: settings validation + live connection test.
	 *
	 * @return true|\WP_Error True if healthy, WP_Error on failure.
	 */
	final public function health_check() {
		$errors = $this->can_sync( true );
		if ( is_wp_error( $errors ) && $errors->has_errors() ) {
			return $errors;
		}
		try {
			$connection = $this->test_connection();
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'newspack_integration_connection_error', $e->getMessage() );
		}
		if ( is_wp_error( $connection ) ) {
			return $connection;
		}
		return true;
	}

	/**
	 * Get the enabled incoming metadata fields for this integration.
	 *
	 * @return string[] List of enabled field names.
	 */
	public function get_enabled_incoming_fields() {
		return \get_option( self::INCOMING_FIELDS_OPTION_PREFIX . $this->id, [] );
	}

	/**
	 * Get the enabled outgoing metadata fields for this integration.
	 *
	 * @return string[] List of enabled field names.
	 */
	public function get_enabled_outgoing_fields() {
		return array_values( \get_option( self::OUTGOING_FIELDS_OPTION_PREFIX . $this->id, [] ) );
	}

	/**
	 * Update the enabled incoming metadata fields for this integration.
	 *
	 * @param array $fields List of field names to enable.
	 *
	 * @return bool True if updated, false otherwise.
	 */
	public function update_enabled_incoming_fields( $fields ) {
		return \update_option( self::INCOMING_FIELDS_OPTION_PREFIX . $this->id, $fields );
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
			function ( $val, $key ) use ( $keys, $enabled_fields ) {
				return in_array( $key, $keys, true ) && in_array( $val, $enabled_fields, true );
			},
			ARRAY_FILTER_USE_BOTH
		);
	}

	/**
	 * Get the metadata keys enabled for outgoing sync.
	 *
	 * @param bool $prefixed Optional. Whether to return prefixed keys instead of raw keys. Default false.
	 *
	 * @return string[] List of raw metadata keys.
	 */
	public function get_enabled_outgoing_fields_keys( $prefixed = false ) {
		$enabled_fields = $this->get_enabled_outgoing_fields();
		$keys           = [];

		foreach ( Sync\Metadata::get_keys() as $raw_key => $field_name ) {
			if ( in_array( $field_name, $enabled_fields, true ) ) {
				$keys[] = $prefixed ? $this->get_metadata_prefix() . $field_name : $raw_key;
			}
		}

		return array_unique( $keys );
	}

	/**
	 * Get the metadata fields declared by this integration.
	 *
	 * @return array Array of settings field declarations.
	 */
	public function get_metadata_fields() {
		return [
			[
				'key'         => 'metadata_prefix',
				'type'        => 'text',
				'label'       => __( 'Metadata field prefix', 'newspack-plugin' ),
				'description' => __( 'A string to prefix metadata fields synced to the integration. Required to ensure that metadata field names are unique. Default: NP_', 'newspack-plugin' ),
				'default'     => 'NP_',
			],
			[
				'key'     => 'outgoing_metadata_fields',
				'type'    => 'metadata',
				'label'   => __( 'Outgoing metadata fields', 'newspack-plugin' ),
				'default' => [],
			],
			[
				'key'     => 'incoming_metadata_fields',
				'type'    => 'metadata',
				'label'   => __( 'Incoming metadata fields', 'newspack-plugin' ),
				'default' => [],
			],
		];
	}

	/**
	 * Get the metadata prefix for this integration.
	 *
	 * @return string The metadata prefix.
	 */
	public function get_metadata_prefix() {
		$value = \get_option( self::METADATA_PREFIX_OPTION_PREFIX . $this->id, null );
		if ( null !== $value ) {
			return $value;
		}
		// Lazy migrate from legacy global option.
		$legacy_value = \get_option( Sync\Metadata::PREFIX_OPTION, null );
		if ( null !== $legacy_value ) {
			// update option directly to avoid infinite loop.
			\update_option( self::METADATA_PREFIX_OPTION_PREFIX . $this->id, $legacy_value );
			return $legacy_value;
		}
		return 'NP_';
	}

	/**
	 * Update the metadata prefix for this integration.
	 *
	 * @param string $prefix The new prefix value.
	 * @return bool True if updated, false otherwise.
	 */
	public function update_metadata_prefix( $prefix ) {
		if ( empty( $prefix ) ) {
			$prefix = 'NP_';
		}
		return \update_option( self::METADATA_PREFIX_OPTION_PREFIX . $this->id, \sanitize_text_field( $prefix ) );
	}

	/**
	 * Get the settings fields declared by this integration.
	 *
	 * @return array Array of settings field declarations.
	 */
	public function get_settings_fields() {
		return array_merge(
			$this->settings_fields,
			$this->get_metadata_fields()
		);
	}

	/**
	 * Get the value of a settings field.
	 *
	 * @param string $key The field key.
	 * @return mixed The field value, or the default if not set.
	 */
	public function get_settings_field_value( $key ) {
		// Route metadata fields to their dedicated getters.
		if ( 'metadata_prefix' === $key ) {
			return $this->get_metadata_prefix();
		}
		if ( 'outgoing_metadata_fields' === $key ) {
			return $this->get_enabled_outgoing_fields();
		}
		if ( 'incoming_metadata_fields' === $key ) {
			return $this->get_enabled_incoming_fields();
		}

		$field = $this->get_settings_field_by_key( $key );
		if ( ! $field ) {
			return null;
		}
		$option_name = self::SETTINGS_OPTION_PREFIX . $this->id . '_' . $key;
		$value       = \get_option( $option_name, null );

		if ( null !== $value ) {
			return $value;
		}
		// Attempt to migrate old setting if the field is found in the key map.
		if ( isset( self::$legacy_option_map[ $key ] ) ) {
			// Lazy migrate from legacy option.
			$legacy_value = \get_option( self::$legacy_option_map[ $key ], null );
			if ( null !== $legacy_value ) {
				// update option directly to avoid infinite loop.
				\update_option( $option_name, $legacy_value );
				return $legacy_value;
			}
		}
		return $field['default'] ?? '';
	}

	/**
	 * Update the value of a settings field.
	 *
	 * @param string $key   The field key.
	 * @param mixed  $value The new value.
	 * @return bool True if updated, false otherwise.
	 */
	public function update_settings_field_value( $key, $value ) {
		$field = $this->get_settings_field_by_key( $key );
		if ( ! $field ) {
			return false;
		}
		$sanitized = $this->sanitize_settings_field_value( $field, $value );

		// Route metadata fields to their dedicated setters.
		if ( 'metadata_prefix' === $key ) {
			return $this->update_metadata_prefix( $sanitized );
		}
		if ( 'outgoing_metadata_fields' === $key ) {
			return $this->update_enabled_outgoing_fields( $sanitized );
		}
		if ( 'incoming_metadata_fields' === $key ) {
			return $this->update_enabled_incoming_fields( $sanitized );
		}

		$option_name = self::SETTINGS_OPTION_PREFIX . $this->id . '_' . $key;
		return \update_option( $option_name, $sanitized );
	}

	/**
	 * Get settings config with current values populated, for API responses.
	 *
	 * Child classes can override this method to return filtered or enriched settings.
	 *
	 * @return array Array of field declarations with current values.
	 */
	public function get_settings_config() {
		$fields = $this->get_settings_fields();
		$config = [];
		foreach ( $fields as $field ) {
			$field['value'] = $this->get_settings_field_value( $field['key'] );
			// Inject metadata options for metadata fields.
			if ( 'incoming_metadata_fields' === $field['key'] ) {
				$incoming_fields  = $this->get_filtered_incoming_contact_fields();
				$field['options'] = array_map(
					function ( $incoming_field ) {
						return $incoming_field->get_key();
					},
					is_wp_error( $incoming_fields ) ? [] : $incoming_fields
				);
			}
			if ( 'outgoing_metadata_fields' === $field['key'] ) {
				$field['options'] = Sync\Metadata::get_default_fields();
			}
			$config[] = $field;
		}
		return $config;
	}

	/**
	 * Get a settings field declaration by key.
	 *
	 * @param string $key The field key.
	 * @return array|null The field declaration or null if not found.
	 */
	private function get_settings_field_by_key( $key ) {
		foreach ( $this->get_settings_fields() as $field ) {
			if ( $field['key'] === $key ) {
				return $field;
			}
		}
		return null;
	}

	/**
	 * Sanitize a settings field value based on its type.
	 *
	 * @param array $field The field declaration.
	 * @param mixed $value The value to sanitize.
	 * @return mixed The sanitized value.
	 */
	private function sanitize_settings_field_value( $field, $value ) {
		$type = $field['type'] ?? 'text';
		switch ( $type ) {
			case 'checkbox':
				return (bool) $value;
			case 'number':
				return is_numeric( $value ) ? $value + 0 : ( $field['default'] ?? 0 );
			case 'select':
				$valid_values = array_column( $field['options'] ?? [], 'value' );
				if ( empty( $valid_values ) ) {
					return \sanitize_text_field( $value );
				}
				return in_array( $value, $valid_values, true ) ? $value : ( $field['default'] ?? '' );
			case 'metadata':
				if ( ! is_array( $value ) ) {
					return $field['default'] ?? [];
				}
				return array_values( array_map( 'sanitize_text_field', $value ) );
			case 'textarea':
				return \sanitize_textarea_field( $value );
			case 'text':
			case 'password':
			default:
				return \sanitize_text_field( $value );
		}
	}
}

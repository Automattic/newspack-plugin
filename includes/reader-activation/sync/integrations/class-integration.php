<?php
/**
 * Base integration class for contact data syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync;

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
	 * @param array  $settings_fields Optional. Array of settings field definitions to register.
	 */
	public function __construct( $id, $name, $settings_fields = [] ) {
		$this->id   = $id;
		$this->name = $name;

		// Register settings fields if provided.
		if ( ! empty( $settings_fields ) ) {
			$this->register_settings_fields( $settings_fields );
		}
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
	 * Register settings fields for this integration.
	 *
	 * This method accepts an array of field definitions that describe the settings
	 * fields for this integration. Each field definition should be an associative array
	 * with the following structure:
	 *
	 * @example
	 * $fields = [
	 *     [
	 *         'key'               => 'integration_api_key',           // Required: Unique identifier for this setting
	 *         'description'       => 'API Key',                       // Required: Human-readable label
	 *         'type'              => 'text',                          // Required: Field type (text, select, checkbox, textarea, password)
	 *         'default'           => '',                              // Optional: Default value for the field
	 *         'options'           => [ 'key' => 'Label' ],            // Optional: Array of options for select fields
	 *         'placeholder'       => 'Enter your API key',            // Optional: Placeholder text for input fields
	 *         'help'              => 'Find your API key in settings', // Optional: Help text displayed near the field
	 *         'helpURL'           => 'https://example.com/docs',      // Optional: URL for additional help documentation
	 *         'provider'          => 'service_name',                  // Optional: Provider identifier if field is provider-specific
	 *         'sanitize_callback' => 'sanitize_text_field',           // Optional: Callback function to sanitize input
	 *         'onboarding'        => true,                            // Optional: Whether to show in onboarding flow (default: false)
	 *     ],
	 * ];
	 *
	 * Field Types:
	 * - 'text': Standard text input field
	 * - 'password': Password input field (masked)
	 * - 'textarea': Multi-line text area
	 * - 'select': Dropdown selection (requires 'options' parameter)
	 * - 'checkbox': Boolean checkbox field
	 * - 'number': Numeric input field
	 *
	 * @param array $fields Array of field definitions. Each field must contain at minimum:
	 *                      'key', 'description', and 'type' keys.
	 *
	 * @return true|\WP_Error True on success, WP_Error on validation failure.
	 */
	public function register_settings_fields( $fields ) {
		// Validate that fields is an array.
		if ( ! is_array( $fields ) ) {
			return new \WP_Error(
				'invalid_fields',
				__( 'Settings fields must be an array.', 'newspack-plugin' )
			);
		}

		$validated_fields = [];
		$valid_types      = [ 'text', 'password', 'textarea', 'select', 'checkbox', 'number' ];

		foreach ( $fields as $index => $field ) {
			// Validate that each field is an array.
			if ( ! is_array( $field ) ) {
				return new \WP_Error(
					'invalid_field_format',
					sprintf(
						/* translators: %d: Field index */
						__( 'Field at index %d must be an array.', 'newspack-plugin' ),
						$index
					)
				);
			}

			// Validate required keys.
			$required_keys = [ 'key', 'description', 'type' ];
			foreach ( $required_keys as $required_key ) {
				if ( empty( $field[ $required_key ] ) ) {
					return new \WP_Error(
						'missing_required_field',
						sprintf(
							/* translators: 1: Required key name, 2: Field index */
							__( 'Field at index %2$d is missing required key: %1$s.', 'newspack-plugin' ),
							$required_key,
							$index
						)
					);
				}
			}

			// Validate field type.
			if ( ! in_array( $field['type'], $valid_types, true ) ) {
				return new \WP_Error(
					'invalid_field_type',
					sprintf(
						/* translators: 1: Field type, 2: Field key, 3: Valid types */
						__( 'Invalid field type "%1$s" for field "%2$s". Valid types are: %3$s.', 'newspack-plugin' ),
						$field['type'],
						$field['key'],
						implode( ', ', $valid_types )
					)
				);
			}

			// Validate that select fields have options.
			if ( 'select' === $field['type'] && empty( $field['options'] ) ) {
				return new \WP_Error(
					'missing_select_options',
					sprintf(
						/* translators: %s: Field key */
						__( 'Select field "%s" must have an "options" parameter.', 'newspack-plugin' ),
						$field['key']
					)
				);
			}

			// Validate sanitize_callback if provided.
			if ( ! empty( $field['sanitize_callback'] ) && ! is_callable( $field['sanitize_callback'] ) ) {
				return new \WP_Error(
					'invalid_sanitize_callback',
					sprintf(
						/* translators: %s: Field key */
						__( 'Invalid sanitize_callback for field "%s". Must be a valid callable function.', 'newspack-plugin' ),
						$field['key']
					)
				);
			}

			// Set defaults for optional fields.
			$field['onboarding'] = $field['onboarding'] ?? false;
			$field['default']    = $field['default'] ?? '';

			$validated_fields[] = $field;
		}

		$this->settings_fields = $validated_fields;

		return true;
	}

	/**
	 * Get registered settings fields.
	 *
	 * @return array Array of registered settings fields.
	 */
	public function get_settings_fields() {
		return $this->settings_fields;
	}

	/**
	 * Get settings values for this integration.
	 *
	 * Retrieves setting values from the database. Only returns settings
	 * that are registered in the settings fields.
	 *
	 * @return array Associative array of setting key => value pairs.
	 */
	public function get_settings() {
		$option_name = 'newspack_integration_' . $this->id . '_settings';
		$settings    = get_option( $option_name, [] );

		if ( ! is_array( $settings ) ) {
			return [];
		}

		// Only return settings that are registered.
		$registered_keys = array_column( $this->settings_fields, 'key' );
		$valid_settings  = [];

		foreach ( $settings as $key => $value ) {
			if ( in_array( $key, $registered_keys, true ) ) {
				$valid_settings[ $key ] = $value;
			}
		}

		// Apply defaults for missing settings.
		foreach ( $this->settings_fields as $field ) {
			if ( ! isset( $valid_settings[ $field['key'] ] ) && isset( $field['default'] ) ) {
				$valid_settings[ $field['key'] ] = $field['default'];
			}
		}

		return $valid_settings;
	}

	/**
	 * Save settings for this integration.
	 *
	 * Only settings that are registered in the settings fields can be saved.
	 * Invalid settings will be filtered out.
	 *
	 * @param array $settings Associative array of setting key => value pairs to save.
	 *
	 * @return bool|\WP_Error True on success, WP_Error on failure.
	 */
	public function save_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return new \WP_Error(
				'invalid_settings',
				__( 'Settings must be an array.', 'newspack-plugin' )
			);
		}

		// Get registered setting keys.
		$registered_keys = array_column( $this->settings_fields, 'key' );

		// Filter out invalid settings and sanitize.
		$valid_settings = [];
		foreach ( $settings as $key => $value ) {
			if ( ! in_array( $key, $registered_keys, true ) ) {
				continue;
			}

			// Find the field definition.
			$field = null;
			foreach ( $this->settings_fields as $field_def ) {
				if ( $field_def['key'] === $key ) {
					$field = $field_def;
					break;
				}
			}

			if ( ! $field ) {
				continue;
			}

			// Apply sanitization callback if provided.
			if ( ! empty( $field['sanitize_callback'] ) && is_callable( $field['sanitize_callback'] ) ) {
				$value = call_user_func( $field['sanitize_callback'], $value );
			}

			$valid_settings[ $key ] = $value;
		}

		$option_name = 'newspack_integration_' . $this->id . '_settings';
		$result      = update_option( $option_name, $valid_settings );

		return $result ? true : new \WP_Error(
			'save_settings_failed',
			__( 'Failed to save settings.', 'newspack-plugin' )
		);
	}

	/**
	 * Get metadata keys for this integration.
	 *
	 * Retrieves the array of metadata keys from the database that are
	 * currently configured for this integration.
	 *
	 * @return array Array of metadata keys.
	 */
	public function get_metadata_keys() {
		$option_name = 'newspack_integration_' . $this->id . '_metadata_keys';
		$keys        = get_option( $option_name, [] );

		if ( ! is_array( $keys ) ) {
			return [];
		}

		return $keys;
	}

	/**
	 * Save metadata keys for this integration.
	 *
	 * Stores the array of metadata keys to the database.
	 *
	 * @param array $keys Array of metadata keys to save.
	 *
	 * @return bool|\WP_Error True on success, WP_Error on failure.
	 */
	public function save_metadata_keys( $keys ) {
		if ( ! is_array( $keys ) ) {
			return new \WP_Error(
				'invalid_metadata_keys',
				__( 'Metadata keys must be an array.', 'newspack-plugin' )
			);
		}

		// Sanitize each key.
		$sanitized_keys = array_map( 'sanitize_key', $keys );

		$option_name = 'newspack_integration_' . $this->id . '_metadata_keys';
		$result      = update_option( $option_name, $sanitized_keys );

		return $result ? true : new \WP_Error(
			'save_metadata_keys_failed',
			__( 'Failed to save metadata keys.', 'newspack-plugin' )
		);
	}

	/**
	 * Get contact data from the integration source.
	 *
	 * This method calls the fetch_contact_data() method implemented by child classes
	 * and filters the returned data to only include registered metadata keys.
	 *
	 * @param mixed $email The contact email to retrieve data for.
	 *
	 * @return array|\WP_Error Array of contact data or WP_Error on failure.
	 */
	public function get_contact_data( $email ) {
		$data = $this->fetch_contact_data( $email );

		// Filter out keys that are not registered metadata keys.
		$registered_keys = $this->get_metadata_keys();

		$registered_keys = array_map( 'strtolower', $registered_keys );

		if ( is_array( $data ) && ! empty( $registered_keys ) ) {
			foreach ( $data as $key => $value ) {
				if ( ! in_array( strtolower( $key ), $registered_keys, true ) ) {
					unset( $data[ $key ] );
				}
			}
		}
		return $data;
	}

	/**
	 * Fetch contact data from the integration source.
	 *
	 * This should be a simple key value pair of data.
	 *
	 * This method should be implemented by child classes to retrieve
	 * contact data from their specific integration source.
	 *
	 * @param mixed $email The contact email to retrieve data for.
	 *
	 * @return array|\WP_Error Array of contact data or WP_Error on failure.
	 */
	abstract public function fetch_contact_data( $email );

	/**
	 * Push contact data to the integration destination.
	 *
	 * This method should be implemented by child classes to send
	 * contact data to their specific integration destination.
	 *
	 * @param array  $contact The contact data to push.
	 * @param string $context Optional. The context of the sync.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	abstract public function push_contact_data( $contact, $context = '' );

}

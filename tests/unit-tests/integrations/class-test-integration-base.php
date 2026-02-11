<?php
/**
 * Tests for the Integration base class.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation\Integrations\Incoming_Contact_Field;
use Newspack\Reader_Activation\Sync\Metadata;

/**
 * Mock Integration class that returns configurable field data.
 */
class Mock_Integration extends Integration {
	/**
	 * The fields to return from get_incoming_available_contact_fields.
	 *
	 * @var Incoming_Contact_Field[]|\WP_Error
	 */
	private $available_fields;

	/**
	 * Set the available fields.
	 *
	 * @param Incoming_Contact_Field[]|\WP_Error $fields The fields to return.
	 */
	public function set_available_fields( $fields ) {
		$this->available_fields = $fields;
	}

	/**
	 * Push contact data (test implementation).
	 *
	 * @param array      $contact The contact data.
	 * @param string     $context The sync context.
	 * @param array|null $existing_contact Existing contact data if available.
	 * @return true
	 */
	public function push_contact_data( $contact, $context = '', $existing_contact = null ) {
		return true;
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	public function can_sync( $return_errors = false ) {
		return $return_errors ? new \WP_Error() : true;
	}

	/**
	 * Get incoming available contact fields from the integration.
	 *
	 * @return Incoming_Contact_Field[]|\WP_Error Array of incoming contact field objects or WP_Error on failure.
	 */
	public function get_incoming_available_contact_fields() {
		return $this->available_fields;
	}
}

/**
 * Tests for the Integration base class.
 */
class Test_Integration_Base extends \WP_UnitTestCase {

	/**
	 * Integration instance for testing.
	 *
	 * @var Mock_Integration
	 */
	private $integration;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->integration = new Mock_Integration( 'test-integration', 'Test Integration' );
	}

	/**
	 * Test get_incoming_contact_fields filters out reserved metadata keys.
	 */
	public function test_get_incoming_contact_fields_filters_reserved_keys() {
		// Create a mix of fields - some that match reserved keys and some that don't.
		$available_fields = [
			new Incoming_Contact_Field( 'NP_Account' ),
			new Incoming_Contact_Field( 'NP_Registration Date' ),
			new Incoming_Contact_Field( 'custom_field_1' ),
			new Incoming_Contact_Field( 'custom_field_2' ),
			new Incoming_Contact_Field( 'NP_Membership Status' ),
		];

		$this->integration->set_available_fields( $available_fields );

		// Get the filtered fields.
		$filtered_fields = $this->integration->get_incoming_contact_fields();

		// Extract the keys from filtered fields.
		$filtered_keys = array_map(
			function( $field ) {
				return $field->get_key();
			},
			$filtered_fields
		);

		// Get the reserved keys to compare.
		$prefixed_keys = Metadata::get_all_prefixed_keys();

		// Assert that reserved keys are filtered out.
		foreach ( $filtered_keys as $key ) {
			$this->assertNotContains(
				$key,
				$prefixed_keys,
				"Field with key '{$key}' should be filtered out as it matches a reserved metadata key."
			);
		}

		// Assert that custom fields remain.
		$this->assertContains( 'custom_field_1', $filtered_keys );
		$this->assertContains( 'custom_field_2', $filtered_keys );

		// Assert that reserved fields are not present.
		$this->assertNotContains( 'NP_Account', $filtered_keys );
		$this->assertNotContains( 'NP_Registration Date', $filtered_keys );
	}

	/**
	 * Test get_incoming_contact_fields propagates WP_Error.
	 */
	public function test_get_incoming_contact_fields_propagates_error() {
		// Create a WP_Error to simulate a failure.
		$error = new \WP_Error( 'api_error', 'Failed to fetch fields from API' );
		$this->integration->set_available_fields( $error );

		// Get the result.
		$result = $this->integration->get_incoming_contact_fields();

		// Assert that the error is propagated.
		$this->assertWPError( $result );
		$this->assertEquals( 'api_error', $result->get_error_code() );
		$this->assertEquals( 'Failed to fetch fields from API', $result->get_error_message() );
	}

	/**
	 * Test get_incoming_contact_fields with empty available fields.
	 */
	public function test_get_incoming_contact_fields_empty_available_fields() {
		$this->integration->set_available_fields( [] );

		$filtered_fields = $this->integration->get_incoming_contact_fields();

		$this->assertIsArray( $filtered_fields );
		$this->assertEmpty( $filtered_fields );
	}

	/**
	 * Test get_incoming_contact_fields with all fields being reserved.
	 */
	public function test_get_incoming_contact_fields_all_fields_reserved() {
		// Create fields that all match reserved keys.
		$available_fields = [
			new Incoming_Contact_Field( 'NP_Account' ),
			new Incoming_Contact_Field( 'NP_Registration Date' ),
			new Incoming_Contact_Field( 'NP_Membership Status' ),
		];

		$this->integration->set_available_fields( $available_fields );

		$filtered_fields = $this->integration->get_incoming_contact_fields();

		// All fields should be filtered out.
		$this->assertIsArray( $filtered_fields );
		$this->assertEmpty( $filtered_fields );
	}

	/**
	 * Test get_incoming_contact_fields with no reserved keys.
	 */
	public function test_get_incoming_contact_fields_no_reserved_keys() {
		// Create fields that don't match any reserved keys.
		$available_fields = [
			new Incoming_Contact_Field( 'custom_field_1' ),
			new Incoming_Contact_Field( 'custom_field_2' ),
			new Incoming_Contact_Field( 'custom_field_3' ),
		];

		$this->integration->set_available_fields( $available_fields );

		$filtered_fields = $this->integration->get_incoming_contact_fields();

		// All fields should remain.
		$this->assertIsArray( $filtered_fields );
		$this->assertCount( 3, $filtered_fields );

		$filtered_keys = array_map(
			function( $field ) {
				return $field->get_key();
			},
			$filtered_fields
		);

		$this->assertContains( 'custom_field_1', $filtered_keys );
		$this->assertContains( 'custom_field_2', $filtered_keys );
		$this->assertContains( 'custom_field_3', $filtered_keys );
	}

	/**
	 * Test get_incoming_contact_fields with different metadata prefix.
	 */
	public function test_get_incoming_contact_fields_with_custom_prefix() {
		// Set a custom prefix.
		$original_prefix = Metadata::get_prefix();
		update_option( Metadata::PREFIX_OPTION, 'CUSTOM_' );

		// Create fields with the custom prefix.
		$available_fields = [
			new Incoming_Contact_Field( 'CUSTOM_Account' ),
			new Incoming_Contact_Field( 'custom_field_1' ),
			new Incoming_Contact_Field( 'NP_Account' ), // This shouldn't be filtered with the new prefix.
		];

		$this->integration->set_available_fields( $available_fields );

		// Reset the cached keys to pick up the new prefix.
		$reflection = new \ReflectionClass( Metadata::class );
		$property   = $reflection->getProperty( 'keys' );
		$property->setAccessible( true );
		$property->setValue( null, [] );

		$filtered_fields = $this->integration->get_incoming_contact_fields();

		$filtered_keys = array_map(
			function( $field ) {
				return $field->get_key();
			},
			$filtered_fields
		);

		// The CUSTOM_Account should be filtered out, but NP_Account should remain.
		$this->assertNotContains( 'CUSTOM_Account', $filtered_keys );
		$this->assertContains( 'custom_field_1', $filtered_keys );
		$this->assertContains( 'NP_Account', $filtered_keys );

		// Restore original prefix.
		update_option( Metadata::PREFIX_OPTION, $original_prefix );
		$property->setValue( null, [] );
	}
}

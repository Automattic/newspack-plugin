<?php
/**
 * Tests for the ESP integration's configure_incoming_field() behavior.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Reader_Activation\Integrations\ESP;
use Newspack\Reader_Activation\Integrations\Incoming_Field;

/**
 * Tests for the ESP integration.
 *
 * @group esp_integration
 */
class Test_ESP extends \WP_UnitTestCase {

	/**
	 * Invoke the protected configure_incoming_field() method on an ESP instance.
	 *
	 * @param ESP            $esp   The ESP integration instance.
	 * @param Incoming_Field $field The field to configure.
	 * @return Incoming_Field
	 */
	private function invoke_configure( ESP $esp, Incoming_Field $field ) {
		$method = new \ReflectionMethod( ESP::class, 'configure_incoming_field' );
		$method->setAccessible( true );
		return $method->invoke( $esp, $field );
	}

	/**
	 * A full schema drives every Incoming_Field setter.
	 */
	public function test_configure_applies_full_schema() {
		$raw = [
			'key'                 => 'membership_level',
			'name'                => 'Membership Level',
			'value_type'          => 'string',
			'matching_function'   => 'list__in',
			'options'             => [
				[
					'value' => 'gold',
					'label' => 'Gold',
				],
			],
			'description'         => 'Reader membership tier.',
			'is_access_rule'      => true,
			'is_segment_criteria' => true,
		];
		$configured = $this->invoke_configure( new ESP(), new Incoming_Field( 'membership_level', $raw ) );

		$this->assertSame( 'Membership Level', $configured->get_name() );
		$this->assertSame( 'string', $configured->get_value_type() );
		$this->assertSame( 'list__in', $configured->get_matching_function() );
		$this->assertSame( $raw['options'], $configured->get_options() );
		$this->assertSame( 'Reader membership tier.', $configured->get_description() );
		$this->assertTrue( $configured->is_access_rule() );
		$this->assertTrue( $configured->is_segment_criteria() );
	}

	/**
	 * An empty schema leaves all Incoming_Field defaults untouched.
	 */
	public function test_configure_keeps_defaults_when_schema_is_empty() {
		$configured = $this->invoke_configure( new ESP(), new Incoming_Field( 'plain_field', [] ) );

		$this->assertSame( 'plain_field', $configured->get_name() );
		$this->assertSame( 'string', $configured->get_value_type() );
		$this->assertSame( 'default', $configured->get_matching_function() );
		$this->assertSame( [], $configured->get_options() );
		$this->assertSame( '', $configured->get_description() );
		$this->assertFalse( $configured->is_access_rule() );
		$this->assertFalse( $configured->is_segment_criteria() );
	}

	/**
	 * Mis-typed schema values are ignored rather than propagated into the Incoming_Field.
	 */
	public function test_configure_ignores_invalid_types() {
		$raw = [
			'name'              => [ 'not', 'a', 'string' ],
			'value_type'        => new \stdClass(),
			'matching_function' => [],
			'options'           => 'not-an-array',
			'description'       => new \stdClass(),
		];
		$configured = $this->invoke_configure( new ESP(), new Incoming_Field( 'weird', $raw ) );

		$this->assertSame( 'weird', $configured->get_name() );
		$this->assertSame( 'string', $configured->get_value_type() );
		$this->assertSame( 'default', $configured->get_matching_function() );
		$this->assertSame( [], $configured->get_options() );
		$this->assertSame( '', $configured->get_description() );
	}

	/**
	 * The promotion flags are parsed with wp_validate_boolean() so the string "false" stays false.
	 */
	public function test_configure_uses_strict_boolean_parsing() {
		$false_raw = [
			'is_access_rule'      => 'false',
			'is_segment_criteria' => 'false',
		];
		$false_field = $this->invoke_configure( new ESP(), new Incoming_Field( 'f', $false_raw ) );
		$this->assertFalse( $false_field->is_access_rule() );
		$this->assertFalse( $false_field->is_segment_criteria() );

		$truthy_raw = [
			'is_access_rule'      => 'yes',
			'is_segment_criteria' => '1',
		];
		$truthy_field = $this->invoke_configure( new ESP(), new Incoming_Field( 't', $truthy_raw ) );
		$this->assertTrue( $truthy_field->is_access_rule() );
		$this->assertTrue( $truthy_field->is_segment_criteria() );
	}

	/**
	 * Each available incoming field is piped through configure_incoming_field().
	 */
	public function test_get_available_incoming_fields_applies_configuration() {
		\Newspack_Newsletters_Contacts::$fields_fixture = [
			[
				'key'                 => 'org',
				'name'                => 'Organization',
				'value_type'          => 'string',
				'matching_function'   => 'default',
				'is_access_rule'      => true,
				'is_segment_criteria' => true,
			],
			[
				'key'        => 'is_vip',
				'name'       => 'VIP',
				'value_type' => 'boolean',
			],
		];

		$esp = new class() extends ESP {
			/**
			 * Bypass master-list-id resolution, which walks through newsletter settings
			 * we don't stage in this test.
			 *
			 * @return string
			 */
			public function get_master_list_id() {
				return 'test-list';
			}
		};

		$result = $esp->get_available_incoming_fields();
		$this->assertIsArray( $result );
		$this->assertCount( 2, $result );

		$this->assertSame( 'Organization', $result[0]->get_name() );
		$this->assertTrue( $result[0]->is_access_rule() );
		$this->assertTrue( $result[0]->is_segment_criteria() );

		$this->assertSame( 'VIP', $result[1]->get_name() );
		$this->assertSame( 'boolean', $result[1]->get_value_type() );
		$this->assertFalse( $result[1]->is_access_rule() );

		\Newspack_Newsletters_Contacts::reset_calls();
	}

	/**
	 * Filtered incoming fields are matched against the field `name` (the ESP-side
	 * label) so outgoing-sync fields are filtered out even though incoming `key` is
	 * now a stable machine identifier (Mailchimp `tag`, ActiveCampaign `perstag`).
	 */
	public function test_get_filtered_incoming_fields_excludes_outgoing_by_name() {
		\Newspack_Newsletters_Contacts::$fields_fixture = [
			[
				'key'  => 'MMERGE7',
				'name' => 'NP_Account',
			],
			[
				'key'  => 'MMERGE8',
				'name' => 'NP_First Name',
			],
			[
				'key'  => 'CUSTOM1',
				'name' => 'Custom Field',
			],
		];

		$esp = new class() extends ESP {
			/**
			 * Bypass master-list-id resolution for the test.
			 *
			 * @return string
			 */
			public function get_master_list_id() {
				return 'test-list';
			}
		};

		add_filter(
			'newspack_ras_metadata_keys',
			function () {
				return [
					'account'    => 'Account',
					'first_name' => 'First Name',
				];
			}
		);
		add_filter(
			'newspack_ras_metadata_prefix',
			function () {
				return 'NP_';
			}
		);

		$result = $esp->get_filtered_incoming_fields();

		remove_all_filters( 'newspack_ras_metadata_keys' );
		remove_all_filters( 'newspack_ras_metadata_prefix' );

		$this->assertCount( 1, $result );
		$this->assertSame( 'CUSTOM1', $result[0]->get_key() );
		$this->assertSame( 'Custom Field', $result[0]->get_name() );

		\Newspack_Newsletters_Contacts::reset_calls();
	}

	/**
	 * Entries without a usable string `key` are skipped rather than producing malformed fields.
	 */
	public function test_get_available_incoming_fields_skips_entries_without_usable_key() {
		\Newspack_Newsletters_Contacts::$fields_fixture = [
			[
				'key'  => 'good',
				'name' => 'Good',
			],
			[
				'name' => 'Missing key',
			],
			[
				'key'  => '',
				'name' => 'Empty key',
			],
			[
				'key'  => [ 'not', 'a', 'string' ],
				'name' => 'Non-string key',
			],
			'not-an-array',
		];

		$esp = new class() extends ESP {
			/**
			 * Bypass master-list-id resolution for the test.
			 *
			 * @return string
			 */
			public function get_master_list_id() {
				return 'test-list';
			}
		};

		$result = $esp->get_available_incoming_fields();
		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );
		$this->assertSame( 'good', $result[0]->get_key() );

		\Newspack_Newsletters_Contacts::reset_calls();
	}
}

<?php
/**
 * Tests for Promoted_Fields.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Reader_Activation\Integrations;
use Newspack\Reader_Activation\Promoted_Fields;
use Sample_Integration;

/**
 * Tests for the Promoted_Fields class.
 *
 * @group promoted_fields
 */
class Test_Promoted_Fields extends \WP_UnitTestCase {

	/**
	 * Integration instance.
	 *
	 * @var Sample_Integration
	 */
	private $integration;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_integrations();
		Promoted_Fields::reset();

		$this->integration = new Sample_Integration( 'promoted-test', 'Test ESP' );
		Integrations::register( $this->integration );
		Integrations::enable( 'promoted-test' );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		Promoted_Fields::reset();
		$this->reset_integrations();
		Integrations::register_integrations();
		delete_option( 'newspack_integration_incoming_fields_promoted-test' );
		delete_option( Integrations::OPTION_NAME );
		parent::tear_down();
	}

	/**
	 * Reset integrations registry via reflection.
	 */
	private function reset_integrations() {
		$reflection = new \ReflectionClass( Integrations::class );
		$property   = $reflection->getProperty( 'integrations' );
		$property->setAccessible( true );
		$property->setValue( null, [] );
	}

	/**
	 * Test that get_promoted_fields returns empty when no fields are configured.
	 */
	public function test_returns_empty_when_no_incoming_fields() {
		$fields = Promoted_Fields::get_promoted_fields();
		$this->assertIsArray( $fields );
		$this->assertEmpty( $fields );
	}

	/**
	 * Test that incoming fields without config are not promoted.
	 */
	public function test_incoming_fields_without_config_not_promoted() {
		$this->integration->update_enabled_incoming_fields( [ 'some_field' ] );
		Promoted_Fields::reset();

		$fields = Promoted_Fields::get_promoted_fields();
		$this->assertEmpty( $fields );
	}

	/**
	 * Test that incoming fields with config are promoted.
	 */
	public function test_incoming_fields_with_config_promoted() {
		$this->integration->update_enabled_incoming_fields( [ 'organization' ] );

		// Override get_incoming_field_config via filter.
		add_filter(
			'newspack_promoted_fields',
			function () {
				return [
					'organization' => [
						'name'                => 'Organization',
						'is_access_rule'      => true,
						'is_segment_criteria' => true,
						'category'            => 'integrations',
						'matching_function'   => 'default',
						'reader_data_key'     => 'organization',
					],
				];
			}
		);
		Promoted_Fields::reset();

		$fields = Promoted_Fields::get_promoted_fields();
		$this->assertArrayHasKey( 'organization', $fields );
		$this->assertTrue( $fields['organization']['is_access_rule'] );
		$this->assertTrue( $fields['organization']['is_segment_criteria'] );

		remove_all_filters( 'newspack_promoted_fields' );
	}

	/**
	 * Test that promoted field names are prefixed with integration name.
	 */
	public function test_field_name_prefixed_with_integration_name() {
		// Use a subclass that returns config.
		$integration = new class( 'prefix-test', 'ActiveCampaign' ) extends Sample_Integration {
			/**
			 * Return config for the org field.
			 *
			 * @param string $key Field key.
			 * @return array
			 */
			public function get_incoming_field_config( $key ) {
				if ( 'org' === $key ) {
					return [
						'name'                => 'Organization',
						'is_access_rule'      => true,
						'is_segment_criteria' => true,
					];
				}
				return [];
			}
		};

		$this->reset_integrations();
		Integrations::register( $integration );
		Integrations::enable( 'prefix-test' );
		$integration->update_enabled_incoming_fields( [ 'org' ] );
		Promoted_Fields::reset();

		$fields = Promoted_Fields::get_promoted_fields();
		$this->assertArrayHasKey( 'org', $fields );
		$this->assertSame( 'ActiveCampaign: Organization', $fields['org']['name'] );
	}

	/**
	 * Test that default values are applied for missing config keys.
	 */
	public function test_defaults_applied() {
		$integration = new class( 'defaults-test', 'TestInt' ) extends Sample_Integration {
			/**
			 * Return minimal config.
			 *
			 * @param string $key Field key.
			 * @return array
			 */
			public function get_incoming_field_config( $key ) {
				if ( 'role' === $key ) {
					return [
						'is_segment_criteria' => true,
					];
				}
				return [];
			}
		};

		$this->reset_integrations();
		Integrations::register( $integration );
		Integrations::enable( 'defaults-test' );
		$integration->update_enabled_incoming_fields( [ 'role' ] );
		Promoted_Fields::reset();

		$fields = Promoted_Fields::get_promoted_fields();
		$this->assertArrayHasKey( 'role', $fields );
		$this->assertSame( 'integrations', $fields['role']['category'] );
		$this->assertSame( 'default', $fields['role']['matching_function'] );
		$this->assertSame( 'role', $fields['role']['reader_data_key'] );
		// Name defaults to field key, prefixed with integration name.
		$this->assertSame( 'TestInt: role', $fields['role']['name'] );
	}

	/**
	 * Test that evaluate_field works for default matching.
	 */
	public function test_evaluate_default_matching() {
		$user_id = $this->factory->user->create();

		// Store a reader data item.
		if ( class_exists( '\Newspack\Reader_Data' ) ) {
			\Newspack\Reader_Data::update_item( $user_id, 'org', 'Newspack' );
		}

		$method = new \ReflectionMethod( Promoted_Fields::class, 'evaluate_field' );
		$method->setAccessible( true );

		$config = [
			'matching_function' => 'default',
			'reader_data_key'   => 'org',
		];

		$this->assertTrue( $method->invoke( null, 'org', $config, $user_id, 'Newspack' ) );
		$this->assertFalse( $method->invoke( null, 'org', $config, $user_id, 'Other' ) );
	}

	/**
	 * Test that evaluate_field handles boolean value_type.
	 */
	public function test_evaluate_boolean_matching() {
		$user_id = $this->factory->user->create();

		$method = new \ReflectionMethod( Promoted_Fields::class, 'evaluate_field' );
		$method->setAccessible( true );

		$config = [
			'value_type'      => 'boolean',
			'reader_data_key' => 'is_vip',
		];

		// No data stored — falsy.
		$this->assertTrue( $method->invoke( null, 'is_vip', $config, $user_id, 'no' ) );
		$this->assertFalse( $method->invoke( null, 'is_vip', $config, $user_id, 'yes' ) );

		// Store truthy value.
		if ( class_exists( '\Newspack\Reader_Data' ) ) {
			\Newspack\Reader_Data::update_item( $user_id, 'is_vip', '1' );
		}

		$this->assertTrue( $method->invoke( null, 'is_vip', $config, $user_id, 'yes' ) );
		$this->assertFalse( $method->invoke( null, 'is_vip', $config, $user_id, 'no' ) );

		// Access rule style — no specific args, just check truthiness.
		$this->assertTrue( $method->invoke( null, 'is_vip', $config, $user_id, null ) );
	}
}

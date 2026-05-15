<?php
/**
 * Tests for account-deletion handling in the Integration framework.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Reader_Activation\Integrations;
use Sample_Integration;

/**
 * Account deletion test case.
 *
 * @group account-deletion
 */
class Test_Account_Deletion extends \WP_UnitTestCase {

	/**
	 * Test integration instance.
	 *
	 * @var Sample_Integration
	 */
	private $integration;

	/**
	 * Set up the test environment before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_integrations();
		$this->integration = new Sample_Integration( 'deletion-test', 'Deletion Test' );
		Integrations::register( $this->integration );
	}

	/**
	 * Tear down the test environment after each test.
	 */
	public function tear_down() {
		$this->reset_integrations();
		Integrations::register_integrations();
		parent::tear_down();
	}

	/**
	 * Reset the static integrations registry so each test starts clean.
	 */
	private function reset_integrations() {
		$reflection = new \ReflectionClass( Integrations::class );
		$property   = $reflection->getProperty( 'integrations' );
		$property->setAccessible( true );
		$property->setValue( null, [] );
	}

	/**
	 * The base Integration::delete_contact() should return a "not_implemented" WP_Error.
	 */
	public function test_delete_contact_default_returns_not_implemented_error() {
		$result = $this->integration->delete_contact( 'reader@example.com' );
		$this->assertWPError( $result );
		$this->assertSame( 'not_implemented', $result->get_error_code() );
	}

	/**
	 * Settings fields should include the new sync_account_deletion and
	 * account_deletion_handling keys auto-appended by the base class.
	 */
	public function test_settings_include_sync_account_deletion_and_handling() {
		$keys = array_column( $this->integration->get_settings_fields(), 'key' );
		$this->assertContains( 'sync_account_deletion', $keys );
		$this->assertContains( 'account_deletion_handling', $keys );
	}

	/**
	 * The account_deletion_handling field should declare a `condition`
	 * predicate that gates it on the sync_account_deletion checkbox.
	 */
	public function test_account_deletion_handling_declares_condition_on_checkbox() {
		$fields   = $this->integration->get_settings_fields();
		$handling = null;
		foreach ( $fields as $field ) {
			if ( 'account_deletion_handling' === $field['key'] ) {
				$handling = $field;
				break;
			}
		}
		$this->assertIsArray( $handling );
		$this->assertSame( 'sync_account_deletion', $handling['condition']['field'] ?? null );
		$this->assertSame( true, $handling['condition']['equals'] ?? null );
	}

	/**
	 * With no legacy option and no per-integration option set,
	 * sync_account_deletion should default to true.
	 */
	public function test_sync_account_deletion_defaults_to_true_when_no_legacy() {
		delete_option( 'newspack_reader_activation_sync_esp_delete' );
		delete_option( 'newspack_integration_settings_deletion-test_sync_account_deletion' );
		$this->assertTrue( (bool) $this->integration->get_settings_field_value( 'sync_account_deletion' ) );
	}

	/**
	 * The account_deletion_handling field should default to "delete" when no value is stored.
	 */
	public function test_account_deletion_handling_defaults_to_delete() {
		delete_option( 'newspack_integration_settings_deletion-test_account_deletion_handling' );
		$this->assertSame( 'delete', $this->integration->get_settings_field_value( 'account_deletion_handling' ) );
	}

	/**
	 * A legacy sync_esp_delete=true should migrate to sync_account_deletion=true
	 * and the per-integration option should be persisted after the lookup.
	 */
	public function test_migration_legacy_true_to_sync_account_deletion_true() {
		delete_option( 'newspack_integration_settings_deletion-test_sync_account_deletion' );
		update_option( 'newspack_reader_activation_sync_esp_delete', true );

		$this->assertTrue( (bool) $this->integration->get_settings_field_value( 'sync_account_deletion' ) );

		// Migration should persist the new option after resolution.
		$this->assertNotFalse(
			get_option( 'newspack_integration_settings_deletion-test_sync_account_deletion', false )
		);
	}

	/**
	 * A legacy sync_esp_delete=false should migrate to sync_account_deletion=false.
	 */
	public function test_migration_legacy_false_to_sync_account_deletion_false() {
		delete_option( 'newspack_integration_settings_deletion-test_sync_account_deletion' );
		delete_option( 'newspack_reader_activation_sync_esp_delete' );
		add_option( 'newspack_reader_activation_sync_esp_delete', false );

		$this->assertFalse( (bool) $this->integration->get_settings_field_value( 'sync_account_deletion' ) );
	}
}

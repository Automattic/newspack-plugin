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
		// Allow sync on the test (non-production) site so Sync::can_sync() does
		// not bail out inside the dispatcher tests below.
		if ( ! defined( 'NEWSPACK_ALLOW_READER_SYNC' ) ) {
			define( 'NEWSPACK_ALLOW_READER_SYNC', true );
		}
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

	/**
	 * When an integration is configured with handling='delete', the dispatcher
	 * must call $integration->delete_contact() and not push the contact.
	 */
	public function test_handle_account_deletion_calls_delete_when_handling_delete() {
		$this->reset_integrations();
		$spy = new \Deletion_Spy_Integration( 'spy-a', 'Spy A' );
		Integrations::register( $spy );
		$spy->update_settings_field_value( 'sync_account_deletion', true );
		$spy->update_settings_field_value( 'account_deletion_handling', 'delete' );
		Integrations::enable( 'spy-a' );

		\Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
			'reader@example.com',
			[
				'email'    => 'reader@example.com',
				'metadata' => [],
			],
			'TestContext'
		);

		$this->assertCount( 1, $spy->delete_calls );
		$this->assertSame( 'reader@example.com', $spy->delete_calls[0]['email'] );
		$this->assertCount( 0, $spy->push_calls );
	}

	/**
	 * When handling='flag', the dispatcher must push the contact with an
	 * `account_deleted` ISO8601 timestamp in metadata and not call delete_contact.
	 */
	public function test_handle_account_deletion_calls_push_with_iso_timestamp_when_handling_flag() {
		$this->reset_integrations();
		$spy = new \Deletion_Spy_Integration( 'spy-b', 'Spy B' );
		Integrations::register( $spy );
		$spy->update_settings_field_value( 'sync_account_deletion', true );
		$spy->update_settings_field_value( 'account_deletion_handling', 'flag' );
		Integrations::enable( 'spy-b' );

		\Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
			'reader@example.com',
			[
				'email'    => 'reader@example.com',
				'metadata' => [],
			],
			'TestContext'
		);

		$this->assertCount( 0, $spy->delete_calls );
		$this->assertCount( 1, $spy->push_calls );

		$pushed = $spy->push_calls[0]['contact'];
		$this->assertSame( 'reader@example.com', $pushed['email'] );
		$this->assertArrayHasKey( 'account_deleted', $pushed['metadata'] );
		$this->assertNotFalse(
			strtotime( $pushed['metadata']['account_deleted'] ),
			'account_deleted must be an ISO8601-parseable timestamp.'
		);
	}

	/**
	 * Integrations with sync_account_deletion=false must be skipped entirely:
	 * neither delete_contact nor push_contact_data should be called on them.
	 */
	public function test_handle_account_deletion_skips_when_sync_off() {
		$this->reset_integrations();
		$spy = new \Deletion_Spy_Integration( 'spy-c', 'Spy C' );
		Integrations::register( $spy );
		// WP's update_option() short-circuits when storing a boolean false against
		// an absent option (the "no change" check compares against false). Use
		// add_option directly to make sure the value is persisted.
		delete_option( 'newspack_integration_settings_spy-c_sync_account_deletion' );
		add_option( 'newspack_integration_settings_spy-c_sync_account_deletion', false );
		$spy->update_settings_field_value( 'account_deletion_handling', 'delete' );
		Integrations::enable( 'spy-c' );

		\Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
			'reader@example.com',
			[
				'email'    => 'reader@example.com',
				'metadata' => [],
			],
			'TestContext'
		);

		$this->assertCount( 0, $spy->delete_calls );
		$this->assertCount( 0, $spy->push_calls );
	}

	/**
	 * Each integration's deletion routing is independent: a single dispatcher
	 * call can simultaneously delete from one integration, flag-push another,
	 * and skip a third based on per-integration settings.
	 */
	public function test_handle_account_deletion_routes_mixed_integrations_independently() {
		$this->reset_integrations();
		$delete_spy = new \Deletion_Spy_Integration( 'spy-d', 'Spy D' );
		$flag_spy   = new \Deletion_Spy_Integration( 'spy-e', 'Spy E' );
		$off_spy    = new \Deletion_Spy_Integration( 'spy-f', 'Spy F' );
		Integrations::register( $delete_spy );
		Integrations::register( $flag_spy );
		Integrations::register( $off_spy );

		$delete_spy->update_settings_field_value( 'sync_account_deletion', true );
		$delete_spy->update_settings_field_value( 'account_deletion_handling', 'delete' );
		$flag_spy->update_settings_field_value( 'sync_account_deletion', true );
		$flag_spy->update_settings_field_value( 'account_deletion_handling', 'flag' );
		// WP's update_option() short-circuits on boolean false against an absent
		// option; persist via add_option to ensure the off state sticks.
		delete_option( 'newspack_integration_settings_spy-f_sync_account_deletion' );
		add_option( 'newspack_integration_settings_spy-f_sync_account_deletion', false );

		Integrations::enable( 'spy-d' );
		Integrations::enable( 'spy-e' );
		Integrations::enable( 'spy-f' );

		\Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
			'reader@example.com',
			[
				'email'    => 'reader@example.com',
				'metadata' => [],
			],
			'TestContext'
		);

		$this->assertCount( 1, $delete_spy->delete_calls );
		$this->assertCount( 0, $delete_spy->push_calls );

		$this->assertCount( 0, $flag_spy->delete_calls );
		$this->assertCount( 1, $flag_spy->push_calls );

		$this->assertCount( 0, $off_spy->delete_calls );
		$this->assertCount( 0, $off_spy->push_calls );
	}

	/**
	 * When delete_contact() returns a WP_Error, the dispatcher must fire
	 * `newspack_sync_contact_failed` so Alert_Manager can record the failure.
	 * The payload's `context` stays a string (matching the existing contract),
	 * and a sibling `mode` key carries the deletion mode for downstream filtering.
	 */
	public function test_handle_account_deletion_fires_alert_action_on_delete_failure() {
		$this->reset_integrations();
		$spy = new \Deletion_Spy_Integration( 'spy-fail-delete', 'Spy Fail Delete' );
		$spy->delete_result = new \WP_Error( 'boom', 'ESP rejected delete' );
		Integrations::register( $spy );
		$spy->update_settings_field_value( 'sync_account_deletion', true );
		$spy->update_settings_field_value( 'account_deletion_handling', 'delete' );
		Integrations::enable( 'spy-fail-delete' );

		$captured = [];
		$listener = function ( $payload ) use ( &$captured ) {
			$captured[] = $payload;
		};
		add_action( 'newspack_sync_contact_failed', $listener );

		$result = \Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
			'reader@example.com',
			[
				'email'    => 'reader@example.com',
				'metadata' => [],
			],
			'TestContext'
		);

		remove_action( 'newspack_sync_contact_failed', $listener );

		$this->assertWPError( $result );
		$this->assertCount( 1, $captured, 'newspack_sync_contact_failed must fire once on delete failure.' );
		$this->assertSame( 'spy-fail-delete', $captured[0]['integration_id'] );
		$this->assertSame( 'reader@example.com', $captured[0]['contact']['email'] );
		$this->assertSame( 'TestContext', $captured[0]['context'] );
		$this->assertSame( 'delete', $captured[0]['mode'] );
		$this->assertSame( 'ESP rejected delete', $captured[0]['reason'] );
	}

	/**
	 * When push_contact_data() returns a WP_Error in flag mode, the dispatcher
	 * must fire `newspack_sync_contact_failed` with a sibling `mode` key set to
	 * `flag` (the `context` field stays a string per the existing contract).
	 */
	public function test_handle_account_deletion_fires_alert_action_on_flag_failure() {
		$this->reset_integrations();
		$spy = new \Deletion_Spy_Integration( 'spy-fail-flag', 'Spy Fail Flag' );
		$spy->push_result = new \WP_Error( 'boom', 'ESP rejected push' );
		Integrations::register( $spy );
		$spy->update_settings_field_value( 'sync_account_deletion', true );
		$spy->update_settings_field_value( 'account_deletion_handling', 'flag' );
		Integrations::enable( 'spy-fail-flag' );

		$captured = [];
		$listener = function ( $payload ) use ( &$captured ) {
			$captured[] = $payload;
		};
		add_action( 'newspack_sync_contact_failed', $listener );

		$result = \Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
			'reader@example.com',
			[
				'email'    => 'reader@example.com',
				'metadata' => [],
			],
			'TestContext'
		);

		remove_action( 'newspack_sync_contact_failed', $listener );

		$this->assertWPError( $result );
		$this->assertCount( 1, $captured, 'newspack_sync_contact_failed must fire once on flag-push failure.' );
		$this->assertSame( 'spy-fail-flag', $captured[0]['integration_id'] );
		$this->assertSame( 'reader@example.com', $captured[0]['contact']['email'] );
		$this->assertArrayHasKey( 'account_deleted', $captured[0]['contact']['metadata'] );
		$this->assertSame( 'TestContext', $captured[0]['context'] );
		$this->assertSame( 'flag', $captured[0]['mode'] );
		$this->assertSame( 'ESP rejected push', $captured[0]['reason'] );
	}

	/**
	 * In v1 metadata mode, Integration::prepare_contact() strips metadata keys that
	 * are not registered in Sync\Metadata::get_keys() and enabled_outgoing_fields.
	 * The dispatcher must re-inject account_deleted (with the integration's prefix)
	 * AFTER prepare_contact() so the deletion signal still reaches the ESP.
	 */
	public function test_handle_account_deletion_flag_preserves_account_deleted_in_v1_mode() {
		// Set metadata version to non-legacy via reflection.
		$reflection = new \ReflectionClass( \Newspack\Reader_Activation\Sync\Metadata::class );
		$property   = $reflection->getProperty( 'version' );
		$property->setAccessible( true );
		$original_version = $property->getValue();
		$property->setValue( null, '2' );

		try {
			$this->reset_integrations();
			$spy = new \Deletion_Spy_Integration( 'spy-v1-flag', 'Spy V1 Flag' );
			Integrations::register( $spy );
			$spy->update_settings_field_value( 'sync_account_deletion', true );
			$spy->update_settings_field_value( 'account_deletion_handling', 'flag' );
			Integrations::enable( 'spy-v1-flag' );

			\Newspack\Reader_Activation\Contact_Sync::handle_account_deletion(
				'reader@example.com',
				[
					'email'    => 'reader@example.com',
					'metadata' => [],
				],
				'TestContext'
			);

			$this->assertCount( 1, $spy->push_calls );
			$pushed = $spy->push_calls[0]['contact'];

			// account_deleted must survive prepare_contact in v1 mode, prefixed by the integration.
			$prefix = $spy->get_metadata_prefix();
			$this->assertArrayHasKey(
				$prefix . 'account_deleted',
				$pushed['metadata'],
				'Prefixed account_deleted must be present in the v1-mode flag-push payload.'
			);
			$this->assertNotFalse(
				strtotime( $pushed['metadata'][ $prefix . 'account_deleted' ] ),
				'account_deleted must be an ISO8601-parseable timestamp in v1 mode.'
			);
		} finally {
			$property->setValue( null, $original_version );
		}
	}
}

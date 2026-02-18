<?php
/**
 * Tests for the Integrations class.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation\Integrations;
use Sample_Integration;

/**
 * Tests for the Integrations class.
 */
class Test_Integrations extends \WP_UnitTestCase {

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Integrations::OPTION_NAME );
		$this->reset_integrations();
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
	 * Test registering an integration.
	 */
	public function test_register_integration() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );

		$this->assertTrue( Integrations::register( $integration ) );
		$this->assertNotNull( Integrations::get_integration( 'test-id' ) );
	}

	/**
	 * Test registering duplicate integration returns false.
	 */
	public function test_register_duplicate_returns_false() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );

		Integrations::register( $integration );
		$this->assertFalse( Integrations::register( $integration ) );
	}

	/**
	 * Test registering invalid object returns false.
	 */
	public function test_register_invalid_returns_false() {
		$this->assertFalse( Integrations::register( new \stdClass() ) );
	}

	/**
	 * Test enabling an integration.
	 */
	public function test_enable_integration() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		Integrations::register( $integration );

		$this->assertTrue( Integrations::enable( 'test-id' ) );
		$this->assertTrue( Integrations::is_enabled( 'test-id' ) );
	}

	/**
	 * Test enabling unregistered integration returns false.
	 */
	public function test_enable_unregistered_returns_false() {
		$this->assertFalse( Integrations::enable( 'nonexistent' ) );
	}

	/**
	 * Test disabling an integration.
	 */
	public function test_disable_integration() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		Integrations::register( $integration );
		Integrations::enable( 'test-id' );

		$this->assertTrue( Integrations::disable( 'test-id' ) );
		$this->assertFalse( Integrations::is_enabled( 'test-id' ) );
	}

	/**
	 * Test get_active_integrations returns only enabled ones.
	 */
	public function test_get_active_integrations() {
		$integration1 = new Sample_Integration( 'enabled', 'Enabled' );
		$integration2 = new Sample_Integration( 'disabled', 'Disabled' );

		Integrations::register( $integration1 );
		Integrations::register( $integration2 );
		Integrations::enable( 'enabled' );

		$active = Integrations::get_active_integrations();

		$this->assertArrayHasKey( 'enabled', $active );
		$this->assertArrayNotHasKey( 'disabled', $active );
	}

	/**
	 * Test get_available_integrations returns all registered.
	 */
	public function test_get_available_integrations() {
		$integration1 = new Sample_Integration( 'one', 'One' );
		$integration2 = new Sample_Integration( 'two', 'Two' );

		Integrations::register( $integration1 );
		Integrations::register( $integration2 );

		$available = Integrations::get_available_integrations();

		$this->assertCount( 2, $available );
		$this->assertArrayHasKey( 'one', $available );
		$this->assertArrayHasKey( 'two', $available );
	}

	/**
	 * Test get_incoming_contact_fields returns empty array when no fields available.
	 */
	public function test_get_incoming_contact_fields_empty() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		Integrations::register( $integration );

		$fields = $integration->get_incoming_contact_fields();

		$this->assertIsArray( $fields );
		$this->assertEmpty( $fields );
	}

	/**
	 * Test get_incoming_contact_fields propagates WP_Error from get_incoming_available_contact_fields.
	 */
	public function test_get_incoming_contact_fields_propagates_error() {
		$integration = new class( 'error-test', 'Error Test' ) extends Sample_Integration {
			/**
			 * Get incoming available contact fields (returns error for test).
			 *
			 * @return \WP_Error
			 */
			public function get_incoming_available_contact_fields() {
				return new \WP_Error( 'test_error', 'Test error message' );
			}
		};

		Integrations::register( $integration );

		$result = $integration->get_incoming_contact_fields();

		$this->assertWPError( $result );
		$this->assertEquals( 'test_error', $result->get_error_code() );
		$this->assertEquals( 'Test error message', $result->get_error_message() );
	}

	/**
	 * Test get_selected_fields returns empty array by default.
	 */
	public function test_get_selected_fields_default_empty() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );

		$this->assertSame( [], $integration->get_selected_fields() );
	}

	/**
	 * Test set_selected_fields and get_selected_fields round-trip.
	 */
	public function test_set_and_get_selected_fields() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		$fields      = [ 'first_name', 'last_name', 'phone' ];

		$integration->set_selected_fields( $fields );

		$this->assertSame( $fields, $integration->get_selected_fields() );
	}

	/**
	 * Test set_selected_fields stores any keys without validation.
	 */
	public function test_set_selected_fields_stores_any_keys() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		$fields      = [ 'nonexistent_field', 'another_unknown' ];

		$integration->set_selected_fields( $fields );

		$this->assertSame( $fields, $integration->get_selected_fields() );
	}

	/**
	 * Test pull is skipped when no user is logged in.
	 */
	public function test_pull_skipped_when_not_logged_in() {
		wp_set_current_user( 0 );

		Integrations::maybe_pull_contact_data();

		// No user meta should be written since no one is logged in.
		$users = get_users( [ 'meta_key' => Integrations::LAST_PULL_META ] );
		$this->assertEmpty( $users );
	}

	/**
	 * Test pull is throttled by the interval.
	 */
	public function test_pull_throttled_by_interval() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$now = time();
		update_user_meta( $user_id, Integrations::LAST_PULL_META, $now );

		Integrations::maybe_pull_contact_data();

		// The meta should remain unchanged (not updated to a newer timestamp).
		$last_pull = (int) get_user_meta( $user_id, Integrations::LAST_PULL_META, true );
		$this->assertSame( $now, $last_pull );
	}

	/**
	 * Test pull runs after interval and stores data via Reader_Data.
	 */
	public function test_pull_runs_after_interval() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		// Set last pull to beyond the interval.
		update_user_meta( $user_id, Integrations::LAST_PULL_META, time() - 301 );

		// Create an integration that returns data from pull.
		$integration = new class( 'pull-test', 'Pull Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning test data.
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @return array
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				return [ 'favorite_color' => 'blue' ];
			}
		};

		$integration->set_selected_fields( [ 'favorite_color' ] );
		Integrations::register( $integration );
		Integrations::enable( 'pull-test' );

		Integrations::maybe_pull_contact_data();

		// Verify the data was stored.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_favorite_color', true );
		$this->assertSame( 'blue', $stored );

		// Verify last pull meta was updated.
		$last_pull = (int) get_user_meta( $user_id, Integrations::LAST_PULL_META, true );
		$this->assertGreaterThanOrEqual( time() - 2, $last_pull );
	}

	/**
	 * Test pull filters returned data by selected fields only.
	 */
	public function test_pull_filters_by_selected_fields() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		update_user_meta( $user_id, Integrations::LAST_PULL_META, time() - 301 );

		$integration = new class( 'filter-test', 'Filter Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning multiple fields.
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @return array
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				return [
					'field_a' => 'value_a',
					'field_b' => 'value_b',
					'field_c' => 'value_c',
				];
			}
		};

		// Only select fields a and c.
		$integration->set_selected_fields( [ 'field_a', 'field_c' ] );
		Integrations::register( $integration );
		Integrations::enable( 'filter-test' );

		Integrations::maybe_pull_contact_data();

		// a and c should be stored.
		$this->assertSame( 'value_a', get_user_meta( $user_id, 'newspack_reader_data_item_field_a', true ) );
		$this->assertSame( 'value_c', get_user_meta( $user_id, 'newspack_reader_data_item_field_c', true ) );

		// b should NOT be stored.
		$this->assertEmpty( get_user_meta( $user_id, 'newspack_reader_data_item_field_b', true ) );
	}

	/**
	 * Test pull catches throwable from integration without fatal.
	 */
	public function test_pull_catches_throwable() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		update_user_meta( $user_id, Integrations::LAST_PULL_META, time() - 301 );

		$integration = new class( 'throw-test', 'Throw Test' ) extends Sample_Integration {
			/**
			 * Pull contact data that throws an exception.
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @throws \RuntimeException Always.
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				throw new \RuntimeException( 'Something went wrong' );
			}
		};

		$integration->set_selected_fields( [ 'some_field' ] );
		Integrations::register( $integration );
		Integrations::enable( 'throw-test' );

		// Should not throw — the routine catches Throwable.
		Integrations::maybe_pull_contact_data();

		// Last pull meta should still have been set.
		$last_pull = (int) get_user_meta( $user_id, Integrations::LAST_PULL_META, true );
		$this->assertGreaterThanOrEqual( time() - 2, $last_pull );
	}
}

<?php
/**
 * Tests for the Integrations class.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation\Integrations;
use Newspack\Reader_Activation\Integrations\Contact_Pull;
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

		Contact_Pull::maybe_pull_contact_data();

		// No user meta should be written since no one is logged in.
		$users = get_users( [ 'meta_key' => Contact_Pull::LAST_PULL_META ] );
		$this->assertEmpty( $users );
	}

	/**
	 * Test pull is throttled by the interval.
	 */
	public function test_pull_throttled_by_interval() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$now = time();
		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, $now );

		Contact_Pull::maybe_pull_contact_data();

		// The meta should remain unchanged (not updated to a newer timestamp).
		$last_pull = (int) get_user_meta( $user_id, Contact_Pull::LAST_PULL_META, true );
		$this->assertSame( $now, $last_pull );
	}

	/**
	 * Test sync pull runs when data is older than 24 hours.
	 */
	public function test_sync_pull_when_data_stale() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		// Set last pull to beyond the 24h threshold.
		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, time() - Contact_Pull::PULL_SYNC_THRESHOLD - 1 );

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

		Contact_Pull::maybe_pull_contact_data();

		// Verify the data was stored synchronously.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_favorite_color', true );
		$this->assertSame( 'blue', $stored );

		// Verify last pull meta was updated.
		$last_pull = (int) get_user_meta( $user_id, Contact_Pull::LAST_PULL_META, true );
		$this->assertGreaterThanOrEqual( time() - 2, $last_pull );
	}

	/**
	 * Test sync pull filters returned data by selected fields only.
	 */
	public function test_sync_pull_filters_by_selected_fields() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, time() - Contact_Pull::PULL_SYNC_THRESHOLD - 1 );

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

		Contact_Pull::maybe_pull_contact_data();

		// a and c should be stored.
		$this->assertSame( 'value_a', get_user_meta( $user_id, 'newspack_reader_data_item_field_a', true ) );
		$this->assertSame( 'value_c', get_user_meta( $user_id, 'newspack_reader_data_item_field_c', true ) );

		// b should NOT be stored.
		$this->assertEmpty( get_user_meta( $user_id, 'newspack_reader_data_item_field_b', true ) );
	}

	/**
	 * Test sync pull catches throwable from integration without fatal.
	 */
	public function test_sync_pull_catches_throwable() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, time() - Contact_Pull::PULL_SYNC_THRESHOLD - 1 );

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
		Contact_Pull::maybe_pull_contact_data();

		// Last pull meta should still have been set.
		$last_pull = (int) get_user_meta( $user_id, Contact_Pull::LAST_PULL_META, true );
		$this->assertGreaterThanOrEqual( time() - 2, $last_pull );
	}

	/**
	 * Test async pull is scheduled when data is fresh (< 24h but past interval).
	 */
	public function test_async_pull_scheduled_when_fresh() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		// Last pull 10 minutes ago — past interval but within 24h.
		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, time() - 600 );

		$integration = new class( 'async-test', 'Async Test' ) extends Sample_Integration {
			/**
			 * Pull contact data (should NOT be called synchronously).
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @return array
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				return [ 'city' => 'Portland' ];
			}
		};

		$integration->set_selected_fields( [ 'city' ] );
		Integrations::register( $integration );
		Integrations::enable( 'async-test' );

		Contact_Pull::maybe_pull_contact_data();

		// Data should NOT have been stored synchronously.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_city', true );
		$this->assertEmpty( $stored );

		// Verify an AS action was scheduled.
		$actions = as_get_scheduled_actions(
			[
				'hook'   => Contact_Pull::ASYNC_PULL_HOOK,
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			]
		);
		$this->assertNotEmpty( $actions );
	}

	/**
	 * Test handle_async_pull processes data for a single integration.
	 */
	public function test_handle_async_pull() {
		$user_id = $this->factory()->user->create();

		$integration = new class( 'handle-test', 'Handle Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning test data.
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @return array
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				return [ 'language' => 'PHP' ];
			}
		};

		$integration->set_selected_fields( [ 'language' ] );
		Integrations::register( $integration );
		Integrations::enable( 'handle-test' );

		Contact_Pull::handle_async_pull(
			[
				'user_id'        => $user_id,
				'integration_id' => 'handle-test',
			]
		);

		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_language', true );
		$this->assertSame( 'PHP', $stored );
	}

	/**
	 * Test handle_async_pull skips disabled integration.
	 */
	public function test_handle_async_pull_skips_disabled() {
		$user_id = $this->factory()->user->create();

		$integration = new class( 'disabled-test', 'Disabled Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning test data.
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @return array
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				return [ 'pet' => 'cat' ];
			}
		};

		$integration->set_selected_fields( [ 'pet' ] );
		Integrations::register( $integration );
		// Not enabled.

		Contact_Pull::handle_async_pull(
			[
				'user_id'        => $user_id,
				'integration_id' => 'disabled-test',
			]
		);

		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_pet', true );
		$this->assertEmpty( $stored );
	}

	/**
	 * Test that first-ever pull (no meta) runs synchronously.
	 */
	public function test_first_pull_runs_sync() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		// No LAST_PULL_META set — age will be time() - 0, which is > 24h.

		$integration = new class( 'first-test', 'First Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning test data.
			 *
			 * @param int $user_id WordPress user ID.
			 * @param int $timeout Max seconds.
			 * @return array
			 */
			public function pull_contact_data( $user_id, $timeout ) {
				return [ 'first_field' => 'hello' ];
			}
		};

		$integration->set_selected_fields( [ 'first_field' ] );
		Integrations::register( $integration );
		Integrations::enable( 'first-test' );

		Contact_Pull::maybe_pull_contact_data();

		// Should have run synchronously.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_first_field', true );
		$this->assertSame( 'hello', $stored );
	}
}

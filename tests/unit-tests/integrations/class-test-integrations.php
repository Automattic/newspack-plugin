<?php
/**
 * Tests for the Integrations class.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

use Newspack\Data_Events;
use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation\Integrations;
use Newspack\Reader_Activation\Integrations\Contact_Pull;
use Sample_Integration;

/**
 * Tests for the Integrations class.
 */
class Test_Integrations extends \WP_UnitTestCase {

	/**
	 * Stored pre_http_request callback for removal in tear_down.
	 *
	 * @var callable|null
	 */
	private $loopback_filter = null;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Integrations::OPTION_NAME );
		$this->reset_integrations();
		$this->reset_handler_map();
		Sample_Integration::reset();
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		if ( $this->loopback_filter ) {
			remove_filter( 'pre_http_request', $this->loopback_filter );
			$this->loopback_filter = null;
		}
		Integrations::register_integrations(); // recover core integrations for future tests.
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
	 * Reset handler_map via reflection.
	 */
	private function reset_handler_map() {
		$reflection = new \ReflectionClass( Integrations::class );
		$property   = $reflection->getProperty( 'handler_map' );
		$property->setAccessible( true );
		$property->setValue( null, [] );
	}

	/**
	 * Mock the loopback HTTP request so pull_sync calls pull_single_integration directly.
	 *
	 * Intercepts wp_remote_post calls to the AJAX pull endpoint, extracts the
	 * integration_id from the body, and calls pull_single_integration directly.
	 *
	 * @param int $user_id The user ID to pull data for.
	 */
	private function mock_pull_loopback( $user_id ) {
		$this->loopback_filter = function ( $preempt, $parsed_args, $url ) use ( $user_id ) {
			if ( false === strpos( $url, 'action=' . Contact_Pull::AJAX_ACTION ) ) {
				return $preempt;
			}

			$integration_id = $parsed_args['body']['integration_id'] ?? '';
			if ( empty( $integration_id ) ) {
				return $preempt;
			}

			$integration = Integrations::get_integration( $integration_id );
			if ( $integration ) {
				Contact_Pull::pull_single_integration( $user_id, $integration );
			}

			return [
				'response' => [ 'code' => 200 ],
				'body'     => '{"success":true}',
			];
		};

		add_filter( 'pre_http_request', $this->loopback_filter, 10, 3 );
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
	 * Test that registering a data event handler results in a serializable
	 * static callable being registered with Data Events.
	 */
	public function test_register_handler_is_serializable() {
		$action_name = 'test_integration_event';
		Data_Events::register_action( $action_name );

		$integration = new Sample_Integration( 'test-id', 'Test' );
		Integrations::register( $integration );

		$integration->test_register_handler( $action_name, 'handle_test_event' );

		$handlers = Data_Events::get_action_handlers( $action_name );
		$this->assertCount( 1, $handlers );

		// The handler should be a static callable array (two strings).
		$handler = $handlers[0];
		$this->assertIsArray( $handler );
		$this->assertCount( 2, $handler );
		$this->assertIsString( $handler[0] );
		$this->assertIsString( $handler[1] );
		$this->assertEquals( 'dispatch_data_event_handler', $handler[1] );
	}

	/**
	 * Test that dispatching a data event through Data_Events::handle() calls
	 * the registered instance method on the integration.
	 */
	public function test_dispatch_data_event_handler_calls_instance_method() {
		$action_name = 'test_dispatch_event';
		Data_Events::register_action( $action_name );

		$integration = new Sample_Integration( 'test-id', 'Test' );
		Integrations::register( $integration );
		$integration->test_register_handler( $action_name, 'handle_test_event' );

		$timestamp = time();
		$data      = [ 'key' => 'value' ];
		$client_id = 'test-client';

		Data_Events::handle( $action_name, $timestamp, $data, $client_id );

		$this->assertNotNull( Sample_Integration::$handler_args, 'Instance method should have been called.' );
		$this->assertEquals( $timestamp, Sample_Integration::$handler_args['timestamp'] );
		$this->assertEquals( $data, Sample_Integration::$handler_args['data'] );
		$this->assertEquals( $client_id, Sample_Integration::$handler_args['client_id'] );
	}

	/**
	 * Test that registering an uncallable method is rejected.
	 */
	public function test_register_uncallable_method_is_rejected() {
		$action_name = 'test_uncallable_event';
		Data_Events::register_action( $action_name );

		$integration = new Sample_Integration( 'test-id', 'Test' );
		Integrations::register( $integration );

		$integration->test_register_handler( $action_name, 'nonexistent_method' );

		$handlers = Data_Events::get_action_handlers( $action_name );
		$this->assertEmpty( $handlers, 'Uncallable method should not be registered.' );
	}

	/**
	 * Test that dispatch throws when integration is not found, allowing
	 * Data Events to catch the error and schedule a retry.
	 */
	public function test_dispatch_throws_when_integration_missing() {
		$action_name = 'test_missing_integration_event';
		Data_Events::register_action( $action_name );

		$integration = new Sample_Integration( 'test-id', 'Test' );
		// Register the integration and its handler, then later clear the registry to simulate a missing integration.
		Integrations::register( $integration );
		$integration->test_register_handler( $action_name, 'handle_test_event' );

		// Now remove the integration from the registry.
		$this->reset_integrations();

		// Data_Events::handle() catches \Throwable and schedules a retry,
		// so this should not propagate, but the handler should not be called.
		Data_Events::handle( $action_name, time(), [], 'client' );

		$this->assertNull( Sample_Integration::$handler_args, 'Handler should not be called when integration is missing.' );
	}

	/**
	 * Test get_available_incoming_contact_fields returns empty array when no fields available.
	 */
	public function test_get_available_incoming_contact_fields_empty() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		Integrations::register( $integration );

		$fields = $integration->get_available_incoming_contact_fields();

		$this->assertIsArray( $fields );
		$this->assertEmpty( $fields );
	}

	/**
	 * Test get_available_incoming_contact_fields propagates WP_Error from get_available_incoming_contact_fields.
	 */
	public function test_get_available_incoming_contact_fields_propagates_error() {
		$integration = new class( 'error-test', 'Error Test' ) extends Sample_Integration {
			/**
			 * Get incoming available contact fields (returns error for test).
			 *
			 * @return \WP_Error
			 */
			public function get_available_incoming_contact_fields() {
				return new \WP_Error( 'test_error', 'Test error message' );
			}
		};

		Integrations::register( $integration );

		$result = $integration->get_available_incoming_contact_fields();

		$this->assertWPError( $result );
		$this->assertEquals( 'test_error', $result->get_error_code() );
		$this->assertEquals( 'Test error message', $result->get_error_message() );
	}

	/**
	 * Test get_incoming_fields returns empty array by default.
	 */
	public function test_get_incoming_fields_default_empty() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );

		$this->assertSame( [], $integration->get_enabled_incoming_fields() );
	}

	/**
	 * Test update_incoming_fields and get_incoming_fields round-trip.
	 */
	public function test_set_and_get_enabled_incoming_fields() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		$fields      = [ 'first_name', 'last_name', 'phone' ];

		$integration->update_enabled_incoming_fields( $fields );

		$this->assertSame( $fields, $integration->get_enabled_incoming_fields() );
	}

	/**
	 * Test update_incoming_fields stores any keys without validation.
	 */
	public function test_update_incoming_fields_stores_any_keys() {
		$integration = new Sample_Integration( 'test-id', 'Test Integration' );
		$fields      = [ 'nonexistent_field', 'another_unknown' ];

		$integration->update_enabled_incoming_fields( $fields );

		$this->assertSame( $fields, $integration->get_enabled_incoming_fields() );
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
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'favorite_color' => 'blue' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'favorite_color' ] );
		Integrations::register( $integration );
		Integrations::enable( 'pull-test' );

		$this->mock_pull_loopback( $user_id );
		Contact_Pull::maybe_pull_contact_data();

		// Verify the data was stored synchronously.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_favorite_color', true );
		$this->assertSame( wp_json_encode( 'blue' ), $stored );

		// Verify last pull meta was updated.
		$last_pull = (int) get_user_meta( $user_id, Contact_Pull::LAST_PULL_META, true );
		$this->assertGreaterThanOrEqual( time() - 2, $last_pull );
	}

	/**
	 * Test sync pull filters returned data by selected fields only.
	 */
	public function test_sync_pull_filters_by_incoming_fields() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, time() - Contact_Pull::PULL_SYNC_THRESHOLD - 1 );

		$integration = new class( 'filter-test', 'Filter Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning multiple fields.
			 *
			 * @param int $user_id WordPress user ID.
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [
					'field_a' => 'value_a',
					'field_b' => 'value_b',
					'field_c' => 'value_c',
				];
			}
		};

		// Only select fields a and c.
		$integration->update_enabled_incoming_fields( [ 'field_a', 'field_c' ] );
		Integrations::register( $integration );
		Integrations::enable( 'filter-test' );

		$this->mock_pull_loopback( $user_id );
		Contact_Pull::maybe_pull_contact_data();

		// a and c should be stored.
		$this->assertSame( wp_json_encode( 'value_a' ), get_user_meta( $user_id, 'newspack_reader_data_item_field_a', true ) );
		$this->assertSame( wp_json_encode( 'value_c' ), get_user_meta( $user_id, 'newspack_reader_data_item_field_c', true ) );

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
			 * @throws \RuntimeException Always.
			 */
			public function pull_contact_data( $user_id ) {
				throw new \RuntimeException( 'Something went wrong' );
			}
		};

		$integration->update_enabled_incoming_fields( [ 'some_field' ] );
		Integrations::register( $integration );
		Integrations::enable( 'throw-test' );

		// Should not throw — the routine catches Throwable.
		$this->mock_pull_loopback( $user_id );
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
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'city' => 'Portland' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'city' ] );
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
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'language' => 'PHP' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'language' ] );
		Integrations::register( $integration );
		Integrations::enable( 'handle-test' );

		Contact_Pull::handle_async_pull(
			[
				'user_id'        => $user_id,
				'integration_id' => 'handle-test',
			]
		);

		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_language', true );
		$this->assertSame( wp_json_encode( 'PHP' ), $stored );
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
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'pet' => 'cat' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'pet' ] );
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
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'first_field' => 'hello' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'first_field' ] );
		Integrations::register( $integration );
		Integrations::enable( 'first-test' );

		$this->mock_pull_loopback( $user_id );
		Contact_Pull::maybe_pull_contact_data();

		// Should have run synchronously.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_first_field', true );
		$this->assertSame( wp_json_encode( 'hello' ), $stored );
	}

	/**
	 * Test sync pull schedules async when loopback request fails (simulated timeout).
	 */
	public function test_sync_pull_timeout_schedules_async() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		update_user_meta( $user_id, Contact_Pull::LAST_PULL_META, time() - Contact_Pull::PULL_SYNC_THRESHOLD - 1 );

		$integration = new class( 'timeout-test', 'Timeout Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning test data.
			 *
			 * @param int $user_id WordPress user ID.
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'timeout_field' => 'should_not_appear' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'timeout_field' ] );
		Integrations::register( $integration );
		Integrations::enable( 'timeout-test' );

		// Simulate a timeout by returning WP_Error from the loopback request.
		$this->loopback_filter = function ( $preempt, $parsed_args, $url ) {
			if ( false === strpos( $url, 'action=' . Contact_Pull::AJAX_ACTION ) ) {
				return $preempt;
			}
			return new \WP_Error( 'http_request_failed', 'Connection timed out' );
		};
		add_filter( 'pre_http_request', $this->loopback_filter, 10, 3 );

		Contact_Pull::maybe_pull_contact_data();

		// Data should NOT have been stored synchronously.
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_timeout_field', true );
		$this->assertEmpty( $stored );

		// Verify an AS action was scheduled as fallback.
		$actions = as_get_scheduled_actions(
			[
				'hook'   => Contact_Pull::ASYNC_PULL_HOOK,
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			]
		);
		$this->assertNotEmpty( $actions );
	}

	/**
	 * Test health_check returns true when can_sync passes and test_connection succeeds.
	 */
	public function test_health_check_returns_true_when_healthy() {
		$integration = new Sample_Integration( 'healthy', 'Healthy' );
		Integrations::register( $integration );

		$result = $integration->health_check();

		$this->assertTrue( $result );
	}

	/**
	 * Test health_check returns WP_Error from can_sync when validation fails.
	 */
	public function test_health_check_returns_can_sync_error() {
		$integration = new class( 'sync-fail', 'Sync Fail' ) extends Sample_Integration {
			/**
			 * Simulate can_sync validation failure.
			 *
			 * @param bool $return_errors Whether to return WP_Error.
			 * @return bool|\WP_Error
			 */
			public function can_sync( $return_errors = false ) {
				if ( $return_errors ) {
					$errors = new \WP_Error();
					$errors->add( 'missing_key', 'API key is missing.' );
					$errors->add( 'missing_list', 'List ID is not set.' );
					return $errors;
				}
				return false;
			}
		};
		Integrations::register( $integration );

		$result = $integration->health_check();

		$this->assertWPError( $result );
		$this->assertEquals( 'missing_key', $result->get_error_code() );
		$this->assertCount( 2, $result->get_error_messages() );
	}

	/**
	 * Test health_check returns WP_Error from test_connection when live check fails.
	 */
	public function test_health_check_returns_test_connection_error() {
		$integration = new class( 'conn-fail', 'Conn Fail' ) extends Sample_Integration {
			/**
			 * Simulate a connection failure.
			 *
			 * @return \WP_Error
			 */
			public function test_connection() {
				return new \WP_Error( 'connection_failed', 'Could not reach the API.' );
			}
		};
		Integrations::register( $integration );

		$result = $integration->health_check();

		$this->assertWPError( $result );
		$this->assertEquals( 'connection_failed', $result->get_error_code() );
		$this->assertEquals( 'Could not reach the API.', $result->get_error_message() );
	}

	/**
	 * Test health_check short-circuits on can_sync failure without calling test_connection.
	 */
	public function test_health_check_skips_test_connection_on_can_sync_failure() {
		$integration = new class( 'short-circuit', 'Short Circuit' ) extends Sample_Integration {
			/**
			 * Whether test_connection was called.
			 *
			 * @var bool
			 */
			public static $connection_called = false;

			/**
			 * Simulate can_sync validation failure.
			 *
			 * @param bool $return_errors Whether to return WP_Error.
			 * @return bool|\WP_Error
			 */
			public function can_sync( $return_errors = false ) {
				if ( $return_errors ) {
					$errors = new \WP_Error();
					$errors->add( 'not_configured', 'Not configured.' );
					return $errors;
				}
				return false;
			}

			/**
			 * Track whether this method is called.
			 *
			 * @return true
			 */
			public function test_connection() {
				self::$connection_called = true;
				return true;
			}
		};
		Integrations::register( $integration );

		$integration->health_check();

		$this->assertFalse( $integration::$connection_called, 'test_connection should not be called when can_sync fails.' );
	}

	/**
	 * Test health_check catches Throwable from test_connection and returns WP_Error.
	 */
	public function test_health_check_catches_throwable_from_test_connection() {
		$integration = new class( 'throw-conn', 'Throw Conn' ) extends Sample_Integration {
			/**
			 * Simulate a fatal error during connection test.
			 *
			 * @throws \RuntimeException Always.
			 */
			public function test_connection() {
				throw new \RuntimeException( 'Fatal: something exploded' );
			}
		};
		Integrations::register( $integration );

		$result = $integration->health_check();

		$this->assertWPError( $result );
		$this->assertEquals( 'newspack_integration_connection_error', $result->get_error_code() );
		$this->assertEquals( 'Fatal: something exploded', $result->get_error_message() );
	}

	/**
	 * Test get_metadata_prefix returns default 'NP_' when no custom prefix is set.
	 */
	public function test_get_metadata_prefix_default() {
		$integration = new Sample_Integration( 'prefix-test', 'Prefix Test' );

		$this->assertSame( 'NP_', $integration->get_metadata_prefix() );
	}

	/**
	 * Test update_metadata_prefix stores and retrieves a custom prefix.
	 */
	public function test_update_and_get_metadata_prefix() {
		$integration = new Sample_Integration( 'prefix-test', 'Prefix Test' );

		$integration->update_metadata_prefix( 'CUSTOM_' );

		$this->assertSame( 'CUSTOM_', $integration->get_metadata_prefix() );
		$this->assertSame( 'CUSTOM_', get_option( 'newspack_integration_metadata_prefix_prefix-test' ) );
	}

	/**
	 * Test update_metadata_prefix with empty string falls back to 'NP_'.
	 */
	public function test_update_metadata_prefix_empty_falls_back() {
		$integration = new Sample_Integration( 'prefix-test', 'Prefix Test' );

		$integration->update_metadata_prefix( 'CUSTOM_' );
		$integration->update_metadata_prefix( '' );

		$this->assertSame( 'NP_', $integration->get_metadata_prefix() );
	}

	/**
	 * Test metadata prefix is isolated per integration.
	 */
	public function test_metadata_prefix_per_integration_isolation() {
		$integration_a = new Sample_Integration( 'iso-a', 'Integration A' );
		$integration_b = new Sample_Integration( 'iso-b', 'Integration B' );

		$integration_a->update_metadata_prefix( 'AAA_' );
		$integration_b->update_metadata_prefix( 'BBB_' );

		$this->assertSame( 'AAA_', $integration_a->get_metadata_prefix() );
		$this->assertSame( 'BBB_', $integration_b->get_metadata_prefix() );
	}

	/**
	 * Test settings field value routing for metadata_prefix.
	 */
	public function test_settings_field_value_routes_metadata_prefix() {
		$integration = new Sample_Integration( 'route-test', 'Route Test' );

		$this->assertTrue( $integration->update_settings_field_value( 'metadata_prefix', 'API_' ) );
		$this->assertSame( 'API_', $integration->get_settings_field_value( 'metadata_prefix' ) );

		// Verify it wrote to the dedicated option, not the generic settings option.
		$this->assertSame( 'API_', get_option( 'newspack_integration_metadata_prefix_route-test' ) );
		$this->assertFalse( get_option( 'newspack_integration_settings_route-test_metadata_prefix' ) );
	}

	/**
	 * Test get_enabled_outgoing_fields_keys uses integration prefix when prefixed flag is true.
	 */
	public function test_get_enabled_outgoing_fields_keys_uses_integration_prefix() {
		$integration = new Sample_Integration( 'keys-test', 'Keys Test' );
		$integration->update_metadata_prefix( 'TEST_' );
		$integration->update_enabled_outgoing_fields( [ 'Account' ] );

		$keys = $integration->get_enabled_outgoing_fields_keys( true );

		$this->assertNotEmpty( $keys );
		foreach ( $keys as $key ) {
			$this->assertStringStartsWith( 'TEST_', $key, "Key '$key' should start with 'TEST_'" );
		}
	}

	/**
	 * Test get_settings_config includes metadata_prefix field with correct value.
	 */
	public function test_get_settings_config_includes_metadata_prefix() {
		$integration = new Sample_Integration( 'config-test', 'Config Test' );
		$integration->update_metadata_prefix( 'CFG_' );

		$config = $integration->get_settings_config();

		$prefix_field = null;
		foreach ( $config as $field ) {
			if ( 'metadata_prefix' === $field['key'] ) {
				$prefix_field = $field;
				break;
			}
		}

		$this->assertNotNull( $prefix_field, 'Settings config should contain a metadata_prefix field.' );
		$this->assertSame( 'CFG_', $prefix_field['value'] );
	}

	/**
	 * Test handle_ajax_pull processes data when called directly.
	 */
	public function test_handle_ajax_pull() {
		$user_id = $this->factory()->user->create();
		wp_set_current_user( $user_id );

		$integration = new class( 'ajax-test', 'Ajax Test' ) extends Sample_Integration {
			/**
			 * Pull contact data returning test data.
			 *
			 * @param int $user_id WordPress user ID.
			 * @return array
			 */
			public function pull_contact_data( $user_id ) {
				return [ 'ajax_field' => 'ajax_value' ];
			}
		};

		$integration->update_enabled_incoming_fields( [ 'ajax_field' ] );
		Integrations::register( $integration );
		Integrations::enable( 'ajax-test' );

		// Call pull_single_integration directly — the AJAX handler is thin glue
		// (nonce + lookup + this call + wp_send_json) and calling it in tests
		// produces unavoidable output from wp_send_json.
		$result = Contact_Pull::pull_single_integration( $user_id, $integration );

		$this->assertTrue( $result );
		$stored = get_user_meta( $user_id, 'newspack_reader_data_item_ajax_field', true );
		$this->assertSame( wp_json_encode( 'ajax_value' ), $stored );
	}
}

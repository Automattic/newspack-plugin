<?php
/**
 * Tests the Data Events functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Data_Events;

/**
 * Tests the Data Events functionality.
 */
class Newspack_Test_Data_Events extends WP_UnitTestCase {
	/**
	 * Test registering an action.
	 */
	public function test_register_action() {
		$action_name = 'test_action';
		Data_Events::register_action( $action_name );
		$registered_actions = Data_Events::get_actions();
		$this->assertContains( $action_name, $registered_actions );
	}

	/**
	 * Test that registering an action handler without registering an action fails
	 * with WP_Error.
	 */
	public function test_register_missing_action_handler() {
		$handler = function() {};
		$result  = Data_Events::register_handler( $handler, 'missing_action' );
		$this->assertInstanceOf( WP_Error::class, $result );
	}

	/**
	 * Test "is_action_registered" method.
	 */
	public function test_is_action_registered() {
		$action_name = 'test_action';
		Data_Events::register_action( $action_name );
		$this->assertTrue( Data_Events::is_action_registered( $action_name ) );
		$this->assertFalse( Data_Events::is_action_registered( 'missing_action' ) );
	}

	/**
	 * Test register action handler.
	 */
	public function test_register_action_handler() {
		$action_name = 'test_action';
		$handler     = function () {};
		Data_Events::register_action( $action_name );
		$result = Data_Events::register_handler( $handler, $action_name );
		$this->assertEquals( null, $result );
		$action_handlers = Data_Events::get_action_handlers( $action_name );
		$this->assertContains( $handler, $action_handlers );
	}

	/**
	 * Test that dispatching an action returns a WP_Http response and triggers a
	 * WP action.
	 */
	public function test_dispatch() {
		$action_name = 'test_action';
		$data        = [ 'test' => 'data' ];

		// Hook into dispatch.
		$call_count = 0;
		$hook       = function() use ( &$call_count ) {
			$call_count++;
		};
		add_action( 'newspack_data_event_dispatch', $hook, 10, 3 );

		Data_Events::register_action( $action_name );
		$result = Data_Events::dispatch( $action_name, $data );

		// Assert the hook was called once.
		$this->assertEquals( 1, $call_count );
	}

	/**
	 * Test that executing queued dispatches triggers the dispatched action hook.
	 */
	public function test_execute_queued_dispatches() {
		$action_name = 'test_action';
		$data        = [ 'test' => 'data' ];

		$hook_request = null;
		$hook_queued_dispatches = null;

		$hook = function( $request, $queued_dispatches ) use ( &$hook_request, &$hook_queued_dispatches ) {
			$hook_request = $request;
			$hook_queued_dispatches = $queued_dispatches;
		};
		add_action( 'newspack_data_events_dispatched', $hook, 10, 2 );

		Data_Events::register_action( $action_name );
		Data_Events::dispatch( $action_name, $data );
		Data_Events::execute_queued_dispatches();

		$this->assertIsArray( $hook_request );
		$this->assertIsArray( $hook_queued_dispatches );
		$this->assertEquals( $action_name, $hook_queued_dispatches[0]['action_name'] );
		$this->assertEquals( $data, $hook_queued_dispatches[0]['data'] );
	}

	/**
	 * Test triggering the handler.
	 */
	public function test_handler() {
		$action_name = 'test_action';

		Data_Events::register_action( $action_name );

		$handler_data = [
			'called' => 0,
			'args'   => [],
		];
		$handler      = function( ...$handler_args ) use ( &$handler_data ) {
			$handler_data['called']++;
			$handler_data['args'] = $handler_args;
		};
		// Attach the handler through the Data_Events API.
		Data_Events::register_handler( $handler, $action_name );
		// Attach the handler through a WP action.
		add_action( 'newspack_data_event_test_action', $handler, 10, 3 );

		// Manual trigger.
		$timestamp = time();
		$data      = [ 'test' => 'data' ];
		$client_id = 'test-client-id';
		Data_Events::handle( $action_name, $timestamp, $data, $client_id );

		// Should have been called twice.
		$this->assertEquals( 2, $handler_data['called'] );

		// Assert args sent to handler.
		$this->assertEquals( $timestamp, $handler_data['args'][0] );
		$this->assertEquals( $data, $handler_data['args'][1] );
		$this->assertEquals( $client_id, $handler_data['args'][2] );
	}

	/**
	 * Test that a handler can throw an exception without disrupting other handler.
	 */
	public function test_handler_exception() {
		$action_name = 'test_action';

		Data_Events::register_action( $action_name );

		$handler_called = 0;

		$handler1 = function( ...$handler_args ) use ( &$handler_called ) {
			$handler_called++;
			throw new Exception( 'Test exception' );
		};
		$handler2 = function( ...$handler_args ) use ( &$handler_called ) {
			$handler_called++;
		};

		// Attach the handlers through the Data_Events API.
		Data_Events::register_handler( $handler1, $action_name );
		Data_Events::register_handler( $handler2, $action_name );

		// Manual trigger.
		$timestamp = time();
		$data      = [ 'test' => 'data' ];
		$client_id = 'test-client-id';
		Data_Events::handle( $action_name, $timestamp, $data, $client_id );

		// Should have been called twice.
		$this->assertEquals( 2, $handler_called );
	}

	/**
	 * Test global handler execution.
	 */
	public function test_global_handler() {
		$action_name = 'test_action';

		Data_Events::register_action( $action_name );

		$handler_data = [
			'called' => 0,
			'args'   => [],
		];
		$handler      = function( ...$handler_args ) use ( &$handler_data ) {
			$handler_data['called']++;
			$handler_data['args'] = $handler_args;
		};
		Data_Events::register_handler( $handler );

		$timestamp = time();
		$data      = [ 'test' => 'data' ];
		$client_id = 'test-client-id';
		Data_Events::handle( $action_name, $timestamp, $data, $client_id );

		$this->assertEquals( 1, $handler_data['called'] );
		$this->assertEquals( $action_name, $handler_data['args'][0] );
		$this->assertEquals( $timestamp, $handler_data['args'][1] );
		$this->assertEquals( $data, $handler_data['args'][2] );
		$this->assertEquals( $client_id, $handler_data['args'][3] );
	}

	/**
	 * Test registering a listener.
	 */
	public function test_register_listener() {
		$action_name = 'test_action';
		Data_Events::register_listener( 'some_actionable_thing', $action_name );
		do_action( 'some_actionable_thing', 'data' );
		$this->assertEquals( 1, did_action( "newspack_data_event_dispatch_$action_name" ) );
	}

	/**
	 * Test registering a listener with a callable.
	 */
	public function test_register_listener_with_callable() {
		$action_name = 'test_action';
		Data_Events::register_listener(
			'some_actionable_thing',
			$action_name,
			function( $data ) {
				return $data . ' was parsed';
			}
		);

		$parsed_data = '';
		add_action(
			"newspack_data_event_dispatch_$action_name",
			function( $timestamp, $data, $client_id ) use ( &$parsed_data ) {
				$parsed_data = $data;
			},
			10,
			3
		);

		do_action( 'some_actionable_thing', 'data' );

		$this->assertEquals( 'data was parsed', $parsed_data );
	}

	/**
	 * Test registering a listener with an argument map.
	 */
	public function test_register_listener_with_map() {
		$action_name = 'test_action';
		Data_Events::register_listener(
			'some_actionable_thing',
			$action_name,
			[ 'key1', 'key2' ]
		);

		$parsed_data = [];
		add_action(
			"newspack_data_event_dispatch_$action_name",
			function( $timestamp, $data, $client_id ) use ( &$parsed_data ) {
				$parsed_data = $data;
			},
			10,
			3
		);

		do_action( 'some_actionable_thing', 'value1', 'value2' );

		$this->assertEquals(
			[
				'key1' => 'value1',
				'key2' => 'value2',
			],
			$parsed_data
		);
	}

	/**
	 * Test the current event is set and available during handler execution.
	 */
	public function test_current_event() {
		Data_Events::register_action( 'test_action' );
		Data_Events::register_action( 'test_action2' );

		$handler = function() {
			$this->assertEquals( 'test_action', Data_Events::current_event(), 'Current event should be set and equal to the action name' );
		};
		Data_Events::register_handler( $handler, 'test_action' );
		Data_Events::handle( 'test_action', time(), [], 'test-client-id' );

		$this->assertNull( Data_Events::current_event(), 'Current event should be null after handling' );

		$handler2 = function() {
			$this->assertEquals( 'test_action2', Data_Events::current_event(), 'Current event should be set and equal to the action name' );
		};
		Data_Events::register_handler( $handler2, 'test_action2' );
		Data_Events::handle( 'test_action2', time(), [], 'test-client-id' );

		$this->assertNull( Data_Events::current_event(), 'Current event should be null after handling' );
	}

	/**
	 * Test that the current event is set to null even if a handler throws an exception.
	 */
	public function test_current_event_exception() {
		Data_Events::register_action( 'test_action' );

		$handler = function() {
			$this->assertEquals( 'test_action', Data_Events::current_event(), 'Current event should be set and equal to the action name' );
			throw new Exception( 'Test exception' );
		};
		Data_Events::register_handler( $handler, 'test_action' );

		try {
			Data_Events::handle( 'test_action', time(), [], 'test-client-id' );
		} catch ( Exception $e ) {
			$this->assertNull( Data_Events::current_event(), 'Current event should be null after handling' );
		}
	}

	/**
	 * Test the custom nonce generation and verification.
	 */
	public function test_nonce_generation_and_verification() {
		// Get a nonce.
		$nonce = Data_Events::get_nonce();

		// Verify the nonce is not empty.
		$this->assertNotEmpty( $nonce );

		// Verify the nonce passes verification.
		$this->assertTrue( Data_Events::verify_nonce( $nonce ) );

		// Verify an invalid nonce fails verification.
		$this->assertFalse( Data_Events::verify_nonce( 'invalid_nonce' ) );
	}

	/**
	 * Test that the nonce is URL-safe.
	 */
	public function test_nonce_is_url_safe() {
		$nonce = Data_Events::get_nonce();

		// Verify the nonce only contains alphanumeric characters.
		$this->assertMatchesRegularExpression( '/^[a-zA-Z0-9]+$/', $nonce );

		// Verify the nonce doesn't change when requested multiple times.
		$nonce2 = Data_Events::get_nonce();
		$this->assertEquals( $nonce, $nonce2 );
	}

	/**
	 * Test nonce expiration and rotation.
	 */
	public function test_nonce_expiration() {
		// Get initial nonce.
		$initial_nonce = Data_Events::get_nonce();

		// Manually expire the nonce by setting expiration to past time.
		update_option( Data_Events::NONCE_EXPIRATION_OPTION, time() - 1 );

		// Get a new nonce - should be different.
		$new_nonce = Data_Events::get_nonce();

		// Verify the new nonce is different from the initial one.
		$this->assertNotEquals( $initial_nonce, $new_nonce );

		// Verify the new nonce passes verification.
		$this->assertTrue( Data_Events::verify_nonce( $new_nonce ) );

		// Verify the old nonce passes verification during grace period.
		$this->assertTrue( Data_Events::verify_nonce( $initial_nonce ) );

		// Expire the grace period.
		update_option( Data_Events::PREVIOUS_NONCE_EXPIRATION_OPTION, time() - 1 );

		// Now the old nonce should fail verification.
		$this->assertFalse( Data_Events::verify_nonce( $initial_nonce ) );
	}

	/**
	 * Test that the nonce is used in dispatches.
	 */
	public function test_nonce_in_dispatches() {
		$action_name = 'test_nonce_action';
		Data_Events::register_action( $action_name );

		// Hook into the dispatched action to capture the URL.
		$captured_url = '';
		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( &$captured_url ) {
				$captured_url = $url;
				return true; // Short-circuit the request.
			},
			10,
			3
		);

		// Dispatch an action.
		Data_Events::dispatch( $action_name, [ 'test' => 'data' ] );
		Data_Events::execute_queued_dispatches();

		// Verify the URL contains our custom nonce.
		$nonce = Data_Events::get_nonce();
		$this->assertStringContainsString( 'nonce=' . $nonce, $captured_url );
	}

	/**
	 * Test the nonce grace period functionality.
	 */
	public function test_nonce_grace_period() {
		// Get initial nonce.
		$initial_nonce = Data_Events::get_nonce();

		// Store the initial nonce and expiration values.
		$initial_expiration = get_option( Data_Events::NONCE_EXPIRATION_OPTION );

		// Force nonce rotation by setting expiration to past time.
		update_option( Data_Events::NONCE_EXPIRATION_OPTION, time() - 1 );

		// Get a new nonce - this should trigger rotation and store the old nonce.
		$new_nonce = Data_Events::get_nonce();

		// Verify we have different nonces.
		$this->assertNotEquals( $initial_nonce, $new_nonce );

		// Verify the previous nonce was stored.
		$previous_nonce = get_option( Data_Events::PREVIOUS_NONCE_OPTION );
		$this->assertEquals( $initial_nonce, $previous_nonce );

		// Verify the previous nonce expiration was set to a future time.
		$previous_expiration = get_option( Data_Events::PREVIOUS_NONCE_EXPIRATION_OPTION );
		$this->assertGreaterThan( time(), $previous_expiration, 'Previous nonce expiration should be in the future' );

		// Verify both nonces are valid during the grace period.
		$this->assertTrue( Data_Events::verify_nonce( $new_nonce ), 'New nonce should be valid' );
		$this->assertTrue( Data_Events::verify_nonce( $initial_nonce ), 'Old nonce should be valid during grace period' );

		// Expire the grace period.
		update_option( Data_Events::PREVIOUS_NONCE_EXPIRATION_OPTION, time() - 1 );

		// Verify only the new nonce is valid after grace period.
		$this->assertTrue( Data_Events::verify_nonce( $new_nonce ), 'New nonce should still be valid' );
		$this->assertFalse( Data_Events::verify_nonce( $initial_nonce ), 'Old nonce should be invalid after grace period' );
	}

	/**
	 * Test that the nonce lifetime is correctly set to 1 hour.
	 */
	public function test_nonce_lifetime() {
		// Get a nonce and check its expiration time.
		Data_Events::get_nonce();
		$expiration = get_option( Data_Events::NONCE_EXPIRATION_OPTION );

		// Verify the expiration is set to approximately 1 hour from now.
		$expected_expiration = time() + Data_Events::NONCE_LIFETIME;
		$this->assertEqualsWithDelta( $expected_expiration, $expiration, 2, 'Nonce expiration should be set to 1 hour' );
	}

	/**
	 * Test that the grace period is correctly set to 10 seconds.
	 */
	public function test_grace_period_duration() {
		// Get initial nonce.
		$initial_nonce = Data_Events::get_nonce();

		// Force nonce rotation.
		update_option( Data_Events::NONCE_EXPIRATION_OPTION, time() - 1 );
		Data_Events::get_nonce();

		// Get the previous nonce expiration.
		$previous_expiration = get_option( Data_Events::PREVIOUS_NONCE_EXPIRATION_OPTION );

		// Verify the grace period is approximately 10 seconds.
		$grace_period = $previous_expiration - time();
		$this->assertEqualsWithDelta( Data_Events::NONCE_GRACE_PERIOD, $grace_period, 2, 'Grace period should be approximately 10 seconds' );
	}

	/**
	 * Test that dispatches work with both current and previous nonces during grace period.
	 */
	public function test_dispatch_with_grace_period() {
		$action_name = 'test_grace_period_action';
		Data_Events::register_action( $action_name );

		// Get initial nonce.
		$initial_nonce = Data_Events::get_nonce();

		// Force nonce rotation.
		update_option( Data_Events::NONCE_EXPIRATION_OPTION, time() - 1 );
		$new_nonce = Data_Events::get_nonce();

		// Hook into the dispatched action to capture the URL.
		$captured_url = '';
		add_filter(
			'pre_http_request',
			function( $preempt, $args, $url ) use ( &$captured_url ) {
				$captured_url = $url;
				return true; // Short-circuit the request.
			},
			10,
			3
		);

		// Dispatch an action with the new nonce.
		Data_Events::dispatch( $action_name, [ 'test' => 'data' ] );
		Data_Events::execute_queued_dispatches();

		// Verify the URL contains the new nonce.
		$this->assertStringContainsString( 'nonce=' . $new_nonce, $captured_url );

		// Manually verify a request with the old nonce would be accepted.
		$_REQUEST['nonce'] = $initial_nonce;
		$this->assertTrue( Data_Events::verify_nonce( $initial_nonce ), 'Old nonce should be valid during grace period' );
	}
}

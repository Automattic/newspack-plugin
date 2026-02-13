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
		$this->reset_handler_map();
		Sample_Integration::reset();
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
		$reflection = new \ReflectionClass( Integration::class );
		$property   = $reflection->getProperty( 'handler_map' );
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
	 * Test that registering a data event handler results in a serializable
	 * static callable being registered with Data Events.
	 */
	public function test_register_data_event_handler_is_serializable() {
		$action_name = 'test_integration_event';
		Data_Events::register_action( $action_name );

		$integration = new Sample_Integration( 'test-id', 'Test' );
		Integrations::register( $integration );

		$integration->test_register_data_event_handler( $action_name, 'handle_test_event' );

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
		$integration->test_register_data_event_handler( $action_name, 'handle_test_event' );

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

		$integration->test_register_data_event_handler( $action_name, 'nonexistent_method' );

		$handlers = Data_Events::get_action_handlers( $action_name );
		$this->assertEmpty( $handlers, 'Uncallable method should not be registered.' );
	}

	/**
	 * Test that dispatch gracefully returns when integration is not found.
	 */
	public function test_dispatch_returns_when_integration_missing() {
		$action_name = 'test_missing_integration_event';
		Data_Events::register_action( $action_name );

		$integration = new Sample_Integration( 'test-id', 'Test' );
		// Register the handler but do NOT register the integration with Integrations.
		Integrations::register( $integration );
		$integration->test_register_data_event_handler( $action_name, 'handle_test_event' );

		// Now remove the integration from the registry.
		$this->reset_integrations();

		// Should not throw, and should not call the handler.
		Data_Events::handle( $action_name, time(), [], 'client' );

		$this->assertNull( Sample_Integration::$handler_args, 'Handler should not be called when integration is missing.' );
	}
}

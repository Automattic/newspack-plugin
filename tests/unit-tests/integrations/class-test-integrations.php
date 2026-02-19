<?php
/**
 * Tests for the Integrations class.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

namespace Newspack\Tests\Unit\Integrations;

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
}

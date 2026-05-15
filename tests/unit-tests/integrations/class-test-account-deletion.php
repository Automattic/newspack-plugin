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
}

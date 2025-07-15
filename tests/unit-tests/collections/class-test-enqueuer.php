<?php
/**
 * Unit tests for the Collections Enqueuer.
 *
 * @package Newspack\Tests
 * @covers \Newspack\Collections\Enqueuer
 */

namespace Newspack\Tests\Unit\Collections;

use WP_UnitTestCase;
use Newspack\Collections\Enqueuer;

/**
 * Test the Collections Enqueuer functionality.
 */
class Test_Enqueuer extends WP_UnitTestCase {
	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Reset the data every time via reflection.
		$reflection = new \ReflectionClass( Enqueuer::class );
		$reflection->setStaticPropertyValue( 'data', [] );

		// Unregister the script if it's registered.
		if ( wp_script_is( Enqueuer::SCRIPT_NAME_ADMIN, 'registered' ) ) {
			wp_deregister_script( Enqueuer::SCRIPT_NAME_ADMIN );
		}

		Enqueuer::init();
	}

	/**
	 * Test that the data manager is initialized.
	 *
	 * @covers \Newspack\Collections\Enqueuer::init
	 */
	public function test_init() {
		$this->assertGreaterThan( 0, has_action( 'admin_enqueue_scripts', [ Enqueuer::class, 'localize_data' ] ), 'Data manager should be initialized for admin.' );
	}

	/**
	 * Test that data can be added and retrieved.
	 *
	 * @covers \Newspack\Collections\Enqueuer::add_data
	 * @covers \Newspack\Collections\Enqueuer::get_data
	 */
	public function test_add_and_get_data() {
		$key       = 'test_key';
		$test_data = [
			'key1' => 'value1',
			'key2' => [ 'nested' => 'value' ],
		];

		Enqueuer::add_data( $key, $test_data );
		$retrieved_data = Enqueuer::get_data();

		$this->assertArrayHasKey( $key, $retrieved_data, 'Data should be stored under the correct key.' );
		$this->assertEquals( $test_data, $retrieved_data[ $key ], 'Retrieved data should match the added data.' );
	}

	/**
	 * Test that data is localized to JavaScript.
	 *
	 * @covers \Newspack\Collections\Enqueuer::localize_data
	 */
	public function test_localize_data() {
		// Add test data.
		$test_data = [ 'test' => 'value' ];
		Enqueuer::add_data( 'test_key', $test_data );

		// Register the test script.
		wp_register_script( Enqueuer::SCRIPT_NAME_ADMIN, 'test.js', [], '1.0.0', true );

		// Trigger the localization.
		Enqueuer::localize_data();

		// Get the localized data.
		global $wp_scripts;
		$script = $wp_scripts->registered[ Enqueuer::SCRIPT_NAME_ADMIN ];

		$this->assertStringContainsString( Enqueuer::JS_OBJECT_NAME, $script->extra['data'], 'Data should be localized to the script.' );
		$this->assertStringContainsString( wp_json_encode( $test_data ), $script->extra['data'], 'Localized data should match the added data.' );
	}

	/**
	 * Test that data is not localized when no data is present.
	 *
	 * @covers \Newspack\Collections\Enqueuer::localize_data
	 */
	public function test_localize_data_empty() {
		// Register the test script.
		wp_register_script( Enqueuer::SCRIPT_NAME_ADMIN, 'test.js', [], '1.0.0', true );

		// Trigger the localization.
		Enqueuer::localize_data();

		// Get the localized data.
		global $wp_scripts;
		$script = $wp_scripts->registered[ Enqueuer::SCRIPT_NAME_ADMIN ];

		$this->assertArrayNotHasKey( Enqueuer::JS_OBJECT_NAME, $script->extra, 'No data should be localized when data is empty.' );
	}

	/**
	 * Test that data is not localized to unregistered scripts.
	 *
	 * @covers \Newspack\Collections\Enqueuer::localize_data
	 */
	public function test_localize_data_unregistered_script() {
		// Add test data.
		$test_data = [ 'test' => 'value' ];
		Enqueuer::add_data( 'test_key', $test_data );

		// Trigger the localization without registering the script.
		Enqueuer::localize_data();

		// Verify no errors were triggered.
		$this->assertTrue( true, 'No errors should be triggered when script is not registered.' );
	}
}

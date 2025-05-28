<?php
/**
 * Unit tests for the Collections_Section wizard class.
 *
 * @package Newspack\Tests
 * @covers \Newspack\Wizards\Newspack\Collections_Section
 */

use Newspack\Wizards\Newspack\Collections_Section;
use Newspack\Optional_Modules;
use WP_UnitTestCase;

/**
 * Tests for the Collections_Section wizard class.
 */
class Newspack_Test_Collections_Section extends WP_UnitTestCase {

	/**
	 * Clean up settings before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Optional_Modules::OPTION_NAME );
	}

	/**
	 * Test that the class can be instantiated.
	 *
	 * @covers \Newspack\Wizards\Newspack\Collections_Section
	 */
	public function test_class_can_be_instantiated() {
		$section = new Collections_Section();
		$this->assertInstanceOf( Collections_Section::class, $section );
	}

	/**
	 * Test that api_get_settings returns an array with the expected key.
	 *
	 * @covers \Newspack\Wizards\Newspack\Collections_Section::api_get_settings
	 */
	public function test_api_get_settings_returns_array() {
		$result = Collections_Section::api_get_settings();
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( Optional_Modules::MODULE_ENABLED_PREFIX . 'collections', $result );
	}

	/**
	 * Test that api_update_settings updates the option and returns the new settings.
	 *
	 * @covers \Newspack\Wizards\Newspack\Collections_Section::api_update_settings
	 */
	public function test_api_update_settings_updates_option() {
		$request = new WP_REST_Request();
		$request->set_param( Optional_Modules::MODULE_ENABLED_PREFIX . 'collections', true );
		$result = Collections_Section::api_update_settings( $request );
		$this->assertTrue( $result[ Optional_Modules::MODULE_ENABLED_PREFIX . 'collections' ] );
		$settings = get_option( Optional_Modules::OPTION_NAME );
		$this->assertTrue( $settings[ Optional_Modules::MODULE_ENABLED_PREFIX . 'collections' ] );
	}

	/**
	 * Test that permissions check returns true for admin users.
	 *
	 * @covers \Newspack\Wizards\Newspack\Collections_Section::api_permissions_check
	 */
	public function test_api_permissions_check_for_admin() {
		// Simulate admin user.
		$user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );
		$section = new Collections_Section();
		$this->assertTrue( $section->api_permissions_check() );
	}

	/**
	 * Test that permissions check returns false for non-admin users.
	 *
	 * @covers \Newspack\Wizards\Newspack\Collections_Section::api_permissions_check
	 */
	public function test_api_permissions_check_for_non_admin() {
		// Simulate subscriber user.
		$user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		wp_set_current_user( $user_id );
		$section = new Collections_Section();
		$this->assertFalse( $section->api_permissions_check() );
	}
}

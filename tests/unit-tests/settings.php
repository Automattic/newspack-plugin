<?php
/**
 * Tests the Settings.
 *
 * @package Newspack\Tests
 */

use Newspack\Settings;

/**
 * Tests the Settings.
 */
class Newspack_Test_Settings extends WP_UnitTestCase {
	/**
	 * Setup for the tests.
	 */
	public function set_up() {
		delete_option( Settings::SETTINGS_OPTION_NAME );
	}

	/**
	 * Default settings.
	 */
	public function test_settings_defaults() {
		self::assertEquals(
			Settings::api_get_settings(),
			[
				'module_enabled_rss'            => false,
				'module_enabled_media-partners' => false,
			],
			'Default settings are as expected.'
		);
	}

	/**
	 * Updating settings.
	 */
	public function test_settings_update() {
		$request = new WP_REST_Request();
		$request->set_param( 'module_enabled_rss', true );
		Settings::api_update_settings( $request );
		self::assertEquals(
			Settings::api_get_settings(),
			[
				'module_enabled_rss'            => true,
				'module_enabled_media-partners' => false,
			],
			'Settings is updated.'
		);

		$request->set_param( 'non_existent_setting', true );
		Settings::api_update_settings( $request );
		self::assertEquals(
			Settings::api_get_settings(),
			[
				'module_enabled_rss'            => true,
				'module_enabled_media-partners' => false,
			],
			'A non-existent setting is not saved.'
		);
	}

	/**
	 * Optional modules.
	 */
	public function test_settings_optional_modules() {
		self::assertEquals(
			Settings::is_optional_module_active( 'rss' ),
			false,
			'RSS module is not active by default.'
		);

		Settings::activate_optional_module( 'rss' );

		self::assertEquals(
			Settings::is_optional_module_active( 'rss' ),
			true,
			'RSS module is active after being activated.'
		);
	}
}

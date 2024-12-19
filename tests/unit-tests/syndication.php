<?php
/**
 * Tests the Settings.
 *
 * @package Newspack\Tests
 */

use Newspack\Syndication;

/**
 * Tests the Settings.
 */
class Newspack_Test_Settings extends WP_UnitTestCase {
	/**
	 * Setup for the tests.
	 */
	public function set_up() {
		delete_option( Syndication::OPTION_NAME );
	}

	/**
	 * Default settings.
	 */
	public function test_settings_defaults() {
		self::assertEquals(
			Syndication::get_settings(),
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
		Syndication::api_update_settings( $request );
		self::assertEquals(
			Syndication::get_settings(),
			[
				'module_enabled_rss'            => true,
				'module_enabled_media-partners' => false,
			],
			'Settings is updated.'
		);

		$request->set_param( 'non_existent_setting', true );
		Syndication::api_update_settings( $request );
		self::assertEquals(
			Syndication::get_settings(),
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
			Syndication::is_optional_module_active( 'rss' ),
			false,
			'RSS module is not active by default.'
		);

		Syndication::activate_optional_module( 'rss' );

		self::assertEquals(
			Syndication::is_optional_module_active( 'rss' ),
			true,
			'RSS module is active after being activated.'
		);
	}
}

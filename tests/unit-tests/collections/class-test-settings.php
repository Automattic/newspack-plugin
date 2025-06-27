<?php
/**
 * Unit tests for the Collections Settings class.
 *
 * @package Newspack\Tests
 * @covers \Newspack\Collections\Settings
 */

namespace Newspack\Tests\Unit\Collections;

use WP_UnitTestCase;
use WP_REST_Request;
use Newspack\Collections\Settings;

/**
 * Tests for the Collections Settings class.
 */
class Test_Settings extends WP_UnitTestCase {

	/**
	 * Clean up settings before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( Settings::OPTION_NAME );
	}

	/**
	 * Test get_settings returns defaults when no settings exist.
	 *
	 * @covers \Newspack\Collections\Settings::get_settings
	 */
	public function test_get_settings_returns_defaults_when_empty() {
		$settings = Settings::get_settings();
		$this->assertEquals( Settings::FIELDS, $settings );
	}

	/**
	 * Test get_settings includes existing settings with defaults.
	 *
	 * @covers \Newspack\Collections\Settings::get_settings
	 */
	public function test_get_settings_includes_existing_settings() {
		$existing_settings = [
			'custom_name'    => 'Issues',
			'subscribe_link' => 'https://example.com/subscribe',
			'order_link'     => 'https://example.com/order',
		];

		update_option( Settings::OPTION_NAME, $existing_settings );

		$settings = Settings::get_settings();
		$expected = array_merge( Settings::FIELDS, $existing_settings );

		$this->assertEquals( $expected, $settings );
	}

	/**
	 * Test update_settings includes existing settings.
	 *
	 * @covers \Newspack\Collections\Settings::update_settings
	 */
	public function test_update_settings_includes_existing_settings() {
		$existing_settings = [
			'custom_name'    => 'Issues',
			'subscribe_link' => 'https://old.example.com/subscribe',
		];

		update_option( Settings::OPTION_NAME, $existing_settings );

		$new_settings = [
			'custom_name'           => 'Magazines',
			'custom_naming_enabled' => true,
		];

		$result = Settings::update_settings( $new_settings );
		$this->assertTrue( $result );

		$expected        = array_merge( $existing_settings, $new_settings );
		$stored_settings = get_option( Settings::OPTION_NAME );
		$this->assertEquals( $expected, $stored_settings );
	}

	/**
	 * Test get_setting returns correct values and handles edge cases.
	 *
	 * @covers \Newspack\Collections\Settings::get_setting
	 */
	public function test_get_setting() {
		$settings = [
			'custom_name'           => 'Issues',
			'custom_naming_enabled' => true,
		];

		update_option( Settings::OPTION_NAME, $settings );

		// Test existing settings.
		$this->assertEquals( 'Issues', Settings::get_setting( 'custom_name' ) );
		$this->assertTrue( Settings::get_setting( 'custom_naming_enabled' ) );

		// Test defaults for unset fields.
		$this->assertEquals( '', Settings::get_setting( 'custom_singular_name' ) );
		$this->assertEquals( '', Settings::get_setting( 'subscribe_link' ) );
		$this->assertEquals( '', Settings::get_setting( 'order_link' ) );

		// Test non-existent field.
		$this->assertNull( Settings::get_setting( 'non_existent_field' ) );
	}

	/**
	 * Test get_rest_args returns correct structure and sanitization callbacks.
	 *
	 * @covers \Newspack\Collections\Settings::get_rest_args
	 */
	public function test_get_rest_args() {
		$rest_args = Settings::get_rest_args();

		$this->assertIsArray( $rest_args );

		// Test all expected fields exist.
		$expected_fields = array_keys( Settings::FIELDS );
		foreach ( $expected_fields as $field ) {
			$this->assertArrayHasKey( $field, $rest_args );
			$this->assertArrayHasKey( 'required', $rest_args[ $field ] );
			$this->assertArrayHasKey( 'sanitize_callback', $rest_args[ $field ] );
			$this->assertFalse( $rest_args[ $field ]['required'] );
			$this->assertIsCallable( $rest_args[ $field ]['sanitize_callback'] );
		}
	}

	/**
	 * Test sanitization callbacks work correctly.
	 *
	 * @covers \Newspack\Collections\Settings::get_rest_args
	 */
	public function test_sanitization_callbacks() {
		$rest_args = Settings::get_rest_args();

		// Test boolean sanitization.
		$boolean_callback = $rest_args['custom_naming_enabled']['sanitize_callback'];
		$this->assertTrue( $boolean_callback( 'true' ) );
		$this->assertTrue( $boolean_callback( 1 ) );
		$this->assertFalse( $boolean_callback( 'false' ) );
		$this->assertFalse( $boolean_callback( 0 ) );

		// Test text field sanitization.
		$text_callback = $rest_args['custom_name']['sanitize_callback'];
		$this->assertEquals( 'Clean Text', $text_callback( 'Clean Text' ) );
		$this->assertEquals( 'Clean Text', $text_callback( '<script>alert("xss")</script>Clean Text' ) );

		// Test URL sanitization.
		$url_callback = $rest_args['subscribe_link']['sanitize_callback'];
		$this->assertEquals( 'https://example.com/subscribe', $url_callback( 'https://example.com/subscribe' ) );
		$this->assertEquals( '', $url_callback( 'javascript:alert("xss")' ) ); // Dangerous URLs should be sanitized to empty string.

		$url_callback = $rest_args['order_link']['sanitize_callback'];
		$this->assertEquals( 'https://example.com/order', $url_callback( 'https://example.com/order' ) );
		$this->assertEquals( 'http://example.com', $url_callback( '{example}.com' ) );

		// Test slug sanitization.
		$slug_callback = $rest_args['custom_slug']['sanitize_callback'];
		$this->assertEquals( 'clean-slug', $slug_callback( 'Clean Slug' ) );
		$this->assertEquals( 'clean-slug', $slug_callback( 'Clean Slug!' ) );
		$this->assertEquals( '', $slug_callback( 123 ) ); // Non-string should return empty string.
	}

	/**
	 * Test update_from_request handles non-field parameters and empty requests.
	 *
	 * @covers \Newspack\Collections\Settings::update_from_request
	 */
	public function test_update_from_request_handles_non_field_parameters_and_empty_requests() {
		// Test with empty request.
		$request = new WP_REST_Request();
		$result  = Settings::update_from_request( $request );
		$this->assertEquals( Settings::FIELDS, $result );

		// Test ignores non-field parameters.
		$request = new WP_REST_Request();
		$request->set_param( 'custom_name', 'Issues' );
		$request->set_param( 'non_field_param', 'should_be_ignored' );

		$result = Settings::update_from_request( $request );
		$this->assertEquals( 'Issues', $result['custom_name'] );
		$this->assertArrayNotHasKey( 'non_field_param', $result );

		$stored_settings = get_option( Settings::OPTION_NAME );
		$this->assertArrayNotHasKey( 'non_field_param', $stored_settings );
	}
}

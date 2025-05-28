<?php
/**
 * Unit tests for the Collections module.
 *
 * @package Newspack\Tests
 * @covers \Newspack\Collections
 */

use Newspack\Collections;
use WP_UnitTestCase;

/**
 * Tests for the Collections module.
 */
class Newspack_Test_Collections extends WP_UnitTestCase {

	/**
	 * Remove all filters before each test.
	 */
	public function set_up() {
		parent::set_up();
		remove_all_filters( 'newspack_collections_enabled' );
	}

	/**
	 * Test that the Collections class exists.
	 *
	 * @covers \Newspack\Collections
	 */
	public function test_class_exists() {
		self::assertTrue( class_exists( '\Newspack\Collections' ), 'Collections class should exist.' );
	}

	/**
	 * Test that the feature is disabled by default.
	 *
	 * @covers \Newspack\Collections::is_feature_enabled
	 */
	public function test_is_feature_enabled_default_false() {
		self::assertFalse( Collections::is_feature_enabled(), 'Feature should be disabled by default.' );
	}

	/**
	 * Test that the feature is enabled when the constant is set to true.
	 *
	 * @covers \Newspack\Collections::is_feature_enabled
	 */
	public function test_is_feature_enabled_constant_true() {
		define( 'NEWSPACK_COLLECTIONS_ENABLED', true );
		self::assertTrue( Collections::is_feature_enabled(), 'Feature should be enabled when constant is true.' );
	}

	/**
	 * Test that the feature is enabled when the filter returns true.
	 *
	 * @covers \Newspack\Collections::is_feature_enabled
	 */
	public function test_is_feature_enabled_filter_true() {
		add_filter( 'newspack_collections_enabled', '__return_true' );
		self::assertTrue( Collections::is_feature_enabled(), 'Feature should be enabled by filter.' );
		remove_all_filters( 'newspack_collections_enabled' );
	}
}

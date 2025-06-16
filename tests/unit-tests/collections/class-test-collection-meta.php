<?php
/**
 * Tests for the Collection_Meta class.
 *
 * @package Newspack\Tests
 */

namespace Newspack\Tests;

use WP_UnitTestCase;
use Newspack\Collections\Collection_Meta;
use Newspack\Collections\Post_Type;

/**
 * Test the Collection_Meta class.
 */
class Test_Collection_Meta extends WP_UnitTestCase {

	/**
	 * Expected meta keys.
	 *
	 * @var array
	 */
	private const EXPECTED_META_KEYS = [
		'file_attachment',
		'file_link',
		'volume',
		'number',
		'period',
		'subscribe_link',
		'order_link',
	];

	/**
	 * Test get_metas returns expected structure.
	 *
	 * @covers \Newspack\Collections\Collection_Meta::get_metas
	 */
	public function test_get_metas() {
		$required_properties = [ 'type', 'label', 'single', 'sanitize_callback', 'show_in_rest' ];
		$metas               = Collection_Meta::get_metas();

		// Test that we have all expected meta keys.
		$this->assertEquals( self::EXPECTED_META_KEYS, array_keys( $metas ) );

		// Test that all required properties are present.
		foreach ( $metas as $key => $meta ) {
			foreach ( $required_properties as $property ) {
				$this->assertArrayHasKey( $property, $meta, 'Meta "' . $property . '" definition is missing for "' . $key . '"' );
				$this->assertNotEmpty( $meta[ $property ], 'Meta "' . $property . '" definition is empty for "' . $key . '"' );
			}
		}
	}

	/**
	 * Test get_frontend_meta_definitions returns expected structure.
	 *
	 * @covers \Newspack\Collections\Collection_Meta::get_frontend_meta_definitions
	 */
	public function test_get_frontend_meta_definitions() {
		$required_properties = [ 'key', 'type', 'label' ];
		$definitions         = Collection_Meta::get_frontend_meta_definitions();

		// Test that we have all expected meta keys.
		$this->assertEquals( self::EXPECTED_META_KEYS, array_keys( $definitions ) );

		// Test that all required properties are present.
		foreach ( $definitions as $key => $definition ) {
			foreach ( $required_properties as $property ) {
				$this->assertArrayHasKey( $property, $definition, 'Meta "' . $property . '" definition is missing for "' . $key . '"' );
				$this->assertNotEmpty( $definition[ $property ], 'Meta "' . $property . '" definition is empty for "' . $key . '"' );
			}
		}
	}

	/**
	 * Test meta registration.
	 *
	 * @covers \Newspack\Collections\Collection_Meta::init
	 */
	public function test_register_meta() {
		// Initialize the post type and register the meta.
		Post_Type::init();
		Collection_Meta::register_meta();

		// Get registered meta.
		$registered_meta = get_registered_meta_keys( 'post', Post_Type::get_post_type() );

		// Test that our meta keys are registered and have the correct values.
		foreach ( Collection_Meta::get_metas() as $key => $meta ) {
			$meta_key = Collection_Meta::PREFIX . $key;
			$this->assertArrayHasKey( $meta_key, $registered_meta, 'Meta key "' . $meta_key . '" is not registered' );
			foreach ( $meta as $property => $value ) {
				$this->assertEquals( $value, $registered_meta[ $meta_key ][ $property ], 'Meta key "' . $meta_key . '" has incorrect value for property "' . $property . '"' );
			}
		}
	}

	/**
	 * Test auth callback.
	 *
	 * @covers \Newspack\Collections\Collection_Meta::auth_callback
	 */
	public function test_auth_callback() {
		// Test with admin user.
		$admin_user_id = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $admin_user_id );
		$this->assertTrue( Collection_Meta::auth_callback(), 'Admin user should be able to edit collection meta' );

		// Test with subscriber.
		$subscriber_user_id = self::factory()->user->create( [ 'role' => 'subscriber' ] );
		wp_set_current_user( $subscriber_user_id );
		$this->assertFalse( Collection_Meta::auth_callback(), 'Subscriber user should not be able to edit collection meta' );

		// Test with no user.
		wp_set_current_user( 0 );
		$this->assertFalse( Collection_Meta::auth_callback(), 'Empty user should not be able to edit collection meta' );
	}
}

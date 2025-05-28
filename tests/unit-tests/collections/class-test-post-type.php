<?php
/**
 * Unit tests for the Collection Post Type.
 *
 * @package Newspack\Tests
 */

namespace Newspack\Tests\Unit\Collections;

use WP_UnitTestCase;
use Newspack\Collections\Post_Type;

/**
 * Test the Collections Post Type functionality.
 */
class Test_Post_Type extends WP_UnitTestCase {
	use Traits\Trait_Collections_Test;

	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Register post type directly as the WP environment is already initialized.
		Post_Type::register_post_type();
	}

	/**
	 * Test that the post type is registered.
	 *
	 * @covers \Newspack\Collections\Post_Type::register_post_type
	 */
	public function test_post_type_registration() {
		$post_type = get_post_type_object( Post_Type::get_post_type() );
		$this->assertNotNull( $post_type, 'Post type should be registered.' );
		$this->assertEquals( 'Collections', $post_type->labels->name, 'Post type label should be "Collections".' );
		$this->assertTrue( $post_type->public, 'Post type should be public.' );
		$this->assertTrue( $post_type->show_in_rest, 'Post type should be available in REST API.' );
		$this->assertTrue( $post_type->has_archive, 'Post type should have archive.' );
	}

	/**
	 * Test that hooks are registered and unregistered correctly.
	 *
	 * @covers \Newspack\Collections\Post_Type::register_hooks
	 * @covers \Newspack\Collections\Post_Type::unregister_hooks
	 * @covers \Newspack\Collections\Traits\Hook_Management_Trait::manage_hooks
	 */
	public function test_hooks_management() {
		$reflection = new \ReflectionMethod( Post_Type::class, 'get_hooks' );
		$reflection->setAccessible( true );
		$hooks = $reflection->invoke( null );

		// Test hook registration.
		Post_Type::register_hooks();
		foreach ( $hooks as $hook ) {
			$this->assertEquals(
				$hook[2] ?? 10, // If not priority is set, WP defaults to 10.
				has_action( $hook[0], $hook[1] ),
				sprintf( 'Hook "%s" should be registered.', $hook[0] )
			);
		}

		// Test hook unregistration.
		Post_Type::unregister_hooks();
		foreach ( $hooks as $hook ) {
			$this->assertFalse(
				has_action( $hook[0], $hook[1] ),
				sprintf( 'Hook "%s" should be unregistered.', $hook[0] )
			);
		}
	}

	/**
	 * Test that a collection post can be created.
	 *
	 * @covers \Newspack\Collections\Post_Type::register_post_type
	 */
	public function test_create_collection_post() {
		$args = [
			'post_title' => 'My Collection',
			'post_name'  => 'my-collection',
		];

		// Create a collection post.
		$post_id = $this->create_test_collection( $args );
		$post = get_post( $post_id );

		$this->assertEquals( Post_Type::get_post_type(), $post->post_type, 'Post should be a collection.' );
		$this->assertEquals( $args['post_title'], $post->post_title, 'Post title should be set correctly.' );
		$this->assertEquals( $args['post_name'], $post->post_name, 'Post slug should be set correctly.' );
	}
}

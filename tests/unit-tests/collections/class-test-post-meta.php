<?php
/**
 * Unit tests for the Post_Meta class.
 *
 * @package Newspack\Tests\Unit\Collections
 */

namespace Newspack\Tests\Unit\Collections;

use WP_UnitTestCase;
use Newspack\Collections\Post_Meta;
use Newspack\Collections\Settings;
use Newspack\Collections\Enqueuer;

/**
 * Test the Post_Meta functionality.
 */
class Test_Post_Meta extends WP_UnitTestCase {
	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Register the meta field.
		Post_Meta::register_meta();
	}

	/**
	 * Test that the post meta is registered.
	 */
	public function test_post_meta_is_registered() {
		$meta = get_registered_meta_keys( 'post', 'post' );
		$this->assertArrayHasKey( Post_Meta::ORDER_META_KEY, $meta, 'Meta key should be registered.' );
	}

	/**
	 * Test that the meta is visible in the REST API.
	 */
	public function test_post_meta_is_visible_in_rest() {
		$meta = get_registered_meta_keys( 'post', 'post' );
		$this->assertTrue( $meta[ Post_Meta::ORDER_META_KEY ]['show_in_rest'], 'Meta key should be visible in REST.' );
	}

	/**
	 * Test that the meta is sanitized as a number.
	 */
	public function test_post_meta_sanitization() {
		$post_id = $this->factory()->post->create();
		update_post_meta( $post_id, Post_Meta::ORDER_META_KEY, '123abc' );
		$value = get_post_meta( $post_id, Post_Meta::ORDER_META_KEY, true );
		$this->assertSame( '123', $value, 'Meta value should be sanitized to number.' );
	}

	/**
	 * Test that the auth callback works (user can edit posts).
	 */
	public function test_post_meta_auth_callback() {
		$user_id = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user_id );
		$this->assertTrue( Post_Meta::auth_callback(), 'Auth callback should return true for user with edit_posts.' );
	}

	/**
	 * Test post meta description uses custom names.
	 *
	 * @covers \Newspack\Collections\Post_Meta::register_meta
	 */
	public function test_post_meta_description_with_custom_names() {
		$custom_name = 'Issues';

		$custom_settings = [
			'custom_naming_enabled' => true,
			'custom_name'           => $custom_name,
		];
		update_option( Settings::OPTION_NAME, $custom_settings );

		Post_Meta::register_meta();

		$meta = get_registered_meta_keys( 'post', 'post' );
		$this->assertStringContainsStringIgnoringCase( $custom_name, $meta[ Post_Meta::ORDER_META_KEY ]['description'] );
	}

	/**
	 * Test admin script data includes dynamic help text.
	 *
	 * @covers \Newspack\Collections\Post_Meta::output_post_meta_data_for_admin_scripts
	 */
	public function test_post_meta_admin_data_with_custom_names() {
		$custom_singular_name = 'Magazine';

		$custom_settings = [
			'custom_naming_enabled' => true,
			'custom_singular_name'  => $custom_singular_name,
		];
		update_option( Settings::OPTION_NAME, $custom_settings );

		global $current_screen;
		$current_screen = (object) [ // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			'post_type' => 'post',
			'base'      => 'post',
		];

		Post_Meta::output_post_meta_data_for_admin_scripts( $current_screen );

		$data = Enqueuer::get_data();
		$this->assertStringContainsString( $custom_singular_name, $data['postMeta']['panelTitle'] );

		$current_screen = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}
}

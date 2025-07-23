<?php
/**
 * Tests the RSS core functionality - simplified version.
 *
 * @package Newspack\Tests
 */

use Newspack\RSS;
use Newspack\Optional_Modules;

/**
 * Tests the RSS core functionality.
 */
class Newspack_Test_RSS extends WP_UnitTestCase {
	/**
	 * Feed post ID.
	 *
	 * @var int
	 */
	private $feed_post_id;

	/**
	 * Setup for the tests.
	 */
	public function set_up() {
		parent::set_up();

		// Create and set an admin user.
		$admin_user = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $admin_user );

		// Enable RSS module.
		Optional_Modules::activate_optional_module( 'rss' );

		// Create a test RSS feed.
		$this->feed_post_id = wp_insert_post(
			[
				'post_title'  => 'Test RSS Feed',
				'post_name'   => 'test-rss-feed',
				'post_type'   => RSS::FEED_CPT,
				'post_status' => 'publish',
			]
		);
	}

	/**
	 * Teardown after tests.
	 */
	public function tear_down() {
		parent::tear_down();

		// Clean up feed.
		if ( $this->feed_post_id ) {
			wp_delete_post( $this->feed_post_id, true );
		}

		// Deactivate RSS module.
		Optional_Modules::deactivate_optional_module( 'rss' );
	}

	/**
	 * Test default category_tag_relation setting.
	 */
	public function test_rss_default_category_tag_relation() {
		$settings = RSS::get_feed_settings( $this->feed_post_id );
		$this->assertEquals( 'AND', $settings['category_tag_relation'], 'Default category_tag_relation should be AND' );
	}

	/**
	 * Test that category_tag_relation setting can be saved and retrieved.
	 */
	public function test_rss_save_category_tag_relation_setting() {
		// Test directly setting the meta and retrieving it.
		$test_settings = [
			'category_tag_relation' => 'OR',
			'num_items_in_feed'     => 10,
		];

		update_post_meta( $this->feed_post_id, RSS::FEED_SETTINGS_META, $test_settings );

		$retrieved_settings = RSS::get_feed_settings( $this->feed_post_id );
		$this->assertEquals( 'OR', $retrieved_settings['category_tag_relation'], 'OR relation should be retrieved' );

		// Test with AND.
		$test_settings['category_tag_relation'] = 'AND';
		update_post_meta( $this->feed_post_id, RSS::FEED_SETTINGS_META, $test_settings );

		$retrieved_settings = RSS::get_feed_settings( $this->feed_post_id );
		$this->assertEquals( 'AND', $retrieved_settings['category_tag_relation'], 'AND relation should be retrieved' );
	}
}

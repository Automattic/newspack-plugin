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
	 * Custom taxonomy name.
	 *
	 * @var string
	 */
	private $custom_taxonomy = 'test_taxonomy';

	/**
	 * Current test settings.
	 *
	 * @var array
	 */
	private $current_test_settings = [];

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

		// Register custom taxonomy for testing.
		register_taxonomy(
			$this->custom_taxonomy,
			'post',
			[
				'public' => true,
				'labels' => [
					'name' => 'Test Taxonomy',
				],
			]
		);

		// Add filter to inject test settings.
		add_filter( 'get_post_metadata', [ $this, 'inject_test_settings' ], 10, 5 );
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

		// Unregister custom taxonomy.
		unregister_taxonomy( $this->custom_taxonomy );

		// Remove filter.
		remove_filter( 'get_post_metadata', [ $this, 'inject_test_settings' ] );

		// Reset test settings.
		$this->current_test_settings = [];
	}

	/**
	 * Inject test settings via filter.
	 *
	 * @param mixed  $value     The value to return, either a single metadata value or an array
	 *                          of values depending on the value of `$single`. Default null.
	 * @param int    $object_id ID of the object metadata is for.
	 * @param string $meta_key  Metadata key.
	 * @param bool   $single    Whether to return only the first value of the specified `$meta_key`.
	 * @param string $meta_type Type of object metadata is for. Accepts 'post', 'comment', 'term', 'user',
	 *                          or any other object type with an associated meta table.
	 */
	public function inject_test_settings( $value, $object_id, $meta_key, $single, $meta_type ) {
		if ( RSS::FEED_SETTINGS_META === $meta_key && ! empty( $this->current_test_settings ) ) {
			return [ $this->current_test_settings ];
		}
		return $value;
	}

	/**
	 * Set test settings for the current test.
	 *
	 * @param array $settings The settings to use for the test.
	 */
	private function set_test_settings( $settings ) {
		$this->current_test_settings = $settings;
	}

	/**
	 * Test default taxonomy_filters_relation setting.
	 */
	public function test_rss_default_taxonomy_filters_relation() {
		$settings = RSS::get_feed_settings( $this->feed_post_id );
		$this->assertEquals( 'AND', $settings['taxonomy_filters_relation'], 'Default taxonomy_filters_relation should be AND' );
	}

	/**
	 * Test that taxonomy_filters_relation setting can be saved and retrieved.
	 */
	public function test_rss_save_taxonomy_filters_relation_setting() {
		// Test directly setting the meta and retrieving it.
		$this->set_test_settings(
			[
				'taxonomy_filters_relation' => 'OR',
				'num_items_in_feed'         => 10,
			]
		);

		$retrieved_settings = RSS::get_feed_settings( $this->feed_post_id );
		$this->assertEquals( 'OR', $retrieved_settings['taxonomy_filters_relation'], 'OR relation should be retrieved' );

		// Test with AND.
		$this->set_test_settings(
			[
				'taxonomy_filters_relation' => 'AND',
				'num_items_in_feed'         => 10,
			]
		);

		$retrieved_settings = RSS::get_feed_settings( $this->feed_post_id );
		$this->assertEquals( 'AND', $retrieved_settings['taxonomy_filters_relation'], 'AND relation should be retrieved' );
	}

	/**
	 * Test that single category filter uses tax_query.
	 */
	public function test_rss_single_category_filter_uses_tax_query() {
		// Create test categories.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat2 ] ] );

		// Set feed settings with only category include.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1 ],
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set and category__in is not.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for single category filter' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( 'category', $tax_query[0]['taxonomy'], 'tax_query should use category taxonomy' );
		$this->assertEquals( [ $cat1 ], $tax_query[0]['terms'], 'tax_query should include the correct terms' );
		$this->assertEmpty( $query->get( 'category__in' ), 'category__in should not be set' );

		// Verify the query returns the correct post.
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post1, $query->posts[0]->ID, 'Should return the post in the included category' );
	}

	/**
	 * Test that single tag filter uses tax_query.
	 */
	public function test_rss_single_tag_filter_uses_tax_query() {
		// Create test tags.
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);
		$tag2 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 2',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create();
		wp_set_object_terms( $post1, [ $tag1 ], 'post_tag' );
		$post2 = $this->factory->post->create();
		wp_set_object_terms( $post2, [ $tag2 ], 'post_tag' );

		// Set feed settings with only tag include.
		$this->set_test_settings(
			[
				'tag_include'               => [ $tag1 ],
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set and tag__in is not.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for single tag filter' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( 'post_tag', $tax_query[0]['taxonomy'], 'tax_query should use post_tag taxonomy' );
		$this->assertEquals( [ $tag1 ], $tax_query[0]['terms'], 'tax_query should include the correct terms' );
		$this->assertEmpty( $query->get( 'tag__in' ), 'tag__in should not be set' );

		// Verify the query returns the correct post.
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post1, $query->posts[0]->ID, 'Should return the post with the included tag' );
	}

	/**
	 * Test that multiple taxonomy filters use tax_query with correct relation.
	 */
	public function test_rss_multiple_taxonomy_filters_use_tax_query() {
		// Create test categories and tags.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		wp_set_object_terms( $post1, [ $tag1 ], 'post_tag' );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post3 = $this->factory->post->create();
		wp_set_object_terms( $post3, [ $tag1 ], 'post_tag' );

		// Set feed settings with both category and tag includes.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1 ],
				'tag_include'               => [ $tag1 ],
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with correct structure.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for multiple taxonomy filters' );
		$this->assertEquals( 'AND', $tax_query['relation'], 'tax_query relation should be AND' );
		$this->assertCount( 3, $tax_query, 'tax_query should have 2 conditions + relation' );

		// Verify the query returns the correct post (only post1 has both category and tag).
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post1, $query->posts[0]->ID, 'Should return the post with both category and tag' );
	}

	/**
	 * Test that custom taxonomy filters use tax_query.
	 */
	public function test_rss_custom_taxonomy_filters_use_tax_query() {
		// Create test terms for custom taxonomy.
		$term1 = $this->factory->term->create(
			[
				'taxonomy' => $this->custom_taxonomy,
				'name'     => 'Test Term 1',
			]
		);
		$term2 = $this->factory->term->create(
			[
				'taxonomy' => $this->custom_taxonomy,
				'name'     => 'Test Term 2',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create();
		wp_set_object_terms( $post1, [ $term1 ], $this->custom_taxonomy );
		$post2 = $this->factory->post->create();
		wp_set_object_terms( $post2, [ $term2 ], $this->custom_taxonomy );

		// Set feed settings with custom taxonomy include.
		$this->set_test_settings(
			[
				$this->custom_taxonomy . '_include' => [ $term1 ],
				'taxonomy_filters_relation'         => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for custom taxonomy filter' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( $this->custom_taxonomy, $tax_query[0]['taxonomy'], 'tax_query should use custom taxonomy' );
		$this->assertEquals( [ $term1 ], $tax_query[0]['terms'], 'tax_query should include the correct terms' );

		// Verify the query returns the correct post.
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post1, $query->posts[0]->ID, 'Should return the post with the custom taxonomy term' );
	}

	/**
	 * Test that category exclusion is always applied.
	 */
	public function test_rss_category_exclusion() {
		// Create test categories.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);
		$cat3 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 3',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat1, $cat2 ] ] );
		$post3 = $this->factory->post->create( [ 'post_category' => [ $cat1, $cat3 ] ] );

		// Set feed settings with category include and exclude, using OR relation.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1, $cat2 ],
				'category_exclude'          => [ $cat3 ],
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with category exclusion.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for category exclusion' );
		$this->assertEquals( 'AND', $tax_query['relation'], 'tax_query relation should be OR' );
		$this->assertCount( 3, $tax_query, 'tax_query should have 2 include conditions + 1 exclude condition + relation' );

		// Find the exclude condition in the tax_query.
		$exclude_condition = null;
		foreach ( $tax_query as $condition ) {
			if ( isset( $condition['operator'] ) && 'NOT IN' === $condition['operator'] ) {
				$exclude_condition = $condition;
				break;
			}
		}

		$this->assertNotNull( $exclude_condition, 'Should have a NOT IN condition' );
		$this->assertEquals( 'category', $exclude_condition['taxonomy'], 'Exclude condition should use category taxonomy' );
		$this->assertEquals( [ $cat3 ], $exclude_condition['terms'], 'Exclude condition should exclude cat2' );

		// Verify the query returns the correct posts (only post1 and post2).
		$query->get_posts();
		$this->assertEquals( 2, $query->found_posts, 'Should find exactly two posts' );
		$post_ids = wp_list_pluck( $query->posts, 'ID' );
		$this->assertContains( $post1, $post_ids, 'Should return post1' );
		$this->assertContains( $post2, $post_ids, 'Should return post2' );
	}

	/**
	 * Test that tax_query relation is set correctly for multiple filters.
	 */
	public function test_rss_tax_query_relation_is_set_correctly() {
		// Create test categories and tags.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create();
		wp_set_object_terms( $post2, [ $tag1 ], 'post_tag' );
		$post3 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		wp_set_object_terms( $post3, [ $tag1 ], 'post_tag' );

		// Test with AND relation.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1 ],
				'tag_include'               => [ $tag1 ],
				'taxonomy_filters_relation' => 'AND',
			]
		);

		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		RSS::modify_feed_query( $query, $this->feed_post_id );

		$tax_query = $query->get( 'tax_query' );
		$this->assertEquals( 'AND', $tax_query['relation'], 'tax_query relation should be AND' );

		// Test with OR relation.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1 ],
				'tag_include'               => [ $tag1 ],
				'taxonomy_filters_relation' => 'OR',
			]
		);

		$query = new WP_Query();

		RSS::modify_feed_query( $query, $this->feed_post_id );

		$tax_query = $query->get( 'tax_query' );
		$this->assertEquals( 'OR', $tax_query['relation'], 'tax_query relation should be OR' );
	}

	/**
	 * Test that category inner relation IN works correctly (any of these categories).
	 */
	public function test_rss_category_inner_relation_in() {
		// Create test categories.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);

		// Create test posts with different category combinations.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat2 ] ] );
		$post3 = $this->factory->post->create( [ 'post_category' => [ $cat1, $cat2 ] ] );
		$post4 = $this->factory->post->create( [ 'post_category' => [] ] );

		// Set feed settings with category include using IN relation.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1, $cat2 ],
				'category_inner_relation'   => 'IN',
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with IN operator.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for category IN relation' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( 'category', $tax_query[0]['taxonomy'], 'tax_query should use category taxonomy' );
		$this->assertEquals( 'IN', $tax_query[0]['operator'], 'tax_query should use IN operator' );
		$this->assertEquals( [ $cat1, $cat2 ], $tax_query[0]['terms'], 'tax_query should include both categories' );

		// Verify the query returns the correct posts (post1, post2, post3 should be included).
		$query->get_posts();
		$this->assertEquals( 3, $query->found_posts, 'Should find exactly three posts' );
		$post_ids = wp_list_pluck( $query->posts, 'ID' );
		$this->assertContains( $post1, $post_ids, 'Should include post with cat1' );
		$this->assertContains( $post2, $post_ids, 'Should include post with cat2' );
		$this->assertContains( $post3, $post_ids, 'Should include post with both categories' );
		$this->assertNotContains( $post4, $post_ids, 'Should not include post with no categories' );
	}

	/**
	 * Test that category inner relation AND works correctly (all of these categories).
	 */
	public function test_rss_category_inner_relation_and() {
		// Create test categories.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);

		// Create test posts with different category combinations.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat2 ] ] );
		$post3 = $this->factory->post->create( [ 'post_category' => [ $cat1, $cat2 ] ] );
		$post4 = $this->factory->post->create( [ 'post_category' => [] ] );

		// Set feed settings with category include using AND relation.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1, $cat2 ],
				'category_inner_relation'   => 'AND',
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with AND operator.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for category AND relation' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( 'category', $tax_query[0]['taxonomy'], 'tax_query should use category taxonomy' );
		$this->assertEquals( 'AND', $tax_query[0]['operator'], 'tax_query should use AND operator' );
		$this->assertEquals( [ $cat1, $cat2 ], $tax_query[0]['terms'], 'tax_query should include both categories' );

		// Verify the query returns the correct posts (only post3 should be included).
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post3, $query->posts[0]->ID, 'Should return only the post with both categories' );
	}

	/**
	 * Test that tag inner relation IN works correctly (any of these tags).
	 */
	public function test_rss_tag_inner_relation_in() {
		// Create test tags.
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);
		$tag2 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 2',
			]
		);

		// Create test posts with different tag combinations.
		$post1 = $this->factory->post->create();
		wp_set_object_terms( $post1, [ $tag1 ], 'post_tag' );
		$post2 = $this->factory->post->create();
		wp_set_object_terms( $post2, [ $tag2 ], 'post_tag' );
		$post3 = $this->factory->post->create();
		wp_set_object_terms( $post3, [ $tag1, $tag2 ], 'post_tag' );
		$post4 = $this->factory->post->create();

		// Set feed settings with tag include using IN relation.
		$this->set_test_settings(
			[
				'tag_include'               => [ $tag1, $tag2 ],
				'tag_inner_relation'        => 'IN',
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with IN operator.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for tag IN relation' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( 'post_tag', $tax_query[0]['taxonomy'], 'tax_query should use post_tag taxonomy' );
		$this->assertEquals( 'IN', $tax_query[0]['operator'], 'tax_query should use IN operator' );
		$this->assertEquals( [ $tag1, $tag2 ], $tax_query[0]['terms'], 'tax_query should include both tags' );

		// Verify the query returns the correct posts (post1, post2, post3 should be included).
		$query->get_posts();
		$this->assertEquals( 3, $query->found_posts, 'Should find exactly three posts' );
		$post_ids = wp_list_pluck( $query->posts, 'ID' );
		$this->assertContains( $post1, $post_ids, 'Should include post with tag1' );
		$this->assertContains( $post2, $post_ids, 'Should include post with tag2' );
		$this->assertContains( $post3, $post_ids, 'Should include post with both tags' );
		$this->assertNotContains( $post4, $post_ids, 'Should not include post with no tags' );
	}

	/**
	 * Test that tag inner relation AND works correctly (all of these tags).
	 */
	public function test_rss_tag_inner_relation_and() {
		// Create test tags.
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);
		$tag2 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 2',
			]
		);

		// Create test posts with different tag combinations.
		$post1 = $this->factory->post->create();
		wp_set_object_terms( $post1, [ $tag1 ], 'post_tag' );
		$post2 = $this->factory->post->create();
		wp_set_object_terms( $post2, [ $tag2 ], 'post_tag' );
		$post3 = $this->factory->post->create();
		wp_set_object_terms( $post3, [ $tag1, $tag2 ], 'post_tag' );
		$post4 = $this->factory->post->create();

		// Set feed settings with tag include using AND relation.
		$this->set_test_settings(
			[
				'tag_include'               => [ $tag1, $tag2 ],
				'tag_inner_relation'        => 'AND',
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with AND operator.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for tag AND relation' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 condition' );
		$this->assertEquals( 'post_tag', $tax_query[0]['taxonomy'], 'tax_query should use post_tag taxonomy' );
		$this->assertEquals( 'AND', $tax_query[0]['operator'], 'tax_query should use AND operator' );
		$this->assertEquals( [ $tag1, $tag2 ], $tax_query[0]['terms'], 'tax_query should include both tags' );

		// Verify the query returns the correct posts (only post3 should be included).
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post3, $query->posts[0]->ID, 'Should return only the post with both tags' );
	}

	/**
	 * Test that custom taxonomy inner relation works correctly.
	 */
	public function test_rss_custom_taxonomy_inner_relation() {
		// Create test terms for custom taxonomy.
		$term1 = $this->factory->term->create(
			[
				'taxonomy' => $this->custom_taxonomy,
				'name'     => 'Test Term 1',
			]
		);
		$term2 = $this->factory->term->create(
			[
				'taxonomy' => $this->custom_taxonomy,
				'name'     => 'Test Term 2',
			]
		);

		// Create test posts with different term combinations.
		$post1 = $this->factory->post->create();
		wp_set_object_terms( $post1, [ $term1 ], $this->custom_taxonomy );
		$post2 = $this->factory->post->create();
		wp_set_object_terms( $post2, [ $term2 ], $this->custom_taxonomy );
		$post3 = $this->factory->post->create();
		wp_set_object_terms( $post3, [ $term1, $term2 ], $this->custom_taxonomy );
		$post4 = $this->factory->post->create();

		// Test with IN relation.
		$this->set_test_settings(
			[
				$this->custom_taxonomy . '_include'        => [ $term1, $term2 ],
				$this->custom_taxonomy . '_inner_relation' => 'IN',
				'taxonomy_filters_relation'                => 'AND',
			]
		);

		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();
		RSS::modify_feed_query( $query, $this->feed_post_id );

		$tax_query = $query->get( 'tax_query' );
		$this->assertEquals( 'IN', $tax_query[0]['operator'], 'tax_query should use IN operator for custom taxonomy' );

		$query->get_posts();
		$this->assertEquals( 3, $query->found_posts, 'Should find exactly three posts with IN relation' );

		// Test with AND relation.
		$this->set_test_settings(
			[
				$this->custom_taxonomy . '_include'        => [ $term1, $term2 ],
				$this->custom_taxonomy . '_inner_relation' => 'AND',
				'taxonomy_filters_relation'                => 'AND',
			]
		);

		$query = new WP_Query();
		RSS::modify_feed_query( $query, $this->feed_post_id );

		$tax_query = $query->get( 'tax_query' );
		$this->assertEquals( 'AND', $tax_query[0]['operator'], 'tax_query should use AND operator for custom taxonomy' );

		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post with AND relation' );
		$this->assertEquals( $post3, $query->posts[0]->ID, 'Should return only the post with both terms' );
	}

	/**
	 * Test complex scenario with multiple taxonomies and different inner relations.
	 */
	public function test_rss_complex_inner_relations() {
		// Create test terms.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);
		$tag2 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 2',
			]
		);

		// Create test posts with different combinations.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		wp_set_object_terms( $post1, [ $tag1 ], 'post_tag' );

		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat1, $cat2 ] ] );
		wp_set_object_terms( $post2, [ $tag1, $tag2 ], 'post_tag' );

		$post3 = $this->factory->post->create( [ 'post_category' => [ $cat2 ] ] );
		wp_set_object_terms( $post3, [ $tag1 ], 'post_tag' );

		$post4 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		wp_set_object_terms( $post4, [ $tag2 ], 'post_tag' );

		// Set feed settings with different inner relations.
		$this->set_test_settings(
			[
				'category_include'          => [ $cat1, $cat2 ],
				'category_inner_relation'   => 'IN', // Any of these categories.
				'tag_include'               => [ $tag1, $tag2 ],
				'tag_inner_relation'        => 'AND', // All of these tags.
				'taxonomy_filters_relation' => 'AND', // Must match both taxonomies.
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with correct structure.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for complex inner relations' );
		$this->assertEquals( 'AND', $tax_query['relation'], 'tax_query relation should be AND' );
		$this->assertCount( 3, $tax_query, 'tax_query should have 2 conditions + relation' );

		// Find the category and tag conditions.
		$category_condition = null;
		$tag_condition = null;
		foreach ( $tax_query as $condition ) {
			if ( ! is_array( $condition ) ) {
				continue;
			}
			if ( 'category' === $condition['taxonomy'] ) {
				$category_condition = $condition;
			} elseif ( 'post_tag' === $condition['taxonomy'] ) {
				$tag_condition = $condition;
			}
		}

		$this->assertNotNull( $category_condition, 'Should have category condition' );
		$this->assertEquals( 'IN', $category_condition['operator'], 'Category should use IN operator' );

		$this->assertNotNull( $tag_condition, 'Should have tag condition' );
		$this->assertEquals( 'AND', $tag_condition['operator'], 'Tag should use AND operator' );

		// Verify the query returns the correct post (only post2 should match: has cat1 OR cat2 AND has both tag1 AND tag2).
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post2, $query->posts[0]->ID, 'Should return only the post matching both conditions' );
	}

	/**
	 * Test that category exclusion works without include filters.
	 */
	public function test_rss_category_exclusion_without_include_filters() {
		// Create test categories.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat2 ] ] );

		// Set feed settings with only category exclude.
		$this->set_test_settings(
			[
				'category_exclude'          => [ $cat2 ],
				'taxonomy_filters_relation' => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with only category exclusion.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for category exclusion only' );
		$this->assertCount( 1, $tax_query, 'tax_query should have 1 exclude condition' );
		$this->assertEquals( 'category', $tax_query[0]['taxonomy'], 'tax_query should use category taxonomy' );
		$this->assertEquals( 'NOT IN', $tax_query[0]['operator'], 'tax_query should use NOT IN operator' );
		$this->assertEquals( [ $cat2 ], $tax_query[0]['terms'], 'tax_query should exclude cat2' );

		// Verify the query returns the correct posts (only post1, not post2).
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post1, $query->posts[0]->ID, 'Should return only the post not in cat2' );
	}

	/**
	 * Test complex scenario with multiple taxonomies and custom taxonomy.
	 */
	public function test_rss_complex_taxonomy_filtering() {
		// Create test terms.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$tag1 = $this->factory->term->create(
			[
				'taxonomy' => 'post_tag',
				'name'     => 'Test Tag 1',
			]
		);
		$custom_term1 = $this->factory->term->create(
			[
				'taxonomy' => $this->custom_taxonomy,
				'name'     => 'Test Custom Term 1',
			]
		);

		// Create test posts with different combinations.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		wp_set_object_terms( $post1, [ $tag1 ], 'post_tag' );
		wp_set_object_terms( $post1, [ $custom_term1 ], $this->custom_taxonomy );

		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		wp_set_object_terms( $post2, [ $tag1 ], 'post_tag' );

		$post3 = $this->factory->post->create();
		wp_set_object_terms( $post3, [ $custom_term1 ], $this->custom_taxonomy );

		// Set feed settings with all three taxonomies.
		$this->set_test_settings(
			[
				'category_include'                  => [ $cat1 ],
				'tag_include'                       => [ $tag1 ],
				$this->custom_taxonomy . '_include' => [ $custom_term1 ],
				'taxonomy_filters_relation'         => 'AND',
			]
		);

		// Mock the feed query.
		$_GET['partner-feed'] = 'test-rss-feed';
		$query = new WP_Query();

		// Apply the RSS modifications.
		RSS::modify_feed_query( $query, $this->feed_post_id );

		// Check that tax_query is set with correct structure.
		$tax_query = $query->get( 'tax_query' );
		$this->assertIsArray( $tax_query, 'tax_query should be set for complex filtering' );
		$this->assertEquals( 'AND', $tax_query['relation'], 'tax_query relation should be AND' );
		$this->assertCount( 4, $tax_query, 'tax_query should have 3 conditions + relation' );

		// Verify the query returns the correct post (only post1 has all three).
		$query->get_posts();
		$this->assertEquals( 1, $query->found_posts, 'Should find exactly one post' );
		$this->assertEquals( $post1, $query->posts[0]->ID, 'Should return the post with all three taxonomy terms' );
	}
}

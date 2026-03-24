<?php
/**
 * Tests for Primary_Category utility.
 *
 * @package Newspack\Tests
 */

use Newspack\Primary_Category;

// Load mock if Yoast is not available.
if ( ! class_exists( 'WPSEO_Primary_Term' ) ) {
	require_once dirname( __DIR__ ) . '/mocks/yoast-mocks.php';
}

/**
 * Primary_Category test case.
 *
 * @group primary-category
 */
class Test_Primary_Category extends WP_UnitTestCase {

	/**
	 * Original global $post value, saved in set_up and restored in tear_down.
	 *
	 * @var \WP_Post|null
	 */
	private $original_post;

	/**
	 * Setup.
	 */
	public function set_up(): void {
		parent::set_up();
		global $post;
		$this->original_post = $post;
	}

	/**
	 * Tear down.
	 */
	public function tear_down(): void {
		global $post;
		$post = $this->original_post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		delete_option( Primary_Category::OPTION_NAME );
		parent::tear_down();
	}

	/**
	 * Test is_yoast_active() returns true (mock is loaded).
	 */
	public function test_is_yoast_active() {
		$this->assertTrue( Primary_Category::is_yoast_active() );
	}

	/**
	 * Test is_enabled() returns true by default when Yoast is active.
	 */
	public function test_is_enabled_defaults_to_true() {
		delete_option( Primary_Category::OPTION_NAME );
		$this->assertTrue( Primary_Category::is_enabled() );
	}

	/**
	 * Test is_enabled() respects the option value.
	 */
	public function test_is_enabled_respects_option() {
		update_option( Primary_Category::OPTION_NAME, 0 );
		$this->assertFalse( Primary_Category::is_enabled() );
		update_option( Primary_Category::OPTION_NAME, 1 );
		$this->assertTrue( Primary_Category::is_enabled() );
	}

	/**
	 * Test get() returns false when feature is disabled via option.
	 */
	public function test_get_returns_false_when_disabled() {
		update_option( Primary_Category::OPTION_NAME, 0 );
		$post_id = self::factory()->post->create();
		$this->assertFalse( Primary_Category::get( $post_id ) );
	}

	/**
	 * Test get() returns false with null post ID and no global post.
	 */
	public function test_get_returns_false_with_null_post_id_no_global() {
		delete_option( Primary_Category::OPTION_NAME );
		unset( $GLOBALS['post'] );
		$this->assertFalse( Primary_Category::get() );
	}

	/**
	 * Test get() returns false when no primary category meta is set.
	 */
	public function test_get_returns_false_without_primary_meta() {
		$post_id = self::factory()->post->create();
		$this->assertFalse( Primary_Category::get( $post_id ) );
	}

	/**
	 * Test get() returns false when the primary category term has been deleted.
	 */
	public function test_get_returns_false_when_primary_term_deleted() {
		$post_id  = self::factory()->post->create();
		$category = self::factory()->category->create_and_get( [ 'name' => 'Temp Cat' ] );
		update_post_meta( $post_id, '_yoast_wpseo_primary_category', $category->term_id );
		wp_delete_term( $category->term_id, 'category' );

		$this->assertFalse( Primary_Category::get( $post_id ) );
	}

	/**
	 * Test get() returns the primary category term.
	 */
	public function test_get_returns_primary_category() {
		$post_id  = self::factory()->post->create();
		$category = self::factory()->category->create_and_get( [ 'name' => 'Primary Cat' ] );
		wp_set_post_categories( $post_id, [ $category->term_id ] );
		update_post_meta( $post_id, '_yoast_wpseo_primary_category', $category->term_id );

		$result = Primary_Category::get( $post_id );
		$this->assertInstanceOf( WP_Term::class, $result );
		$this->assertEquals( $category->term_id, $result->term_id );
	}

	/**
	 * Test filter passes through post_tag blocks.
	 */
	public function test_filter_passes_through_tag_blocks() {
		$html   = '<div class="taxonomy-post_tag"><a href="/tag/news/" rel="tag">News</a></div>';
		$parsed = [ 'attrs' => [ 'term' => 'post_tag' ] ];
		$result = Primary_Category::filter_post_terms_block( $html, $parsed, null );
		$this->assertEquals( $html, $result );
	}

	/**
	 * Test filter passes through when no term attr (defaults to non-category).
	 */
	public function test_filter_passes_through_when_no_term_attr() {
		$html   = '<div class="taxonomy-post_tag"><a href="/tag/news/" rel="tag">News</a></div>';
		$parsed = [ 'attrs' => [] ];
		$result = Primary_Category::filter_post_terms_block( $html, $parsed, null );
		$this->assertEquals( $html, $result );
	}

	/**
	 * Test filter replaces categories with primary category.
	 */
	public function test_filter_replaces_category_block_content() {
		$post_id  = self::factory()->post->create();
		$primary  = self::factory()->category->create_and_get( [ 'name' => 'Primary Cat' ] );
		$other    = self::factory()->category->create_and_get( [ 'name' => 'Other Cat' ] );
		wp_set_post_categories( $post_id, [ $primary->term_id, $other->term_id ] );
		update_post_meta( $post_id, '_yoast_wpseo_primary_category', $primary->term_id );

		$GLOBALS['post'] = get_post( $post_id );
		setup_postdata( $GLOBALS['post'] );

		$html   = '<div class="taxonomy-category wp-block-post-terms"><a href="/cat/other-cat/" rel="tag">Other Cat</a>, <a href="/cat/primary-cat/" rel="tag">Primary Cat</a></div>';
		$parsed = [ 'attrs' => [ 'term' => 'category' ] ];

		// Create a mock block instance with postId context.
		$block_instance          = new stdClass();
		$block_instance->context = [ 'postId' => $post_id ];

		$result = Primary_Category::filter_post_terms_block( $html, $parsed, $block_instance );

		$this->assertStringContainsString( 'Primary Cat', $result );
		$this->assertStringNotContainsString( 'Other Cat', $result );
		$this->assertStringContainsString( '<div', $result );
		$this->assertStringContainsString( 'taxonomy-category', $result );

		wp_reset_postdata();
	}

	/**
	 * Test filter preserves prefix and suffix.
	 */
	public function test_filter_preserves_prefix_and_suffix() {
		$post_id  = self::factory()->post->create();
		$category = self::factory()->category->create_and_get( [ 'name' => 'Tech' ] );
		wp_set_post_categories( $post_id, [ $category->term_id ] );
		update_post_meta( $post_id, '_yoast_wpseo_primary_category', $category->term_id );

		$html   = '<div class="taxonomy-category"><a href="/cat/tech/" rel="tag">Tech</a></div>';
		$parsed = [
			'attrs' => [
				'term'   => 'category',
				'prefix' => 'Filed under: ',
				'suffix' => '.',
			],
		];

		$block_instance          = new stdClass();
		$block_instance->context = [ 'postId' => $post_id ];

		$result = Primary_Category::filter_post_terms_block( $html, $parsed, $block_instance );

		$this->assertStringContainsString( 'wp-block-post-terms__prefix', $result );
		$this->assertStringContainsString( 'Filed under: ', $result );
		$this->assertStringContainsString( 'wp-block-post-terms__suffix', $result );
	}

	/**
	 * Test filter returns original content when no primary category is set.
	 */
	public function test_filter_returns_original_when_no_primary_category() {
		$post_id = self::factory()->post->create();

		$html   = '<div class="taxonomy-category"><a href="/cat/uncategorized/" rel="tag">Uncategorized</a></div>';
		$parsed = [ 'attrs' => [ 'term' => 'category' ] ];

		$block_instance          = new stdClass();
		$block_instance->context = [ 'postId' => $post_id ];

		$result = Primary_Category::filter_post_terms_block( $html, $parsed, $block_instance );
		$this->assertEquals( $html, $result );
	}

	/**
	 * Test filter handles malformed HTML gracefully.
	 */
	public function test_filter_handles_malformed_html() {
		$post_id  = self::factory()->post->create();
		$category = self::factory()->category->create_and_get( [ 'name' => 'News' ] );
		wp_set_post_categories( $post_id, [ $category->term_id ] );
		update_post_meta( $post_id, '_yoast_wpseo_primary_category', $category->term_id );

		$malformed = 'just plain text, no HTML tags';
		$parsed    = [ 'attrs' => [ 'term' => 'category' ] ];

		$block_instance          = new stdClass();
		$block_instance->context = [ 'postId' => $post_id ];

		$result = Primary_Category::filter_post_terms_block( $malformed, $parsed, $block_instance );
		$this->assertEquals( $malformed, $result );
	}
}

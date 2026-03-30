<?php
/**
 * Tests for RSS feed content restriction.
 *
 * @package Newspack\Tests\Content_Gate
 */

namespace Newspack\Tests\Content_Gate;

use Newspack\Content_Gate;
use Newspack\Content_Gate_Settings;

/**
 * Tests for RSS feed content restriction.
 */
class Test_Advanced_Settings extends \WP_UnitTestCase {

	/**
	 * Gate ID.
	 *
	 * @var int
	 */
	protected $gate_id;

	/**
	 * Restricted post ID.
	 *
	 * @var int
	 */
	protected $restricted_post_id;

	/**
	 * Unrestricted post ID.
	 *
	 * @var int
	 */
	protected $unrestricted_post_id;

	/**
	 * Long body used for posts so paragraph truncation has something to work with.
	 *
	 * @var string
	 */
	protected $long_content = '<p>Paragraph one.</p><p>Paragraph two.</p><p>Paragraph three.</p><p>Paragraph four.</p><p>Paragraph five.</p>';

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Create a published gate that restricts all posts by post type.
		$this->gate_id = Content_Gate::create_gate( [ 'title' => 'Feed Test Gate' ] );
		Content_Gate::update_gate_settings(
			$this->gate_id,
			[
				'title'         => 'Feed Test Gate',
				'status'        => 'publish',
				'priority'      => 0,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'registration'  => [
					'active'               => true,
					'metering'             => [
						'enabled' => false,
						'count'   => 0,
						'period'  => 'month',
					],
					'require_verification' => false,
					'gate_id'              => 0,
				],
			]
		);

		$this->restricted_post_id   = $this->factory->post->create( [ 'post_content' => $this->long_content ] );
		$this->unrestricted_post_id = $this->factory->post->create(
			[
				'post_type'    => 'page',
				'post_content' => $this->long_content,
			]
		);

		// Ensure restrict_feeds is on (default is 1).
		update_option( Content_Gate_Settings::OPTION_PREFIX . 'restrict_feeds', 1 );

		// Reset cached settings so the option change takes effect.
		Content_Gate_Settings::reset_cache();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		foreach ( Content_Gate::get_gates() as $gate ) {
			wp_delete_post( $gate['id'], true );
		}
		wp_delete_post( $this->restricted_post_id, true );
		wp_delete_post( $this->unrestricted_post_id, true );

		delete_option( Content_Gate_Settings::OPTION_PREFIX . 'restrict_feeds' );
		Content_Gate_Settings::reset_cache();

		parent::tear_down();
	}

	/**
	 * When restrict_feeds is enabled, the_content_feed is truncated for a gated post.
	 */
	public function test_feed_content_is_truncated_for_restricted_post() {
		global $post;
		$post = get_post( $this->restricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$filtered = apply_filters( 'the_content_feed', $this->long_content, 'rss2' );

		wp_reset_postdata();

		$this->assertNotEquals( $this->long_content, $filtered, 'Feed content should be truncated for a restricted post' );
		$this->assertStringNotContainsString( 'Paragraph five', $filtered, 'Truncated content should not contain later paragraphs' );
	}

	/**
	 * When restrict_feeds is enabled, the_excerpt_rss is truncated for a gated post.
	 */
	public function test_feed_excerpt_is_truncated_for_restricted_post() {
		global $post;
		$post = get_post( $this->restricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$filtered = apply_filters( 'the_excerpt_rss', $this->long_content );

		wp_reset_postdata();

		$this->assertNotEquals( $this->long_content, $filtered, 'Feed excerpt should be truncated for a restricted post' );
		$this->assertStringNotContainsString( 'Paragraph five', $filtered, 'Truncated excerpt should not contain later paragraphs' );
	}

	/**
	 * When restrict_feeds is disabled, the_content_feed is unmodified.
	 */
	public function test_feed_content_is_not_truncated_when_restrict_feeds_is_off() {
		update_option( Content_Gate_Settings::OPTION_PREFIX . 'restrict_feeds', 0 );
		Content_Gate_Settings::reset_cache();

		global $post;
		$post = get_post( $this->restricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$filtered = apply_filters( 'the_content_feed', $this->long_content, 'rss2' );

		wp_reset_postdata();

		$this->assertEquals( $this->long_content, $filtered, 'Feed content should be unmodified when restrict_feeds is disabled' );
	}

	/**
	 * When restrict_feeds is disabled, the_excerpt_rss is unmodified.
	 */
	public function test_feed_excerpt_is_not_truncated_when_restrict_feeds_is_off() {
		update_option( Content_Gate_Settings::OPTION_PREFIX . 'restrict_feeds', 0 );
		Content_Gate_Settings::reset_cache();

		global $post;
		$post = get_post( $this->restricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$filtered = apply_filters( 'the_excerpt_rss', $this->long_content );

		wp_reset_postdata();

		$this->assertEquals( $this->long_content, $filtered, 'Feed excerpt should be unmodified when restrict_feeds is disabled' );
	}

	/**
	 * Content for a non-restricted post is not truncated in feeds.
	 */
	public function test_feed_content_is_not_truncated_for_unrestricted_post() {
		// Make the unrestricted post the current post in the loop.
		global $post;
		$post = get_post( $this->unrestricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$filtered = apply_filters( 'the_content_feed', $this->long_content, 'rss2' );

		wp_reset_postdata();

		$this->assertEquals( $this->long_content, $filtered, 'Feed content should be unmodified for an unrestricted post' );
	}

	/**
	 * Excerpt for a non-restricted post is not truncated in feeds.
	 */
	public function test_feed_excerpt_is_not_truncated_for_unrestricted_post() {
		global $post;
		$post = get_post( $this->unrestricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$filtered = apply_filters( 'the_excerpt_rss', $this->long_content );

		wp_reset_postdata();

		$this->assertEquals( $this->long_content, $filtered, 'Feed excerpt should be unmodified for an unrestricted post' );
	}

	// -------------------------------------------------------------------------
	// Everlit audio restriction tests
	// -------------------------------------------------------------------------

	/**
	 * Everlit iframe src pattern used to simulate the plugin output.
	 *
	 * @var string
	 */
	private $everlit_iframe = '<iframe src="https://app.everlit.audio/mixable/abc123" width="100%" height="200px"></iframe>';

	/**
	 * When restrict_everlit is enabled, Everlit iframes are stripped from
	 * the_content output for a gated post.
	 */
	public function test_everlit_iframe_is_removed_for_restricted_post() {
		// Force restrict_everlit on via the filter hook (Everlit is not configured in tests).
		add_filter( 'newspack_content_gate_restrict_everlit', '__return_true' );

		global $post;
		$post = get_post( $this->restricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$content  = $this->long_content . $this->everlit_iframe;
		$filtered = apply_filters( 'the_content', $content );

		wp_reset_postdata();
		remove_filter( 'newspack_content_gate_restrict_everlit', '__return_true' );

		$this->assertStringNotContainsString( 'everlit.audio', $filtered, 'Everlit iframe should be stripped from restricted post content' );
	}

	/**
	 * When restrict_everlit is disabled, Everlit iframes are preserved in
	 * the_content output for a gated post.
	 */
	public function test_everlit_iframe_is_not_removed_when_setting_is_off() {
		add_filter( 'newspack_content_gate_restrict_everlit', '__return_false' );

		global $post;
		$post = get_post( $this->restricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$content  = $this->long_content . $this->everlit_iframe;
		$filtered = apply_filters( 'the_content', $content );

		wp_reset_postdata();
		remove_filter( 'newspack_content_gate_restrict_everlit', '__return_false' );

		$this->assertStringContainsString( 'everlit.audio', $filtered, 'Everlit iframe should be preserved when restrict_everlit is disabled' );
	}

	/**
	 * Everlit iframes are never stripped from unrestricted post content.
	 */
	public function test_everlit_iframe_is_not_removed_for_unrestricted_post() {
		add_filter( 'newspack_content_gate_restrict_everlit', '__return_true' );

		global $post;
		$post = get_post( $this->unrestricted_post_id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $post );

		$content  = $this->long_content . $this->everlit_iframe;
		$filtered = apply_filters( 'the_content', $content );

		wp_reset_postdata();
		remove_filter( 'newspack_content_gate_restrict_everlit', '__return_true' );

		$this->assertStringContainsString( 'everlit.audio', $filtered, 'Everlit iframe should be preserved for unrestricted posts' );
	}
}

<?php
/**
 * Tests for Post Date features.
 *
 * @package Newspack\Tests
 */

namespace Newspack\Tests;

/**
 * Test class for Post_Date.
 *
 * @group post-date
 */
class Test_Post_Date extends \WP_UnitTestCase {

	/**
	 * Post ID for testing.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Setup before class.
	 */
	public static function set_up_before_class(): void {
		parent::set_up_before_class();
		require_once NEWSPACK_ABSPATH . 'includes/class-post-date.php';
	}

	/**
	 * Setup.
	 */
	public function set_up(): void {
		parent::set_up();
		// Reset theme mods for each test.
		remove_theme_mod( 'post_time_ago' );
		remove_theme_mod( 'post_time_ago_cut_off' );
		remove_theme_mod( 'post_updated_date' );
		remove_theme_mod( 'post_updated_date_threshold' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down(): void {
		remove_theme_mod( 'post_time_ago' );
		remove_theme_mod( 'post_time_ago_cut_off' );
		remove_theme_mod( 'post_updated_date' );
		remove_theme_mod( 'post_updated_date_threshold' );
		parent::tear_down();
	}

	// ─── Time Ago: convert_to_time_ago() ───

	/**
	 * Test time-ago conversion for a recent post (within cutoff).
	 */
	public function test_time_ago_within_cutoff() {
		$two_hours_ago = gmdate( 'Y-m-d H:i:s', time() - 2 * HOUR_IN_SECONDS );
		$result = \Newspack\Post_Date::convert_to_time_ago( $two_hours_ago, 14 );
		$this->assertStringContainsString( 'ago', $result, 'Post 2 hours old should show relative date.' );
	}

	/**
	 * Test time-ago returns null for a post beyond the cutoff.
	 */
	public function test_time_ago_beyond_cutoff() {
		$twenty_days_ago = gmdate( 'Y-m-d H:i:s', time() - 20 * DAY_IN_SECONDS );
		$result = \Newspack\Post_Date::convert_to_time_ago( $twenty_days_ago, 14 );
		$this->assertNull( $result, 'Post beyond cutoff should return null.' );
	}

	/**
	 * Test time-ago at exact cutoff boundary returns null (not within cutoff).
	 */
	public function test_time_ago_at_boundary() {
		$exactly_14_days = gmdate( 'Y-m-d H:i:s', time() - 14 * DAY_IN_SECONDS );
		$result = \Newspack\Post_Date::convert_to_time_ago( $exactly_14_days, 14 );
		$this->assertNull( $result, 'Post at exact cutoff boundary should return null.' );
	}

	/**
	 * Test time-ago with custom cutoff.
	 */
	public function test_time_ago_custom_cutoff() {
		$three_days_ago = gmdate( 'Y-m-d H:i:s', time() - 3 * DAY_IN_SECONDS );
		$result_within = \Newspack\Post_Date::convert_to_time_ago( $three_days_ago, 7 );
		$this->assertStringContainsString( 'ago', $result_within, 'Post 3 days old with 7-day cutoff should show relative date.' );

		$result_beyond = \Newspack\Post_Date::convert_to_time_ago( $three_days_ago, 2 );
		$this->assertNull( $result_beyond, 'Post 3 days old with 2-day cutoff should return null.' );
	}

	// ─── Time Ago: get_the_date filter (classic theme) ───

	/**
	 * Test get_the_date filter converts date when feature is enabled.
	 */
	public function test_get_the_date_filter_enabled() {
		set_theme_mod( 'post_time_ago', true );
		set_theme_mod( 'post_time_ago_cut_off', 14 );

		$post_id = static::factory()->post->create(
			[
				'post_date' => gmdate( 'Y-m-d H:i:s', time() - 2 * HOUR_IN_SECONDS ),
			]
		);

		\Newspack\Post_Date::init();
		$date = get_the_date( '', $post_id );
		$this->assertStringContainsString( 'ago', $date, 'get_the_date should return relative date when feature is on.' );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test get_the_date filter preserves date when feature is disabled.
	 */
	public function test_get_the_date_filter_disabled() {
		set_theme_mod( 'post_time_ago', false );

		$post_id = static::factory()->post->create(
			[
				'post_date' => gmdate( 'Y-m-d H:i:s', time() - 2 * HOUR_IN_SECONDS ),
			]
		);

		\Newspack\Post_Date::init();
		$date = get_the_date( '', $post_id );
		$this->assertStringNotContainsString( 'ago', $date, 'get_the_date should return full date when feature is off.' );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Test get_the_date filter skips machine-readable ISO format.
	 */
	public function test_get_the_date_skips_iso_format() {
		set_theme_mod( 'post_time_ago', true );
		set_theme_mod( 'post_time_ago_cut_off', 14 );

		$post_id = static::factory()->post->create(
			[
				'post_date' => gmdate( 'Y-m-d H:i:s', time() - 2 * HOUR_IN_SECONDS ),
			]
		);

		\Newspack\Post_Date::init();
		$date = get_the_date( 'Y-m-d\TH:i:sP', $post_id );
		$this->assertStringNotContainsString( 'ago', $date, 'ISO format should not be converted to time-ago.' );

		wp_delete_post( $post_id, true );
	}

	// ─── Time Ago: render_block filter (block theme) ───

	/**
	 * Test render_block filter converts publish date block.
	 */
	public function test_render_block_time_ago_publish_date() {
		set_theme_mod( 'post_time_ago', true );
		set_theme_mod( 'post_time_ago_cut_off', 14 );

		$two_hours_ago = gmdate( 'Y-m-d\TH:i:sP', time() - 2 * HOUR_IN_SECONDS );
		$block_content = '<div class="wp-block-post-date"><time datetime="' . $two_hours_ago . '">March 11, 2026</time></div>';
		$block = [ 'blockName' => 'core/post-date' ];

		$result = \Newspack\Post_Date::filter_post_date_block( $block_content, $block );
		$this->assertStringContainsString( 'ago', $result, 'Publish date block should show relative date.' );
		$this->assertStringContainsString( 'datetime="' . $two_hours_ago . '"', $result, 'datetime attribute should be preserved.' );
	}

	/**
	 * Test render_block filter does NOT convert modified date blocks.
	 */
	public function test_render_block_time_ago_skips_modified_date() {
		set_theme_mod( 'post_time_ago', true );
		set_theme_mod( 'post_time_ago_cut_off', 14 );

		$two_hours_ago = gmdate( 'Y-m-d\TH:i:sP', time() - 2 * HOUR_IN_SECONDS );
		$block_content = '<div class="wp-block-post-date wp-block-post-date__modified-date"><time datetime="' . $two_hours_ago . '">March 11, 2026</time></div>';
		$block = [ 'blockName' => 'core/post-date' ];

		$result = \Newspack\Post_Date::filter_post_date_block( $block_content, $block );
		$this->assertStringNotContainsString( 'ago', $result, 'Modified date block should NOT get time-ago treatment.' );
	}

	/**
	 * Test render_block filter preserves date beyond cutoff.
	 */
	public function test_render_block_time_ago_beyond_cutoff() {
		set_theme_mod( 'post_time_ago', true );
		set_theme_mod( 'post_time_ago_cut_off', 14 );

		$twenty_days_ago = gmdate( 'Y-m-d\TH:i:sP', time() - 20 * DAY_IN_SECONDS );
		$block_content = '<div class="wp-block-post-date"><time datetime="' . $twenty_days_ago . '">February 19, 2026</time></div>';
		$block = [ 'blockName' => 'core/post-date' ];

		$result = \Newspack\Post_Date::filter_post_date_block( $block_content, $block );
		$this->assertStringNotContainsString( 'ago', $result, 'Date beyond cutoff should not be converted.' );
		$this->assertStringContainsString( 'February 19, 2026', $result, 'Original date text should be preserved.' );
	}
}

<?php
/**
 * Newspack Content Gate.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Content_Gate_Settings {
	/**
	 * Option prefix for content gate options.
	 */
	const OPTION_PREFIX = 'newspack_content_gate_';

	/**
	 * Cached settings.
	 *
	 * @var array|null
	 */
	private static $settings = null;

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'the_content_feed', [ __CLASS__, 'restrict_feed_content' ], PHP_INT_MAX );
		add_filter( 'the_excerpt_rss', [ __CLASS__, 'restrict_feed_excerpt' ], PHP_INT_MAX );
		add_filter( 'render_block', [ __CLASS__, 'restrict_everlit' ], 10, 2 );
	}

	/**
	 * Get the advanced settings.
	 *
	 * @return array The advanced settings.
	 */
	public static function get_settings() {
		if ( null !== self::$settings ) {
			return self::$settings;
		}

		// RSS.
		$settings = [
			'restrict_feeds' => get_option( self::OPTION_PREFIX . 'restrict_feeds', 1 ),
		];

		// Everlit.
		$everlit = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'everlit' );
		if ( $everlit->is_active() ) {
			$settings['restrict_everlit'] = get_option( self::OPTION_PREFIX . 'restrict_everlit', 1 );
		}
		return $settings;
	}

	/**
	 * Update the advanced settings.
	 *
	 * @param array $settings The advanced settings.
	 */
	public static function update_settings( $settings ) {
		update_option( self::OPTION_PREFIX . 'restrict_feeds', boolval( $settings['restrict_feeds'] ) ? 1 : 0, false );
		update_option( self::OPTION_PREFIX . 'restrict_everlit', boolval( $settings['restrict_everlit'] ) ? 1 : 0, false );
		self::reset_cache();
		return self::get_settings();
	}

	/**
	 * Reset the settings cache.
	 */
	public static function reset_cache() {
		self::$settings = null;
	}

	/**
	 * Truncate post content in RSS feeds when restrict_feeds is enabled.
	 *
	 * Uses the gate's excerpt settings (<!--more--> tag or paragraph count) to
	 * match what logged-out visitors see on the front-end. The inline gate HTML
	 * is intentionally omitted — feeds should not contain login prompts.
	 *
	 * @param string $content Feed item content.
	 *
	 * @return string
	 */
	public static function restrict_feed_content( $content ) {
		$settings = self::get_settings();
		if ( empty( $settings['restrict_feeds'] ) ) {
			return $content;
		}
		$post = get_post();
		if ( ! $post || ! Content_Gate::is_post_restricted( $post->ID ) ) {
			return $content;
		}
		return Content_Gate::get_restricted_post_excerpt_for_gate( $post, Content_Gate::get_gate_layout_id( $post->ID ) );
	}

	/**
	 * Truncate post excerpt in RSS feeds when restrict_feeds is enabled.
	 *
	 * @param string $excerpt Feed item excerpt.
	 *
	 * @return string
	 */
	public static function restrict_feed_excerpt( $excerpt ) {
		$settings = self::get_settings();
		if ( empty( $settings['restrict_feeds'] ) ) {
			return $excerpt;
		}
		$post = get_post();
		if ( ! $post || ! Content_Gate::is_post_restricted( $post->ID ) ) {
			return $excerpt;
		}
		return Content_Gate::get_restricted_post_excerpt_for_gate( $post, Content_Gate::get_gate_layout_id( $post->ID ) );
	}

	/**
	 * Render block filter to strip Everlit audio iframes from the block content.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block.
	 *
	 * @return string The block content.
	 */
	public static function restrict_everlit( $block_content, $block ) {
		if ( ! in_array( $block['blockName'], [ 'custom/everlit-iframe-embed', 'custom/everlit-playlist-embed' ], true ) ) {
			return $block_content;
		}
		$settings = self::get_settings();

		/**
		 * Filters whether to strip Everlit audio iframes from gated post content.
		 *
		 * Defaults to the restrict_everlit setting (only present when Everlit is
		 * configured). Can be overridden — e.g. in tests — via this filter.
		 *
		 * @param bool $restrict Whether to restrict Everlit audio.
		 */
		if ( ! apply_filters( 'newspack_content_gate_restrict_everlit', ! empty( $settings['restrict_everlit'] ) ) ) {
			return $block_content;
		}
		$post = get_post();
		if ( ! $post || ! Content_Gate::is_post_restricted( $post->ID ) ) {
			return $block_content;
		}
		return '';
	}
}
Content_Gate_Settings::init();

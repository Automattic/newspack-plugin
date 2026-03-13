<?php
/**
 * Primary Category utility.
 *
 * Provides a shared utility for retrieving the Yoast primary category
 * of a post, with a site-wide toggle to enable/disable the feature.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Primary Category utility class.
 */
class Primary_Category {

	/**
	 * Option name for the primary category setting.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'newspack_primary_category_enabled';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_option( self::OPTION_NAME, true );
	}

	/**
	 * Check if the primary category feature is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return (bool) get_option( self::OPTION_NAME, true );
	}

	/**
	 * Check if Yoast SEO is active.
	 *
	 * @return bool
	 */
	public static function is_yoast_active() {
		return class_exists( 'WPSEO_Primary_Term' );
	}

	/**
	 * Get the primary category for a post.
	 *
	 * @param int|null $post_id Post ID. Defaults to current post.
	 * @return \WP_Term|false Primary category term object, or false if not available.
	 */
	public static function get( $post_id = null ) {
		if ( ! self::is_enabled() ) {
			return false;
		}

		if ( ! self::is_yoast_active() ) {
			return false;
		}

		if ( null === $post_id ) {
			$post_id = get_the_ID();
		}

		if ( ! $post_id ) {
			return false;
		}

		$primary_term = new \WPSEO_Primary_Term( 'category', $post_id );
		$category_id  = $primary_term->get_primary_term();

		if ( ! $category_id ) {
			return false;
		}

		$category = get_term( $category_id );

		if ( ! $category || is_wp_error( $category ) ) {
			return false;
		}

		return $category;
	}
}
Primary_Category::init();

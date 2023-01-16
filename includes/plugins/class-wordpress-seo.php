<?php
/**
 * Yoast (wordpress-seo) integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class WordPress_SEO {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'wpseo_enhanced_slack_data', [ __CLASS__, 'use_cap_for_slack_preview' ] );
		add_filter( 'wpseo_opengraph_url', [ __CLASS__, 'http_ogurls' ] );
		add_filter( 'wpseo_robots_array', [ __CLASS__, 'allow_indexing_guest_author_archive' ], 10, 2 );
	}

	/**
	 * Use the Co-Author in Slack preview metadata instead of the regular post author if needed.
	 *
	 * @param array $slack_data Array of data which will be output in twitter:data tags.
	 * @return array Modified $slack_data
	 */
	public static function use_cap_for_slack_preview( $slack_data ) {
		if ( function_exists( 'coauthors' ) && is_single() && isset( $slack_data[ __( 'Written by', 'wordpress-seo' ) ] ) ) {
			$slack_data[ __( 'Written by', 'wordpress-seo' ) ] = coauthors( null, null, null, null, false );
		}

		return $slack_data;
	}

	/**
	 * On Atomic infrastructure, URLs are `http` for Facebook requests.
	 * This forces the `og:url` to `http` for consistency, to prevent 301 redirect loop issues.
	 *
	 * @param string $og_url The opengraph URL.
	 * @return string modified $og_url
	 */
	public static function http_ogurls( $og_url ) {
		if ( defined( 'ATOMIC_SITE_ID' ) && ATOMIC_SITE_ID ) {
			$og_url = str_replace( 'https:', 'http:', $og_url );
		}
		return $og_url;
	}

	/**
	 * CoAuthors Plus and Yoast are incompatible where the author archives for guest authors are output as noindex.
	 * This filter will determine if we're on an author archive and reset the robots.txt string properly.
	 *
	 * See https://github.com/Yoast/wordpress-seo/issues/9147.
	 *
	 * @param string                 $robots       The meta robots directives to be echoed.
	 * @param Indexable_Presentation $presentation The presentation of an indexable.
	 */
	public static function allow_indexing_guest_author_archive( $robots, $presentation ) {
		if ( ! is_author() ) {
			return $robots;
		}

		if ( ! is_a( $presentation, '\Yoast\WP\SEO\Presentations\Indexable_Author_Archive_Presentation' ) ) {
			return $robots;
		}

		$post_type = get_post_type( get_queried_object_id() );
		if ( 'guest-author' !== $post_type ) {
			return $robots;
		}

		/*
		 * If this is a guest author archive and hasn't manually been set to noindex,
		 * make sure the robots.txt string is set properly.
		 */
		if ( empty( $presentation->model->is_robots_noindex ) || 0 === intval( $presentation->model->is_robots_noindex ) ) {
			if ( ! is_array( $robots ) ) {
				$robots = [];
			}
			$robots['index']  = 'index';
			$robots['follow'] = 'follow';
		}

		return $robots;
	}
}
WordPress_SEO::init();

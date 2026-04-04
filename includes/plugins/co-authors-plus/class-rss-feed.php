<?php
/**
 * Co-Authors Plus RSS feed integration.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Adds co-author support to RSS and other feeds.
 */
class RSS_Feed {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'the_author', [ __CLASS__, 'coauthors_in_rss' ] );
	}

	/**
	 * Filter the_author to include all co-authors in RSS and other feeds.
	 *
	 * /wp-includes/feed-rss2.php uses the_author(), so we selectively filter
	 * the_author value to include all co-authors when inside a feed.
	 *
	 * @param string $the_author The post author's display name.
	 * @return string The co-authors' display names, or the original author if not in a feed.
	 */
	public static function coauthors_in_rss( $the_author ) {
		if ( ! is_feed() || ! function_exists( 'coauthors' ) ) {
			return $the_author;
		}
		return coauthors( null, null, null, null, false );
	}
}
RSS_Feed::init();

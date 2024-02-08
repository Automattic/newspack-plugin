<?php
/**
 * Newspack category pager fix.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack category pager.
 *
 * This class adds a few tweaks to sites where the permalink structure is "/%category%/%postname%/".
 *
 * See https://core.trac.wordpress.org/ticket/8905 and https://core.trac.wordpress.org/ticket/21209
 */
final class Category_Pager {
	/**
	 * Initialize Hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'on_init' ] );
	}

	/**
	 * Action callback for init.
	 */
	public static function on_init() {
		if ( '/%category%/%postname%/' === get_option( 'permalink_structure' ) ) {
			add_filter( 'paginate_links', [ __CLASS__, 'fix_category_pager' ] );
			add_filter( 'wp_unique_post_slug', [ __CLASS__, 'guard_page_slug' ], 99, 1 );
		}
	}

	/**
	 * Filter callback for paginate_links.
	 *
	 * Filter the pager urls on category pages.
	 *
	 * For a category with the slug "kitten" for instance, WP will generate pager urls like "/kitten/page/2/"
	 * if you hit the url /kitten – this fixes the pager urls to be "/category/kitten/page/2/".
	 *
	 * @param string $link The pager link to filter.
	 *
	 * @return mixed|string
	 */
	public static function fix_category_pager( $link ) {
		if ( ! is_category() ) {
			return $link;
		}

		$path = wp_parse_url( $link, PHP_URL_PATH );
		if ( str_starts_with( $path, '/category' ) ) {
			// No fixing needed.
			return $link;
		}

		$new_path = '/category' . $path;

		return str_replace( $path, $new_path, $link );
	}

	/**
	 * Filter callback for wp_unique_post_slug.
	 *
	 * This will guard against the slug "page" being used for a post, as it will conflict with the pager.
	 *
	 * @param string $slug The post slug.
	 *
	 * @return mixed|string
	 */
	public static function guard_page_slug( $slug ) {
		if ( 'page' === $slug ) {
			return 'np-page';
		}

		return $slug;
	}
}

Category_Pager::init();

<?php
/**
 * Lite Site functionality
 *
 * @package newspack
 */

/**
 * Lite Site class
 */
class Lite_Site {
	/**
	 * Initialize the lite site functionality
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_rewrite_rules' ] );
		add_action( 'init', [ __CLASS__, 'maybe_flush_rewrite_rules' ], 11 );
		add_filter( 'query_vars', [ __CLASS__, 'register_query_vars' ] );
		add_action( 'template_redirect', [ __CLASS__, 'handle_lite_site_templates' ] );
	}

	/**
	 * Register the rewrite rules for the lite site
	 */
	public static function register_rewrite_rules() {
		add_rewrite_rule(
			'^text/?$',
			'index.php?lite_site=archive',
			'top'
		);

		add_rewrite_rule(
			'^text/([0-9]+)/?$',
			'index.php?lite_site=single&lite_site_id=$matches[1]',
			'top'
		);
	}

	/**
	 * Flush rewrite rules if they haven't been flushed yet
	 */
	public static function maybe_flush_rewrite_rules() {
		if ( ! get_option( 'lite_site_rewrite_rules_flushed' ) ) {
			flush_rewrite_rules(); // phpcs:ignore
			update_option( 'lite_site_rewrite_rules_flushed', true );
		}
	}

	/**
	 * Register custom query variables
	 *
	 * @param array $vars The array of query variables.
	 * @return array The modified array of query variables.
	 */
	public static function register_query_vars( $vars ) {
		$vars[] = 'lite_site';
		$vars[] = 'lite_site_id';
		return $vars;
	}

	/**
	 * Handle template routing for lite site pages
	 */
	public static function handle_lite_site_templates() {
		$lite_site = get_query_var( 'lite_site' );

		if ( ! $lite_site ) {
			return;
		}

		// Disable all other output.
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );

		if ( $lite_site === 'archive' ) {
			include_once __DIR__ . '/templates/archive.php';
			exit;
		}

		if ( $lite_site === 'single' ) {
			include_once __DIR__ . '/templates/single.php';
			exit;
		}
	}

	/**
	 * Get the primary color
	 *
	 * @return string The primary color.
	 */
	public static function get_primary_color() {
		if ( ! function_exists( 'newspack_get_primary_color' ) ) {
			return '#000';
		}

		$primary_color = newspack_get_primary_color();

		if ( 'default' !== get_theme_mod( 'theme_colors' ) ) {
			$primary_color = get_theme_mod( 'primary_color_hex', $primary_color );
		}

		return $primary_color;
	}

	/**
	 * Get the author(s) for a post
	 *
	 * @param WP_Post $post The post object.
	 * @return string The formatted author(s) string with links.
	 */
	public static function get_authors( $post ) {
		if ( function_exists( 'coauthors_posts_links' ) ) {
			$authors = get_coauthors( $post->ID );
			$author_links = array_map(
				function( $author ) {
					return sprintf(
						'<a href="%s">%s</a>',
						esc_url( get_author_posts_url( $author->ID, $author->user_nicename ) ),
						esc_html( $author->display_name )
					);
				},
				$authors
			);

			if ( count( $author_links ) > 1 ) {
				$last_author = array_pop( $author_links );
				$author_string = implode(
					/* translators: separator for all but last author in a list */
					__( ', ', 'newspack' ),
					$author_links
				);
				$author_string .= ' ' .
					/* translators: separator for last author in a list */
					__( 'and', 'newspack' ) .
					' ' . $last_author;
			} else {
				$author_string = $author_links[0];
			}
		} else {
			$author_string = sprintf(
				'<a href="%s">%s</a>',
				esc_url( get_author_posts_url( $post->post_author ) ),
				esc_html( get_the_author_meta( 'display_name', $post->post_author ) )
			);
		}

		return sprintf(
			/* translators: %s: author name(s) */
			__( 'By %s', 'newspack' ),
			$author_string
		);
	}

	/**
	 * Clean the post content for lite display
	 *
	 * @param string $content The post content.
	 * @return string The cleaned content.
	 */
	public static function clean_content( $content ) {
		// Remove HTML comments.
		$content = preg_replace( '/<!--(.|\s)*?-->/', '', $content );

		// First remove figures and their contents (including images and captions).
		$content = preg_replace( '/<figure.*?>.*?<\/figure>/s', '', $content );

		// Define allowed HTML elements for text-only content.
		$allowed_html = [
			'p'          => [],
			'h1'         => [],
			'h2'         => [],
			'h3'         => [],
			'h4'         => [],
			'h5'         => [],
			'h6'         => [],
			'ul'         => [],
			'ol'         => [],
			'li'         => [],
			'blockquote' => [],
			'strong'     => [],
			'em'         => [],
			'b'          => [],
			'i'          => [],
			'a'          => [
				'href'  => true,
				'title' => true,
			],
		];

		// Strip all HTML except allowed elements.
		$content = wp_kses( $content, $allowed_html );

		// Clean up any empty paragraphs.
		$content = preg_replace( '/<p>\s*<\/p>/', '', $content );

		return $content;
	}
}

// Initialize the class.
Lite_Site::init();

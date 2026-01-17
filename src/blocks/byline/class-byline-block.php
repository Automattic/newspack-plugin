<?php
/**
 * Byline Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Byline;

use Newspack\Bylines;

defined( 'ABSPATH' ) || exit;

/**
 * Byline_Block Class
 */
final class Byline_Block {
	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register the byline block.
	 *
	 * @return void
	 */
	public static function register_block() {
		register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
				'uses_context'    => [ 'postId', 'postType' ],
			]
		);
	}

	/**
	 * Block render callback.
	 *
	 * @param array  $attributes The block attributes.
	 * @param string $content    The block content.
	 * @param object $block      The block.
	 *
	 * @return string The block HTML.
	 */
	public static function render_block( array $attributes, string $content, $block ) {
		$post_id = $block->context['postId'] ?? get_the_ID();

		if ( empty( $post_id ) ) {
			return '';
		}

		// 1. Check for custom byline (use post meta check).
		if ( class_exists( 'Newspack\Bylines' ) ) {
			$byline_active = get_post_meta( $post_id, Bylines::META_KEY_ACTIVE, true );
			if ( $byline_active ) {
				// Use Bylines::get_post_byline_html() as the authoritative source.
				// Pass false for include_avatars and byline_wrapper since we handle output ourselves.
				$custom_byline = Bylines::get_post_byline_html( false, false, $post_id );
				if ( ! empty( $custom_byline ) ) {
					return self::render_custom_byline( $attributes, $custom_byline );
				}
			}
		}

		// 2. Check for CoAuthors Plus.
		if ( function_exists( 'get_coauthors' ) ) {
			$coauthors = get_coauthors( $post_id );
			if ( ! empty( $coauthors ) ) {
				return self::render_coauthors( $attributes, $coauthors );
			}
		}

		// 3. Fallback to default author.
		return self::render_default_author( $attributes, $post_id );
	}

	/**
	 * Render custom byline.
	 *
	 * @param array  $attributes    The block attributes.
	 * @param string $custom_byline The custom byline HTML from Bylines class.
	 *
	 * @return string The block HTML.
	 */
	private static function render_custom_byline( array $attributes, string $custom_byline ) {
		// Custom bylines already include their prefix text, so we ignore the prefix attribute.
		$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'wp-block-newspack-byline' ] );

		return sprintf(
			'<div %1$s><span class="byline">%2$s</span></div>',
			$wrapper_attributes,
			wp_kses_post( $custom_byline )
		);
	}

	/**
	 * Render CoAuthors Plus authors.
	 *
	 * @param array $attributes The block attributes.
	 * @param array $coauthors  The coauthors array.
	 *
	 * @return string The block HTML.
	 */
	private static function render_coauthors( array $attributes, array $coauthors ) {
		$prefix             = $attributes['prefix'] ?? 'By ';
		$link_to_archive    = $attributes['linkToAuthorArchive'] ?? true;
		$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'wp-block-newspack-byline' ] );

		$author_links = [];
		foreach ( $coauthors as $coauthor ) {
			$display_name = isset( $coauthor->display_name ) ? $coauthor->display_name : '';

			if ( empty( $display_name ) ) {
				continue;
			}

			if ( $link_to_archive ) {
				// Use get_author_posts_url with user_nicename - CAP hooks the author_link filter
				// via CoAuthors_Guest_Authors::filter_author_link() to construct proper URLs.
				$author_url     = get_author_posts_url( $coauthor->ID, $coauthor->user_nicename );
				$author_links[] = sprintf(
					'<span class="author vcard"><a class="url fn n" href="%1$s">%2$s</a></span>',
					esc_url( $author_url ),
					esc_html( $display_name )
				);
			} else {
				$author_links[] = sprintf(
					'<span class="author vcard"><span class="fn n">%1$s</span></span>',
					esc_html( $display_name )
				);
			}
		}

		if ( empty( $author_links ) ) {
			return '';
		}

		$byline_content = self::format_author_list( $author_links );

		return sprintf(
			'<div %1$s><span class="byline">%2$s%3$s</span></div>',
			$wrapper_attributes,
			esc_html( $prefix ),
			$byline_content
		);
	}

	/**
	 * Render default WordPress author.
	 *
	 * @param array $attributes The block attributes.
	 * @param int   $post_id    The post ID.
	 *
	 * @return string The block HTML.
	 */
	private static function render_default_author( array $attributes, int $post_id ) {
		$prefix             = $attributes['prefix'] ?? 'By ';
		$link_to_archive    = $attributes['linkToAuthorArchive'] ?? true;
		$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'wp-block-newspack-byline' ] );

		$author_id = get_post_field( 'post_author', $post_id );
		$author    = get_userdata( $author_id );

		if ( ! $author ) {
			return '';
		}

		$display_name = $author->display_name;

		if ( $link_to_archive ) {
			$author_url  = get_author_posts_url( $author_id );
			$author_html = sprintf(
				'<span class="author vcard"><a class="url fn n" href="%1$s">%2$s</a></span>',
				esc_url( $author_url ),
				esc_html( $display_name )
			);
		} else {
			$author_html = sprintf(
				'<span class="author vcard"><span class="fn n">%1$s</span></span>',
				esc_html( $display_name )
			);
		}

		return sprintf(
			'<div %1$s><span class="byline">%2$s%3$s</span></div>',
			$wrapper_attributes,
			esc_html( $prefix ),
			$author_html
		);
	}

	/**
	 * Format a list of author links with proper separators.
	 *
	 * Uses wp_sprintf_l for localized list formatting.
	 *
	 * @param array $author_links Array of author HTML strings.
	 *
	 * @return string Formatted author list.
	 */
	private static function format_author_list( array $author_links ) {
		if ( empty( $author_links ) ) {
			return '';
		}

		if ( 1 === count( $author_links ) ) {
			return $author_links[0];
		}

		// Use wp_sprintf_l for localized list formatting.
		// The %l placeholder formats the array as a proper list with commas and "and".
		return wp_sprintf_l( '%l', $author_links );
	}
}

Byline_Block::init();

<?php
/**
 * Author Profile Social Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Author_Profile_Social;

use Newspack\Social_Icons;
use Newspack_Blocks;
use WP_Block;

defined( 'ABSPATH' ) || exit;

/**
 * Author_Profile_Social_Block Class
 */
final class Author_Profile_Social_Block {
	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init(): void {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register the Author Profile Social Links block.
	 *
	 * @return void
	 */
	public static function register_block(): void {
		// Enable inserter only in block themes where nested layout is supported.
		$is_nested_mode = wp_is_block_theme();

		register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
				'uses_context'    => [ 'newspack-blocks/author' ],
				'supports'        => [
					'inserter' => $is_nested_mode,
				],
			]
		);
	}

	/**
	 * Block render callback.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block default content.
	 * @param WP_Block $block      Block instance.
	 *
	 * @return string The rendered block markup.
	 */
	public static function render_block( array $attributes, string $content, WP_Block $block ): string {
		$author = $block->context['newspack-blocks/author'] ?? null;
		if ( ! $author ) {
			return '';
		}

		$icon_size = (int) ( round( ( $attributes['iconSize'] ?? 24 ) / 2 ) * 2 );

		// If we have inner blocks (InnerBlocks mode), render them.
		if ( ! empty( $block->inner_blocks ) ) {
			return self::render_social_with_inner_blocks( $attributes, $block, $author, $icon_size );
		}

		// Legacy flat render: build social links from author data.
		return self::render_social_flat( $attributes, $block, $author, $icon_size );
	}

	/**
	 * Render social links using InnerBlocks (author-social-link children).
	 *
	 * @param array    $attributes Block attributes.
	 * @param WP_Block $block      Block instance.
	 * @param array    $author     Author data.
	 * @param int      $icon_size  Icon size in pixels.
	 * @return string Rendered HTML.
	 */
	private static function render_social_with_inner_blocks( array $attributes, WP_Block $block, array $author, int $icon_size ): string {
		$inner_content = '';

		foreach ( $block->inner_blocks as $inner_block ) {
			$inner_block_instance = new WP_Block(
				$inner_block->parsed_block,
				array_merge(
					$block->context,
					[
						'newspack-blocks/author'   => $author,
						'newspack-blocks/iconSize' => $icon_size,
					]
				)
			);

			$rendered = $inner_block_instance->render();
			if ( $rendered ) {
				$inner_content .= $rendered;
			}
		}

		if ( empty( $inner_content ) ) {
			return '';
		}

		$wrapper_attributes = self::get_block_wrapper_attributes( $block, $attributes, $icon_size );

		return sprintf(
			'<div %s><ul class="author-profile-social__list">%s</ul></div>',
			$wrapper_attributes,
			$inner_content
		);
	}

	/**
	 * Render social links in flat mode (legacy, no inner blocks).
	 *
	 * @param array    $attributes Block attributes.
	 * @param WP_Block $block      Block instance.
	 * @param array    $author     Author data.
	 * @param int      $icon_size  Icon size in pixels.
	 * @return string Rendered HTML.
	 */
	private static function render_social_flat( array $attributes, WP_Block $block, array $author, int $icon_size ): string {
		$show_email = $attributes['showEmail'] ?? false;

		// Build social links array.
		$social_links = [];

		if ( ! empty( $author['social'] ) && is_array( $author['social'] ) ) {
			foreach ( $author['social'] as $service => $data ) {
				if ( ! empty( $data['url'] ) ) {
					$social_links[ $service ] = $data;
				}
			}
		}

		// Add email if enabled.
		if ( $show_email && ! empty( $author['email'] ) ) {
			$social_links['email'] = [
				'url' => 'mailto:' . $author['email'],
				'svg' => null,
			];
		}

		if ( empty( $social_links ) ) {
			return '';
		}

		$wrapper_attributes = self::get_block_wrapper_attributes( $block, $attributes, $icon_size );

		$output = '<ul class="author-profile-social__list">';

		foreach ( $social_links as $service => $social_data ) {
			$service_label = ucfirst( $service );
			$output       .= '<li>';
			$output       .= sprintf( '<a href="%s" aria-label="%s">', esc_url( $social_data['url'] ), esc_attr( $service_label ) );

			$svg = ! empty( $social_data['svg'] ) ? $social_data['svg'] : Social_Icons::get_svg( $service );

			if ( $svg ) {
				$output .= sprintf(
					'<span style="width: %dpx; height: %dpx;" aria-hidden="true">%s</span>',
					absint( $icon_size ),
					absint( $icon_size ),
					Newspack_Blocks::sanitize_svg( $svg )
				);
			} else {
				$output .= sprintf( '<span class="service-name">%s</span>', esc_html( $service ) );
			}

			$output .= '</a></li>';
		}

		$output .= '</ul>';

		return sprintf( '<div %s>%s</div>', $wrapper_attributes, $output );
	}

	/**
	 * Get wrapper attributes (class, style, etc.) for the block.
	 * Sets block context so core includes default class, custom className, and other supports.
	 * Style is built from full attributes.style (spacing, color, border, etc.) plus block-specific --icon-size.
	 *
	 * @param WP_Block $block      Block instance.
	 * @param array    $attributes Block attributes.
	 * @param int      $icon_size  Icon size in pixels.
	 * @return string HTML attributes for the wrapper div.
	 */
	private static function get_block_wrapper_attributes( WP_Block $block, array $attributes, int $icon_size ): string {
		$previous = \WP_Block_Supports::$block_to_render ?? null;
		\WP_Block_Supports::$block_to_render = $block->parsed_block;

		$wrapper_attributes = get_block_wrapper_attributes(
			[
				'style' => self::get_wrapper_style( $attributes, $icon_size ),
			]
		);

		\WP_Block_Supports::$block_to_render = $previous;
		return $wrapper_attributes;
	}

	/**
	 * Build wrapper style from block attributes.style (spacing, color, border, etc.) and block-specific vars.
	 * Uses the style engine so presets (e.g. var:preset|spacing|20) are converted to CSS.
	 *
	 * @param array $attributes Block attributes.
	 * @param int   $icon_size  Icon size in pixels.
	 * @return string Inline style string.
	 */
	private static function get_wrapper_style( array $attributes, int $icon_size ): string {
		$parts = [];
		$style = $attributes['style'] ?? null;
		if ( ! empty( $style ) && is_array( $style ) ) {
			$styles = wp_style_engine_get_styles(
				$style,
				[ 'context' => 'block-supports' ]
			);
			if ( ! empty( $styles['css'] ) ) {
				$parts[] = $styles['css'];
			}
		}
		$parts[] = sprintf( '--icon-size: %dpx;', absint( $icon_size ) );
		return implode( ' ', $parts );
	}
}

Author_Profile_Social_Block::init();

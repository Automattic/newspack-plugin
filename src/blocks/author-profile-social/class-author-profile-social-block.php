<?php
/**
 * Author Profile Social Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Author_Profile_Social;

use Newspack_Blocks;
use WP_Block;

defined( 'ABSPATH' ) || exit;

/**
 * Author_Profile_Social_Block Class
 */
final class Author_Profile_Social_Block {
	/**
	 * Fallback SVG icons for social services.
	 * Used when Newspack_SVG_Icons (from newspack-theme) is not available (e.g., block theme).
	 *
	 * @var array|null
	 */
	private static $social_icon_svg_map = null;

	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register the Author Profile Social Links block.
	 *
	 * @return void
	 */
	public static function register_block() {
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
	public static function render_block( array $attributes, string $content, WP_Block $block ) {
		\Newspack_Blocks::enqueue_view_assets( 'author-profile-social' );

		$author = $block->context['newspack-blocks/author'] ?? null;
		if ( ! $author ) {
			return '';
		}

		$icon_size = $attributes['iconSize'] ?? 24;

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
	private static function render_social_with_inner_blocks( $attributes, $block, $author, $icon_size ) {
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

		// Also render any services the author has that aren't in saved inner blocks (fallback).
		$saved_services = [];
		foreach ( $block->inner_blocks as $inner_block ) {
			$service = $inner_block->parsed_block['attrs']['service'] ?? '';
			if ( $service ) {
				$saved_services[] = $service;
			}
		}

		$all_services = self::get_author_available_services( $author );
		foreach ( $all_services as $service ) {
			if ( ! in_array( $service, $saved_services, true ) ) {
				// Render unsaved service as a fallback.
				$fallback_block = new WP_Block(
					[
						'blockName' => 'newspack/author-social-link',
						'attrs'     => [ 'service' => $service ],
					],
					[
						'newspack-blocks/author'   => $author,
						'newspack-blocks/iconSize' => $icon_size,
					]
				);
				$rendered       = $fallback_block->render();
				if ( $rendered ) {
					$inner_content .= $rendered;
				}
			}
		}

		if ( empty( $inner_content ) ) {
			return '';
		}

		$wrapper_attributes = get_block_wrapper_attributes(
			[
				'class' => 'wp-block-newspack-author-profile-social',
				'style' => sprintf( '--icon-size: %dpx;', absint( $icon_size ) ),
			]
		);

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
	private static function render_social_flat( $attributes, $block, $author, $icon_size ) {
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

		$wrapper_attributes = get_block_wrapper_attributes(
			[
				'class' => 'wp-block-newspack-author-profile-social',
				'style' => sprintf( '--icon-size: %dpx;', absint( $icon_size ) ),
			]
		);

		$output = '<ul class="author-profile-social__list">';

		foreach ( $social_links as $service => $social_data ) {
			$output .= '<li>';
			$output .= sprintf( '<a href="%s">', esc_url( $social_data['url'] ) );

			$svg = ! empty( $social_data['svg'] ) ? $social_data['svg'] : self::get_fallback_social_svg( $service );

			if ( $svg ) {
				$output .= sprintf(
					'<span style="width: %dpx; height: %dpx;">%s</span>',
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
	 * Get all available social services for an author.
	 *
	 * @param array $author Author data.
	 * @return array List of service keys.
	 */
	private static function get_author_available_services( $author ) {
		$services = [];

		if ( ! empty( $author['social'] ) && is_array( $author['social'] ) ) {
			foreach ( $author['social'] as $service => $data ) {
				if ( ! empty( $data['url'] ) ) {
					$services[] = $service;
				}
			}
		}

		if ( ! empty( $author['email'] ) ) {
			$services[] = 'email';
		}

		if ( ! empty( $author['newspack_phone_number'] ) ) {
			$services[] = 'phone';
		}

		return $services;
	}

	/**
	 * Get fallback SVG icons map for social services.
	 *
	 * @return array Map of service name to SVG markup.
	 */
	private static function get_social_icon_svg_map() {
		if ( null !== self::$social_icon_svg_map ) {
			return self::$social_icon_svg_map;
		}

		self::$social_icon_svg_map = [
			'facebook'   => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"></path></svg>',
			'twitter'    => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.982 10.622 20.54 3h-1.554l-5.693 6.618L8.745 3H3.5l6.876 10.007L3.5 21h1.554l6.012-6.989L15.868 21h5.245l-7.131-10.378Zm-2.128 2.474-.697-.997-5.543-7.93H8l4.474 6.4.697.996 5.815 8.318h-2.387l-4.745-6.787Z"></path></svg>',
			'instagram'  => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673 c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637 s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035 c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052 s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673 c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12 s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035 c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3 C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511 c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711 c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038 c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418 c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185 C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594 c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378 c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15 c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08 s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z"></path></svg>',
			'linkedin'   => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z"></path></svg>',
			'youtube'    => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21.8,8.001c0,0-0.195-1.378-0.795-1.985c-0.76-0.797-1.613-0.801-2.004-0.847c-2.799-0.202-6.997-0.202-6.997-0.202 h-0.009c0,0-4.198,0-6.997,0.202C4.608,5.216,3.756,5.22,2.995,6.016C2.395,6.623,2.2,8.001,2.2,8.001S2,9.62,2,11.238v1.517 c0,1.618,0.2,3.237,0.2,3.237s0.195,1.378,0.795,1.985c0.761,0.797,1.76,0.771,2.205,0.855c1.6,0.153,6.8,0.201,6.8,0.201 s4.203-0.006,7.001-0.209c0.391-0.047,1.243-0.051,2.004-0.847c0.6-0.607,0.795-1.985,0.795-1.985s0.2-1.618,0.2-3.237v-1.517 C22,9.62,21.8,8.001,21.8,8.001z M9.935,14.594l-0.001-5.62l5.404,2.82L9.935,14.594z"></path></svg>',
			'bluesky'    => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.33525 4.1443C8.6282 5.80613 11.0944 9.17571 12 10.9838C12.9056 9.17571 15.3718 5.80613 17.6648 4.1443C19.3192 2.94521 22 2.01741 22 4.96972C22 5.55931 21.6498 9.92278 21.4444 10.6312C20.7305 13.0941 18.1291 13.7222 15.815 13.342C19.8599 14.0066 20.8889 16.2079 18.6667 18.4093C14.4462 22.59 12.6007 17.3603 12.1279 16.0203C12.0412 15.7746 12.0006 15.6597 12 15.7574C11.9994 15.6597 11.9588 15.7746 11.8721 16.0203C11.3993 17.3603 9.55377 22.59 5.33333 18.4093C3.11111 16.2079 4.14006 14.0066 8.18496 13.342C5.87088 13.7222 3.26949 13.0941 2.55556 10.6312C2.35018 9.92278 2 5.55931 2 4.96972C2 2.01741 4.68079 2.94521 6.33525 4.1443Z"></path></svg>',
			'pinterest'  => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.289,2C6.617,2,3.606,5.648,3.606,9.622c0,1.846,1.025,4.146,2.666,4.878c0.25,0.111,0.381,0.063,0.439-0.169 c0.044-0.175,0.267-1.029,0.365-1.428c0.032-0.128,0.017-0.237-0.091-0.362C6.445,11.911,6.01,10.75,6.01,9.668 c0-2.777,2.194-5.464,5.933-5.464c3.23,0,5.49,2.108,5.49,5.122c0,3.407-1.794,5.768-4.13,5.768c-1.291,0-2.257-1.021-1.948-2.277 c0.372-1.495,1.089-3.112,1.089-4.191c0-0.967-0.542-1.775-1.663-1.775c-1.319,0-2.379,1.309-2.379,3.059 c0,1.115,0.394,1.869,0.394,1.869s-1.302,5.279-1.54,6.261c-0.405,1.666,0.053,4.368,0.094,4.604 c0.021,0.126,0.167,0.169,0.25,0.063c0.129-0.165,1.699-2.419,2.142-4.051c0.158-0.59,0.817-2.995,0.817-2.995 c0.43,0.784,1.681,1.446,3.013,1.446c3.963,0,6.822-3.494,6.822-7.833C20.394,5.112,16.849,2,12.289,2"></path></svg>',
			'myspace'    => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.25,14.29a3.28,3.28,0,1,0-3.28-3.28A3.28,3.28,0,0,0,17.25,14.29Zm-7.69.42A2.84,2.84,0,1,0,6.72,11.87,2.84,2.84,0,0,0,9.56,14.71ZM3.24,14.92a2.4,2.4,0,1,0-2.4-2.4A2.4,2.4,0,0,0,3.24,14.92Zm14,1.47a5.63,5.63,0,0,0-5.63,3.4V19.8h11.27V19.8A5.64,5.64,0,0,0,17.25,16.39Zm-7.69.42a4.94,4.94,0,0,0-4,2.13h0v.86H13.4A6.9,6.9,0,0,1,9.56,16.81ZM3.24,17.24a4.24,4.24,0,0,0-3.24,1.5h0v1.06H5.49a6.19,6.19,0,0,1-2.25-2.56Z"></path></svg>',
			'soundcloud' => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.9 16.1L9 6.6c0-.1.1-.1.1-.1.1 0 .1 0 .1.1l.1 9.5c0 .1 0 .1-.1.1s-.2 0-.3-.1zM.4 13.5c0 .1-.1.1-.2.1s-.2-.1-.2-.1L0 11.9v1.5c0 .1.1.2.2.2s.2-.1.2-.2v-1.5c0 .2 0 1.2 0 1.6zm1-1.1c-.1 0-.1 0-.2.1L1 11.1v2.4l.2 1.3c0 .1.1.1.2.1s.1 0 .2-.1l.2-1.3v-2.5c0-.1-.1-.1-.2-.1zm.8-1c-.1 0-.2.1-.2.2L1.9 9.5l.1 4v.1c.1.1.1.1.2.1s.2-.1.2-.2l.1-4.1-.2-2.2v.2c-.1.1-.1 0-.1 0zm.9-.3c-.2 0-.2.1-.2.2l-.2 2.5.2 3.8c0 .1.1.2.2.2.2 0 .2-.1.2-.2l.2-3.8-.2-2.5c0-.1-.1-.2-.2-.2zm1 .2c-.2 0-.2.1-.3.2l-.1 2.3.1 3.8c0 .2.1.2.3.2.1 0 .2-.1.2-.2l.2-3.8-.2-2.3c0-.1-.1-.2-.2-.2zm.8-1.8c-.2 0-.3.1-.3.3L4.5 12l.1 3.8c0 .2.1.3.3.3.1 0 .2-.1.3-.3l.2-3.8-.2-2.5c0-.2-.1-.3-.3-.3zM6 8.8c-.2 0-.3.1-.3.3l-.2 2.9.2 3.7c0 .2.1.3.3.3.2 0 .3-.1.3-.3l.2-3.7-.2-2.9c0-.2-.2-.3-.3-.3zm.8-.4c-.2 0-.3.2-.3.3l-.2 3.3.2 3.7c0 .2.2.3.3.3.2 0 .3-.1.4-.3l.1-3.7-.1-3.3c0-.2-.2-.3-.4-.3zm.8-.1c-.2 0-.4.2-.4.4L7.1 12l.1 3.6c0 .2.2.4.4.4s.4-.2.4-.4l.1-3.6-.1-3.3c0-.2-.2-.4-.4-.4zm.9-.4c-.3 0-.4.2-.4.4l-.1 3.7.1 3.5c0 .2.2.4.4.4.3 0 .4-.2.4-.4l.2-3.5-.2-3.7c-.1-.2-.2-.4-.4-.4zm3.4-1.1c-.2 0-.3 0-.5.1-.2-2.7-2.4-4.8-5.2-4.8-.7 0-1.4.1-2 .4-.3.1-.4.2-.4.5v12.3c0 .3.2.5.4.5h7.7c1.9 0 3.4-1.5 3.4-3.4s-1.5-3.5-3.4-3.5v-.1z"></path></svg>',
			'tumblr'     => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.04 21.28h-3.28c-2.84 0-4.94-1.37-4.94-5.02v-5.67H6.08V7.5c2.93-.73 4.11-3.3 4.3-5.48h3.01v4.93h3.47v3.65H13.4v4.81c0 1.34.68 1.91 1.88 1.91h1.76v3.96z"></path></svg>',
			'wikipedia'  => '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.1,21.4 L5.5,8.3 L4.6,8.3 L4.6,7.5 L9.1,7.5 L9.1,8.3 L7.5,8.3 L11.5,16.5 L14.4,9.8 L13.4,8.3 L12.3,8.3 L12.3,7.5 L16.2,7.5 L16.2,8.3 L15.3,8.3 L12.1,21.4 Z M17.7,8.3 L17.7,7.5 L20.4,7.5 L20.4,8.3 L19.3,8.3 L16.4,15.5 L15.5,15.5 L18.6,8.3 L17.7,8.3 Z M4.6,7.5 L3.6,7.5 L3.6,8.3 L4.6,8.3 L4.6,7.5 Z"></path></svg>',
			'website'    => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path></svg>',
			'email'      => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"></path></svg>',
			'phone'      => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path></svg>',
		];

		return self::$social_icon_svg_map;
	}

	/**
	 * Get fallback SVG icon for a social service.
	 *
	 * @param string $service Service key (e.g. 'facebook', 'email').
	 * @param int    $size    Icon size in pixels. Default 24.
	 * @return string|null SVG markup or null.
	 */
	public static function get_fallback_social_svg( $service, $size = 24 ) {
		$map = self::get_social_icon_svg_map();
		$svg = $map[ $service ] ?? null;
		if ( $svg ) {
			$svg = str_replace( '<svg ', '<svg width="' . absint( $size ) . '" height="' . absint( $size ) . '" ', $svg );
		}
		return $svg;
	}
}

Author_Profile_Social_Block::init();

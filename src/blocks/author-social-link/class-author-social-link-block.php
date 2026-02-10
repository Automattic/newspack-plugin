<?php
/**
 * Author Social Link Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Author_Social_Link;

use Newspack_Blocks;
use Newspack\Blocks\Author_Profile_Social\Author_Profile_Social_Block;
use WP_Block;

defined( 'ABSPATH' ) || exit;

/**
 * Author_Social_Link_Block Class
 */
final class Author_Social_Link_Block {
	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register the Author Social Link block.
	 *
	 * @return void
	 */
	public static function register_block() {
		register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
				'uses_context'    => [ 'newspack-blocks/author', 'newspack-blocks/iconSize' ],
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
	public static function render_block( array $attributes, string $content, $block ) {
		$author  = $block->context['newspack-blocks/author'] ?? null;
		$service = $attributes['service'] ?? '';

		if ( ! $author || ! $service ) {
			return '';
		}

		$url = self::get_social_service_url( $author, $service );
		if ( ! $url ) {
			return '';
		}

		$icon_size = $block->context['newspack-blocks/iconSize'] ?? 24;
		$svg       = self::get_social_service_svg( $author, $service );

		$output  = '<li class="wp-block-newspack-author-social-link">';
		$output .= sprintf( '<a href="%s">', esc_url( $url ) );

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

		return $output;
	}

	/**
	 * Get the URL for a social service from author data.
	 *
	 * @param array  $author  Author data array.
	 * @param string $service Service key.
	 * @return string|null URL or null.
	 */
	private static function get_social_service_url( $author, $service ) {
		if ( 'email' === $service ) {
			$email = $author['email'] ?? null;
			if ( ! $email ) {
				return null;
			}
			if ( is_array( $email ) ) {
				return $email['url'] ?? null;
			}
			return 'mailto:' . $email;
		}

		if ( 'phone' === $service ) {
			$phone = $author['newspack_phone_number'] ?? null;
			if ( ! $phone ) {
				return null;
			}
			if ( is_array( $phone ) ) {
				return $phone['url'] ?? null;
			}
			return 'tel:' . $phone;
		}

		// Social services.
		return $author['social'][ $service ]['url'] ?? null;
	}

	/**
	 * Get the SVG icon for a social service from author data, with fallback to built-in icons.
	 *
	 * @param array  $author  Author data array.
	 * @param string $service Service key.
	 * @return string|null SVG markup or null.
	 */
	private static function get_social_service_svg( $author, $service ) {
		// Check if REST API provided an SVG (from Newspack_SVG_Icons on classic theme).
		if ( 'email' === $service ) {
			$email = $author['email'] ?? null;
			if ( is_array( $email ) && ! empty( $email['svg'] ) ) {
				return $email['svg'];
			}
		} elseif ( 'phone' === $service ) {
			$phone = $author['newspack_phone_number'] ?? null;
			if ( is_array( $phone ) && ! empty( $phone['svg'] ) ) {
				return $phone['svg'];
			}
		} else {
			$svg = $author['social'][ $service ]['svg'] ?? null;
			if ( $svg ) {
				return $svg;
			}
		}

		// Fall back to built-in SVG map from parent block.
		return Author_Profile_Social_Block::get_fallback_social_svg( $service );
	}
}

Author_Social_Link_Block::init();

<?php
/**
 * Search Overlay Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Search_Overlay;

defined( 'ABSPATH' ) || exit;

/**
 * Search Overlay Block class.
 */
final class Search_Overlay_Block {
	/**
	 * Initialize the block.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register the block type.
	 */
	public static function register_block() {
		if ( ! \wp_is_block_theme() ) {
			return;
		}
		\register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
			]
		);
	}

	/**
	 * Render the block on the frontend.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered block HTML.
	 */
	public static function render_block( $attributes ) {
		$wrapper_attributes = \get_block_wrapper_attributes( [ 'data-search-overlay' => '1' ] );
		return '<div ' . $wrapper_attributes . '>Search Overlay (scaffold)</div>';
	}
}

Search_Overlay_Block::init();

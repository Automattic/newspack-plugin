<?php
/**
 * Overlay Menu Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Overlay_Menu;

defined( 'ABSPATH' ) || exit;

/**
 * Overlay_Menu_Block Class.
 */
final class Overlay_Menu_Block {

	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Registers the block type.
	 *
	 * @return void
	 */
	public static function register_block() {
		register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
			]
		);
	}

	/**
	 * Block render callback.
	 *
	 * Renders the outer wrapper. Trigger and panel are rendered by their own
	 * child-block render callbacks and arrive pre-rendered in $content.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content    Pre-rendered inner blocks HTML.
	 *
	 * @return string Block HTML.
	 */
	public static function render_block( array $attributes, string $content ) {
		$instance_id = ! empty( $attributes['instanceId'] )
			? esc_attr( $attributes['instanceId'] )
			: wp_unique_id( 'overlay-menu-' );

		$wrapper_attributes = get_block_wrapper_attributes(
			[
				'data-overlay-id' => $instance_id,
			]
		);

		return sprintf(
			'<div %s>%s</div>',
			$wrapper_attributes,
			$content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}
}

Overlay_Menu_Block::init();

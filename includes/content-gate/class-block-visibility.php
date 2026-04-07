<?php
/**
 * Newspack Block Access Control.
 *
 * Per-block visibility control based on content restriction rules.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Block_Visibility class.
 */
class Block_Visibility {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'render_block', [ __CLASS__, 'filter_render_block' ], 10, 2 );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );
		add_filter( 'register_block_type_args', [ __CLASS__, 'register_block_type_args' ], 10, 2 );
	}

	/**
	 * Filter rendered block output based on access control attributes.
	 *
	 * @param string $block_content Rendered block HTML.
	 * @param array  $block         Block data.
	 * @return string
	 */
	public static function filter_render_block( $block_content, $block ) {
		$target_blocks = [ 'core/group', 'core/stack', 'core/row' ];
		if ( ! in_array( $block['blockName'] ?? '', $target_blocks, true ) ) {
			return $block_content;
		}

		if ( is_admin() ) {
			return $block_content;
		}

		$rules = $block['attrs']['newspackAccessControlRules'] ?? [];

		$has_registration = ! empty( $rules['registration']['active'] );
		$has_access_rules = ! empty( $rules['custom_access']['active'] )
							&& ! empty( $rules['custom_access']['access_rules'] );

		if ( ! $has_registration && ! $has_access_rules ) {
			return $block_content;
		}

		// Full evaluation handled in Task 5.
		return $block_content;
	}

	/**
	 * Register block attributes server-side for the three target block types.
	 *
	 * @param array  $args       Block type arguments.
	 * @param string $block_type Block type name.
	 * @return array
	 */
	public static function register_block_type_args( $args, $block_type ) {
		return $args;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		// No-op until implemented.
	}
}
Block_Visibility::init();

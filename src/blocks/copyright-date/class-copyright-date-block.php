<?php
/**
 * Copyright Date Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\CopyrightDate;

defined( 'ABSPATH' ) || exit;

/**
 * Copyright_Date_Block Class
 */
final class Copyright_Date_Block {

	/**
	 * Block name.
	 */
	public const BLOCK_NAME = 'newspack/copyright-date';

	/**
	 * Initializes the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register the copyright date block.
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
	 * @param array $attributes The block attributes.
	 *
	 * @return string The block HTML.
	 */
	public static function render_block( array $attributes ) {
		$prefix      = $attributes['prefix'] ?? '';
		$suffix      = $attributes['suffix'] ?? '';
		$year        = wp_date( 'Y' );
		$block_class = wp_get_block_default_classname( self::BLOCK_NAME );

		$parts = [];

		if ( '' !== $prefix ) {
			$parts[] = sprintf(
				'<span class="%s__prefix">%s</span>',
				$block_class,
				esc_html( $prefix )
			);
		}

		$parts[] = sprintf(
			'<span class="%s__year">%s</span>',
			$block_class,
			esc_html( $year )
		);

		if ( '' !== $suffix ) {
			$parts[] = sprintf(
				'<span class="%s__suffix">%s</span>',
				$block_class,
				esc_html( $suffix )
			);
		}

		$wrapper_attributes = get_block_wrapper_attributes();

		return sprintf(
			'<div %1$s>%2$s</div>',
			$wrapper_attributes,
			implode( ' ', $parts )
		);
	}
}

Copyright_Date_Block::init();

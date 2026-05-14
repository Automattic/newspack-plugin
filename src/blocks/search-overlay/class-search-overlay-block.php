<?php
/**
 * Search Overlay Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Search_Overlay;

use Newspack\Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Search Overlay Block.
 */
final class Search_Overlay_Block {
	// Inline search (magnifying glass) icon.
	const ICON_SEARCH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13.5 6C10.5 6 8 8.5 8 11.5c0 1.1.3 2.1.9 3l-3.4 3 1 1.1 3.4-3c1 .9 2.2 1.4 3.6 1.4 3 0 5.5-2.5 5.5-5.5C19 8.5 16.5 6 13.5 6zm0 9.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>';

	// Inline close (X) icon — matches the overlay-menu panel block.
	const ICON_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"/></svg>';

	/**
	 * Initialize the block.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_block' ] );
	}

	/**
	 * Register block from metadata.
	 *
	 * @return void
	 */
	public static function register_block() {
		\register_block_type_from_metadata(
			__DIR__ . '/block.json',
			[
				'render_callback' => [ __CLASS__, 'render_block' ],
			]
		);
	}

	/**
	 * Render the block.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Block HTML.
	 */
	public static function render_block( $attributes ) {
		\wp_enqueue_style(
			'newspack-blocks-frontend',
			Newspack::plugin_url() . '/dist/blocks.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);

		$defaults   = [
			'triggerText'  => __( 'Search', 'newspack-plugin' ),
			'overlayColor' => '',
			'className'    => '',
		];
		$attributes = \wp_parse_args( $attributes, $defaults );

		$trigger_text = '' === trim( (string) $attributes['triggerText'] )
			? $defaults['triggerText']
			: $attributes['triggerText'];

		$classes      = explode( ' ', (string) $attributes['className'] );
		$is_icon_only = in_array( 'is-style-icon-only', $classes, true );
		$is_text_only = in_array( 'is-style-text-only', $classes, true );

		// `wp_unique_id()` returns a per-request counter ("1", "2", ...); prefix once for a clean DOM id.
		$panel_id = 'newspack-search-overlay-panel-' . \wp_unique_id();

		$is_jetpack_search = \wp_script_is( 'jetpack-instant-search', 'enqueued' );

		if ( $is_jetpack_search ) {
			return self::render_jetpack_trigger( $trigger_text, $is_icon_only, $is_text_only );
		}

		return self::render_trigger_button( $trigger_text, $panel_id, $is_icon_only, $is_text_only )
			. self::render_panel( $panel_id, $attributes['overlayColor'] );
	}

	/**
	 * Render the trigger as a Jetpack Instant Search anchor.
	 *
	 * Jetpack's instant-search script binds its own overlay to elements
	 * matching `.jetpack-search-filter__link`.
	 *
	 * @param string $trigger_text Visible/SR label.
	 * @param bool   $is_icon_only Whether the active style hides the label.
	 * @param bool   $is_text_only Whether the active style hides the icon.
	 * @return string Trigger anchor HTML.
	 */
	private static function render_jetpack_trigger( $trigger_text, $is_icon_only, $is_text_only ) {
		$extra_attributes = [
			'class'      => 'wp-element-button wp-block-button__link newspack-search-overlay__trigger jetpack-search-filter__link',
			'href'       => \esc_url( \add_query_arg( 's', '', \home_url( '/' ) ) ),
			'aria-label' => $trigger_text,
		];
		$wrapper_attributes = \get_block_wrapper_attributes( $extra_attributes );

		$label_classes = [ 'newspack-search-overlay__label' ];
		if ( $is_icon_only ) {
			$label_classes[] = 'screen-reader-text';
		}

		$html  = '<div class="wp-block-buttons is-layout-flex">';
		$html .= '<div class="wp-block-button">';
		$html .= '<a ' . $wrapper_attributes . '>';
		if ( ! $is_text_only ) {
			$html .= '<span class="newspack-search-overlay__icon" aria-hidden="true">' . self::ICON_SEARCH . '</span>';
		}
		$html .= '<span class="' . \esc_attr( implode( ' ', $label_classes ) ) . '">' . \esc_html( $trigger_text ) . '</span>';
		$html .= '</a>';
		$html .= '</div>';
		$html .= '</div>';

		return $html;
	}

	/**
	 * Render the standard (non-Jetpack) trigger button.
	 *
	 * @param string $trigger_text Visible/SR label.
	 * @param string $panel_id     ID of the panel this trigger controls.
	 * @param bool   $is_icon_only Whether the active style hides the label.
	 * @param bool   $is_text_only Whether the active style hides the icon.
	 * @return string Trigger button HTML.
	 */
	private static function render_trigger_button( $trigger_text, $panel_id, $is_icon_only, $is_text_only ) {
		$extra_attributes = [
			'class'           => 'wp-element-button wp-block-button__link newspack-search-overlay__trigger',
			'type'            => 'button',
			'aria-expanded'   => 'false',
			'aria-controls'   => $panel_id,
			'aria-label'      => $trigger_text,
			'data-overlay-id' => $panel_id,
		];
		$wrapper_attributes = \get_block_wrapper_attributes( $extra_attributes );

		$label_classes = [ 'newspack-search-overlay__label' ];
		if ( $is_icon_only ) {
			$label_classes[] = 'screen-reader-text';
		}

		$html  = '<div class="wp-block-buttons is-layout-flex">';
		$html .= '<div class="wp-block-button">';
		$html .= '<button ' . $wrapper_attributes . '>';
		if ( ! $is_text_only ) {
			$html .= '<span class="newspack-search-overlay__icon" aria-hidden="true">' . self::ICON_SEARCH . '</span>';
		}
		$html .= '<span class="' . \esc_attr( implode( ' ', $label_classes ) ) . '">' . \esc_html( $trigger_text ) . '</span>';
		$html .= '</button>';
		$html .= '</div>';
		$html .= '</div>';

		return $html;
	}

	/**
	 * Render the overlay panel containing a search form.
	 *
	 * @param string $panel_id      DOM id of the panel.
	 * @param string $overlay_color Background color of the panel (any valid CSS color, supports RGBA).
	 * @return string Panel HTML.
	 */
	private static function render_panel( $panel_id, $overlay_color ) {
		$style = '';
		if ( '' !== $overlay_color ) {
			$style = ' style="background:' . \esc_attr( $overlay_color ) . '"';
		}

		// Render core/search via its own render callback (it's a dynamic block). Wrap
		// in a constrained-width group as plain HTML — building a synthetic core/group
		// parsed-block array is fragile because `core/group` relies on `innerContent`
		// to interleave inner HTML.
		$search_html = \render_block(
			[
				'blockName'    => 'core/search',
				'attrs'        => [
					'buttonText' => __( 'Search', 'newspack-plugin' ),
					'fontSize'   => 'small',
				],
				'innerBlocks'  => [],
				'innerHTML'    => '',
				'innerContent' => [],
			]
		);
		$group_html = '<div class="wp-block-group is-layout-constrained">' . $search_html . '</div>';

		$html  = '<div';
		$html .= ' id="' . \esc_attr( $panel_id ) . '"';
		$html .= ' class="newspack-search-overlay__panel"';
		$html .= ' role="dialog"';
		$html .= ' aria-modal="true"';
		$html .= ' aria-hidden="true"';
		$html .= ' inert="true"';
		$html .= ' aria-label="' . \esc_attr__( 'Search', 'newspack-plugin' ) . '"';
		$html .= $style;
		$html .= '>';

		$html .= '<button type="button" class="newspack-search-overlay__close">';
		$html .= '<span class="newspack-search-overlay__icon" aria-hidden="true">' . self::ICON_CLOSE . '</span>';
		$html .= '<span class="screen-reader-text">' . \esc_html__( 'Close search', 'newspack-plugin' ) . '</span>';
		$html .= '</button>';

		$html .= '<div class="newspack-search-overlay__content">';
		$html .= $group_html;
		$html .= '</div>';

		$html .= '</div>';

		return $html;
	}
}

Search_Overlay_Block::init();

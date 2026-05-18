<?php
/**
 * Search Overlay Block.
 *
 * @package Newspack
 */

namespace Newspack\Blocks\Search_Overlay;

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
	public static function render_block( array $attributes ): string {
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

		if ( self::is_jetpack_instant_search_active() ) {
			return self::render_jetpack_trigger( $trigger_text, $is_icon_only, $is_text_only );
		}

		return self::render_trigger_button( $trigger_text, $panel_id, $is_icon_only, $is_text_only )
			. self::render_panel( $panel_id, (string) $attributes['overlayColor'] );
	}

	/**
	 * Whether Jetpack Instant Search will hijack search triggers on this request.
	 *
	 * Checking module/option state (rather than `wp_script_is( ..., 'enqueued' )`)
	 * is stable regardless of when the block renders — template parts in `wp_head`
	 * can render before Jetpack's `wp_enqueue_scripts` callback fires.
	 *
	 * @return bool
	 */
	private static function is_jetpack_instant_search_active(): bool {
		return class_exists( 'Jetpack' )
			&& \Jetpack::is_module_active( 'search' )
			&& (bool) \get_option( 'instant_search_enabled' );
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
	private static function render_jetpack_trigger( string $trigger_text, bool $is_icon_only, bool $is_text_only ): string {
		// No `aria-label` — the visible label (or the screen-reader-text span when
		// icon-only) already supplies the accessible name.
		$wrapper_attributes = \get_block_wrapper_attributes(
			[
				'class' => 'wp-element-button wp-block-button__link newspack-search-overlay__trigger jetpack-search-filter__link',
				'href'  => \esc_url( \add_query_arg( 's', '', \home_url( '/' ) ) ),
			]
		);
		$label_classes = $is_icon_only
			? 'newspack-search-overlay__label screen-reader-text'
			: 'newspack-search-overlay__label';

		ob_start();
		?>
		<div class="wp-block-buttons is-layout-flex">
			<div class="wp-block-button">
				<a <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
					<?php if ( ! $is_text_only ) : ?>
						<span class="newspack-search-overlay__icon" aria-hidden="true">
							<?php echo self::ICON_SEARCH; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</span>
					<?php endif; ?>
					<span class="<?php echo \esc_attr( $label_classes ); ?>">
						<?php echo \esc_html( $trigger_text ); ?>
					</span>
				</a>
			</div>
		</div>
		<?php
		return ob_get_clean();
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
	private static function render_trigger_button( string $trigger_text, string $panel_id, bool $is_icon_only, bool $is_text_only ): string {
		// No `aria-label` — the visible label (or the screen-reader-text span when
		// icon-only) already supplies the accessible name.
		$wrapper_attributes = \get_block_wrapper_attributes(
			[
				'class'           => 'wp-element-button wp-block-button__link newspack-search-overlay__trigger',
				'type'            => 'button',
				'aria-expanded'   => 'false',
				'aria-controls'   => $panel_id,
				'data-overlay-id' => $panel_id,
			]
		);
		$label_classes = $is_icon_only
			? 'newspack-search-overlay__label screen-reader-text'
			: 'newspack-search-overlay__label';

		ob_start();
		?>
		<div class="wp-block-buttons is-layout-flex">
			<div class="wp-block-button">
				<button <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
					<?php if ( ! $is_text_only ) : ?>
						<span class="newspack-search-overlay__icon" aria-hidden="true">
							<?php echo self::ICON_SEARCH; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</span>
					<?php endif; ?>
					<span class="<?php echo \esc_attr( $label_classes ); ?>">
						<?php echo \esc_html( $trigger_text ); ?>
					</span>
				</button>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render the overlay panel containing a search form.
	 *
	 * @param string $panel_id      DOM id of the panel.
	 * @param string $overlay_color Background color of the panel (any valid CSS color, supports RGBA).
	 * @return string Panel HTML.
	 */
	private static function render_panel( string $panel_id, string $overlay_color ): string {
		// Render core/search once per request and reuse — its output doesn't depend
		// on block instance, and re-rendering for each panel is wasted work when a
		// site uses several search-overlay blocks (e.g. desktop + mobile header).
		static $search_html = null;
		if ( null === $search_html ) {
			// Wrap in a constrained-width group as plain HTML — building a synthetic
			// core/group parsed-block array is fragile because `core/group` relies on
			// `innerContent` to interleave inner HTML.
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
		}

		// Run user-supplied CSS through `safecss_filter_attr` before output.
		// `esc_attr` alone would let an editor inject extra declarations.
		$style_attr = '';
		if ( '' !== $overlay_color ) {
			$safe_css = \safecss_filter_attr( 'background: ' . $overlay_color );
			if ( '' !== $safe_css ) {
				$style_attr = ' style="' . \esc_attr( $safe_css ) . '"';
			}
		}

		ob_start();
		?>
		<div
			id="<?php echo \esc_attr( $panel_id ); ?>"
			class="newspack-search-overlay__panel"
			role="dialog"
			aria-modal="true"
			aria-hidden="true"
			inert
			aria-label="<?php \esc_attr_e( 'Search', 'newspack-plugin' ); ?>"
			<?php echo $style_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		>
			<button type="button" class="newspack-search-overlay__close">
				<span class="newspack-search-overlay__icon" aria-hidden="true">
					<?php echo self::ICON_CLOSE; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</span>
				<span class="screen-reader-text">
					<?php \esc_html_e( 'Close search', 'newspack-plugin' ); ?>
				</span>
			</button>

			<div class="newspack-search-overlay__content">
				<div class="wp-block-group is-layout-constrained">
					<?php echo $search_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</div>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}
}

Search_Overlay_Block::init();

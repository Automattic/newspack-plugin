<?php
/**
 * Enhancements and improvements to third-party plugins for AMP compatibility.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Tweaks third-party plugins for better AMP compatibility.
 * When possible it's preferred to contribute AMP fixes downstream to the actual plugin.
 */
class AMP_Enhancements {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'do_shortcode_tag', [ __CLASS__, 'documentcloud_iframe_full_height' ], 10, 2 );
		add_filter( 'render_block', [ __CLASS__, 'pymjs_convert_block_to_ampiframe' ], 10, 2 );
		add_filter( 'do_shortcode_tag', [ __CLASS__, 'pymjs_convert_shortcode_to_ampiframe' ], 10, 3 );
	}

	/**
	 * Add an attribute to the iframe instructing AMP that the iframe should be rendered with the "fill" style instead
	 * of the "fixed-height" style.
	 *
	 * @see    https://github.com/ampproject/amp-wp/issues/3142
	 * @param  string $output HTML output of the shortcode.
	 * @param  string $tag The shortcode currently being processed.
	 * @return string Modified shortcode output.
	 */
	public static function documentcloud_iframe_full_height( $output, $tag ) {
		if ( 'documentcloud' !== $tag ) {
			return $output;
		}

		return str_replace( '<iframe', '<iframe layout="fill"', $output );
	}

	/**
	 * Handle pym.js blocks and raw HTML blocks on AMP pages.
	 *
	 * @param  string $output HTML block output.
	 * @param  array  $block Block attributes and information.
	 * @return string HTML block output.
	 */
	public static function pymjs_convert_block_to_ampiframe( $output, $block ) {
		if ( ! newspack_is_amp() ) {
			return $output;
		}

		if ( 'core/html' === $block['blockName'] ) {
			$pym_src_regex = '~data-pym-src=[\'"]([^\'"]*)~';
			$is_match      = preg_match( $pym_src_regex, $block['innerHTML'], $matches );
			if ( ! $is_match ) {
				return $output;
			}

			$pym_src = $matches[1];
		} elseif ( 'pym-shortcode/pym' === $block['blockName'] ) {
			$pym_src = $block['attrs']['src'];
		} else {
			return $output;
		}

		return self::get_pym_ampiframe( $pym_src );
	}

	/**
	 * Handle pym.js shortcode on AMP pages.
	 *
	 * @param  string $output HTML shortcode output.
	 * @param  string $tag Shortcode tag.
	 * @param  array  $attributes Shortcode attributes.
	 * @return string HTML shortcode output.
	 */
	public static function pymjs_convert_shortcode_to_ampiframe( $output, $tag, $attributes ) {
		if ( ! newspack_is_amp() || 'pym' !== $tag ) {
			return $output;
		}

		if ( empty( $attributes['src'] ) ) {
			return $output;
		}

		return self::get_pym_ampiframe( $attributes['src'] );
	}

	/**
	 * Build an amp-iframe out of pym.js iframe source.
	 *
	 * @todo   This is a "good enough" solution until native pym.js AMP compatibility. In general, embeds are designed rectangular,
	 * so there will be a little extra padding underneath the amp-iframe, as this renders a square container. We don't have access to
	 * the intended height of the iframe from only the src url.
	 * @see    https://github.com/ampproject/amphtml/issues/22714
	 * @param  string $src iframe src.
	 * @return string AMP-iframe HTML.
	 */
	protected static function get_pym_ampiframe( $src ) {
		ob_start();
		?>
		<amp-iframe 
			src='<?php echo esc_url( $src ); ?>'
			layout='responsive'
			width='1'
			height='1'
			sandbox='allow-scripts allow-same-origin'
			frameborder='0'
			resizable
		>
			<div 
				overflow 
				tabindex=0 
				aria-label='<?php esc_attr_e( 'Load interactive graphic', 'newspack' ); ?>'
				placeholder
				style='width:100%; text-align:center; padding-top:50%; background:rgba(0,0,0,.7); color:#FFF; font-weight:bold'
			>
				<?php esc_html_e( 'Load interactive graphic', 'newspack' ); ?>
			</div>
		</amp-iframe>
		<?php

		return ob_get_clean();
	}
}
AMP_Enhancements::init();

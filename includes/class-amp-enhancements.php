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
	}

	/**
	 * Add an attribute to the iframe instructing AMP that the iframe should be rendered with the "fill" style instead
	 * of the "fixed-height" style.
	 *
	 * @see https://github.com/ampproject/amp-wp/issues/3142
	 * @param string $output HTML output of the shortcode.
	 * @param string $tag The shortcode currently being processed.
	 * @return string Modified shortcode output.
	 */
	public static function documentcloud_iframe_full_height( $output, $tag ) {
		if ( 'documentcloud' !== $tag ) {
			return $output;
		}

		return str_replace( '<iframe', '<iframe layout="fill"', $output );
	}
}
AMP_Enhancements::init();

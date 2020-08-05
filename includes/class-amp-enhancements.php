<?php
/**
 * Enhancements and improvements to third-party plugins for AMP compatibility.
 *
 * @package Newspack
 */

namespace Newspack;

use Felix_Arntz\WP_GDPR_Cookie_Notice\Shortcodes\WordPress_Shortcode_Parser;
use Felix_Arntz\WP_GDPR_Cookie_Notice\Settings\Plugin_Option_Reader;
use Felix_Arntz\WP_GDPR_Cookie_Notice\Cookie_Notice\Cookie_Notice_AMP_Markup;

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
		// WP GDPR Cookie Notice plugin enhancements.
		if ( is_plugin_active( 'wp-gdpr-cookie-notice/wp-gdpr-cookie-notice.php' ) ) {
			include_once 'amp-enhancements/class-wp-gdpr-cookie-notice-performance.php';
		}
	}
}
AMP_Enhancements::init();

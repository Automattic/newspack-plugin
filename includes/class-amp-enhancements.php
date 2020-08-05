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
		// WP GDPR Cookie Notice plugin enhancements.
		if ( is_plugin_active( 'wp-gdpr-cookie-notice/wp-gdpr-cookie-notice.php' ) ) {
			include_once 'amp-enhancements/class-wp-gdpr-cookie-notice-performance.php';
		}
	}
}
AMP_Enhancements::init();

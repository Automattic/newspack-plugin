<?php
/**
 * PWA management.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Manages settings for PWA.
 */
class PWA {

	/**
	 * Add hooks.
	 */
	public static function init() {
		// For backwards compatibility and because there's no reason not to, always and automatically enable offline browsing.
		add_filter( 'pre_option_offline_browsing', '__return_true' );
	}

	/**
	 * Check whether everything is configured correctly.
	 *
	 * @return bool|WP_Error True on success, WP_Error on failure.
	 */
	public static function check_configured() {
		if ( ! is_ssl() ) {
			return new WP_Error( 'newspack_pwa_error', __( 'Site is not served over https. Progressive web app features will not work.', 'newspack' ) );
		}

		if ( ! self::get_site_icon() ) {
			return new WP_Error( 'newspack_pwa_error', __( 'No site icon specified. Visitors will not be able to install the site as an app.', 'newspack' ) );
		}

		return true;
	}

	/**
	 * Retrieve Site Icon.
	 *
	 * @return null|array
	 */
	public static function get_site_icon() {
		$site_icon = get_option( 'site_icon' );
		if ( ! $site_icon ) {
			return null;
		}
		$url = wp_get_attachment_image_src( $site_icon );
		return [
			'id'  => $site_icon,
			'url' => $url[0],
		];
	}

	/**
	 * Update Site Icon
	 *
	 * @param string $site_icon The site icon.
	 */
	public function update_site_icon( $site_icon ) {
		if ( ! empty( $site_icon['id'] ) ) {
			update_option( 'site_icon', intval( $site_icon['id'] ) );
		} else {
			delete_option( 'site_icon' );
		}
	}
}
PWA::init();

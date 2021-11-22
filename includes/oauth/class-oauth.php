<?php
/**
 * Authentication.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class OAuth {
	/**
	 * Get API key for proxies.
	 */
	public static function get_proxy_api_key() {
		if ( ! defined( 'NEWSPACK_MANAGER_API_KEY_OPTION_NAME' ) ) {
			return false;
		}
		return get_option( NEWSPACK_MANAGER_API_KEY_OPTION_NAME );
	}
}

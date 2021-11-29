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
	const CSRF_TOKEN_TRANSIENT_NAME_BASE = '_newspack_google_oauth_csrf_';

	/**
	 * Get API key for proxies.
	 */
	public static function get_proxy_api_key() {
		if ( ! defined( 'NEWSPACK_MANAGER_API_KEY_OPTION_NAME' ) ) {
			return false;
		}
		return get_option( NEWSPACK_MANAGER_API_KEY_OPTION_NAME );
	}

	/**
	 * Generate a CSRF token and save it as transient.
	 *
	 * @param string $namespace Namespace for the token.
	 * @return string CSRF token.
	 */
	public static function generate_csrf_token( $namespace ) {
		$csrf_token     = sha1( openssl_random_pseudo_bytes( 1024 ) );
		$transient_name = self::CSRF_TOKEN_TRANSIENT_NAME_BASE . $namespace . get_current_user_id();
		set_transient( $transient_name, $csrf_token, 60 );
		return $csrf_token;
	}

	/**
	 * Retrieve a saved CSRF token.
	 *
	 * @param string $namespace Namespace for the token.
	 * @return string CSRF token.
	 */
	public static function retrieve_csrf_token( $namespace ) {
		$csrf_token_transient_name = self::CSRF_TOKEN_TRANSIENT_NAME_BASE . $namespace . get_current_user_id();
		return get_transient( $csrf_token_transient_name );
	}

	/**
	 * Process OAuth proxy URL.
	 *
	 * @param string $type 'google' or 'fivetran' for now.
	 * @param string $path Path to append to base URL.
	 * @param object $query_args Query params.
	 */
	public static function authenticate_proxy_url( $type, $path = '', $query_args = [] ) {
		if ( ! self::is_proxy_configured( $type ) ) {
			return false;
		}
		return add_query_arg(
			array_merge(
				[
					'api_key' => urlencode( self::get_proxy_api_key() ),
				],
				$query_args
			),
			self::get_proxy_url( $type ) . $path
		);
	}

	/**
	 * Is OAuth2 configured for this instance?
	 *
	 * @param string $type 'google' or 'fivetran' for now.
	 */
	public static function is_proxy_configured( $type ) {
		return self::get_proxy_url( $type ) && self::get_proxy_api_key();
	}

	/**
	 * Get proxy URL by type.
	 */
	private static function get_proxy_url( $type ) {
		switch ( $type ) {
			case 'google':
				if ( defined( 'NEWSPACK_GOOGLE_OAUTH_PROXY' ) ) {
					return NEWSPACK_GOOGLE_OAUTH_PROXY;
				}
			case 'fivetran':
				if ( defined( 'NEWSPACK_FIVETRAN_PROXY' ) ) {
					return NEWSPACK_FIVETRAN_PROXY;
				}
		}
		return false;
	}
}

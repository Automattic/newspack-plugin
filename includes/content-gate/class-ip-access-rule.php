<?php
/**
 * Content Gate IP Access Rule.
 *
 * @package Newspack
 */

namespace Newspack\Content_Gate;

/**
 * IP Access Rule class.
 */
class IP_Access_Rule {

	/**
	 * The name of the cookie used to bypass cache and allow server side IP checking.
	 */
	const COOKIE_NAME = 'wp_nocache_ip';

	/**
	 * The endpoint for institutional access.
	 */
	const ENDPOINT = 'institutional-access';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'add_rewrite_rule' ] );
		add_action( 'template_redirect', [ __CLASS__, 'handle_redirect' ] );
	}

	/**
	 * Register the rewrite rule for the institutional access endpoint.
	 */
	public static function add_rewrite_rule() {
		add_rewrite_rule( '^' . self::ENDPOINT . '/?$', 'index.php?' . self::ENDPOINT . '=1', 'top' );
		add_rewrite_tag( '%' . self::ENDPOINT . '%', '1' );

		$option_key = 'newspack_ip_access_rule_flushed';
		if ( ! get_option( $option_key ) ) {
			flush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules
			update_option( $option_key, true );
		}
	}

	/**
	 * Handle the institutional access redirect.
	 */
	public static function handle_redirect() {
		if ( ! get_query_var( self::ENDPOINT ) ) {
			return;
		}

		// Never cache this page.
		if ( function_exists( 'batcache_cancel' ) ) {
			batcache_cancel();
		}
		nocache_headers();

		/**
		 * Filter whether the current IP is valid for content gate access.
		 *
		 * @param bool $valid_ip Whether the IP is valid. Default false.
		 */
		$valid_ip = apply_filters( 'newspack_content_gate_check_ip', false );

		if ( $valid_ip ) {
			setcookie( self::COOKIE_NAME, '1', time() + MONTH_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN ); // phpcs:ignore
		}

		wp_safe_redirect( home_url( '/' ) );
		exit;
	}
	/**
	 * Check if an IP address matches any of the given ranges.
	 *
	 * @param string $ip     The IP address to check.
	 * @param string $ranges Comma-separated list of IPs and/or CIDR blocks.
	 *
	 * @return bool Whether the IP matches any range.
	 */
	public static function ip_matches_ranges( $ip, $ranges ) {
		if ( empty( $ranges ) || ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			return false;
		}
		$ranges  = array_map( 'trim', explode( ',', $ranges ) );
		$ranges  = array_filter( $ranges );
		$ip_long = ip2long( $ip );

		foreach ( $ranges as $range ) {
			if ( strpos( $range, '/' ) !== false ) {
				list( $subnet, $bits ) = explode( '/', $range, 2 );
				$bits = (int) $bits;
				if ( $bits < 0 || $bits > 32 || ! filter_var( $subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
					continue;
				}
				$subnet_long = ip2long( $subnet );
				$mask        = -1 << ( 32 - $bits );
				if ( ( $ip_long & $mask ) === ( $subnet_long & $mask ) ) {
					return true;
				}
			} elseif ( filter_var( $range, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
				if ( $ip_long === ip2long( $range ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Get the visitor's IP address.
	 *
	 * By default only REMOTE_ADDR is trusted, because proxy headers like
	 * X-Forwarded-For and X-Real-IP can be set by the client and used to
	 * spoof an allowed IP for institutional access.
	 *
	 * To trust proxy headers (when the site sits behind a known reverse
	 * proxy), use the `newspack_trusted_proxy_headers` filter:
	 *
	 *     add_filter( 'newspack_trusted_proxy_headers', function () {
	 *         return [ 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP' ];
	 *     } );
	 *
	 * For full control over IP resolution use `newspack_visitor_ip`.
	 *
	 * @return string The visitor's IP address.
	 */
	public static function get_visitor_ip() {
		/**
		 * Filter the list of trusted proxy headers checked before REMOTE_ADDR.
		 *
		 * Return an array of `$_SERVER` keys (e.g. `HTTP_X_FORWARDED_FOR`,
		 * `HTTP_X_REAL_IP`) that your reverse-proxy infrastructure is known
		 * to set reliably. An empty array (the default) means only
		 * REMOTE_ADDR is used.
		 *
		 * @param string[] $headers Trusted header keys. Default empty array.
		 */
		$trusted_headers = apply_filters( 'newspack_trusted_proxy_headers', [] );

		// Always end with REMOTE_ADDR as the final fallback.
		$headers = array_merge( (array) $trusted_headers, [ 'REMOTE_ADDR' ] );

		foreach ( $headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
				$ip = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) ) )[0];
				$ip = trim( $ip );
				if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
					/**
					 * Filter the resolved visitor IP address.
					 *
					 * @param string $ip     Resolved IP address.
					 * @param string $header The $_SERVER key it was read from.
					 */
					return apply_filters( 'newspack_visitor_ip', $ip, $header );
				}
			}
		}
		return '';
	}
}
IP_Access_Rule::init();

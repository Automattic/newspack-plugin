<?php
/**
 * Content Gate IP Access Rule.
 *
 * @package Newspack
 */

namespace Newspack\Content_Gate;

use Newspack\Newspack_UI;

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
	 * The query parameter name for the IP check result.
	 */
	const RESULT_PARAM = 'institutional-access-result';

	/**
	 * The REST API route for the IP check.
	 */
	const REST_ROUTE = '/institutional-access/check';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'add_rewrite_rule' ] );
		add_action( 'rest_api_init', [ __CLASS__, 'register_rest_route' ] );
		add_action( 'template_redirect', [ __CLASS__, 'handle_redirect' ] );
		add_action( 'template_redirect', [ __CLASS__, 'handle_result_notice' ] );
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
	 * Register the REST API route for IP checking.
	 */
	public static function register_rest_route() {
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			self::REST_ROUTE,
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'check_ip_rest' ],
				'permission_callback' => '__return_true',
			]
		);
	}

	/**
	 * REST API callback: check the visitor's IP and set the cookie if valid.
	 *
	 * @return \WP_REST_Response
	 */
	public static function check_ip_rest() {
		if ( function_exists( 'batcache_cancel' ) ) {
			batcache_cancel();
		}
		nocache_headers();

		/** This filter is documented in handle_redirect(). */
		$result = apply_filters( 'newspack_content_gate_check_ip', false );

		if ( $result ) {
			setcookie( self::COOKIE_NAME, '1', time() + MONTH_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN ); // phpcs:ignore
		}

		$data = [ 'valid' => (bool) $result ];
		if ( is_int( $result ) ) {
			$data['institution'] = get_the_title( $result );
		}

		return new \WP_REST_Response( $data );
	}

	/**
	 * Handle the institutional access check.
	 *
	 * For `?institutional-access=1` or `?institutional-access` on any URL:
	 * performs the IP check server-side, then redirects back to the same URL
	 * with a result parameter.
	 *
	 * For the dedicated `/institutional-access` endpoint: renders a loading page
	 * that performs the check via the REST API and redirects on completion.
	 */
	public static function handle_redirect() {
		if ( ! get_query_var( self::ENDPOINT ) && ! isset( $_GET[ self::ENDPOINT ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		// Never cache this page.
		if ( function_exists( 'batcache_cancel' ) ) {
			batcache_cancel();
		}
		nocache_headers();

		// Check if this is the dedicated endpoint or a query param on a regular URL.
		$request_path = wp_parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$is_dedicated = (bool) preg_match( '#^/?' . preg_quote( self::ENDPOINT, '#' ) . '/?$#', trim( $request_path, '/' ) );

		if ( $is_dedicated ) {
			self::render_loading_page();
			exit;
		}

		// Query param on a regular URL: server-side check and redirect.
		/**
		 * Filter whether the current IP is valid for content gate access.
		 *
		 * @param bool|int $valid_ip Whether the IP is valid, or institution post ID. Default false.
		 */
		$result = apply_filters( 'newspack_content_gate_check_ip', false );

		if ( $result ) {
			setcookie( self::COOKIE_NAME, '1', time() + MONTH_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN ); // phpcs:ignore
		}

		$redirect_url = self::get_redirect_url();
		$redirect_url = add_query_arg( self::RESULT_PARAM, $result ? 'success' : 'failure', $redirect_url );
		if ( is_int( $result ) ) {
			$redirect_url = add_query_arg( 'institution', rawurlencode( get_the_title( $result ) ), $redirect_url );
		}
		wp_safe_redirect( $redirect_url );
		exit;
	}

	/**
	 * Display a snackbar notice based on the IP check result parameter.
	 */
	public static function handle_result_notice() {
		if ( empty( $_GET[ self::RESULT_PARAM ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		// Prevent this response from being cached so other users don't see the snackbar.
		if ( function_exists( 'batcache_cancel' ) ) {
			batcache_cancel();
		}
		nocache_headers();

		$result = sanitize_text_field( wp_unslash( $_GET[ self::RESULT_PARAM ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( 'success' === $result ) {
			$institution = ! empty( $_GET['institution'] ) ? sanitize_text_field( wp_unslash( $_GET['institution'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$message     = $institution
				/* translators: %s: institution name */
				? sprintf( __( 'Connected to %s.', 'newspack-plugin' ), '<strong>' . esc_html( $institution ) . '</strong>' )
				: __( 'Connected to your organization.', 'newspack-plugin' );
			Newspack_UI::add_notice(
				$message,
				[
					'type'     => 'success',
					'autohide' => true,
				]
			);
		} elseif ( 'failure' === $result ) {
			Newspack_UI::add_notice(
				__( "We couldn't verify your location. Make sure you're on your organization's network and try again.", 'newspack-plugin' ),
				[
					'type'     => 'warning',
					'autohide' => false,
				]
			);
		}
	}

	/**
	 * Get the URL to redirect to after the IP check (for query param usage).
	 *
	 * Rebuilds the current URL without the institutional-access parameter.
	 *
	 * @return string The redirect URL.
	 */
	private static function get_redirect_url() {
		$request_path = wp_parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$url          = home_url( $request_path );

		// Rebuild query string without the institutional-access param.
		$query = $_GET; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		unset( $query[ self::ENDPOINT ] );
		if ( ! empty( $query ) ) {
			$url = add_query_arg( $query, $url );
		}

		return $url;
	}

	/**
	 * Get the URL to redirect to from the dedicated endpoint.
	 *
	 * Checks redirect_to param, then Referer header, then falls back to homepage.
	 *
	 * @return string The redirect URL.
	 */
	private static function get_dedicated_redirect_url() {
		$home = home_url( '/' );

		if ( ! empty( $_GET['redirect_to'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput
			$url = esc_url_raw( wp_unslash( $_GET['redirect_to'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput
			if ( wp_validate_redirect( $url, $home ) !== $home || $url === $home ) {
				return $url;
			}
		}

		$referer = wp_get_referer();
		if ( $referer && wp_validate_redirect( $referer, $home ) !== $home ) {
			return $referer;
		}

		return $home;
	}

	/**
	 * Render the loading page for the dedicated /institutional-access endpoint.
	 *
	 * Outputs a standalone HTML page with a loading spinner that performs
	 * the IP check via the REST API and redirects on completion.
	 */
	private static function render_loading_page() {
		$redirect_url = self::get_dedicated_redirect_url();
		$rest_url     = rest_url( NEWSPACK_API_NAMESPACE . self::REST_ROUTE );
		$result_param = self::RESULT_PARAM;
		$site_name    = get_bloginfo( 'name' );
		$timeout_ms   = 10000;
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<title><?php echo esc_html( $site_name ); ?> — <?php esc_html_e( 'Verifying access', 'newspack-plugin' ); ?></title>
			<?php wp_head(); ?>
			<style>
				.newspack-ui__ip-check__actions { display: none; }
				.newspack-ui__ip-check--error .newspack-ui__spinner > span { display: none; }
				.newspack-ui__ip-check--error .newspack-ui__ip-check__actions { display: flex; gap: var(--newspack-ui-spacer-2); justify-content: center; }
			</style>
		</head>
		<body>
			<div class="newspack-ui" id="ip-check">
				<div class="newspack-ui__spinner">
					<span></span>
					<p class="newspack-ui__font--m" id="ip-check-message"><?php esc_html_e( 'Verifying your access…', 'newspack-plugin' ); ?></p>
					<p class="newspack-ui__font--xs" id="ip-check-detail" style="color: var(--newspack-ui-color-neutral-50);"><?php esc_html_e( "You'll be redirected in a few seconds.", 'newspack-plugin' ); ?></p>
					<div class="newspack-ui__ip-check__actions" id="ip-check-actions">
						<button class="newspack-ui__button newspack-ui__button--primary newspack-ui__button--small" onclick="location.reload()"><?php esc_html_e( 'Try again', 'newspack-plugin' ); ?></button>
						<a class="newspack-ui__button newspack-ui__button--outline newspack-ui__button--small" href="<?php echo esc_url( $redirect_url ); ?>"><?php esc_html_e( 'Continue to site', 'newspack-plugin' ); ?></a>
					</div>
				</div>
			</div>
			<script>
			(function() {
				var container = document.getElementById( 'ip-check' );
				var messageEl = document.getElementById( 'ip-check-message' );
				var detailEl  = document.getElementById( 'ip-check-detail' );
				var redirectUrl = <?php echo wp_json_encode( $redirect_url ); ?>;
				var resultParam = <?php echo wp_json_encode( $result_param ); ?>;

				var controller = new AbortController();
				var timer = setTimeout( function() {
					controller.abort();
					showError(
						<?php echo wp_json_encode( __( 'Verification timed out.', 'newspack-plugin' ) ); ?>,
						<?php echo wp_json_encode( __( 'Please check your connection and try again.', 'newspack-plugin' ) ); ?>
					);
				}, <?php echo (int) $timeout_ms; ?> );

				var minDelay = new Promise( function( resolve ) { setTimeout( resolve, 1000 ); } );

				Promise.all( [
					fetch( <?php echo wp_json_encode( $rest_url ); ?>, {
						credentials: 'same-origin',
						signal: controller.signal
					} ).then( function( response ) { return response.json(); } ),
					minDelay
				] )
				.then( function( results ) { var data = results[0];
					clearTimeout( timer );
					if ( data.valid ) {
						messageEl.textContent = data.institution
							? <?php echo wp_json_encode( __( 'Connected to ', 'newspack-plugin' ) ); ?> + data.institution + '.'
							: <?php echo wp_json_encode( __( 'Connected to your organization.', 'newspack-plugin' ) ); ?>;
						detailEl.textContent = <?php echo wp_json_encode( __( 'Redirecting…', 'newspack-plugin' ) ); ?>;
						setTimeout( function() {
							var url = new URL( redirectUrl, location.origin );
							url.searchParams.set( resultParam, 'success' );
							if ( data.institution ) {
								url.searchParams.set( 'institution', data.institution );
							}
							location.href = url.toString();
						}, 1500 );
					} else {
						showError(
							<?php echo wp_json_encode( __( "We couldn't verify your location.", 'newspack-plugin' ) ); ?>,
							<?php echo wp_json_encode( __( "Make sure you're on your organization's network and try again.", 'newspack-plugin' ) ); ?>
						);
					}
				} )
				.catch( function() {
					clearTimeout( timer );
					showError(
						<?php echo wp_json_encode( __( 'Verification failed.', 'newspack-plugin' ) ); ?>,
						<?php echo wp_json_encode( __( 'An error occurred. Please try again.', 'newspack-plugin' ) ); ?>
					);
				} );

				function showError( message, detail ) {
					container.classList.add( 'newspack-ui__ip-check--error' );
					messageEl.textContent = message;
					detailEl.textContent = detail;
				}
			})();
			</script>
			<?php wp_footer(); ?>
		</body>
		</html>
		<?php
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

<?php
/**
 * Newspack "My Account" v2 prototype demo.
 *
 * Admin-only, gated by the `?v2-demo` query parameter on /my-account/. See
 * docs/my-account-v2-prototype-brief.md for the full spec. Phase 1 is the
 * gating plumbing only; later phases swap in real templates, register
 * endpoints, and add menu items.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack "My Account" v2 prototype demo gate.
 */
final class My_Account_UI_V2_Demo {
	const DEMO_FLAG  = 'v2-demo';
	const BODY_CLASS = 'newspack-my-account--v2-demo';

	/**
	 * Initialize hooks.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		\add_filter( 'query_vars', [ __CLASS__, 'query_vars' ] );
		\add_filter( 'body_class', [ __CLASS__, 'body_class' ] );
		// v1 enqueues at priority 11; run at 12 so newspack-ui dependencies
		// are already registered when our bundle is enqueued.
		\add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ], 12 );
		// woocommerce_account_content fires inside the [woocommerce_my_account]
		// shortcode body. v1's page template renders the account area via the
		// shortcode and never calls the_content(), so the_content filter would
		// never fire here. See brief §2.3.
		\add_action( 'woocommerce_account_content', [ __CLASS__, 'render_stub' ], 100 );
	}

	/**
	 * Whether the demo is active for the current request.
	 *
	 * Every other hook short-circuits when this returns false. Keeps the demo
	 * a no-op for everyone else.
	 *
	 * @return bool
	 */
	public static function is_demo_active() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET[ self::DEMO_FLAG ] ) ) {
			return false;
		}
		if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() ) {
			return false;
		}
		if ( ! \is_user_logged_in() ) {
			return false;
		}
		return \current_user_can( 'manage_options' );
	}

	/**
	 * Register the demo flag as a recognized query var so WordPress doesn't
	 * strip it during URL parsing.
	 *
	 * @param array $vars Query vars.
	 * @return array
	 */
	public static function query_vars( $vars ) {
		$vars[] = self::DEMO_FLAG;
		return $vars;
	}

	/**
	 * Add the v2-demo body class so SCSS scoping works.
	 *
	 * @param array $classes Body classes.
	 * @return array
	 */
	public static function body_class( $classes ) {
		if ( self::is_demo_active() ) {
			$classes[] = self::BODY_CLASS;
		}
		return $classes;
	}

	/**
	 * Enqueue the v2 demo CSS + JS bundle.
	 */
	public static function enqueue_assets() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		\wp_enqueue_style(
			'newspack-my-account-v2-demo',
			Newspack::plugin_url() . '/dist/my-account-v2-demo.css',
			[ 'newspack-ui' ],
			NEWSPACK_PLUGIN_VERSION
		);
		\wp_enqueue_script(
			'newspack-my-account-v2-demo',
			Newspack::plugin_url() . '/dist/my-account-v2-demo.js',
			[ 'newspack-ui' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
	}

	/**
	 * Phase 1 stub. Replaced by wc_get_template swaps in later phases.
	 */
	public static function render_stub() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		echo '<div class="newspack-ui"><p>' . esc_html__( 'Hello v2 demo. Phase 1 stub is working.', 'newspack-plugin' ) . '</p></div>';
	}
}
My_Account_UI_V2_Demo::init();

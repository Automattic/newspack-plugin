<?php
/**
 * Newspack "My Account" v2 prototype demo.
 *
 * Admin-only, gated by the `?v2-demo` query parameter on /my-account/. See
 * docs/my-account-v2-prototype-brief.md for the full spec. Phase 2 swaps in
 * real templates for newsletters, registers the `newsletters` endpoint, and
 * adds the v2 menu item. Donations/subscriptions templates land in later
 * phases.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack "My Account" v2 prototype demo gate.
 */
final class My_Account_UI_V2_Demo {
	const DEMO_FLAG        = 'v2-demo';
	const BODY_CLASS       = 'newspack-my-account--v2-demo';
	const ENDPOINTS_OPTION = 'newspack_my_account_v2_demo_endpoints_version';
	// Bump when the set of registered endpoints changes so the auto-flush
	// guard re-runs. See devlog Decision log "Endpoint flush strategy".
	const ENDPOINTS_VERSION = 2;

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
		// v1 filters at 1001 to rename/remove items; we run at 1100 so we
		// see v1's output and can layer on top.
		\add_filter( 'woocommerce_account_menu_items', [ __CLASS__, 'menu_items' ], 1100 );
		// Render the newsletters endpoint body.
		\add_action( 'woocommerce_account_newsletters_endpoint', [ __CLASS__, 'render_newsletters_endpoint' ] );
		// Preserve `?v2-demo` on every internal nav link (sidebar, post-login
		// redirect, etc.) so a single click can't drop you back into v1.
		\add_filter( 'woocommerce_get_endpoint_url', [ __CLASS__, 'preserve_demo_flag_on_endpoint_url' ], 10, 4 );
		// Register custom endpoints + auto-flush rewrite rules once per
		// version bump. Called directly because this class is itself loaded
		// inside an `init` callback (see class-woocommerce-my-account.php),
		// so add_action('init', ...) would register too late to fire — init
		// has already started by the time we get here.
		self::register_endpoints();
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
		$vars[] = 'newsletters';
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
	 * Enqueue the v2 demo CSS + JS bundle, plus localized fake data.
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
		\wp_localize_script(
			'newspack-my-account-v2-demo',
			'newspackMyAccountV2Demo',
			self::get_fake_data()
		);
	}

	/**
	 * Register custom endpoints (`newsletters`, etc.) and auto-flush rewrite
	 * rules exactly once per bump of `ENDPOINTS_VERSION`. The demo audience
	 * doesn't have CLI access, so we trade a one-shot DB write for not
	 * shipping a manual `wp rewrite flush` step. See devlog cross-phase log.
	 */
	public static function register_endpoints() {
		\add_rewrite_endpoint( 'newsletters', EP_PAGES );

		$current = (int) \get_option( self::ENDPOINTS_OPTION, 0 );
		if ( $current !== self::ENDPOINTS_VERSION ) {
			\flush_rewrite_rules( false ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules
			\update_option( self::ENDPOINTS_OPTION, self::ENDPOINTS_VERSION );
		}
	}

	/**
	 * Inject v2-only menu items. Gated on `is_demo_active()` so v1 sees the
	 * unmodified menu. Mutates by reference of the items array, then re-emits.
	 *
	 * @param array $items Existing menu items.
	 * @return array
	 */
	public static function menu_items( $items ) {
		if ( ! self::is_demo_active() ) {
			return $items;
		}
		// v1 already removed `customer-logout` and `edit-address`. Insert
		// `newsletters` right after `edit-account` so it lines up with the
		// design, and `donations` is reserved for Phase 3.
		$ordered = [];
		foreach ( $items as $slug => $label ) {
			$ordered[ $slug ] = $label;
			if ( 'edit-account' === $slug ) {
				$ordered['newsletters'] = __( 'Newsletters', 'newspack-plugin' );
			}
		}
		// Fallback: if `edit-account` was removed upstream, append.
		if ( ! isset( $ordered['newsletters'] ) ) {
			$ordered['newsletters'] = __( 'Newsletters', 'newspack-plugin' );
		}
		return $ordered;
	}

	/**
	 * Render the newsletters endpoint. Loaded by WooCommerce when the user
	 * visits `/my-account/newsletters/`. Gated so a non-demo admin (or any
	 * non-admin) doesn't see prototype output if they reach the URL directly.
	 */
	public static function render_newsletters_endpoint() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		\load_template(
			__DIR__ . '/templates/v2-demo/newsletters.php',
			false,
			[ 'data' => self::get_fake_data() ]
		);
	}

	/**
	 * Append `?v2-demo` to every account endpoint URL so internal nav, the
	 * post-login redirect, and the WC redirect-to-account-details bounce all
	 * keep the demo active. Filter only runs on demo requests, so non-demo
	 * users see unchanged URLs.
	 *
	 * @param string $url       The endpoint URL.
	 * @param string $endpoint  The endpoint slug.
	 * @param string $value     Endpoint query value.
	 * @param string $permalink The page permalink.
	 * @return string
	 */
	public static function preserve_demo_flag_on_endpoint_url( $url, $endpoint, $value, $permalink ) {
		unset( $endpoint, $value, $permalink );
		if ( ! self::is_demo_active() ) {
			return $url;
		}
		return \add_query_arg( self::DEMO_FLAG, '1', $url );
	}

	/**
	 * Fake data shared by PHP templates and JS. Single source of truth.
	 *
	 * Phase 2 ships only the `newsletters` slice; Phase 3+ will add donations
	 * / subscriptions slices alongside it. Scenario overrides via
	 * `?v2-demo=<scenario>` will be wired in Phase 6.
	 *
	 * @return array
	 */
	public static function get_fake_data() {
		$user = \wp_get_current_user();
		return [
			'reader'      => [
				'display_name' => $user && $user->ID ? $user->display_name : __( 'Casey Reader', 'newspack-plugin' ),
				'email'        => $user && $user->ID ? $user->user_email : 'casey@example.com',
			],
			'newsletters' => [
				'sections'             => [
					[
						'id'          => 'featured',
						'label'       => __( 'Featured newsletters', 'newspack-plugin' ),
						'description' => __( 'Get curated information and inspiration sent straight to your inbox.', 'newspack-plugin' ),
						'lists'       => [
							[
								'id'              => 'morning-brief',
								'name'            => __( 'The Morning', 'newspack-plugin' ),
								'description'     => __( 'A daily roundup of the most relevant stories from the previous day.', 'newspack-plugin' ),
								'frequency'       => __( 'Daily', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => false,
							],
							[
								'id'              => 'recap',
								'name'            => __( 'The Recap', 'newspack-plugin' ),
								'description'     => __( 'Once a month, a roundup of the most relevant stories.', 'newspack-plugin' ),
								'frequency'       => __( 'Monthly', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => true,
							],
							[
								'id'              => 'breaking-news',
								'name'            => __( 'Breaking News', 'newspack-plugin' ),
								'description'     => __( 'Get informed as important news breaks around the world.', 'newspack-plugin' ),
								'frequency'       => __( 'As needed', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => false,
							],
							[
								'id'              => 'evening',
								'name'            => __( 'The Evening', 'newspack-plugin' ),
								'description'     => __( 'Catch up on the biggest news, and wind down to end your day.', 'newspack-plugin' ),
								'frequency'       => __( 'Daily', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => true,
							],
							[
								'id'              => 'science-times',
								'name'            => __( 'Science Times', 'newspack-plugin' ),
								'description'     => __( 'Receive tales of nature, the cosmos, and the human body\'s wonders.', 'newspack-plugin' ),
								'frequency'       => __( 'Twice weekly', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => true,
							],
						],
					],
					[
						'id'          => 'tech',
						'label'       => __( 'Technology', 'newspack-plugin' ),
						'description' => __( 'Get in-depth insights on the rapid pace of tech each week from our sharp analysts.', 'newspack-plugin' ),
						'lists'       => [
							[
								'id'              => 'emerging-tech',
								'name'            => __( 'Emerging Tech Today', 'newspack-plugin' ),
								'description'     => __( 'The latest on cutting-edge innovations soon to impact business and society.', 'newspack-plugin' ),
								'frequency'       => __( 'Monthly', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => true,
							],
							[
								'id'              => 'tech-policy',
								'name'            => __( 'Tech Policy Roundup', 'newspack-plugin' ),
								'description'     => __( 'A weekly dive into the critical laws and regulations shaping the tech sector.', 'newspack-plugin' ),
								'frequency'       => __( 'Weekly', 'newspack-plugin' ),
								'subscriber_only' => false,
								'subscribed'      => true,
							],
							[
								'id'              => 'cio-brief',
								'name'            => __( 'CIO Brief', 'newspack-plugin' ),
								'description'     => __( 'Data security, IT infrastructure, and digital transformation insights for enterprise leaders.', 'newspack-plugin' ),
								'frequency'       => __( 'As needed', 'newspack-plugin' ),
								'subscriber_only' => true,
								'subscribed'      => false,
							],
						],
					],
					[
						'id'          => 'premium',
						'label'       => __( 'Subscriber-only newsletters', 'newspack-plugin' ),
						'description' => __( 'Enjoy exclusive newsletters with your subscription.', 'newspack-plugin' ),
						'lists'       => [
							[
								'id'              => 'la-fourchette',
								'name'            => __( 'La Fourchette', 'newspack-plugin' ),
								'description'     => __( 'Unleash a culinary world with our exclusive restaurant reviews — a day before everyone else.', 'newspack-plugin' ),
								'frequency'       => __( 'Weekly', 'newspack-plugin' ),
								'subscriber_only' => true,
								'subscribed'      => false,
							],
							[
								'id'              => 'football-am',
								'name'            => __( 'Football AM with Ade Lenworth', 'newspack-plugin' ),
								'description'     => __( 'News and analysis, on and off the pitch.', 'newspack-plugin' ),
								'frequency'       => __( '3 times a week', 'newspack-plugin' ),
								'subscriber_only' => true,
								'subscribed'      => false,
							],
							[
								'id'              => 'cio-brief-premium',
								'name'            => __( 'CIO Brief', 'newspack-plugin' ),
								'description'     => __( 'Data security, IT infrastructure, and digital transformation insights for enterprise leaders.', 'newspack-plugin' ),
								'frequency'       => __( 'As needed', 'newspack-plugin' ),
								'subscriber_only' => true,
								'subscribed'      => false,
							],
						],
					],
				],
				'unsubscribe_from_all' => [
					'enabled'     => true,
					'title'       => __( 'Unsubscribe from all', 'newspack-plugin' ),
					'description' => __( 'Don’t want any newsletters from us?', 'newspack-plugin' ),
					'label'       => __( 'Unsubscribe from all', 'newspack-plugin' ),
				],
			],
		];
	}
}
My_Account_UI_V2_Demo::init();

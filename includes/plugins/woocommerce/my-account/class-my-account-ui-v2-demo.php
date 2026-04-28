<?php
/**
 * Newspack "My Account" v2 prototype demo.
 *
 * Admin-only, gated by the `?v2-demo` query parameter on /my-account/. See
 * docs/my-account-v2-prototype-brief.md for the full spec. Phase 2 swaps in
 * real templates for newsletters, registers the `newsletters` endpoint, and
 * adds the v2 menu item. Phase 3 adds the `donations` endpoint plus list and
 * detail templates. Subscriptions templates land in later phases.
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
	// 2 = newsletters (Phase 2). 3 = + donations (Phase 3).
	const ENDPOINTS_VERSION = 3;

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
		// Render the donations endpoint body. Same hook shape as newsletters.
		// The endpoint accepts a value: bare `/my-account/donations/` is the
		// list view; `/my-account/donations/<id>/` is the detail view (the
		// id is read inside the render function via get_query_var).
		\add_action( 'woocommerce_account_donations_endpoint', [ __CLASS__, 'render_donations_endpoint' ] );
		// The `newsletters` and `donations` endpoints are registered globally
		// (rewrite rules can't be conditional on caps), so a non-demo visitor
		// guessing either URL would land on an empty account body. Redirect
		// them away.
		\add_action( 'template_redirect', [ __CLASS__, 'redirect_non_demo_v2_endpoints' ], 9 );
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
		$vars[] = 'donations';
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
		// Use the webpack-emitted asset.php for the JS deps so anything the
		// bundle imports (e.g. @wordpress/i18n) is enqueued automatically.
		// Canonical pattern in this repo — see e.g. trait-content-gate-layout.
		$asset = require NEWSPACK_ABSPATH . 'dist/my-account-v2-demo.asset.php';
		\wp_enqueue_style(
			'newspack-my-account-v2-demo',
			Newspack::plugin_url() . '/dist/my-account-v2-demo.css',
			[ 'newspack-ui' ],
			$asset['version']
		);
		\wp_enqueue_script(
			'newspack-my-account-v2-demo',
			Newspack::plugin_url() . '/dist/my-account-v2-demo.js',
			$asset['dependencies'],
			$asset['version'],
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
		// `donations` accepts a value, so `/my-account/donations/` is the
		// list view and `/my-account/donations/<id>/` is the detail view.
		// EP_PAGES already preserves the trailing value segment.
		\add_rewrite_endpoint( 'donations', EP_PAGES );

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
		// v1 already removed `customer-logout` and `edit-address`. Insert v2
		// items between `edit-account` and the rest, in the order they appear
		// in the Figma sidebar: Newsletters → Donations → (Subscriptions,
		// already present from WC Subscriptions if installed).
		$ordered = [];
		foreach ( $items as $slug => $label ) {
			$ordered[ $slug ] = $label;
			if ( 'edit-account' === $slug ) {
				$ordered['newsletters'] = __( 'Newsletters', 'newspack-plugin' );
				$ordered['donations']   = __( 'Donations', 'newspack-plugin' );
			}
		}
		// Fallback: if `edit-account` was removed upstream, append.
		if ( ! isset( $ordered['newsletters'] ) ) {
			$ordered['newsletters'] = __( 'Newsletters', 'newspack-plugin' );
		}
		if ( ! isset( $ordered['donations'] ) ) {
			$ordered['donations'] = __( 'Donations', 'newspack-plugin' );
		}
		return $ordered;
	}

	/**
	 * Bounce non-demo visitors away from `/my-account/newsletters/` and
	 * `/my-account/donations/` (incl. detail URLs) so they never see an
	 * empty My Account body. Runs before WC writes the response; complements
	 * the render-side gates and makes Copilot's "guessable URL" concern moot
	 * for production users.
	 */
	public static function redirect_non_demo_v2_endpoints() {
		if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() ) {
			return;
		}
		// Use get_query_var, not is_wc_endpoint_url — the latter only
		// matches WC's hardcoded endpoint list, not custom endpoints we
		// register via add_rewrite_endpoint(). False === unset; bare endpoint
		// comes through as empty string; detail URL as the value (e.g. an id).
		$is_v2_endpoint = false !== \get_query_var( 'newsletters', false )
			|| false !== \get_query_var( 'donations', false );
		if ( ! $is_v2_endpoint ) {
			return;
		}
		if ( self::is_demo_active() ) {
			return;
		}
		\wp_safe_redirect( \wc_get_account_endpoint_url( 'edit-account' ) );
		exit;
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
	 * Render the donations endpoint. Loaded by WooCommerce when the user
	 * visits `/my-account/donations/` (list) or `/my-account/donations/<id>/`
	 * (detail). The endpoint value is the donation id; empty string = list.
	 *
	 * If the id doesn't match any fake donation, fall back to the list view
	 * (silent fallback is fine for a demo — Phase 6 polish can add a notice).
	 */
	public static function render_donations_endpoint() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		$data = self::get_fake_data();
		$id   = (string) \get_query_var( 'donations', '' );

		if ( '' !== $id ) {
			$donation = self::find_donation_by_id( $data, $id );
			if ( $donation ) {
				\load_template(
					__DIR__ . '/templates/v2-demo/donation-details.php',
					false,
					[
						'data'     => $data,
						'donation' => $donation,
					]
				);
				return;
			}
		}

		\load_template(
			__DIR__ . '/templates/v2-demo/donations.php',
			false,
			[ 'data' => $data ]
		);
	}

	/**
	 * Build a v2-demo donations URL — bare endpoint when $id is empty, detail
	 * URL otherwise. Goes through `wc_get_endpoint_url`, which fires the
	 * `woocommerce_get_endpoint_url` filter so our `?v2-demo=1` preservation
	 * kicks in automatically — list/detail/sidebar links all stay in the demo.
	 *
	 * @param string $id Donation id, or '' for the list URL.
	 * @return string
	 */
	public static function donations_url( $id = '' ) {
		$myaccount = \wc_get_page_permalink( 'myaccount' );
		return \wc_get_endpoint_url( 'donations', (string) $id, $myaccount );
	}

	/**
	 * Look up a single donation in the fake-data array by id, across the
	 * `recurring` and `one_time` sections.
	 *
	 * @param array  $data Full fake-data payload.
	 * @param string $id   Donation id to find.
	 * @return array|null  Donation row + a `kind` key set to 'recurring' or
	 *                     'one_time', or null if not found.
	 */
	private static function find_donation_by_id( $data, $id ) {
		$donations = isset( $data['donations'] ) ? $data['donations'] : [];
		foreach ( [ 'recurring', 'one_time' ] as $kind ) {
			$rows = isset( $donations[ $kind ] ) ? $donations[ $kind ] : [];
			foreach ( $rows as $row ) {
				if ( isset( $row['id'] ) && (string) $row['id'] === $id ) {
					$row['kind'] = $kind;
					return $row;
				}
			}
		}
		return null;
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
	 * Phase 2 ships only the `newsletters` slice; Phase 3 adds `donations`.
	 * Subscriptions land in Phase 4. Scenario overrides via
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
			'donations'   => self::get_fake_donations(),
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

	/**
	 * Donations slice of the fake-data payload. One active recurring + one
	 * cancelled recurring + two one-time entries + a billing-history button
	 * (the list page renders an inline billing-history table when
	 * `billing_history_inline` is true; Phase 6 wires that as a scenario).
	 *
	 * Currency is USD per brief §7. The Figma frames render in £ — substance
	 * is the same. Each donation carries its own `billing_history` array
	 * (the per-donation table on the detail page); the recurring without-fees
	 * variant is expressed via `fees_covered = true`, which suppresses the
	 * Amount breakdown on the detail page.
	 *
	 * @return array
	 */
	private static function get_fake_donations() {
		return [
			'currency_symbol'        => '$',
			'currency_code'          => 'USD',
			'recurring'              => [
				[
					'id'              => 'don-001',
					'status'          => 'active',
					'amount'          => 10.00,
					'frequency'       => 'month',
					'frequency_label' => __( 'Monthly', 'newspack-plugin' ),
					'started'         => '2025-03-14',
					'latest_payment'  => '2026-04-14',
					'next_payment'    => '2026-05-14',
					'subtotal'        => 8.33,
					'vat'             => 1.67,
					'transaction_fee' => null,
					'total'           => 10.00,
					'fees_covered'    => false,
					'payment_method'  => [
						'brand' => __( 'Visa', 'newspack-plugin' ),
						'last4' => '4242',
						'exp'   => '02/27',
					],
					'billing_history' => [
						[
							'order'  => '#890',
							'date'   => '2026-04-14',
							'status' => 'paid',
							'amount' => 10.00,
						],
						[
							'order'  => '#731',
							'date'   => '2026-03-14',
							'status' => 'paid',
							'amount' => 10.00,
						],
						[
							'order'  => '#684',
							'date'   => '2026-02-14',
							'status' => 'paid',
							'amount' => 10.00,
						],
						[
							'order'  => '#603',
							'date'   => '2026-01-14',
							'status' => 'paid',
							'amount' => 10.00,
						],
						[
							'order'  => '#562',
							'date'   => '2025-12-14',
							'status' => 'paid',
							'amount' => 10.00,
						],
					],
				],
				[
					'id'              => 'don-cancelled',
					'status'          => 'cancelled',
					'amount'          => 153.00,
					'frequency'       => 'year',
					'frequency_label' => __( 'Annually', 'newspack-plugin' ),
					'started'         => '2024-02-14',
					'latest_payment'  => '2025-08-01',
					'next_payment'    => null,
					'cancelled'       => '2025-08-15',
					'subtotal'        => 125.00,
					'vat'             => 25.00,
					'transaction_fee' => 3.00,
					'total'           => 153.00,
					'fees_covered'    => false,
					'payment_method'  => [
						'brand' => __( 'Amex', 'newspack-plugin' ),
						'last4' => '9001',
						'exp'   => '07/29',
					],
					'billing_history' => [
						[
							'order'  => '#899',
							'date'   => '2025-08-15',
							'status' => 'cancelled',
							'amount' => null,
						],
						[
							'order'  => '#820',
							'date'   => '2025-02-14',
							'status' => 'paid',
							'amount' => 153.00,
						],
						[
							'order'  => '#640',
							'date'   => '2024-02-14',
							'status' => 'paid',
							'amount' => 153.00,
						],
					],
				],
			],
			'one_time'               => [
				[
					'id'              => 'don-onetime-1',
					'status'          => 'paid',
					'amount'          => 25.00,
					'subtotal'        => 20.83,
					'vat'             => 4.17,
					'transaction_fee' => null,
					'total'           => 25.00,
					'fees_covered'    => false,
					'date'            => '2025-11-30',
					'payment_method'  => [
						'brand' => __( 'Visa', 'newspack-plugin' ),
						'last4' => '4242',
						'exp'   => '02/27',
					],
					'billing_history' => [
						[
							'order'  => '#946',
							'date'   => '2025-11-30',
							'status' => 'paid',
							'amount' => 25.00,
						],
					],
				],
				[
					'id'              => 'don-onetime-2',
					'status'          => 'paid',
					'amount'          => 40.00,
					'subtotal'        => 33.33,
					'vat'             => 6.67,
					'transaction_fee' => null,
					'total'           => 40.00,
					'fees_covered'    => true,
					'date'            => '2024-01-01',
					'payment_method'  => [
						'brand' => __( 'Mastercard', 'newspack-plugin' ),
						'last4' => '5454',
						'exp'   => '08/28',
					],
					'billing_history' => [
						[
							'order'  => '#312',
							'date'   => '2024-01-01',
							'status' => 'paid',
							'amount' => 40.00,
						],
					],
				],
			],
			// Bottom of the list page: render the Button Card by default
			// (Figma 2636:46467). Phase 6 will flip `billing_history_inline`
			// for the embedded-table variant (Figma 3619:292407).
			'billing_history_inline' => false,
			'billing_history_button' => [
				'enabled'     => true,
				'title'       => __( 'Billing history', 'newspack-plugin' ),
				'description' => __( 'View, download, and print your receipts.', 'newspack-plugin' ),
			],
		];
	}
}
My_Account_UI_V2_Demo::init();

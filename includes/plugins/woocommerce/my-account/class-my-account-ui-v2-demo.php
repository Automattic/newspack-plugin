<?php
/**
 * Newspack "My Account" v2 prototype demo.
 *
 * Admin-only, gated by the `?v2-demo` query parameter on /my-account/. See
 * docs/my-account-v2-prototype-brief.md for the full spec. Phase 2 swaps in
 * real templates for newsletters, registers the `newsletters` endpoint, and
 * adds the v2 menu item. Phase 3 adds the `donations` endpoint plus list and
 * detail templates. Phase 4 adds the `subscriptions` endpoint with list +
 * detail templates and takes over WC Subscriptions' default rendering when
 * the demo flag is active. Phase 6 mirrors WC core's `payment-methods`
 * page under the demo flag, fed by fake data, and bypasses v1's
 * `wc_get_template` swap via the same takeover pattern Phase 4 uses for
 * subscriptions. See the v2-demo template for the small intentional
 * deviations from WC core's exact output.
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
	/**
	 * Recognised scenario names. The query parameter `?v2-demo=<scenario>`
	 * triggers a deterministic merge into the base fake-data fixture so each
	 * variant frame in Figma is reachable from a stable URL. The default
	 * `?v2-demo=1` (or any other value) yields the happy path with no
	 * overrides — see apply_scenario() and brief §7.
	 */
	const SCENARIOS = [
		// Subscription state swaps — replace whatever's in the active slot.
		'cancelled-sub',
		'expiring',
		'renewed',
		'no-fees',
		// Donations.
		'billing-history',
		// Newsletters.
		'no-categories',
		// Payment methods.
		'expired-payment',
		// Empty states.
		'empty',
		'no-donations',
		'no-subscriptions',
		'no-payment-methods',
	];
	// Bump when the set of registered endpoints changes so the auto-flush
	// guard re-runs. See devlog Decision log "Endpoint flush strategy".
	// 2 = newsletters (Phase 2). 3 = + donations (Phase 3).
	// 4 = + subscriptions (Phase 4). 5 = Phase 6 payment-methods takeover —
	// the `payment-methods` endpoint is already registered by WC core, so we
	// don't add_rewrite_endpoint for it; the bump still fires the flush once
	// per environment so any rewrite-rule drift from earlier phases lands on
	// a clean slate alongside the takeover hook.
	// The `subscriptions` endpoint may already exist on sites with WC
	// Subscriptions; add_rewrite_endpoint is idempotent so re-registering is
	// harmless, and the auto-flush only fires once per admin visit after the
	// bump.
	const ENDPOINTS_VERSION = 5;

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
		// Render the subscriptions endpoint body. WC Subscriptions also hooks
		// here when installed (see WCS_Query::endpoint_content); when the demo
		// is active we suppress all other handlers via takeover_subscriptions
		// so this is the only renderer.
		\add_action( 'woocommerce_account_subscriptions_endpoint', [ __CLASS__, 'render_subscriptions_endpoint' ] );
		// Render the payment-methods endpoint body. WC core hooks
		// `woocommerce_account_payment_methods` at priority 10; v1 also swaps
		// the underlying template via wc_get_template. Our takeover (below)
		// drops both so this callback is the sole renderer when the demo flag
		// is active.
		\add_action( 'woocommerce_account_payment-methods_endpoint', [ __CLASS__, 'render_payment_methods_endpoint' ] );
		// On sites with WC Subscriptions, WCS owns `woocommerce_account_subscriptions_endpoint`
		// at priority 10 and Newspack appends a memberships table at 11 (see
		// WooCommerce_My_Account::append_membership_table). Both must be
		// suppressed when the demo is active so our template is the sole
		// renderer. Runs at priority 8, before redirect_non_demo at 9.
		\add_action( 'template_redirect', [ __CLASS__, 'takeover_subscriptions_endpoint' ], 8 );
		// Mirror the subscriptions takeover for `payment-methods` — WC core
		// hooks `woocommerce_account_payment_methods` (-> wc_get_template
		// 'myaccount/payment-methods.php', which v1 swaps for its own custom
		// `payment-information.php`). Drop both handlers and re-add our
		// renderer so the v2 prototype shows fake-data cards instead.
		\add_action( 'template_redirect', [ __CLASS__, 'takeover_payment_methods_endpoint' ], 8 );
		// The `newsletters`, `donations`, and `subscriptions` endpoints are
		// registered globally (rewrite rules can't be conditional on caps),
		// so a non-demo visitor guessing those URLs would land on an empty
		// account body. Redirect them away. Subscriptions is special-cased:
		// when WC Subscriptions is installed, it owns the endpoint for non-
		// demo users, so we don't bounce them off `/my-account/subscriptions/`.
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
	 * Read the current scenario name from `?v2-demo=<scenario>`. Returns the
	 * empty string when the flag is `1` / unset / not in the SCENARIOS list,
	 * so callers can short-circuit the happy path with a single is-empty
	 * check. Sanitised because it's read from $_GET; gating happens upstream
	 * via is_demo_active().
	 *
	 * @return string Scenario name (one of self::SCENARIOS) or ''.
	 */
	public static function get_scenario() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET[ self::DEMO_FLAG ] ) ) {
			return '';
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$value = \sanitize_text_field( \wp_unslash( $_GET[ self::DEMO_FLAG ] ) );
		return \in_array( $value, self::SCENARIOS, true ) ? $value : '';
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
		// `subscriptions` may already be registered as a query var by WC
		// Subscriptions; pushing again is harmless (WP de-dupes when parsing)
		// but ensures the var exists even on sites without WCS.
		$vars[] = 'subscriptions';
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
		// `subscriptions` follows the same shape — bare URL is the list,
		// `/my-account/subscriptions/<id>/` is the detail. add_rewrite_endpoint
		// is idempotent: on sites where WC Subscriptions has already
		// registered the same slug, this is a no-op. The takeover at
		// template_redirect is what wins control of the rendering when the
		// demo flag is active.
		\add_rewrite_endpoint( 'subscriptions', EP_PAGES );

		// Auto-flush the rewrite rules once per ENDPOINTS_VERSION bump, but
		// only when an admin is logged in — flush_rewrite_rules() is
		// expensive (~50ms) and shouldn't fire on anonymous frontend
		// traffic. Demo audience is admins anyway, so deferring is harmless;
		// the first admin to visit any /my-account/ page after a deploy
		// triggers the flush, and subsequent requests for everyone resolve
		// the new endpoints.
		$current = (int) \get_option( self::ENDPOINTS_OPTION, 0 );
		if ( $current !== self::ENDPOINTS_VERSION
			&& \is_user_logged_in()
			&& \current_user_can( 'manage_options' )
		) {
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
		// Pluck `subscriptions` if it exists (WC Subscriptions adds it, and
		// the wrapper class moves it to the top via `wc_subscriptions_at_top`).
		// We always re-insert it in our preferred position with our preferred
		// label so the menu order is consistent on sites with and without WCS.
		unset( $items['subscriptions'] );

		// v1 relabels `payment-methods` to "Payment information" — pluck it
		// here too so we can reinsert with the v2 label "Payment methods" in
		// our preferred slot, regardless of what v1 (or anything else) named
		// it. WC core registers the slug for any logged-in customer.
		unset( $items['payment-methods'] );

		// v1 already removed `customer-logout` and `edit-address`. Insert v2
		// items between `edit-account` and the rest, in the order they appear
		// in the Figma sidebar: Newsletters → Donations → Subscriptions →
		// Payment methods.
		$ordered = [];
		foreach ( $items as $slug => $label ) {
			$ordered[ $slug ] = $label;
			if ( 'edit-account' === $slug ) {
				$ordered['newsletters']     = __( 'Newsletters', 'newspack-plugin' );
				$ordered['donations']       = __( 'Donations', 'newspack-plugin' );
				$ordered['subscriptions']   = __( 'Subscriptions', 'newspack-plugin' );
				$ordered['payment-methods'] = __( 'Payment methods', 'newspack-plugin' );
			}
		}
		// Fallbacks: if `edit-account` was removed upstream, append.
		if ( ! isset( $ordered['newsletters'] ) ) {
			$ordered['newsletters'] = __( 'Newsletters', 'newspack-plugin' );
		}
		if ( ! isset( $ordered['donations'] ) ) {
			$ordered['donations'] = __( 'Donations', 'newspack-plugin' );
		}
		if ( ! isset( $ordered['subscriptions'] ) ) {
			$ordered['subscriptions'] = __( 'Subscriptions', 'newspack-plugin' );
		}
		if ( ! isset( $ordered['payment-methods'] ) ) {
			$ordered['payment-methods'] = __( 'Payment methods', 'newspack-plugin' );
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
		// Subscriptions: only bounce if WC Subscriptions ISN'T installed.
		// When it is installed, WCS owns the endpoint for non-demo readers
		// and we must not redirect them. wcs_get_subscription is WCS' own
		// helper — its existence is the established sentinel for WCS being
		// active (used elsewhere in the plugin and brief §8).
		$has_wc_subscriptions = function_exists( 'wcs_get_subscription' );
		if ( ! $has_wc_subscriptions && false !== \get_query_var( 'subscriptions', false ) ) {
			$is_v2_endpoint = true;
		}
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
	 * Take over the subscriptions endpoint when the demo is active. WC
	 * Subscriptions hooks `WCS_Query::endpoint_content` at priority 10 and
	 * Newspack hooks `WooCommerce_My_Account::append_membership_table` at
	 * 11; both must be suppressed so our v2 template is the sole renderer.
	 *
	 * Runs at template_redirect priority 8 — before the action is fired by
	 * the [woocommerce_my_account] shortcode and before redirect_non_demo at
	 * priority 9 (so a non-demo guesser is bounced, never takes over).
	 */
	public static function takeover_subscriptions_endpoint() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		if ( false === \get_query_var( 'subscriptions', false ) ) {
			return;
		}
		// Drop every existing handler (WCS, memberships, anything else a
		// site might have attached). Our render_subscriptions_endpoint
		// callback was registered in init() and is re-added here so it
		// remains the only handler.
		\remove_all_actions( 'woocommerce_account_subscriptions_endpoint' );
		\add_action( 'woocommerce_account_subscriptions_endpoint', [ __CLASS__, 'render_subscriptions_endpoint' ] );
	}

	/**
	 * Take over the payment-methods endpoint when the demo is active. WC core
	 * hooks `woocommerce_account_payment_methods` at priority 10 (which calls
	 * `wc_get_template( 'myaccount/payment-methods.php' )`); v1 also filters
	 * `wc_get_template` to swap in its own `payment-information.php`. Drop
	 * every existing handler so our v2 template is the sole renderer.
	 *
	 * Same shape as takeover_subscriptions_endpoint — see Phase 4 devlog.
	 * Runs at template_redirect priority 8, before the action is fired by
	 * the [woocommerce_my_account] shortcode.
	 */
	public static function takeover_payment_methods_endpoint() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		// `payment-methods` is a registered WC core endpoint; the query var
		// is set whenever the URL matches, even though we don't consume the
		// value here.
		if ( false === \get_query_var( 'payment-methods', false ) ) {
			return;
		}
		\remove_all_actions( 'woocommerce_account_payment-methods_endpoint' );
		\add_action( 'woocommerce_account_payment-methods_endpoint', [ __CLASS__, 'render_payment_methods_endpoint' ] );
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
	 * Render the subscriptions endpoint. Loaded by WooCommerce when the user
	 * visits `/my-account/subscriptions/` (list) or
	 * `/my-account/subscriptions/<id>/` (detail). The endpoint value is the
	 * subscription id; empty string = list.
	 *
	 * If the id doesn't match any fake subscription, fall back to the list
	 * view (silent fallback — Phase 6 polish can add a notice).
	 */
	public static function render_subscriptions_endpoint() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		$data = self::get_fake_data();
		$id   = (string) \get_query_var( 'subscriptions', '' );

		if ( '' !== $id ) {
			$subscription = self::find_subscription_by_id( $data, $id );
			if ( $subscription ) {
				\load_template(
					__DIR__ . '/templates/v2-demo/subscription-details.php',
					false,
					[
						'data'         => $data,
						'subscription' => $subscription,
					]
				);
				return;
			}
		}

		\load_template(
			__DIR__ . '/templates/v2-demo/subscriptions.php',
			false,
			[ 'data' => $data ]
		);
	}

	/**
	 * Render the payment-methods endpoint. Loaded by WooCommerce when the
	 * user visits `/my-account/payment-methods/`, after the takeover above
	 * has dropped WC core / v1 / Stripe handlers. The template mirrors WC
	 * core's `myaccount/payment-methods.php` DOM byte-for-byte, fed by the
	 * fake `payment_methods` slice from get_fake_data().
	 */
	public static function render_payment_methods_endpoint() {
		if ( ! self::is_demo_active() ) {
			return;
		}
		\load_template(
			__DIR__ . '/templates/v2-demo/payment-methods.php',
			false,
			[ 'data' => self::get_fake_data() ]
		);
	}

	/**
	 * Build a v2-demo subscriptions URL — bare endpoint when $id is empty,
	 * detail URL otherwise. Same plumbing as donations_url(); the
	 * woocommerce_get_endpoint_url filter re-appends ?v2-demo automatically.
	 *
	 * @param string $id Subscription id, or '' for the list URL.
	 * @return string
	 */
	public static function subscriptions_url( $id = '' ) {
		$myaccount = \wc_get_page_permalink( 'myaccount' );
		return \wc_get_endpoint_url( 'subscriptions', (string) $id, $myaccount );
	}

	/**
	 * Look up a single subscription in the fake-data array by id, across the
	 * `active` and `previous` buckets. Phase 7 retired the prior `extras`
	 * pool: scenarios (`?v2-demo=expiring` / `=renewed` / `=no-fees` /
	 * `=cancelled-sub`) now swap each variant fixture into the `active` slot,
	 * so every detail variant is reachable through its scenario URL without
	 * a separate detail-only bucket.
	 *
	 * @param array  $data Full fake-data payload.
	 * @param string $id   Subscription id to find.
	 * @return array|null  Subscription row, or null if not found.
	 */
	private static function find_subscription_by_id( $data, $id ) {
		$subscriptions = isset( $data['subscriptions'] ) ? $data['subscriptions'] : [];
		foreach ( [ 'active', 'previous' ] as $bucket ) {
			$rows = isset( $subscriptions[ $bucket ] ) ? $subscriptions[ $bucket ] : [];
			foreach ( $rows as $row ) {
				if ( isset( $row['id'] ) && (string) $row['id'] === $id ) {
					return $row;
				}
			}
		}
		return null;
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
		// Preserve the original flag value (e.g. `?v2-demo=cancelled-sub` per
		// brief §7 scenario fixtures), not just `'1'`. Falls back to `'1'`
		// for the happy path. is_demo_active() above already gated on
		// admin caps + endpoint URL, so reading $_GET here is safe.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$demo_flag_value = isset( $_GET[ self::DEMO_FLAG ] ) ? \sanitize_text_field( \wp_unslash( $_GET[ self::DEMO_FLAG ] ) ) : '1'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( '' === $demo_flag_value ) {
			$demo_flag_value = '1';
		}
		return \add_query_arg( self::DEMO_FLAG, $demo_flag_value, $url );
	}

	/**
	 * Fake data shared by PHP templates and JS. Single source of truth.
	 *
	 * The base fixture is the happy path (one active recurring donation,
	 * one active subscription, one cancelled + one expired previous, two
	 * saved cards). Scenario overrides via `?v2-demo=<scenario>` (Phase 7)
	 * are merged on top — see apply_scenario() and brief §7.
	 *
	 * @return array
	 */
	public static function get_fake_data() {
		$user = \wp_get_current_user();
		$base = [
			'reader'          => [
				'display_name' => $user && $user->ID ? $user->display_name : __( 'Casey Reader', 'newspack-plugin' ),
				'email'        => $user && $user->ID ? $user->user_email : 'casey@example.com',
			],
			'donations'       => self::get_fake_donations(),
			'subscriptions'   => self::get_fake_subscriptions(),
			'payment_methods' => self::get_fake_payment_methods(),
			'newsletters'     => [
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

		$scenario = self::get_scenario();
		if ( '' === $scenario ) {
			return $base;
		}
		return self::apply_scenario( $base, $scenario );
	}

	/**
	 * Apply a scenario override to the base fake-data fixture. Each scenario
	 * is a small deterministic merge — swap a fixture into the active slot,
	 * flip a flag, empty a slice — that closes a Figma variant frame the
	 * happy-path fixture doesn't reach. Unrecognised names fall through to
	 * the base (defensive: get_scenario already enforces the allow-list).
	 *
	 * Scenario inventory (brief §7, Phase 7 devlog):
	 *  - cancelled-sub / expiring / renewed / no-fees — swap which subscription
	 *    fixture renders in the active slot, so the list view picks up the
	 *    same status badge / inline notice / collapsed Amount section as the
	 *    matching detail variant.
	 *  - billing-history — flip donations.billing_history_inline true so the
	 *    embedded billing-history table replaces the bottom Button Card
	 *    (Figma 3619:292407).
	 *  - no-categories — flatten newsletters.sections to a single ungrouped
	 *    list (Figma 4645:19732).
	 *  - expired-payment — replace one saved card with one whose `expires`
	 *    is in the past, surfacing the Expired badge.
	 *  - empty / no-donations / no-subscriptions / no-payment-methods —
	 *    empty-state variants for the relevant slice(s).
	 *
	 * @param array  $data     Base fake-data payload.
	 * @param string $scenario Scenario name; one of self::SCENARIOS.
	 * @return array
	 */
	private static function apply_scenario( $data, $scenario ) {
		switch ( $scenario ) {
			case 'cancelled-sub':
				$pool                              = self::get_subscription_fixtures();
				$data['subscriptions']['active']   = [ $pool['sub-cancelled'] ];
				// Drop the now-duplicated cancelled card from previous so the
				// reader doesn't see the same row twice.
				$data['subscriptions']['previous'] = [ $pool['sub-expired'] ];
				break;

			case 'expiring':
				$pool                            = self::get_subscription_fixtures();
				$data['subscriptions']['active'] = [ $pool['sub-expiring'] ];
				break;

			case 'renewed':
				$pool                            = self::get_subscription_fixtures();
				$data['subscriptions']['active'] = [ $pool['sub-renewed'] ];
				break;

			case 'no-fees':
				$pool                            = self::get_subscription_fixtures();
				$data['subscriptions']['active'] = [ $pool['sub-active-no-fees'] ];
				break;

			case 'billing-history':
				if ( isset( $data['donations'] ) ) {
					$data['donations']['billing_history_inline'] = true;
				}
				break;

			case 'no-categories':
				if ( isset( $data['newsletters']['sections'] ) ) {
					$flat_lists = [];
					foreach ( $data['newsletters']['sections'] as $section ) {
						if ( ! empty( $section['lists'] ) && is_array( $section['lists'] ) ) {
							$flat_lists = array_merge( $flat_lists, $section['lists'] );
						}
					}
					$data['newsletters']['sections'] = [
						[
							'id'          => 'all',
							'label'       => '',
							'description' => '',
							'lists'       => $flat_lists,
						],
					];
				}
				break;

			case 'expired-payment':
				if ( isset( $data['payment_methods']['cc'] ) && is_array( $data['payment_methods']['cc'] ) ) {
					// Mark the non-default card as expired (or the only card if
					// there's just one). Swapping `expires` to a past month is
					// what surfaces v1's Expired indicator in the cell template
					// — the row class stays the same, the value column carries
					// the past date.
					foreach ( $data['payment_methods']['cc'] as $idx => $row ) {
						if ( empty( $row['is_default'] ) ) {
							$data['payment_methods']['cc'][ $idx ]['expires'] = '03/24';
							break;
						}
					}
				}
				break;

			case 'empty':
				$data['donations']       = self::empty_donations();
				$data['subscriptions']   = self::empty_subscriptions();
				$data['payment_methods'] = self::empty_payment_methods();
				break;

			case 'no-donations':
				$data['donations'] = self::empty_donations();
				break;

			case 'no-subscriptions':
				$data['subscriptions'] = self::empty_subscriptions();
				break;

			case 'no-payment-methods':
				$data['payment_methods'] = self::empty_payment_methods();
				break;
		}
		return $data;
	}

	/**
	 * Empty-state shape for the donations slice. Preserves currency + the
	 * billing-history button slot so the list template still renders the
	 * "no recurring / no previous" copy without erroring on missing keys.
	 *
	 * @return array
	 */
	private static function empty_donations() {
		return [
			'currency_symbol'        => '$',
			'currency_code'          => 'USD',
			'recurring'              => [],
			'one_time'               => [],
			'billing_history_inline' => false,
			'billing_history_button' => [ 'enabled' => false ],
		];
	}

	/**
	 * Empty-state shape for the subscriptions slice. Keeps the tiers
	 * catalogue so the modal lookup path stays valid even on empty lists.
	 *
	 * @return array
	 */
	private static function empty_subscriptions() {
		$base = self::get_fake_subscriptions();
		return [
			'currency_symbol' => $base['currency_symbol'],
			'currency_code'   => $base['currency_code'],
			'tiers'           => $base['tiers'],
			'active'          => [],
			'previous'        => [],
		];
	}

	/**
	 * Empty-state shape for the payment-methods slice.
	 *
	 * @return array
	 */
	private static function empty_payment_methods() {
		return [
			'cc' => [],
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
			// (Figma 2636:46467). Phase 7 scenario `?v2-demo=billing-history`
			// flips this to true for the embedded-table variant
			// (Figma 3619:292407).
			'billing_history_inline' => false,
			'billing_history_button' => [
				'enabled'     => true,
				'title'       => __( 'Billing history', 'newspack-plugin' ),
				'description' => __( 'View, download, and print your receipts.', 'newspack-plugin' ),
			],
		];
	}

	/**
	 * Canonical subscription fixtures, keyed by id. Phase 7 lifted these out
	 * of the prior `active` / `previous` / `extras` arrays so scenarios can
	 * swap any fixture into the `active` slot without duplicating row
	 * literals — `?v2-demo=expiring` plucks `sub-expiring`, `=renewed`
	 * plucks `sub-renewed`, etc.
	 *
	 * Each row's `status` + `fees_covered` flags drive the detail template
	 * branch (header buttons, Amount breakdown, CANCELLED badge, inline
	 * expiring notice). Currency is USD per brief §7; Figma renders in £.
	 *
	 * @return array<string,array>
	 */
	private static function get_subscription_fixtures() {
		return [
			// active (Figma 2636:46149) — happy-path live subscription.
			'sub-001'            => [
				'id'                    => 'sub-001',
				'status'                => 'active',
				'current_tier'          => 'tier-member-yearly',
				'product'               => __( 'Member', 'newspack-plugin' ),
				'amount'                => 71.16,
				'frequency'             => 'year',
				'frequency_label'       => __( 'Annually', 'newspack-plugin' ),
				'started'               => '2025-03-16',
				'latest_payment'        => '2026-03-16',
				'next_payment'          => '2027-03-16',
				'subtotal'              => 58.33,
				'vat'                   => 11.67,
				'transaction_fee'       => 1.16,
				'transaction_fee_label' => __( 'Transaction fee (2%)', 'newspack-plugin' ),
				'total'                 => 71.16,
				'fees_covered'          => false,
				'payment_method'        => [
					'brand' => __( 'Visa', 'newspack-plugin' ),
					'last4' => '4242',
					'exp'   => '02/27',
				],
				'billing_history'       => [
					[
						'order'  => '#854',
						'date'   => '2026-03-16',
						'status' => 'paid',
						'amount' => 71.16,
					],
					[
						'order'  => '#853',
						'date'   => '2025-03-16',
						'status' => 'failed',
						'amount' => 71.16,
					],
					[
						'order'  => '#852',
						'date'   => '2025-03-16',
						'status' => 'processing',
						'amount' => 71.16,
					],
				],
			],
			// cancelled (Figma 2636:46177) — CANCELLED badge + Renew subscription.
			'sub-cancelled'      => [
				'id'                    => 'sub-cancelled',
				'status'                => 'cancelled',
				'product'               => __( 'Patron', 'newspack-plugin' ),
				'amount'                => 101.70,
				'frequency'             => 'year',
				'frequency_label'       => __( 'Annually', 'newspack-plugin' ),
				'started'               => '2021-02-19',
				'latest_payment'        => '2022-02-19',
				'next_payment'          => null,
				'cancelled'             => '2023-01-17',
				'subtotal'              => 83.33,
				'vat'                   => 16.67,
				'transaction_fee'       => 1.70,
				'transaction_fee_label' => __( 'Transaction fee (2%)', 'newspack-plugin' ),
				'total'                 => 101.70,
				'fees_covered'          => false,
				'payment_method'        => [
					'brand' => __( 'Visa', 'newspack-plugin' ),
					'last4' => '4242',
					'exp'   => '02/24',
				],
				'billing_history'       => [
					[
						'order'  => '#721',
						'date'   => '2023-01-17',
						'status' => 'cancelled',
						'amount' => null,
					],
					[
						'order'  => '#680',
						'date'   => '2022-02-19',
						'status' => 'paid',
						'amount' => 101.70,
					],
					[
						'order'  => '#102',
						'date'   => '2021-02-19',
						'status' => 'paid',
						'amount' => 101.70,
					],
				],
			],
			// expired — variant of cancelled used as the second `previous`
			// card on the list (Figma init 1 second card row).
			'sub-expired'        => [
				'id'              => 'sub-expired',
				'status'          => 'expired',
				'product'         => __( 'Supporter', 'newspack-plugin' ),
				'amount'          => 5.00,
				'frequency'       => 'month',
				'frequency_label' => __( 'Monthly', 'newspack-plugin' ),
				'started'         => '2022-06-01',
				'latest_payment'  => '2023-05-01',
				'next_payment'    => null,
				'expires_on'      => '2023-06-01',
				'subtotal'        => 4.17,
				'vat'             => 0.83,
				'transaction_fee' => null,
				'total'           => 5.00,
				'fees_covered'    => false,
				'payment_method'  => [
					'brand' => __( 'Mastercard', 'newspack-plugin' ),
					'last4' => '5454',
					'exp'   => '05/23',
				],
				'billing_history' => [
					[
						'order'  => '#480',
						'date'   => '2023-06-01',
						'status' => 'failed',
						'amount' => null,
					],
					[
						'order'  => '#445',
						'date'   => '2023-05-01',
						'status' => 'paid',
						'amount' => 5.00,
					],
					[
						'order'  => '#410',
						'date'   => '2023-04-01',
						'status' => 'paid',
						'amount' => 5.00,
					],
				],
			],
			// expiring (Figma 2636:46232) — inline error notice + Renew on
			// the active card. Surfaced via `?v2-demo=expiring`.
			'sub-expiring'       => [
				'id'                    => 'sub-expiring',
				'status'                => 'expiring',
				'product'               => __( 'Member', 'newspack-plugin' ),
				'amount'                => 71.16,
				'frequency'             => 'year',
				'frequency_label'       => __( 'Annually', 'newspack-plugin' ),
				'expires_on'            => '2026-09-16',
				'started'               => '2024-03-16',
				'latest_payment'        => '2025-03-16',
				'next_payment'          => null,
				'subtotal'              => 58.33,
				'vat'                   => 11.67,
				'transaction_fee'       => 1.16,
				'transaction_fee_label' => __( 'Transaction fee (2%)', 'newspack-plugin' ),
				'total'                 => 71.16,
				'fees_covered'          => false,
				'payment_method'        => [
					'brand' => __( 'Visa', 'newspack-plugin' ),
					'last4' => '4242',
					'exp'   => '02/27',
				],
				'billing_history'       => [
					[
						'order'  => '#1200',
						'date'   => '2025-09-04',
						'status' => 'cancelled',
						'amount' => null,
					],
					[
						'order'  => '#854',
						'date'   => '2025-03-16',
						'status' => 'paid',
						'amount' => 71.16,
					],
					[
						'order'  => '#853',
						'date'   => '2024-09-16',
						'status' => 'failed',
						'amount' => 71.16,
					],
					[
						'order'  => '#852',
						'date'   => '2024-03-16',
						'status' => 'processing',
						'amount' => 71.16,
					],
				],
			],
			// renewed (Figma 2636:46204) — visually identical to active.
			// Surfaced via `?v2-demo=renewed`.
			'sub-renewed'        => [
				'id'                    => 'sub-renewed',
				'status'                => 'renewed',
				'current_tier'          => 'tier-patron-yearly',
				'product'               => __( 'Patron', 'newspack-plugin' ),
				'amount'                => 101.70,
				'frequency'             => 'year',
				'frequency_label'       => __( 'Annually', 'newspack-plugin' ),
				'started'               => '2021-02-19',
				'latest_payment'        => '2023-11-02',
				'next_payment'          => '2024-11-02',
				'subtotal'              => 83.33,
				'vat'                   => 16.67,
				'transaction_fee'       => 1.70,
				'transaction_fee_label' => __( 'Transaction fee (2%)', 'newspack-plugin' ),
				'total'                 => 101.70,
				'fees_covered'          => false,
				'payment_method'        => [
					'brand' => __( 'Visa', 'newspack-plugin' ),
					'last4' => '4242',
					'exp'   => '02/24',
				],
				'billing_history'       => [
					[
						'order'  => '#955',
						'date'   => '2023-11-02',
						'status' => 'paid',
						'amount' => 101.70,
					],
					[
						'order'  => '#721',
						'date'   => '2023-01-17',
						'status' => 'cancelled',
						'amount' => null,
					],
					[
						'order'  => '#680',
						'date'   => '2022-02-19',
						'status' => 'paid',
						'amount' => 101.70,
					],
					[
						'order'  => '#102',
						'date'   => '2021-02-19',
						'status' => 'paid',
						'amount' => 101.70,
					],
				],
			],
			// active no-fees (Figma 4351:66807) — fees_covered=true collapses
			// the Amount breakdown to a single Total row. Surfaced via
			// `?v2-demo=no-fees`.
			'sub-active-no-fees' => [
				'id'              => 'sub-active-no-fees',
				'status'          => 'active',
				'current_tier'    => 'tier-member-yearly',
				'product'         => __( 'Member', 'newspack-plugin' ),
				'amount'          => 71.16,
				'frequency'       => 'year',
				'frequency_label' => __( 'Annually', 'newspack-plugin' ),
				'started'         => '2025-03-16',
				'latest_payment'  => '2026-03-16',
				'next_payment'    => '2027-03-16',
				'fees_covered'    => true,
				'payment_method'  => [
					'brand' => __( 'Visa', 'newspack-plugin' ),
					'last4' => '4242',
					'exp'   => '02/27',
				],
				'billing_history' => [
					[
						'order'  => '#854',
						'date'   => '2026-03-16',
						'status' => 'paid',
						'amount' => 71.16,
					],
					[
						'order'  => '#853',
						'date'   => '2025-03-16',
						'status' => 'failed',
						'amount' => 71.16,
					],
					[
						'order'  => '#852',
						'date'   => '2025-03-16',
						'status' => 'processing',
						'amount' => 71.16,
					],
				],
			],
		];
	}

	/**
	 * Subscriptions slice of the fake-data payload. Mirrors the structural
	 * shape of get_fake_donations() so the v2 detail template can branch on
	 * the same primitives — `status`, `fees_covered`, billing-history rows.
	 *
	 * The default arrangement matches Figma init 1 (one active card + one
	 * previous card). Phase 7 scenarios swap which fixture appears in the
	 * `active` slot via `?v2-demo=expiring` / `=renewed` / `=no-fees` /
	 * `=cancelled-sub` (see apply_scenario). All canonical fixtures live in
	 * get_subscription_fixtures().
	 *
	 * @return array
	 */
	private static function get_fake_subscriptions() {
		$pool = self::get_subscription_fixtures();
		return [
			'currency_symbol' => '$',
			'currency_code'   => 'USD',
			// Tier catalogue + billing details powering the Change subscription
			// modal (Figma 2636:46318 / 46331 / 46344 / 46297). Each tier has
			// a stable `id` we can flag as `current_tier` on a subscription
			// row; the modal pre-selects that tier on its matching frequency
			// tab and renders a CURRENT badge next to it.
			'tiers'           => [
				'frequencies' => [
					[
						'id'       => 'year',
						'label'    => __( 'Annually', 'newspack-plugin' ),
						'unit'     => __( 'year', 'newspack-plugin' ),
						'products' => [
							[
								'id'    => 'tier-member-yearly',
								'name'  => __( 'Member', 'newspack-plugin' ),
								'price' => 70.00,
							],
							[
								'id'    => 'tier-patron-yearly',
								'name'  => __( 'Patron', 'newspack-plugin' ),
								'price' => 100.00,
							],
						],
					],
					[
						'id'       => 'month',
						'label'    => __( 'Monthly', 'newspack-plugin' ),
						'unit'     => __( 'month', 'newspack-plugin' ),
						'products' => [
							[
								'id'    => 'tier-member-monthly',
								'name'  => __( 'Member', 'newspack-plugin' ),
								'price' => 6.99,
							],
							[
								'id'    => 'tier-patron-monthly',
								'name'  => __( 'Patron', 'newspack-plugin' ),
								'price' => 9.99,
							],
						],
					],
				],
				// Static billing fixture surfaced on the transaction step
				// (Figma 2636:46297). Match Figma copy verbatim for review.
				'billing'     => [
					'name'  => __( 'John Lewis', 'newspack-plugin' ),
					'lines' => [
						__( '10 Downing Street', 'newspack-plugin' ),
						__( 'London, SW1A 2AA', 'newspack-plugin' ),
						__( 'United Kingdom', 'newspack-plugin' ),
					],
					'email' => 'johnny.lewis@email.com',
				],
			],
			'active'          => [
				$pool['sub-001'],
			],
			'previous'        => [
				$pool['sub-cancelled'],
				$pool['sub-expired'],
			],
		];
	}

	/**
	 * Payment methods slice of the fake-data payload. Two saved cards: one
	 * default Visa (no "Make default" action; mirrors WC core's pattern of
	 * only emitting that action for non-default rows) and one Mastercard.
	 *
	 * Shape mirrors `wc_get_customer_saved_methods_list()`: each row carries
	 * `method.brand` + `method.last4`, an `expires` string in the
	 * Stripe-conventional `MM/YY` format, an `is_default` flag, and an
	 * `actions` map of `key => [name, url]` consumed by the template. The v2
	 * template renders these into the same `<table class="shop_table
	 * account-payment-methods-table">` DOM WC core ships, so any future
	 * stylesheet that targets WC's payment-methods table styles us for free.
	 *
	 * @return array
	 */
	private static function get_fake_payment_methods() {
		return [
			'cc' => [
				[
					'method'     => [
						'brand' => 'Visa',
						'last4' => '4242',
					],
					'expires'    => '02/27',
					'is_default' => true,
					'actions'    => [
						// Order matters: WC core renders actions in array
						// order. `delete` last keeps the destructive action
						// rightmost, matching WC's default rendering.
						'delete' => [
							'name' => __( 'Delete', 'newspack-plugin' ),
							'url'  => '#',
						],
					],
				],
				[
					'method'     => [
						'brand' => 'Mastercard',
						'last4' => '5454',
					],
					'expires'    => '08/28',
					'is_default' => false,
					'actions'    => [
						'default' => [
							'name' => __( 'Make default', 'newspack-plugin' ),
							'url'  => '#',
						],
						'delete'  => [
							'name' => __( 'Delete', 'newspack-plugin' ),
							'url'  => '#',
						],
					],
				],
			],
		];
	}
}
My_Account_UI_V2_Demo::init();

# My Account v2 Prototype — Guide

**Status:** Phase 10 + post-Phase-8 rebuilds (account settings, payment information rebuild, donation detail rebuild, subscriptions list polish, homepage overlay, Reader Account Customization admin)
**Last updated:** 2026-04-30
**Companion docs:** [`my-account-v2-prototype-brief.md`](my-account-v2-prototype-brief.md) (intent + spec) · [`my-account-v2-prototype-devlog.md`](my-account-v2-prototype-devlog.md) (history + cross-phase decision log)
**Figma:** [My Account — i5 (Final)](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-44336)

The brief is the spec. The devlog is the history. **This guide is the map** — read it when you're walking back into the prototype after time away, or picking it up cold for the first time.

---

## 1. Reader's guide — kicking the tyres

### Entry URL

```
/my-account/?my-account-v2-demo=1
```

Logged in as an administrator (`manage_options`). Any other user — non-admin, anonymous, even an admin without the query parameter — sees v1 unchanged. The flag is preserved on every internal nav click, so once you're in the demo you stay in it.

The same flag works on every account-page URL plus the site homepage:

- `/?my-account-v2-demo=1` — Homepage drawer overlay (greeting + sidebar mirror)
- `/my-account/?my-account-v2-demo=1` — Dashboard (v1 — the demo doesn't customise this)
- `/my-account/edit-account/?my-account-v2-demo=1` — Account settings (Phase 9)
- `/my-account/newsletters/?my-account-v2-demo=1`
- `/my-account/donations/?my-account-v2-demo=1`
- `/my-account/donations/<id>/?my-account-v2-demo=1` (e.g. `don-001`, `don-cancelled`, `don-onetime-1`)
- `/my-account/subscriptions/?my-account-v2-demo=1`
- `/my-account/subscriptions/<id>/?my-account-v2-demo=1` (e.g. `sub-001`, `sub-cancelled`, `sub-expired`, `sub-expiring`, `sub-renewed`, `sub-active-no-fees`)
- `/my-account/payment-methods/?my-account-v2-demo=1` — Payment information (sidebar label; URL slug stays `payment-methods`)

**WP-admin companion** (Phase 10 — no `?my-account-v2-demo` flag, lives inside the Audience wizard):

- `/wp-admin/admin.php?page=newspack-audience#/reader-account-customization` — Reader Account Customization tab (Branding, Newsletters, Account & Billing). Pure-demo: local React state, Save is a no-op.

### Scenario index

`?my-account-v2-demo=<scenario>` switches the fake-data fixture. Anything outside the allow-list (typos, `?my-account-v2-demo=1`, no value at all) falls through to the happy path.

| Scenario | What it does | Figma frame |
|---|---|---|
| `1` *(or any unrecognised value)* | Happy path — one active sub, one cancelled donation, two saved cards | Init frames |
| `cancelled-sub` | Active slot becomes a cancelled sub (CANCELLED badge, Renew button) | `2636:46177` |
| `expiring` | Active slot becomes an expiring sub (inline error notice + "renew now") | `2636:46232` |
| `renewed` | Active slot becomes a renewed sub | `2636:46204` |
| `no-fees` | Active slot becomes an active sub with `fees_covered=true` (Amount breakdown collapses) | `4351:66807` |
| `billing-history` | Donations list embeds a billing-history table at the bottom (replaces the Button Card) | `3619:292407` |
| `no-categories` | Newsletters flatten to a single ungrouped 11-row list | `4645:19732` |
| `expired-payment` | Non-default saved card's expiry rewritten to a past date — surfaces an inline `Expired` badge | n/a |
| `empty` | Empties donations + subscriptions + payment methods + addresses at once | n/a |
| `no-donations` | Empty donations slice; everything else stays populated | n/a |
| `no-subscriptions` | Empty subscriptions slice | n/a |
| `no-payment-methods` | Empty payment-methods slice | n/a |
| `no-addresses` | Empty addresses slice (billing + shipping cards render in their empty state) | n/a |

The full Figma node-id index for non-scenario screens is in [brief Appendix A](my-account-v2-prototype-brief.md#appendix-a--figma-screen-index-priority-screens-only).

### Per-flow walkthroughs

**Newsletters** ([`templates/my-account-v2-demo/newsletters.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/newsletters.php) · [`src/my-account-v2-demo/newsletters.js`](../src/my-account-v2-demo/newsletters.js)). Sectioned list (Featured / Technology / Subscriber-only) of newsletter rows. Each row's *Sign up* / *Unsubscribe* button toggles the row's subscribed state in the DOM and fires a snackbar — no fetch, state resets on reload. The bottom *Unsubscribe from all* button cascades the toggle and disables itself once nothing is subscribed. `?my-account-v2-demo=no-categories` flattens the sections.

**Donations** ([`donations.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/donations.php) · [`donation-details.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/donation-details.php) · [`donations.js`](../src/my-account-v2-demo/donations.js)). List has *Active recurring* + *Previous donations* sections. Click a donation card → detail page. Detail page branches on `kind` (`recurring` / `one_time`) + `status` (`active` / `cancelled`) + `fees_covered` — one template, four visual variants. Header buttons / dropdown items open client-side modals: **Modify donation** (recomputes totals as the amount changes — Phase 5 math is approximate; submit fires a snackbar), **Cancel donation** (two-step: confirm → success), **Restart donation** (single-screen, submit fires a snackbar — no success state in Figma).

**Subscriptions** ([`subscriptions.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/subscriptions.php) · [`subscription-details.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/subscription-details.php) · [`subscriptions.js`](../src/my-account-v2-demo/subscriptions.js)). List has one Active card and two Previous cards. Detail template branches on `status` (`active` / `cancelled` / `expiring` / `renewed`) + `fees_covered`. Header offers **Change subscription** (segmented control: frequency tabs + tier cards → transaction step with billing readout + payment form; *Pay now* fires a snackbar and closes), **Cancel subscription** (two-step: confirm → success), and **Renew subscription** on cancelled / expiring (init → success). The expiring variant adds an inline notice with a `renew now` link. **Update payment method** is a snackbar stub — productionisation hooks it to the v1 checkout flow.

**Payment information** ([`payment-methods.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/payment-methods.php) · [`payment-methods.js`](../src/my-account-v2-demo/payment-methods.js)). Originally Phase 6 reproduced WC core's table DOM; mid-prototype the call reversed and the page was rebuilt onto v1's card-based `payment-information.php` shell — `<section id="payment-methods">` (a grid of `__box --border` cards) plus `<section id="addresses">` (billing + shipping cards). Each card has a More dropdown with **Edit** + **Delete** modal triggers. The trailing **Add payment method** button opens a singleton modal. Default badge sits inside the default-card's `__box__badges`; `?my-account-v2-demo=expired-payment` adds an Expired badge to the non-default card. Every modal Confirm fires a slug-keyed snackbar and closes.

**Account settings** (Phase 9 — [`edit-account.php`](../includes/plugins/woocommerce/my-account/templates/my-account-v2-demo/edit-account.php) · [`edit-account.js`](../src/my-account-v2-demo/edit-account.js)). Hooked via `wc_get_template` priority 2 (so the demo lands after v1's priority-1 swap). DOM is reused verbatim from v1 (`<form class="woocommerce-EditAccountForm">`, the `account-profile` / `account-password` / `delete-account` section ids, v1's input + button classes) so v1's existing SCSS does the heavy lifting. Form submits are stateless: `Save` fires `Profile updated.` / `Password updated.` snackbars and returns. The **Delete account** button opens a two-step modal: step 1 is "Are you sure?" + a three-row "Manage my…" alternative-actions list (Donations / Subscriptions / Newsletters, each with a Manage button preserving the demo flag); step 2 flips to a "check inbox" success state with the reader's email echoed back. Reset-on-close listens for the `closeModal` event newspack-ui's `modals.js` dispatches.

**Reader Account Customization admin** (Phase 10 — [`reader-account-customization.js`](../src/wizards/audience/views/setup/reader-account-customization.js) · [`reader-account-customization.scss`](../src/wizards/audience/views/setup/reader-account-customization.scss)). New tab in the Audience wizard, between Configuration and Checkout & Payment. Pure-demo: local React `useState`, no REST roundtrip, Save button is a no-op. Three two-column sections (`<Grid columns={2} gutter={32} noMargin>` + `<SectionHeader heading={2} noMargin>` left, `<VStack spacing={8}>` of controls right, `<Divider alignment="full-width" variant="tertiary">` between sections) — Branding (logo upload), Newsletters (page title + description), Account & Billing (Terminology toggle with `Custom` revealing stacked singular + plural inputs, plus cancel-recurring-donation message and billing/invoice footer). The single scoped SCSS rule in `reader-account-customization.scss` zeroes legacy `.components-base-control` margins so VStack `spacing={8}` is the only source of vertical rhythm. **The brief's §2.1 / §2.1.1 reflexes don't apply on this surface** — admin React pages compose from `@wordpress/components` first, `packages/components/src` second, custom SCSS last.

---

## 2. Architectural map for agents

> "I just walked into this codebase — where do I start?" Read [§2.1.1 of the brief](my-account-v2-prototype-brief.md#211--the-other-non-negotiable-rule-reuse-v1s-class-names) before this section: every reflex below assumes "v1 class names first, newspack-ui composition second, custom SCSS only after a devlog entry."

### File layout

```
includes/plugins/woocommerce/my-account/
├── class-my-account-v2-demo.php          # the whole reader-facing demo lives here
└── templates/my-account-v2-demo/
    ├── newsletters.php                       # list + bulk unsubscribe
    ├── donations.php                         # list (recurring + one-time + Button Card | inline billing history)
    ├── donation-details.php                  # 4-variant branching: kind × status × fees_covered (rebuilt onto v1 class names post-Phase 8)
    ├── subscriptions.php                     # list (active + previous)
    ├── subscription-details.php              # 6-variant branching: status × fees_covered (active / cancelled / expired / expiring / renewed / no-fees)
    ├── payment-methods.php                   # card-based payment-information shell (rebuilt post-Phase 8 from WC core table → v1's card DOM)
    ├── edit-account.php                      # Phase 9 — account settings (profile + password + delete)
    └── partials/
        ├── newsletters-row.php
        ├── cancel-donation-modal.php
        ├── modify-donation-modal.php
        ├── restart-donation-modal.php
        ├── cancel-subscription-modal.php
        ├── change-subscription-modal.php     # two-step: select → transaction
        ├── renew-subscription-modal.php      # two-step: init → success
        ├── add-payment-method-modal.php      # singleton (Phase 6 rebuild)
        ├── edit-payment-method-modal.php     # per-card (Phase 6 rebuild)
        ├── delete-payment-method-modal.php   # per-card (Phase 6 rebuild)
        ├── edit-address-modal.php            # per-type, title swaps on populated/empty (Phase 6 rebuild)
        ├── delete-address-modal.php          # per-type (Phase 6 rebuild)
        └── delete-account-modal.php          # two-step: init → check-inbox (Phase 9)

src/my-account-v2-demo/
├── index.js                                  # webpack entry — public-path + style + per-screen modules
├── style.scss                                # near-empty wrapper plus the small handful of scoped rules each documented in the devlog
├── newsletters.js / donations.js / subscriptions.js / payment-methods.js / edit-account.js
└── util/snackbar.js                          # shared transient-toast helper (extracted Phase 5 rule-of-three)

src/my-account-v2-demo-homepage/             # Homepage drawer overlay (post-Phase-8 addition)
├── index.js                                  # auto-opening right-side drawer + greeting + sidebar mirror
└── style.scss                                # ~80 lines — first JS-driven non-modal overlay in the prototype

src/wizards/audience/views/setup/            # Phase 10 — WP-admin companion
├── reader-account-customization.js           # tab view (pure-demo React state, no REST)
├── reader-account-customization.scss         # one scoped rule: zeroes .components-base-control margins
└── index.js                                  # 3-line edit registers the tab + route between Configuration and Checkout & Payment
```

Webpack entries: `'my-account-v2-demo'` and `'my-account-v2-demo-homepage'` in [`webpack.config.js`](../webpack.config.js). The Phase 10 admin tab piggy-backs on the existing Audience wizard entry — no new webpack entry.

### Fake-data shape (single source of truth)

`My_Account_V2_Demo::get_fake_data()` returns an associative array; `wp_localize_script` ships it to `window.newspackMyAccountV2Demo` and templates receive it via `load_template(..., [ 'data' => self::get_fake_data() ])`.

Top-level slices:

- `reader` — `display_name`, `email` (auto-pulled from `wp_get_current_user()`).
- `newsletters` — `sections[].lists[]` (per-row `id`, `name`, `description`, `frequency`, `subscriber_only`, `subscribed`); `unsubscribe_from_all`.
- `donations` — `recurring[]`, `one_time[]`, `currency_symbol`, `currency_code`, `billing_history_inline` (bool), `billing_history_button` (`enabled` + copy). Each donation row carries its own `billing_history` array (per-donation table on the detail page).
- `subscriptions` — `active[]`, `previous[]`, `tiers` (`frequencies[]` + a static `billing` fixture for transaction modals), `currency_*`. Subscription rows are sourced from `get_subscription_fixtures()` — an **id → row pool** that scenarios pluck from (`sub-001`, `sub-cancelled`, `sub-expired`, `sub-expiring`, `sub-renewed`, `sub-active-no-fees`).
- `payment_methods.cc[]` — `method.brand`, `method.last4`, `expires` (`MM/YY`), `is_default`, `actions` (key → `[ name, url ]` map). Mirrors `wc_get_customer_saved_methods_list()`.
- `addresses` — `billing` + `shipping` (each `null` when unset, otherwise an object with first/last name, address fields, and the standard WC customer address shape). Built by `get_fake_addresses()`, sourcing first/last names from `wp_get_current_user()` with sensible fallbacks. Powers the Phase 6 rebuild's `<section id="addresses">` cards + the Edit/Add and Delete address modals.

### Takeover / redirect / menu plumbing (priorities matter)

| Hook | Priority | Callback | Why |
|---|---|---|---|
| `template_redirect` | 8 | `takeover_subscriptions_endpoint` | `remove_all_actions('woocommerce_account_subscriptions_endpoint')` on demo requests — drops WCS's `WCS_Query::endpoint_content` (10) + `WooCommerce_My_Account::append_membership_table` (11) in one move, then re-adds our renderer |
| `template_redirect` | 8 | `takeover_payment_methods_endpoint` | Same shape — drops WC core's `woocommerce_account_payment_methods` callback so v1's `wc_get_template` swap (which it would have called) never fires. Re-adds our card-based renderer (rebuilt post-Phase 8 onto v1's `payment-information.php` shape) |
| `template_redirect` | 8 | `takeover_newsletters_endpoint` | Same shape — drops `Newspack_Newsletters_Subscription::endpoint_content` (priority 10) so the "verify your email" warning that newspack-newsletters prepends to the v1 form doesn't land on top of our v2 list |
| `template_redirect` | 9 | `redirect_non_demo_v2_endpoints` | Bounces non-demo guessers off `/newsletters/`, `/donations/`, and `/subscriptions/` (the last only when WCS isn't installed). Runs *after* takeovers so a non-demo user can't take over anything they then redirect away from |
| `wc_get_template` | 2 | swap of `myaccount/form-edit-account.php` (Phase 9) | Returns the v2-demo `edit-account.php` path when the demo is active. Priority 2 lands after v1's priority-1 swap of the same template, so v1 stays untouched on non-demo `/edit-account/` |
| `woocommerce_account_menu_items` | 1100 | `menu_items` | Inserts Newsletters / Donations / Subscriptions / Payment information after `edit-account`. v1 runs at 1001, so this layers on top. "Payment methods" → "Payment information" relabel happens here too (slug stays `payment-methods`) |
| `woocommerce_get_endpoint_url` | 10 | `preserve_demo_flag_on_endpoint_url` | Re-appends the *original* flag value (e.g. `?my-account-v2-demo=cancelled-sub`) to every internal endpoint URL — sidebar, post-login redirect, the WC redirect-to-account-details bounce |
| `wp_footer` | 100 | `render_homepage_drawer` | Renders the homepage right-side drawer overlay markup when the same `?my-account-v2-demo` flag is present on a non-`/my-account/` URL. Body-class scope is its own (`newspack-my-account--my-account-v2-demo-homepage`) so styles don't leak |

Endpoint registration (`add_rewrite_endpoint` for `newsletters`, `donations`, `subscriptions`, all `EP_PAGES`) is called **directly from `init()`**, not through `add_action('init', …)`. The class is itself loaded inside an `init` callback, so a deferred action would register too late. `add_rewrite_endpoint` is idempotent — re-registering `subscriptions` on a WCS-installed site is a no-op.

### Modal-router pattern

Triggers in templates carry `data-action="<slug>"` + a `data-subscription-id` / `data-donation-id`. The detail-page click handler routes through a slug map:

```js
function tryOpenModal( action, id, root ) {
    const slug = { 'change-subscription': 'change-subscription', /* … */ }[ action ];
    if ( ! slug || ! id ) return false;
    const modal = document.getElementById( `newspack-my-account__${ slug }-${ id }` );
    if ( ! modal ) return false;
    modal.setAttribute( 'data-state', 'open' );
    return true;
}
```

Modal id convention: `newspack-my-account__<flow-slug>-<resource-id>` (e.g. `#newspack-my-account__cancel-donation-don-001`). One modal instance per resource, rendered after the detail-page wrap closes so internal clicks don't bubble through. Two-step confirm/renew-style modals (`cancel-donation`, `cancel-subscription`, `renew-subscription`) keep `data-step="init"` and `data-step="success"` divs in the same container and toggle `hidden` between them; the **Change subscription** modal instead uses `data-step="select"` and `data-step="transaction"`. The `closeModal` event newspack-ui's [`modals.js`](../src/newspack-ui/js/modals.js) dispatches resets each modal back to its own initial step. Per-modal config rides on `data-*` attributes on the container (`data-unit-labels`, `data-vat-rate`, `data-currency-symbol`, …) — cheaper than a separate `wp_localize_script` pass.

Actions with no modal fall through to `fallbackSnackbar(action)` — today only `update-payment-method` (subs) and the payment-methods action set.

### v1-class-names-first reflex (one-screen index)

This is brief [§2.1.1](my-account-v2-prototype-brief.md#211--the-other-non-negotiable-rule-reuse-v1s-class-names), restated for finger-pointing. When rebuilding a v2 surface, **copy v1's DOM verbatim before reaching for utility classes** — the my-account-v2-demo body class chain inherits every v1 SCSS rule for free.

| Surface | Reuse from |
|---|---|
| Subscription detail header (back chevron, title, badge, action buttons, More dropdown) | `templates/v1/subscription-header.php` — `.newspack-my-account__subscription--header / --title / --back-link / --actions / --actions-container / --actions-dropdown` |
| Subscription kv pairs (Status / dates / Payment) | WCS — `<table class="shop_table subscription_details">` |
| Subscription totals / Amount breakdown | WCS — `<table class="shop_table order_details">` with `tr.order-total` |
| Billing history / related orders | WCS — `<table class="shop_table shop_table_responsive my_account_orders woocommerce-orders-table woocommerce-orders-table--orders">` |
| Status dot in a table | `.newspack-my-account__subscription--order-status-label.<status>` |
| Tier picker (segmented control + tier cards + Current badge) | `class-subscriptions-tiers.php::render_form` / `render_product_card` — `.newspack-ui__segmented-control` + `.newspack-ui__input-card.current` + `<strong>` + `.newspack-ui__helper-text` |
| Modal frame | `Newspack_UI::generate_modal()` — `.newspack-ui__modal-container` + `__modal__header` + `__modal__content`. **Don't use `__modal__footer` for action buttons** — its `neutral-5` background reads wrong |
| Checkout fields (billing readout + payment radios + card form) | `newspack-blocks` `modal-checkout/templates/form-checkout.php` — `wc_payment_methods payment_methods methods`, `payment_box payment_method_stripe`, `form-row form-row-first/last/wide`, `woocommerce-customer-details` |

### Reserved-globals trap

PHPCS rejects these as template-local variable names because WP uses them as globals: **`$id`, `$status`, `$title`, `$type`, `$frequency`, `$action`**. Always entity-prefix: `$donation_id`, `$subscription_status`, `$header_title`, `$payment_method_id`, `$action_data`. Six iterations across Phases 2–6 make the reflex solid; future templates should skip the round-trip.

### Auto-flush plumbing

`ENDPOINTS_VERSION` (currently `7`) bumps every phase that touches endpoint plumbing. The first admin to visit `/my-account/` after a deploy compares it against the `newspack_my_account_v2_demo_endpoints_version` option and runs `flush_rewrite_rules()` exactly once per environment. **Caveat:** the guard isn't atomic against PHP opcache — on dev/staging, the first request after a bump may serve stale code that doesn't register the new endpoints before the flush. Workaround:

```bash
n wp eval 'opcache_reset();'
n wp option delete newspack_my_account_v2_demo_endpoints_version
n wp rewrite flush
```

Production deploys clear opcache, so this only bites in dev.

### Scenario merge flow

1. `get_scenario()` reads `$_GET['my-account-v2-demo']`, sanitises, returns the value iff it's in `SCENARIOS` — anything else (typos, malicious values, `1`) returns `''`.
2. `get_fake_data()` builds the base fixture, then short-circuits if the scenario is empty or hands off to `apply_scenario($base, $scenario)`.
3. `apply_scenario()` is a single switch dispatcher. Each case is a small mutation:
   - **Pluck-from-pool** (subscription state swaps) — `$pool = self::get_subscription_fixtures(); $data['subscriptions']['active'] = [ $pool['sub-expiring'] ];`
   - **Flag flip** (`billing-history`, `no-categories`, `expired-payment`) — toggles a value or rewrites a field.
   - **Empty helper** (`empty`, `no-*`) — calls `empty_donations()` / `empty_subscriptions()` / `empty_payment_methods()`, which preserve currency + tier scaffolding so iterating templates don't hit undefined-index notices.

Adding a scenario is a one-liner: append to `SCENARIOS`, add a `case` to `apply_scenario`, optionally add a fixture id to `get_subscription_fixtures()`.

---

## 3. Productionisation playbook

The to-do list for when the prototype rolls into v1 (folds the demo into the production `My_Account_UI_V1` surface and drops the gate). Each item links to the cross-phase decision row that explains *why* the prototype shape is what it is, so a productionising engineer can decide what to keep or change.

### Replace fake-data slices with real sources

`get_fake_data()` is the single seam — every template and JS module reads through it. Swap the slice-builders one at a time:

- **`reader`** — already pulls from `wp_get_current_user()`; nothing to do.
- **`newsletters`** — from the real Newspack Newsletters / ESP integration. Fixture shape (`sections[].lists[]`) is close to what the existing newsletter-subscription-list helpers emit, but verify per-row keys against the production data.
- **`donations`** — from `WC_Order` + `WC_Subscription` queries. The brief's `recurring` / `one_time` split maps to subscription products vs. simple-product orders. Per-donation `billing_history` comes from the related-orders helper.
- **`subscriptions`** — from `wcs_get_users_subscriptions()`. The `tiers` catalogue + billing fixture currently power the Change modal (devlog Phase 4 / Phase 5 entries) — productionised tiers come from the existing `Subscriptions_Tiers` helper.
- **`payment_methods`** — from `wc_get_customer_saved_methods_list()`. Fixture mirrors that shape already.
- **`addresses`** — from `WC_Customer::get_billing()` / `get_shipping()` (or `wc_get_account_formatted_address()` for the rendered form). Fixture mirrors v1's `payment-information.php` shape.

### Wire real Stripe on the modal forms

All Phase 5 modal submissions are client-side stubs — they fire a snackbar and close. Productionisation:

- **Change subscription** (transaction step) — real WC cart math + `WC_Subscriptions::switch` flow (see Phase 4 devlog row on `Subscriptions_Tiers::render_modal` — instructive but not directly reusable).
- **Renew subscription** (transaction step) — real WCS resubscribe flow.
- **Modify donation** — real cart math (currently approximate; see Phase 5 open question on totals precision).
- **Restart donation** — real subscription-restart flow.
- **Update payment method / Add payment method** — both currently stub snackbars (Phase 6 rebuild added the modals; submits stay client-side). The brief (§3) lumps them with the v1 checkout flow; productionisation routes them to the existing newspack-blocks `modal-checkout` form-change-payment-method template.
- **Edit / Delete payment method, Edit/Add / Delete address** — Phase 6 rebuild modals. Productionisation hooks them to v1's existing `Newspack_UI::generate_modal()` handlers (already implemented in `class-my-account-ui-v1.php` against real `wc_get_customer_saved_methods_list()` data + WC nonces).
- **Account settings forms (Phase 9)** — Profile + Password submits and the Forgot-password link are stateless snackbars; the Delete account modal's Confirm button is a snackbar too. Productionisation re-attaches the WC handlers (`save_account_details` action) and removes the JS submit listener; Delete account wires to the real WC nonce-bounce flow (or whatever the design team picks now that we have the two-step modal as a reference).

### Scrub the takeover sledgehammers

`takeover_subscriptions_endpoint`, `takeover_payment_methods_endpoint`, and `takeover_newsletters_endpoint` all use `remove_all_actions()` — they drop *every* handler on the action, including any third-party hook. That's fine for a prototype demoed by admins, not for production. Replace with handler-name-keyed removals:

```php
remove_action( 'woocommerce_account_subscriptions_endpoint', [ \WCS_Query::class, 'endpoint_content' ], 10 );
remove_action( 'woocommerce_account_subscriptions_endpoint', [ \Newspack\WooCommerce_My_Account::class, 'append_membership_table' ], 11 );
```

See cross-phase decision log rows for Phase 4 (subscriptions takeover), Phase 6 (payment-methods takeover), and the Newsletters polish row dated 2026-04-30 (newsletters takeover).

### Drop the `?my-account-v2-demo` gate

- Remove `is_demo_active()` short-circuits across every callback in the class.
- Remove the `query_vars` filter entry for `my-account-v2-demo`.
- Remove `preserve_demo_flag_on_endpoint_url`.
- Remove the `newspack-my-account--my-account-v2-demo` body-class scope in [`style.scss`](../src/my-account-v2-demo/style.scss). The wrapper is currently load-bearing — it scopes the small handful of scoped rules each documented inline — but if those rules fold cleanly into v1's `_my-account.scss`, the wrapper goes too.
- Remove the `is_homepage_demo_active()` gate on the homepage drawer + `wp_footer` priority 100 hook. The drawer becomes either always-on (productionised as the new logged-in masthead "My Account" affordance) or wired off a real toggle.

### Remove the auto-flush plumbing

- Delete the `newspack_my_account_v2_demo_endpoints_version` option (`wp option delete …`).
- Re-flush rewrite rules so any v2-only endpoints not retained in production are dropped from the rules table.
- Remove the `ENDPOINTS_VERSION` constant + the guard in `register_endpoints()`.

### Menu-item filter cleanup

`menu_items()` is gated on `is_demo_active()`. Productionised v1 should either always show the new items or gate them on Reader Activation (the same gate v1 already uses) — drop the demo conditional and decide. Also: the relabel from "Payment methods" to "Payment information" (Phase 6 rebuild) lives inside this same filter — keep or revert based on the productionisation copy decision.

### Productionise the WP-admin companion (Phase 10)

`src/wizards/audience/views/setup/reader-account-customization.js` is pure-demo state today. Productionisation:

- **Real persistence layer.** Each control needs a real settings key. Branding's logo upload has precedent in `theme-and-brand/header.tsx` (uses the WP customizer's `custom_logo` theme mod); Newsletters' page title/description likely live as `wp_options`; Account & Billing's terminology + cancel-message + billing-footer fit naturally as `newspack_my_account_v2_*` options under the existing `Audience_Wizard` REST namespace. Open whether to ship as one flat slice or split per section. See the Phase 10 cross-phase decision-log row.
- **Wire the Custom terminology through to v2 templates.** The singular/plural inputs are local-only state today. Productionisation replaces the hardcoded "Subscription" copy across `subscription-details.php`, `subscriptions.php`, the Change/Cancel/Renew modals, etc. with whatever terminology the publisher set.
- **Pluralisation rules.** Two text inputs (singular + plural) handle simple cases (Patronage / Patronages) but not all languages have a 1:1 singular→plural mapping. Productionisation should consider whether to expose a third "many" form for languages with three plural categories, or accept the simplification.
- **Drop the scoped `__nextHasNoMarginBottom` workaround.** The single SCSS rule in `reader-account-customization.scss` zeroes `.components-base-control` margins because the WP `__nextHasNoMarginBottom` opt-in lands inconsistently across control types. If WP eventually flips the new behaviour to default, the scoped rule can come out.

### Deferred design-system work (separate PRs)

- **CANCELLED / EXPIRED badge saturation.** Phase 3 carryover, applies to Phase 4's expired variant too. `__badge--error` is lighter than Figma; the right fix is a `__badge--error-strong` (or similarly named) addition to [`src/newspack-ui/scss/elements/misc/_badge.scss`](../src/newspack-ui/scss/elements/misc/_badge.scss). Touches the shared design system → separate PR with design sign-off.
- **Detail-page kv-table density.** `order_details` + `subscription_details` cell padding renders ~56px row height vs Figma's ~32px row pitch. Shared by donation + subscription detail pages; deferred to a cross-page review pass rather than touching freshly-merged work.
- **`__separator` primitive promotion.** Subscriptions list polish introduced `.newspack-my-account-v2-demo__separator` (a `1px × 1em` vertical hairline) as a prototype-local addition because newspack-ui's `<hr>` is horizontal-only. If a third caller appears in v1 it should graduate to `_dividers.scss` proper.

### Final cleanup checklist

- [ ] `get_fake_data()` and its sub-builders deleted (or kept behind a `WP_DEBUG`-style flag, with caveats).
- [ ] `SCENARIOS` constant + `get_scenario()` + `apply_scenario()` + `get_subscription_fixtures()` + `empty_*()` helpers + `get_fake_addresses()` deleted.
- [ ] All scenario doc-links from this guide marked stale (or this guide retired entirely).
- [ ] `dist/my-account-v2-demo.*` and `dist/my-account-v2-demo-homepage.*` no longer enqueued; webpack entries removed from [`webpack.config.js`](../webpack.config.js).
- [ ] Templates folded into v1's template-override shape (or kept as-is and re-pointed).
- [ ] `src/wizards/audience/views/setup/reader-account-customization.{js,scss}` either folded into a real Audience wizard tab (with REST persistence) or deleted.
- [ ] `composer dump-autoload` run after class-file removals.

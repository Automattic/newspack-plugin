# My Account v2 Prototype — Design / Dev Brief

**Status:** Draft for review
**Author:** thomas@a8c.com
**Last updated:** 2026-04-28
**Figma:** [My Account — i5 (Final)](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-44336)

---

## 1. Goal

Stand up a clickable prototype of the "My Account v2" experience inside `newspack-plugin`, gated to admins via a `?v2-demo` query parameter on the WooCommerce `/my-account/` URL. The prototype must be:

- **In-repo and testable** on any Newspack site (no separate sandbox).
- **Built exclusively from existing Newspack UI primitives** (`/src/newspack-ui/`) and its utility classes — no bespoke CSS or one-off React components. New components only as a last resort, and only as additions to `newspack-ui` itself.
- **Fed by fake/static data** — no real WooCommerce, WC Subscriptions, or ESP queries. The demo can render for admins on any site, even one with no donations or subscriptions configured.
- **Strictly scoped** — never visible to non-admin users, never altering production behaviour, never leaking styles outside the demo body class.

Out of scope: production wiring, real ESP integration, real Stripe/payment flows, mobile-first polish (mobile is in Figma but secondary; desktop is the priority for the prototype).

## 2. Before you start (junior dev primer)

This section exists for devs new to WordPress, WooCommerce, or the Newspack codebase. Skip it if you've already shipped a Newspack feature.

### 2.1 — The non-negotiable rule: newspack-ui only

**Build everything with existing Newspack UI components and utility classes. No custom CSS.** This is the whole point of the prototype — proving the design can be assembled from primitives we already ship.

If you find yourself about to write a fresh CSS rule, stop and check three places first: the [Newspack UI utility class reference](../src/newspack-ui/UTILITY_CLASSES.md), the existing class names in `src/newspack-ui/scss/elements/`, and the live demo at any URL with `?ui-demo` appended (an admin-only gallery of every component on display). If a genuine gap exists, raise it as an addition to `src/newspack-ui/` itself — not a one-off rule inside the prototype's SCSS. Document the gap in the devlog (see §11) before you write the workaround.

The demo's SCSS file (`src/my-account/v2-demo/style.scss`) should stay nearly empty. Most of it is just the scoping wrapper:

```scss
.newspack-my-account--v2-demo {
    // If you're writing rules in here, pause and re-read §2.1.
}
```

If at any point your `style.scss` has more than a handful of lines, treat that as a smell and ask in PR review.

### 2.2 — WordPress hooks in 30 seconds

WordPress runs hundreds of named events ("hooks") during every request. Code subscribes to a hook and runs at that moment. Two flavours: *actions* (do something — e.g., `wp_enqueue_scripts`) and *filters* (transform a value — e.g., `body_class` filter takes the array of CSS classes for the `<body>` element and returns a modified array). You attach with `add_action( 'hook_name', $callback )` or `add_filter( 'hook_name', $callback )`. That's the whole model.

### 2.3 — The hooks we'll actually use

- `wc_get_template` (filter) — WooCommerce's template-override hook. When WC asks for `myaccount/dashboard.php`, our filter can return a different file path. This is how v1 swaps in its own templates and how v2 will too.
- `woocommerce_account_content` (action) — fires inside the `[woocommerce_my_account]` shortcode body. Use this (not `the_content`) for any "inject content into the My Account page" trick. v1's custom page template renders the account area via the shortcode and never calls `the_content()`, so the `the_content` filter doesn't fire here.
- `body_class` (filter) — modify the `<body class>` array. We add `newspack-my-account--v2-demo` so SCSS scoping works.
- `woocommerce_account_menu_items` (filter) — modify the sidebar nav items. v1 already filters this at priority 1001; we run later (1100) so we can rename items only when the demo flag is set.
- `query_vars` (filter) — tell WordPress that `v2-demo` is a recognized URL parameter so it isn't stripped during URL parsing.
- `wp_enqueue_scripts` (action) — register a CSS/JS bundle for a page.
- `wp_localize_script` (function) — pass a PHP array to the browser as a JS global like `window.newspackMyAccountV2Demo = {...}`. This is how the fake data reaches the JS layer.
- `add_rewrite_endpoint` + `flush_rewrite_rules` — register `/my-account/donations/` as a real URL. Endpoints have to be flushed once after registration; otherwise WordPress returns 404 for the new URL.
- `is_account_page()` — WooCommerce helper, returns `true` if the current request is anywhere under `/my-account/`. We gate every hook on this.

### 2.4 — Newspack class init pattern

Most Newspack PHP classes live in `includes/`, declare `namespace Newspack;`, and end with a one-liner that calls `init()`. The class does nothing until `init()` runs and registers its hooks.

```php
namespace Newspack;

final class My_Feature {
    public static function init() {
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue' ] );
    }
    public static function enqueue() {
        // ...
    }
}
My_Feature::init();
```

### 2.5 — Two foot-guns to know about

**`composer dump-autoload`.** When you add a new PHP class file, the autoloader doesn't know about it until you run this command. If your class works "everywhere except after a deploy", you forgot it.

**`src/shared/js/public-path.js`.** Every standalone webpack entry must `import` this file as its very first line. It tells webpack where to load lazy-loaded chunks from at runtime. Skip it and the bundle compiles fine but breaks in the browser with cryptic 404s on chunked assets.

### 2.6 — Newspack UI requires the `.newspack-ui` body wrapper

All Newspack UI styles are scoped under an ancestor with class `newspack-ui`. v1 already adds it to the body class on `/my-account/`, so we inherit it for free. If you ever build a Newspack UI page outside My Account, add the wrapper class yourself — otherwise none of the styles apply.

### 2.7 — Tooling: Figma MCP

The design source of truth is here:

- **File:** [My Account — i5 (Final)](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-44336&t=WMJl9b81CENbehe7-1)
- **MCP file key:** `mkvHE3qozmmGrytPt9RGrV`

If your Claude/Cursor/etc. workspace has the Figma MCP server enabled, you can pull live design context for any frame instead of guessing from a static screenshot. The available tools are `get_design_context` (returns reference code, screenshot, and visible text), `get_screenshot`, `get_metadata`, and `get_variable_defs`.

Important: the MCP integration is bound to the **Figma desktop app** — you must have Figma open and the frame *selected* in the canvas before the tools can return useful per-frame data. Bulk metadata works without selection but only includes structural information (frame names, sizes, hierarchy), not visible text or copy.

Recommended workflow per screen:

1. Open the Figma file in the desktop app.
2. Select the specific frame you're implementing (its node ID is in Appendix A).
3. From your editor/agent, call `get_design_context` for that frame.
4. Implement the screen using newspack-ui (per §2.1) and the Figma reference for copy and structure only.

Don't paste Figma reference code verbatim — it's a generic React/HTML approximation, not Newspack UI markup. Use it to confirm copy and layout, then re-build with our components.

### 2.8 — Files to read first (~60 minutes well spent)

- [`includes/class-newspack-ui.php`](../includes/class-newspack-ui.php) — see `init()` and `load_demo()`. The simplest example of an admin-gated demo.
- [`includes/plugins/woocommerce/my-account/class-my-account-ui-v1.php`](../includes/plugins/woocommerce/my-account/class-my-account-ui-v1.php) — the closest analog to what you'll build. Pay attention to `init()`, `page_template()`, `add_body_class()`, `enqueue_assets()`, and the `wc_get_template` filter.
- [`includes/plugins/woocommerce/my-account/templates/v1/`](../includes/plugins/woocommerce/my-account/templates/v1/) — open `navigation.php` and `my-account.php` to see the layout shell we're reusing.
- [`src/newspack-ui/UTILITY_CLASSES.md`](../src/newspack-ui/UTILITY_CLASSES.md) — utility class reference. **Read this twice.** Stack is the layout primitive; everything else builds on it.
- The `?ui-demo` gallery — log in as admin and visit any page with `?ui-demo` appended. Bookmark it. Refer to it whenever you're not sure which class to use.
- [`webpack.config.js`](../webpack.config.js) — search for `my-account` to see the entries you'll be adding alongside.
- Root [`newspack-workspace/AGENTS.md`](../../AGENTS.md) — Docker setup, the `n` script.
- This repo's [`AGENTS.md`](../AGENTS.md) — namespace map, lint commands, common gotchas.

### 2.9 — Local setup checklist

Before writing any code: clone the repo via `n`, install deps (`npm install` and `composer install`), boot a local site via Docker, log into wp-admin as an administrator, and confirm you can visit `/my-account/` and see the v1 layout. Then visit `/?ui-demo` on any page and confirm the component gallery renders. If either fails, fix that first — there's no shortcut.

---

## 3. Scope of screens

Three priority surfaces, each with several variant states. Everything else (account settings, delete account, signed-out, email-unverified) is **reused from v1 as-is** for the prototype.

**Newsletters** (Figma section `2636:46703`)

The v1 surface today is a thin form repurposed from the WooCommerce edit-account page. v2 promotes it to a first-class endpoint with grouped lists.

- `Newsletters list w/ sections` — categories (e.g. Featured / Premium / Tech), each a section with its own list of newsletter rows and per-row subscribe state.
- `Newsletters list w/o categories` — flat list variant for sites without categories.
- `Newsletters list w/ sections — Unsubscribed` — confirmation toast state after unsubscribing from one newsletter.

**Row anatomy.** Each newsletter row has a square *thumbnail* (a full image, not an icon — fake data should use `https://picsum.photos/seed/{slug}/128/128` so every row gets a stable but distinct image), a name, a *frequency badge* (display labels: `Daily`, `Weekly`, `Monthly`, `Twice weekly`, `As needed`, plus free-text fallbacks like "3 times a week"), an optional `SUBSCRIBER-ONLY` badge, a one-line description, and a `Sign up` or `Unsubscribe` button. Categories in the w/sections variant are *always-expanded visual labels, not collapsible accordions*. The bottom of the list has a separate "Unsubscribe from all" row with its own button.

**Donations** (Figma section `2636:46466`)

There is no dedicated v1 donations surface today. Donations piggy-back on the WooCommerce Subscriptions endpoint or order history. v2 introduces a first-class endpoint.

- `Donations (init)` — list view, splits into "recurring" and "previous" sections.
- `Donations details — recurring (active)`.
- `Donations details — recurring (cancelled)`.
- `Donations details — one-time`.
- `Donations details — new payment method` (variant after a successful payment-method update).
- `Donations w/ billing history` — list with an embedded billing-history table.
- Modals: `Modify donation`, `Cancel donation – Init`, `Cancel donation – Success`, `Restart monthly donation`.

**Subscriptions** (Figma section `2636:46116`)

v1 already extends the WooCommerce Subscriptions endpoint, but the design is being substantially upgraded.

- `Subscriptions (init)` and `Subscriptions (init 2)` — list with active and previous sections.
- Detail variants: `active`, `active (no fees)`, `cancelled`, `expiring`, `renewed`.
- Modals: `Cancel subscription – Init/Success`, `Renew subscription` and its `Success`, `Change subscription – Init / Monthly selected / Plan selected / Transaction modal`.

Reused from v1 unchanged: account-page page template, sidebar/menu, account settings, delete-account flow, signed-out state.

## 4. The `?v2-demo` mechanism

The model is **`?ui-demo`** as implemented in `includes/class-newspack-ui.php`. That class hooks `the_content` and, if `isset( $_REQUEST['ui-demo'] )` and `current_user_can( 'manage_options' )`, appends a long inline demo to the rendered content. v2 follows the same shape but operates earlier in the pipeline because My Account uses a custom page template, not `the_content`.

A new class `Newspack\My_Account_UI_V2_Demo` lives at `includes/plugins/woocommerce/my-account/class-my-account-ui-v2-demo.php`. It:

1. **Gates everything on `is_account_page() && is_user_logged_in() && current_user_can( 'manage_options' ) && isset( $_GET['v2-demo'] )`.** A single private static helper `is_demo_active()` returns the boolean; every other hook short-circuits when it returns false. No-op for everyone else.
2. **Adds a body class `newspack-my-account--v2-demo`** via `body_class`. All v2 SCSS is nested under this selector so demo styles cannot leak.
3. **Swaps templates** via `wc_get_template` (the same hook v1 uses) for the dashboard, newsletters, donations, and subscriptions endpoints — pointing them at v2 templates under `includes/plugins/woocommerce/my-account/templates/v2-demo/`.
4. **Forces v1's account-page page template** to remain in effect (no header/footer chrome) — v1's `My_Account_UI_V1::page_template()` already does this for any logged-in account page, so we inherit it for free.
5. **Enqueues a single new bundle** `newspack-my-account-v2-demo` (CSS + JS, see §6). Existing `newspack-ui` script + style is already enqueued globally by `Newspack_UI`, so we get all of newspack-ui for free without touching the enqueue list.
6. **Registers a fake-data provider** keyed by the WP user id (so the demo state is per-admin and per-session, not global). Fake data is exposed to JS via `wp_localize_script( 'newspack-my-account-v2-demo', 'newspackMyAccountV2Demo', [...] )` and to PHP templates via a shared `My_Account_UI_V2_Demo::get_fake_data()` static method.
7. **Registers a query var** `v2-demo` via the `query_vars` filter so WordPress doesn't strip it.

The class follows the static `init()` pattern (per `AGENTS.md`), is `include_once`d from `includes/plugins/woocommerce/my-account/class-woocommerce-my-account.php` after the v1 class, and `composer dump-autoload` is run after creation.

```php
namespace Newspack;

final class My_Account_UI_V2_Demo {
    const DEMO_FLAG = 'v2-demo';

    public static function init() {
        add_filter( 'query_vars',           [ __CLASS__, 'query_vars' ] );
        add_filter( 'body_class',           [ __CLASS__, 'body_class' ] );
        add_filter( 'wc_get_template',      [ __CLASS__, 'wc_get_template' ], 5, 5 );
        add_filter( 'woocommerce_account_menu_items', [ __CLASS__, 'menu_items' ], 1100 );
        add_action( 'wp_enqueue_scripts',   [ __CLASS__, 'enqueue_assets' ], 12 );
        add_action( 'init',                 [ __CLASS__, 'register_endpoints' ] );
    }

    private static function is_demo_active() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if ( ! isset( $_GET[ self::DEMO_FLAG ] ) ) return false;
        if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) return false;
        if ( ! is_user_logged_in() ) return false;
        return current_user_can( 'manage_options' );
    }
    // ...
}
My_Account_UI_V2_Demo::init();
```

The demo flag is preserved across navigation by appending `?v2-demo=1` to every internal nav link generated for the v2 menu items (a small filter on `woocommerce_get_account_menu_item_classes` / a `wc_get_account_endpoint_url` wrapper).

## 5. File structure

```
includes/plugins/woocommerce/my-account/
├── class-my-account-ui-v2-demo.php           # NEW — demo gate + fake data
└── templates/v2-demo/                        # NEW — v2 templates
    ├── dashboard.php                         # entry, optional welcome
    ├── newsletters.php                       # priority screen
    ├── newsletters-row.php                   # partial
    ├── donations.php                         # list (init / w/ billing)
    ├── donation-details.php                  # detail page
    ├── subscriptions.php                     # list (init)
    ├── subscription-details.php              # detail page
    ├── partials/
    │   ├── plan-card.php                     # composed of .newspack-ui__box
    │   ├── billing-history-table.php
    │   ├── section-title.php
    │   └── menu-sidebar.php                  # passes through to v1 nav
    └── modals/
        ├── cancel-donation.php
        ├── modify-donation.php
        ├── restart-donation.php
        ├── cancel-subscription.php
        ├── renew-subscription.php
        └── change-subscription.php

src/my-account/v2-demo/
├── index.js                                  # webpack entry, imports public-path then style + JS
├── style.scss                                # all styles scoped under .newspack-my-account--v2-demo
├── newsletters.js                            # wires up unsubscribe toast, optimistic UI
├── donations.js                              # cancel/modify modal triggers
├── subscriptions.js                          # cancel/renew/change modal triggers
└── fake-data.js                              # mirrors the PHP fake-data shape
```

A new webpack entry is added to `webpack.config.js` (alongside the existing `my-account`, `my-account-v0`, `my-account-v1` entries):

```js
'my-account-v2-demo': path.join( __dirname, 'src', 'my-account', 'v2-demo', 'index.js' ),
```

Per `AGENTS.md`, `index.js` must `import 'src/shared/js/public-path.js'` first.

## 6. Component mapping (Figma → newspack-ui)

> **Reminder of §2.1: no custom CSS.** Every row in the table below maps to an existing class or composition. If you reach for a class you don't see here, search `src/newspack-ui/scss/` first, then visit `?ui-demo` on a logged-in admin session, then ask in PR review — *before* writing any new SCSS.

Every Figma element maps to an existing newspack-ui primitive. There are no genuinely new components; everything is composition + utility classes. The "Newspack / …" naming in Figma corresponds directly to newspack-ui CSS classes once the deprecated entries are swapped.

| Figma instance / pattern | newspack-ui mapping | Source |
|---|---|---|
| `Menu - Sidebar` (left nav) | Re-render v1's `templates/v1/navigation.php` unchanged | `class-my-account-ui-v1.php` |
| `Newspack / Modal` | `.newspack-ui__modal-container` + `__modal` + `__header` / `__content` / `__footer` | `src/newspack-ui/scss/_modals.scss`, `js/modals.js` |
| `Newspack / Badge` | `.newspack-ui__badge` and variants (`--success`, `--warning`, `--error`, `--outline`) | `scss/elements/misc/_badge.scss` |
| `Newspack / Radio` and `Newspack / Radio Card` | Native `input[type="radio"]` styled by `_checkbox-radio.scss`; "Radio Card" = a `.newspack-ui__input-card` wrapper | `scss/elements/forms/` |
| `Newspack / Note` | `.newspack-ui__notice` (and `--success` / `--warning` / `--error`) | `scss/elements/_notices.scss` |
| `Toast Notification` | `Newspack_UI::add_notice()` PHP helper (renders `.newspack-ui__snackbar__item`) | `class-newspack-ui.php` |
| `Plan Card` (donation/subscription tile) | `.newspack-ui__box` + a vertical `newspack-ui__stack` of: badge, amount (`__font--xl --bold`), frequency (`__color--neutral-60`), action button row | composition |
| `Button Card` (clickable CTA tile) | `<a class="newspack-ui__box newspack-ui__box--border">` with stack contents | composition |
| `section-title` | `<h2 class="newspack-ui__font--l newspack-ui__font--bold newspack-ui__color--neutral-90">` | utilities |
| `table-header` / `table-row` (billing history) | newspack-ui table styles (`scss/elements/_tables.scss`) wrapped in `.newspack-ui__box` for the rounded card | composition |
| `Dropdown` (menus on subscriptions/donations rows) | `.newspack-ui__dropdown__toggle` + `__dropdown__content` (already wired up in `js/dropdowns.js`) | `scss/elements/misc/_dropdown.scss` |
| `Input [Text]` | Default `input[type="text"]` styling under `.newspack-ui` | `scss/elements/forms/_text-inputs.scss` |
| `Checkbox` (newsletter rows) | Native `input[type="checkbox"]` | `_checkbox-radio.scss` |
| `[DEPRECATED] Newspack / Button` | **Replace** with `.newspack-ui__button` family (`--primary`, `--secondary`, `--ghost`, `--destructive`) | `_buttons.scss` |
| Newsletter "categories" sections | Always-expanded visual labels — **not** collapsible accordions. A vertical stack of `section-title` + a `.newspack-ui__box` containing the rows. | utilities |
| Newsletter row thumbnail | A square `<img>` (request 128×128, render at design size) inside a sized container. For fake data, `https://picsum.photos/seed/{slug}/128/128` gives a stable but distinct image per newsletter. | composition |
| Frequency badge / `SUBSCRIBER-ONLY` badge | `.newspack-ui__badge` (frequency) and `.newspack-ui__badge--outline` (subscriber-only). Both render side-by-side in a horizontal stack. | `_badge.scss` |
| "Unsubscribe from all" row | A `.newspack-ui__box` at the bottom of the newsletters list with title + supporting copy on the left and a `.newspack-ui__button--secondary` on the right. | composition |
| "active" vs "previous" / "cancelled" splits | Vertical stack with two section-titles and two stacks of `Plan Card`s | utilities |

**Layout primitives.** Page chrome on every screen is the same: `container` (max-width content area, ~768px) → vertical `newspack-ui__stack --gap-6` for top-level sections. Inside each section, a vertical stack of `.newspack-ui__box` cards. Margins are controlled by stack `gap`, never per-element margins (per `UTILITY_CLASSES.md`). The whole page sits inside `<body class="newspack-ui newspack-my-account newspack-my-account--v1 newspack-my-account--v2-demo">` — `newspack-ui` is the wrapper newspack-ui CSS scopes itself to.

**Things to verify in newspack-ui before final implementation.** Whether a "Plan Card" pattern already has a documented compositional recipe; whether `.newspack-ui__accordion` supports the section grouping we want for newsletters; whether tables are styled within `.newspack-ui__box` or stand alone. Spot-checks of the `?ui-demo` page on a local site will confirm.

## 7. Fake data

Fake data lives in **PHP** (single source of truth) inside `class-my-account-ui-v2-demo.php` as a static method `get_fake_data()` returning an associative array, optionally filtered through a small filter for the demo to be reshaped per scenario. It is shipped to the browser via `wp_localize_script`. JS consumers read from `window.newspackMyAccountV2Demo`.

**Data shape (informed by Figma, kept minimal):**

```php
return [
    'reader' => [
        'display_name' => 'Casey Reader',
        'email'        => 'casey@example.com',
        'avatar_url'   => '...',
    ],
    'newsletters' => [
        'sections' => [
            [
                'id'    => 'featured',
                'label' => 'Featured',
                'lists' => [
                    [
                        'id'              => 'morning-brief',
                        'name'            => 'The Morning',
                        'description'     => 'A daily roundup of the most relevant stories from the previous day',
                        'frequency'       => 'Daily',           // Display label. Conventional: Daily, Weekly, Monthly, Twice weekly, As needed. Free-text fallback allowed (e.g. '3 times a week').
                        'subscriber_only' => false,
                        'thumbnail'       => 'https://picsum.photos/seed/morning-brief/128/128',
                        'subscribed'      => true,
                    ],
                    // ...
                ],
            ],
            // 'premium', 'tech' ...
        ],
        'unsubscribe_from_all' => [
            'enabled' => true, // Renders the bottom row. Click handler is client-side only — fires a toast.
        ],
    ],
    'donations' => [
        'recurring' => [
            [
                'id'             => 'don-001',
                'status'         => 'active',          // active | cancelled | expired
                'amount'         => 15.00,
                'currency'       => 'USD',
                'frequency'      => 'month',           // month | year
                'next_payment'   => '2026-05-12',
                'started'        => '2024-03-01',
                'payment_method' => [ 'brand' => 'Visa', 'last4' => '4242', 'exp' => '12/27' ],
            ],
        ],
        'one_time' => [
            [ 'id' => 'don-002', 'amount' => 50.00, 'currency' => 'USD', 'date' => '2025-12-04' ],
        ],
        'billing_history' => [
            [ 'date' => '2026-04-12', 'amount' => 15.00, 'status' => 'paid', 'invoice_url' => '#' ],
            // ...
        ],
    ],
    'subscriptions' => [
        'active' => [
            [
                'id'             => 'sub-001',
                'status'         => 'active',          // active | cancelled | expiring | renewed
                'product'        => 'Newspack Premium',
                'amount'         => 9.99,
                'currency'       => 'USD',
                'frequency'      => 'month',
                'next_payment'   => '2026-05-04',
                'fees_covered'   => true,
                'payment_method' => [ 'brand' => 'Mastercard', 'last4' => '5454', 'exp' => '08/28' ],
            ],
        ],
        'previous' => [
            [ 'id' => 'sub-002', 'product' => 'Daily Digest', 'status' => 'cancelled', 'ended' => '2025-09-01' ],
        ],
    ],
];
```

**Variant switching for screenshot/test scenarios.** A second query parameter, `?v2-demo=<scenario>`, picks a fixture variant: `?v2-demo=cancelled-sub`, `?v2-demo=expired-payment`, `?v2-demo=no-donations`, etc. `My_Account_UI_V2_Demo::get_fake_data()` merges the scenario overrides into the base fixture. The default `?v2-demo=1` is the "happy path" (one active recurring donation, one active sub, one one-time donation, billing history populated).

**Mutations.** All "Cancel", "Modify", "Renew", "Change", "Unsubscribe" actions are **client-side only** in JS — they trigger the appropriate modal, then on submit show a toast via `newspackUI` (already exposed by `js/modals.js`) and optimistically update the DOM. No POST, no AJAX. This keeps the prototype stateless and risk-free.

## 8. Reuse vs. new (cheat sheet)

Reuse from v1 verbatim:
- Page template: `templates/v1/my-account.php` (no header/footer wrapper).
- Sidebar/menu: `templates/v1/navigation.php` and `My_Account_UI_V1::my_account_menu_items()`.
- Body classes machinery, `is_account_page` gating, `wc_get_template` hook plumbing.
- `Newspack_UI::add_notice()` for snackbars/toasts.
- Email-unverified, signed-out, account settings, delete-account screens (no v2 designs are missing from these for prototype purposes).

Replace for v2:
- Newsletters main column — promote from inline form to dedicated endpoint.
- Subscriptions list and detail templates — new layout, new modals.
- Donations list and detail templates — entirely new endpoint (didn't exist in v1).

Add menu items via `woocommerce_account_menu_items` filter on the demo class only (so they appear ONLY when `?v2-demo` is set):
- "Newsletters" (slug `newsletters`)
- "Donations" (slug `donations`)
- "Subscriptions" (slug `subscriptions`) — already exists from WC Subscriptions, just relabel/reorder.

Custom endpoints (`add_rewrite_endpoint`) are registered conditionally in `My_Account_UI_V2_Demo::register_endpoints()`. After registration, a flush-rewrite-rules step is needed once per site (CLI: `wp rewrite flush`). Note this in onboarding.

## 9. Risks & open questions

1. **Sidebar nav collisions.** v1's `My_Account_UI_V1::my_account_menu_items()` already filters and renames items. Our v2 filter must run at a higher priority (1100 vs 1001) and only mutate when the demo flag is set. Verify there's no `wp_cache`-style memoization that bakes the v1 list before our filter runs.
2. **Endpoint flush.** Registering `donations` and `newsletters` endpoints requires a one-time `flush_rewrite_rules`. We should not auto-flush on every demo load. Recommendation: flush on plugin activation if a constant is defined, or document a manual `wp rewrite flush` step.
3. **Plan Card / Button Card components.** These are Figma instance names that map to *compositions* in newspack-ui, not single classes. If the same composition is repeated in 5+ places we should extract a partial (`partials/plan-card.php`) — but **not** a new Sass class. If a true gap appears, raise it as an addition to `newspack-ui` rather than a one-off in the prototype.
4. **`?v2-demo` link preservation.** Every internal link must carry the flag forward; otherwise clicking a sidebar item drops back to v1. Wrap `wc_get_account_endpoint_url()` results in a small helper that re-appends the demo query var when the demo is active.
5. **Mobile.** Figma has both desktop and a `MOBILE` section (`4105:131109`). The prototype targets desktop first. Mobile responsive tweaks should land in a follow-up; v1's existing breakpoints will hold up reasonably as a baseline.
6. **Translatable strings.** All visible copy must use `__( '…', 'newspack-plugin' )`. Even fake data labels (e.g. "The Morning") should be wrapped, since this prototype lives in the plugin and gets scanned by translation tooling.
7. **Figma desktop-app dependency.** The Figma MCP available in this workspace requires the desktop app and a layer selection to return component code; bulk metadata is available but text content is not. Detailed text/copy in screens must be pulled either by selecting each frame in the Figma desktop app at implementation time, or by using exported screenshots as the source of truth.
8. **Donations "no fees" vs "with fees" variants.** Both subscriptions and donations have `(no fees)` variants. Confirm the data flag (e.g. `fees_covered` boolean) and how the Figma renders the difference (likely an extra line in the Plan Card).

## 10. Suggested phasing

### Phase 1 — Plumbing (~half a day)

**Goal:** an admin who appends `?v2-demo=1` to `/my-account/` sees a "Hello v2 demo" stub *and* the body class `newspack-my-account--v2-demo`. A non-admin appending the same URL sees v1 unchanged.

**Step 1 — Read first.** Spend 30–60 minutes on the files listed in §2.8. Don't skip this.

**Step 2 — Create the PHP class.** New file `includes/plugins/woocommerce/my-account/class-my-account-ui-v2-demo.php`:

```php
<?php
/**
 * My Account v2 Prototype Demo (admin-only, gated by ?v2-demo).
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

final class My_Account_UI_V2_Demo {
    const DEMO_FLAG  = 'v2-demo';
    const BODY_CLASS = 'newspack-my-account--v2-demo';

    public static function init() {
        add_filter( 'query_vars',                  [ __CLASS__, 'query_vars' ] );
        add_filter( 'body_class',                  [ __CLASS__, 'body_class' ] );
        add_action( 'wp_enqueue_scripts',          [ __CLASS__, 'enqueue_assets' ], 12 );
        // Inside the [woocommerce_my_account] shortcode body. v1's page template
        // renders the account area via the shortcode and does not call the_content(),
        // so the_content filter would never fire here. See §2.3.
        add_action( 'woocommerce_account_content', [ __CLASS__, 'render_stub' ], 100 );
    }

    public static function is_demo_active() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        if ( ! isset( $_GET[ self::DEMO_FLAG ] ) ) {
            return false;
        }
        if ( ! function_exists( 'is_account_page' ) || ! is_account_page() ) {
            return false;
        }
        if ( ! is_user_logged_in() ) {
            return false;
        }
        return current_user_can( 'manage_options' );
    }

    public static function query_vars( $vars ) {
        $vars[] = self::DEMO_FLAG;
        return $vars;
    }

    public static function body_class( $classes ) {
        if ( self::is_demo_active() ) {
            $classes[] = self::BODY_CLASS;
        }
        return $classes;
    }

    public static function enqueue_assets() {
        if ( ! self::is_demo_active() ) {
            return;
        }
        wp_enqueue_style(
            'newspack-my-account-v2-demo',
            Newspack::plugin_url() . '/dist/my-account-v2-demo.css',
            [ 'newspack-ui' ],
            NEWSPACK_PLUGIN_VERSION
        );
        wp_enqueue_script(
            'newspack-my-account-v2-demo',
            Newspack::plugin_url() . '/dist/my-account-v2-demo.js',
            [ 'newspack-ui' ],
            NEWSPACK_PLUGIN_VERSION,
            true
        );
    }

    public static function render_stub() {
        if ( ! self::is_demo_active() ) {
            return;
        }
        echo '<div class="newspack-ui"><p>' . esc_html__( 'Hello v2 demo. Phase 1 stub is working.', 'newspack-plugin' ) . '</p></div>';
    }
}
My_Account_UI_V2_Demo::init();
```

This is intentionally smaller than the final shape sketched in §5 — Phase 1 just proves the gate works. Later phases swap in `wc_get_template` for real templates, register endpoints, and add menu items.

**Step 3 — Wire it into the bootstrap.** The v1 class isn't included from `includes/class-newspack.php`; it's loaded from `includes/plugins/woocommerce/my-account/class-woocommerce-my-account.php` inside an `init`-time `else` branch (the v0/v1 version switch, gated on `Reader_Activation::is_enabled()`). Add the v2-demo `include_once` immediately after the v1 includes there, so v1's filters register first and v2-demo inherits the same Reader Activation + version gating for free:

```php
// inside class-woocommerce-my-account.php, the v1 branch of the version switch
include_once __DIR__ . '/class-my-account-ui-v1.php';
include_once __DIR__ . '/class-my-account-ui-v1-passwords.php';
include_once __DIR__ . '/class-my-account-ui-v2-demo.php'; // v2 prototype demo, admin-only behind ?v2-demo.
```

**Step 4 — Refresh the autoloader.**

```bash
composer dump-autoload
```

Don't skip this even if your class loads "by accident" via `include_once` (see §2.5).

**Step 5 — Scaffold the SCSS + JS bundle.** Even though Phase 1 doesn't render any v2 markup yet, set up the bundle so later phases just add to it.

`src/my-account/v2-demo/index.js`:

```js
import '../../shared/js/public-path';
import './style.scss';

console.log( 'Newspack My Account v2 demo bundle loaded.' );
```

`src/my-account/v2-demo/style.scss`:

```scss
.newspack-my-account--v2-demo {
    // All v2-demo styles live under this scope.
    // Phase 1: nothing yet — newspack-ui handles the rest.
}
```

> **Note.** Verify the `public-path` import path against an existing entry like `src/my-account/v1/index.js` — match the existing convention exactly. If you skip this import, the bundle compiles but breaks at runtime (see §2.5).

**Step 6 — Register the webpack entry.** Open `webpack.config.js` and add this entry beside the existing my-account entries (around line 56):

```js
'my-account-v2-demo': path.join( __dirname, 'src', 'my-account', 'v2-demo', 'index.js' ),
```

**Step 7 — Build assets.**

```bash
npm run build
# or, while developing:
npm start
```

`npm start` watches and rebuilds; use it during active work.

**Step 8 — Test as an admin.** Log in as an administrator and visit:

```
/my-account/?v2-demo=1
```

Expected:
- The page renders with the v1 layout shell.
- Inside the My Account content area (near the bottom of the shortcode body) you see "Hello v2 demo. Phase 1 stub is working."
- DevTools: `<body>` has the `newspack-my-account--v2-demo` class.
- Console: "Newspack My Account v2 demo bundle loaded."
- Network: `my-account-v2-demo.css` and `.js` are fetched.

**Step 9 — Test gating.** Log out (or switch to a non-admin user). Visit the same URL. Expected:
- v1 renders unchanged.
- No "Hello v2 demo" anywhere.
- No `newspack-my-account--v2-demo` body class.
- The bundle is *not* enqueued (check the Network tab).

If any of these fail, debug *now* before adding more code.

**Step 10 — Lint.**

```bash
npm run lint:php
npm run lint
```

Fix everything before committing.

**Step 11 — Document the phase.** Open [`my-account-v2-prototype-devlog.md`](my-account-v2-prototype-devlog.md) and add a Phase 1 entry using the format described in §11. Then commit and open a PR.

### Phase 2 — Newsletters (~1 day)

Build the list with sections + the "unsubscribed" toast variant. This validates the component-mapping approach end-to-end. Use the Figma MCP per §2.7 to pull design context for `2636:46704`, `4645:19732`, and `2636:46736`. Switch the demo from `the_content` injection to a real `wc_get_template` swap, register the `newsletters` endpoint, and add the menu item (gated on the demo flag).

### Phase 3 — Donations list + detail (~2 days)

Including the billing-history table variant. Figma frames `2636:46467`, `2636:46488`, `2636:46512`, `2636:46661`, `2636:46500`, `3619:292407`. Pull each via Figma MCP per §2.7.

### Phase 4 — Subscriptions list + detail (~2 days)

All 5 detail variants. Figma section `2636:46116`. v1 already has a subscriptions endpoint; v2 just swaps templates.

### Phase 5 — Modals (~1 day)

All six modal flows (cancel donation, modify donation, restart donation, cancel subscription, renew subscription, change subscription) wired to client-side handlers + toast confirmations. All use `Newspack / Modal` → `.newspack-ui__modal*` (see §6).

### Phase 6 — Polish + scenario fixtures (~0.5 day)

`?v2-demo=<scenario>` overrides for cancelled / expired / empty / no-fees states (see §7). Final screenshot pass against Figma.

**Total estimate:** ~7 dev-days for one engineer, end-to-end clickable on any Newspack site.

## 11. Working in the open — dev log practice

A commit history tells you *what* changed, not *why*, and almost never captures the dead-ends you walked down on the way to a working solution. We want both. The discipline is small: keep a running dev log alongside this brief, written in the moment, in your own voice.

**Where it lives.** [`my-account-v2-prototype-devlog.md`](my-account-v2-prototype-devlog.md), sibling to this brief. A starter file is committed alongside; just open it and start adding entries.

**Format.** One section per phase, dated entries within. Each entry covers four things:

1. **What I built.** Plain English. Two or three sentences.
2. **What I learned.** Surprises, gotchas, things the brief got wrong, things the codebase taught you. The most valuable section over time.
3. **Decisions and why.** Especially anything that deviates from this brief or from a "default" approach. If you picked option A over option B, write down why — even if it feels obvious right now.
4. **Open questions.** Things you couldn't answer alone, things to bring up in PR review, things to revisit later.

Add links to PRs, commits, and Figma frames. Keep it scannable.

**Cadence.** Minimum: one entry per phase, written before opening the PR. Better: an entry whenever you stop for the day or hit a meaningful checkpoint. The cost is 5–10 minutes; the payoff is the difference between "the next dev can pick this up cold" and "the next dev needs an hour with you".

**When the brief is wrong, fix the brief.** If something in this document turns out to be inaccurate or a decision changes (the deprecated-button question gets resolved, the accordion question gets settled, the demo flag's link-preservation strategy changes), update the brief in the same PR as the implementation change. Note the brief edit in the devlog entry.

**Inline code comments should explain *why*, not *what*.** The "what" is in the code. Use comments for:

- Non-obvious tradeoffs ("filtering at priority 1100 because v1 runs at 1001 and we need to win the conflict").
- Guards against future regressions ("this short-circuit must run before the body_class filter; otherwise admin sees the demo class on every account page even without the flag").
- Pointers back to the brief or devlog when a decision is documented elsewhere.

**The newspack-ui escape-hatch rule.** If you ever catch yourself writing a fresh CSS rule outside `.newspack-my-account--v2-demo { }` (or, worse, a custom React component to fill a perceived gap), write a devlog entry *before* committing the workaround. Describe what you tried with newspack-ui and why it didn't fit. That entry is the trigger for raising the gap as a `newspack-ui` addition rather than letting it ossify in the prototype.

---

## 12. Definition of done

- An admin can append `?v2-demo` (or `?v2-demo=<scenario>`) to any `/my-account/...` URL on any Newspack site and see the prototype rendered.
- A non-admin appending the same URL sees v1 unchanged.
- All visible markup uses `.newspack-ui*` classes. The v2-demo `style.scss` contains the `.newspack-my-account--v2-demo` scoping wrapper and effectively nothing else — open it in PR review and check.
- All four primary screens (dashboard, newsletters, donations, subscriptions) plus all six modals are reachable.
- Scenario flag toggles produce visibly different fixtures.
- `npm run lint` and `npm run lint:php` pass.
- The devlog has at least one entry per shipped phase.
- A short PR description documents the flag, the scenarios, and known limitations.

---

## Appendix A — Figma screen index (priority screens only)

```
SUBSCRIPTIONS  (2636:46116)
  Subscriptions (init)                  2636:46117
  Subscriptions (init 2)                2636:46133
  Subscription details - active         2636:46149
  Subscription details - active no fees 4351:66807
  Subscription details - cancelled      2636:46177
  Subscription details - expiring       2636:46232
  Subscription details - renewed        2636:46204
  Cancel subscription – Init            2636:46259
  Cancel subscription – Success         2636:46262
  Renew subscription                    2636:46276
  Renew subscription – Success          2636:46269
  Change subscription - Init            2636:46318
  Change subscription - Monthly sel.    2636:46331
  Change subscription - Plan selected   2636:46344
  Change subscription - Transaction     2636:46297

DONATIONS  (2636:46466)
  Donations (init)                      2636:46467
  Donations details — recurring active  2636:46488
  Donations details — recurring cancel  2636:46661
  Donations details — one-time          2636:46512
  Donations details — new pmt method    2636:46500
  Donations details — recurring no fees 4339:17740
  Donations w/ billing history          3619:292407
  Modify donation                       2636:46578
  Cancel donation – Init                2636:46591
  Cancel donation – Success             2636:46550
  Restart monthly donation              2636:46530

NEWSLETTERS  (2636:46703)
  Newsletters list w/ sections          2636:46704
  Newsletters list w/o categories       4645:19732
  Newsletters list — Unsubscribed       2636:46736
```

## Appendix B — Quick reference: newspack-ui surface used

CSS files actually exercised by this prototype (all under `src/newspack-ui/scss/`):
`elements/forms/_buttons.scss`, `_text-inputs.scss`, `_checkbox-radio.scss`, `_labels.scss`, `_select.scss`, `_accordion.scss`, `_spinner.scss`; `elements/_notices.scss`, `_tables.scss`, `_typography.scss`, `_segmented-control.scss`, `_boxes.scss`, `_stack.scss`, `_layout.scss`; `elements/misc/_badge.scss`, `_dropdown.scss`, `_spacing.scss`, `_position.scss`, `_visibility.scss`; `_modals.scss` (top-level); `elements/woocommerce/_my-account.scss`.

JS modules: `src/newspack-ui/js/modals.js`, `dropdowns.js`, `accordions.js`, `notices.js`, `segmented-control/index.js`, plus `Newspack_UI::add_notice()` PHP for snackbars.

Utility classes: stack (`__stack`, `--vertical`, `--gap-{1-12}`, `--align-*`, `--justify-*`); spacing (`__spacing-{side}--{n}`); typography (`__font--{2xs..6xl}`, `--bold`, `--normal`); color (`__color--{neutral|primary|success|error|warning}-{step}`); position; visibility (`hidden`, `overflow-hidden`).

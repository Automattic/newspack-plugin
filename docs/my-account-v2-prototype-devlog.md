# My Account v2 Prototype — Dev Log

A running diary of building the My Account v2 prototype.

See [the brief](my-account-v2-prototype-brief.md) §11 for the full format guidelines and cadence. The short version:

- One section per phase, dated entries within.
- Each entry has four parts: **What I built**, **What I learned**, **Decisions and why**, **Open questions**.
- Add links to PRs, commits, and Figma frames.
- Write entries in the moment, not retroactively.
- If the brief is wrong, fix the brief — and note it here.
- If you wrote any custom CSS, the rule from §11 applies: write the entry *before* committing the workaround.

---

## Phase 0 — Brief read, ready to start

**Date:** _YYYY-MM-DD_
**By:** _your-name@a8c.com_

**What I built**

Nothing yet. Read the brief end-to-end, set up the local Newspack site, confirmed I can log in as an administrator and load `/my-account/`. Visited `/?ui-demo` and confirmed the component gallery renders.

**What I learned**

_(Drop in any aha moments from reading the brief, the v1 code, or the `?ui-demo` gallery. e.g. "didn't realize the v1 sidebar nav is a separate template I can pass through unchanged" — that kind of thing.)_

**Decisions and why**

_(Note any pre-implementation decisions made with the team here — e.g. the call between accordion vs flat newsletter sections, or any of the other items still open in brief §9.)_

**Open questions**

_(Anything in the brief that didn't make sense, that you want to clarify before Phase 1 — list it here so it's not lost.)_

---

## Phase 1 — Plumbing

> See [brief §10 → Phase 1](my-account-v2-prototype-brief.md#phase-1--plumbing-half-a-day) for the step-by-step.

**Date:** 2026-04-28
**By:** thomas@a8c.com
**PR:** _pending_
**Commits:** _pending — code is staged on `prototype/my-account-demo`_

**What I built**

Created `includes/plugins/woocommerce/my-account/class-my-account-ui-v2-demo.php` with the four-hook gating shape from brief §10 (query var, body class, asset enqueue at priority 12, and a `woocommerce_account_content` stub at priority 100). Scaffolded the webpack entry at `src/my-account/v2-demo/{index.js,style.scss}`, registered it in `webpack.config.js` next to `my-account-v1`, and confirmed the bundle compiles (`dist/my-account-v2-demo.{js,css,asset.php}`). Verified the gate end-to-end against a real Newspack site (`localhost`) for all four paths: admin + flag, admin + no flag, logged-out + flag, and the unit-style branch coverage of `is_demo_active()` via `wp eval-file`. All Step 8 / Step 9 signals checked out.

**What I learned**

The brief said to wire the new class in via `includes/class-newspack.php` "in the same block as the v1 class". The v1 class isn't actually loaded from there — it's loaded from `class-woocommerce-my-account.php` inside an `init`-time `else` branch that gates on `Reader_Activation::is_enabled()` and the `NEWSPACK_MY_ACCOUNT_VERSION` version switch (v0 vs v1). Including v2-demo there means it inherits the same Reader Activation + version preconditions for free. Updated brief §10 → Step 3 in the same change.

The other small gotcha was the `wp_enqueue_scripts` priority: v1 enqueues at 11; the v2-demo runs at 12 so `newspack-ui` is already registered as a dependency by the time our handle declares it. The brief called this out, but it's worth flagging that any later phase adding more bundles needs to follow the same ordering.

**Decisions and why**

- **Used `woocommerce_account_content` (action) for the stub, not `the_content` (filter).** v1's account-page page template renders the account area via `[woocommerce_my_account]` and never calls `the_content()`, so a `the_content` filter would never fire on `/my-account/`. The brief calls this out in §2.3 and §10 Step 2; I went with the documented action.
- **Loaded v2-demo from `class-woocommerce-my-account.php`, not `class-newspack.php`.** Deviation from brief §10 Step 3 as written, but consistent with its intent ("after the v1 include, so v1's filters register first") because that's the only place v1 actually gets included. Fixed the brief in the same change.
- **Kept `console.log` in `index.js` for Phase 1 only.** Brief Step 8 lists the log line as a verification signal; fine for Phase 1, but it should come out in Phase 2 once we have real interactions to wire up. Logged this as a Phase 2 cleanup item below.

**Open questions**

- **Login redirect drops `?v2-demo`.** When a logged-in user lands on `/my-account/`, `WooCommerce_My_Account::redirect_to_account_details()` (existing v1 behaviour) bounces them to `/my-account/edit-account/` and `wp_safe_redirect` strips the query string. Side effect: hitting `wp-login.php` with `redirect_to=/my-account/?v2-demo=1` lands you on `/edit-account/` *without* the flag. Workarounds for the prototype: bookmark a sub-endpoint URL like `/my-account/edit-account/?v2-demo=1`, or wait for Phase 2's link-preservation work (brief §9 risk #4) which will re-append the flag on every internal nav. Not a Phase 1 blocker; the gate itself behaves correctly on any URL where the flag *is* present.
- **Phase 2 cleanup.** Remove the `console.log` in `src/my-account/v2-demo/index.js` once there's real JS to register. Trivial, just don't forget.
- **Open-question sweep.** None of brief §9's open items came up in Phase 1 (sidebar nav collisions, endpoint flush, link preservation, etc. — all Phase 2+ concerns).

---

## Phase 2 — Newsletters

> See [brief §10 → Phase 2](my-account-v2-prototype-brief.md#phase-2--newsletters-1-day). Pull design context from Figma frames `2636:46704`, `4645:19732`, `2636:46736` per brief §2.7.

**Date:** 2026-04-28
**By:** thomas@a8c.com
**PR:** [#4679](https://github.com/Automattic/newspack-plugin/pull/4679) (stacked)
**Commits:** _pending — code is staged on `prototype/my-account-demo`_
**Figma:** [`2636:46704`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46704), [`4645:19732`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=4645-19732), [`2636:46736`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46736)

**What I built**

The Newsletters list, end-to-end. Replaced the Phase 1 stub action with: (a) a `newsletters` rewrite endpoint registered with the option-keyed auto-flush guard from the cross-phase decision log, (b) a `woocommerce_account_newsletters_endpoint` action that loads `templates/v2-demo/newsletters.php`, (c) a v2-only menu-item filter at priority 1100 that injects the "Newsletters" link only when the demo flag is set, and (d) a `woocommerce_get_endpoint_url` filter that re-appends `?v2-demo=1` to every internal account URL — sidebar nav, post-login redirect, and the WC redirect-to-account-details bounce. The Phase 1 login-redirect open question (entry above) is closed by that filter. PHP fake data lives on the class as `get_fake_data()`, shipped to the JS layer via `wp_localize_script` and to PHP templates by passing the array into `load_template`.

The list itself is composed entirely from newspack-ui primitives — vertical `__stack`s for sections, horizontal `__stack`s for rows, `__badge--outline` for frequency, `__badge--secondary` for SUBSCRIBER-ONLY, `__button--primary` / `--secondary` for the row CTAs. Section grouping is a flat label + list (not an accordion — that decision was settled pre-Phase 2 and is in the cross-phase decision log). The "Unsubscribed" frame (`2636:46736`) is realised as the bulk-unsubscribe end state: clicking "Unsubscribe from all" flips every subscribed row to "Sign up" and disables the bottom button, exactly mirroring Figma. The optimistic UI lives in `src/my-account/v2-demo/newsletters.js` — a single delegated click listener per root, no fetch, snackbar via `newspackUI.notices.openNotice`. Removed the Phase 1 placeholder `console.log` from `index.js` per the Phase 1 cleanup note.

Verified server-side: 11 rows (5 featured + 3 tech + 3 premium), 6 sign-up / 5 unsubscribe buttons, 4 SUBSCRIBER-ONLY badges, 1 bulk-unsubscribe button. Anon `/my-account/?v2-demo=1` does not enqueue the demo bundle and does not get the body class — gate stays closed.

**What I learned**

The big surprise: my `add_action('init', 'register_endpoints')` registration never fired. The class file is included _inside_ an `init` callback in `class-woocommerce-my-account.php` (line 84), so by the time my class' `init()` method runs, the `init` action is already mid-flight at priority 10+. Registering another `init` action at default priority is too late — WP only re-fires actions on the next request, and on the next request the class file is once again loaded inside an `init` callback. So the endpoint registration would never run, and `/my-account/newsletters/` would 404 forever.

Fix: call `self::register_endpoints()` directly from `init()` instead of registering it as an action. The class is loaded during the `init` action, so a direct call _is_ effectively running on `init` at priority 10. WC core registers its own endpoints at the same moment, so timing lines up. Confirmed by hitting `/my-account/` once and watching the `newspack_my_account_v2_demo_endpoints_version` option flip from absent to `2`.

The other small lesson: PHPCS treats `$id` as a WordPress reserved global and rejects template variable assignments to it. Renamed to `$list_id` in the row partial. Worth knowing for future templates.

I almost reached for the newspack-ui escape-hatch. The horizontal newsletter row "needs" a middle column that grows to fill width and a hairline separator between rows, both of which felt like genuine `__stack` gaps. First pass added three small scoped rules under `.newspack-my-account--v2-demo` and I drafted a devlog entry to back it up — but Thomas pushed back ("you could use a mix of stacks") and on a second look every rule was unnecessary. The corrected layout: outer `__stack--horizontal --justify-between` pushes the button to the right edge while a left-side `__stack--horizontal` groups image + details. Image dimensions go on the `<img>` width/height attrs (the picsum source is already 128×128 square, so no `object-fit` is needed). Hairlines between rows are an `<hr>` between siblings — newspack-ui's `_dividers.scss` styles `<hr>` as a 1px line, and `__stack--vertical` zeroes child margins so `--gap-5` alone controls spacing. style.scss went back to the wrapper-only state it should be in per brief §2.1. The right escape-hatch reflex isn't "log a gap, write a rule" — it's "ask whether nested stacks already cover it."

**Decisions and why**

- **Direct `register_endpoints()` call instead of `add_action('init', …)`** — see "What I learned". Comment in the code explains why so future readers don't "fix" it.
- **Endpoint version bumped to 2** — auto-flush guard from the cross-phase decision log. Phase 1 didn't write any version (option absent); Phase 2 sets it to 2 so the flush runs exactly once per environment when this lands. Will be bumped again in Phase 3 when `donations` is added.
- **Skipped the `wc_get_template` filter for newsletters** — the brief listed it as a swap target, but `myaccount/newsletters.php` isn't a real WC template (there's no core file, no `wc_get_template` call). Hooked `woocommerce_account_newsletters_endpoint` directly and `load_template`'d the v2 file instead. Same end result, cleaner control flow, no accidental override of a non-existent path.
- **Image as a real `<img>` tag (not `background-image`)** — brief §3 specifies a "full image, not an icon" using `picsum.photos/seed/{slug}/128/128`. `<img>` gets `loading="lazy"` and `alt=""` (decorative) for free; CSS background-image would lose that. The tradeoff is a third scoped rule for `object-fit: cover` — fine, it's logged as part of the candidate gap.
- **JS ships translations via `@wordpress/i18n` directly** — no fallback shim. The dep is already on the page (newspack-ui depends on `wp-util`/`wp-i18n`); a shim would just be untested code.
- **Translatable fake data strings** — every newsletter name and description is wrapped in `__()`. Brief §9 risk #6 calls this out: the prototype lives in the plugin and is scanned by translation tooling. Names like "The Morning" sound silly translated, but consistency beats a one-off carve-out.

**Open questions**

- **`include_once` ordering inside the wrapper's init callback.** v2-demo is loaded at default priority alongside v1 in the same closure. If a future change needs v2-demo registered _before_ v1's filters (vs. its current after-v1 stance), that closure will need restructuring. Not blocking Phase 2; flagging for Phase 3+.
- **No newspack-ui gap after all.** Initial impulse was to file three additions (stack `--grow`, sized-image primitive, stack hairline). Stack composition handles all three: outer `__stack--justify-between` for left/right pinning, `<img width height>` HTML attrs for size, and a styled `<hr>` between children of a `__stack--vertical`. The takeaway is process: when the brief's escape-hatch reflex fires, first try _more_ stacks before reaching for SCSS. Resolved without leaving the demo.
- **No-categories scenario.** Figma `4645:19732` is the flat variant. Phase 2 implements only the sectioned variant; the flat variant should land via `?v2-demo=no-categories` in Phase 6 (scenario fixtures). Not a blocker — every section already renders independently, so a flatten in `get_fake_data()` is trivial.

---

## Phase 3 — Donations list + detail

> See [brief §10 → Phase 3](my-account-v2-prototype-brief.md#phase-3--donations-list--detail-2-days). Figma frames listed in the brief.

**Date:** 2026-04-28
**By:** thomas@a8c.com
**PR:** [#4679](https://github.com/Automattic/newspack-plugin/pull/4679) (stacked)
**Commits:** _pending — code is staged on `prototype/my-account-demo`_
**Figma:** [`2636:46467`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46467), [`2636:46488`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46488), [`2636:46661`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46661), [`2636:46512`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46512), [`2636:46500`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=2636-46500), [`3619:292407`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=3619-292407), [`4339:17740`](https://www.figma.com/design/mkvHE3qozmmGrytPt9RGrV/My-Account?node-id=4339-17740)

**What I built**

The Donations list and detail surfaces, end-to-end. (a) Registered a `donations` rewrite endpoint with `EP_PAGES`, bumped `ENDPOINTS_VERSION` from 2 → 3 so the auto-flush guard re-runs once. (b) Hooked `woocommerce_account_donations_endpoint` to a single render function that distinguishes list vs. detail by reading `get_query_var('donations')` — bare endpoint = list, value = donation id (`don-001`, etc.). (c) Renamed the Phase 2 `redirect_non_demo_newsletters_endpoint` to `redirect_non_demo_v2_endpoints` and extended it to bounce non-demo guessers off `/my-account/donations/<anything>/` too. (d) Inserted a "Donations" sidebar item right after "Newsletters" in the v2 menu-items filter. (e) Extended the `query_vars` filter so WP doesn't strip the `donations` value during URL parsing.

The list template (Figma `2636:46467`) renders three sections: a "Recurring donation" Plan Card stack (one `__box --border` per active recurring), a "Previous donations" `<table>` (cancelled recurring + one-times sorted newest-first, with `data-href` on each `<tr>`), and a "Billing history" Button Card at the bottom (an `<a class="newspack-ui__box">` with a receipt SVG). The detail template handles all four functional variants from a single file, branching on `kind` + `status` + `fees_covered`: recurring/active gets the Edit donation button + "More" newspack-ui dropdown (Update payment method / Cancel donation); recurring/cancelled gets a CANCELLED badge + Restart donation button only + em-dash for next payment; one-time has no top-right buttons and one Donation date row; the no-fees variant (Figma `4339:17740`) is just `fees_covered = true` suppressing the entire Amount breakdown. donations.js wires row-click navigation in the previous-donations table (anchors aren't valid `<tr>` children) and stub snackbars for the modal-trigger buttons (Phase 5 swaps these for real modals).

Verified server-side: list renders 1 active recurring + 3 previous rows + the billing button; all four detail URLs resolve and render their variant correctly; anonymous + admin-without-flag both 302 to `/my-account/edit-account/`; the `?v2-demo=1` flag is preserved on every internal link (sidebar, Manage donation button, row-click hrefs, back-to-list chevron) via the existing `woocommerce_get_endpoint_url` filter. Console clean, no JS errors.

**What I learned**

`add_rewrite_endpoint` + the auto-flush guard isn't actually atomic on a fresh code load. After bumping `ENDPOINTS_VERSION` to 3, the first request to `/my-account/donations/` 404'd because PHP opcache was still serving the old class file — so `add_rewrite_endpoint('donations', EP_PAGES)` never ran during the flush, and the regenerated rules table contained `newsletters` but not `donations`. Solution on the dev box was `wp eval 'opcache_reset();'` + `wp option delete newspack_my_account_v2_demo_endpoints_version` + `wp rewrite flush`. In production this won't bite (deploys clear opcache), but it's worth noting that any phase whose ENDPOINTS_VERSION bump _intersects_ with an opcache cycle will need a one-time reset — flagging because Phase 4 will bump again for `subscriptions`.

The brief's recurring "no fees" variant (`4339:17740`) reads at first glance like a separate template variant. It's not — it's the same detail page with the Amount breakdown section omitted. A `fees_covered` boolean on the donation row is enough; the template just guards the whole `<section data-section-id="amount">` block. One flag, one branch. Worth documenting in the data shape so Phase 4 (which has its own `(no fees)` subscription variant) can reuse the pattern.

The reflex Phase 2 burned a cycle on fired again here. The Amount breakdown section in Figma uses two equal-width flex columns (label column / value column) — newspack-ui's `__stack` doesn't expose a `flex: 1` modifier, so my first pass had `style="flex:1"` inline on each child. I caught it before committing because of Phase 2's lesson, swapped to `__stack--horizontal --justify-between` per row (label flush-left, value flush-right at the page edges), and the visual reads cleanly at 768px even though it's not the exact 50/50 split Figma shows. Pure composition again. The escape hatch reflex I'm building: when a layout primitive seems missing, the answer is usually "split the section into multiple stacks where each stack is a single row" rather than "add flex-grow."

The other small lesson is the same reserved-globals trap Phase 2 hit. PHPCS rejects `$id`, `$status`, and `$title` as template variables. Renamed to `$donation_id`, `$donation_status`, and `$header_title`. The fix is mechanical now; the takeaway for Phase 4 is to skip those names from the start.

**Decisions and why**

- **Detail-page URLs use the rewrite endpoint's value parameter, not a query arg.** `add_rewrite_endpoint('donations', EP_PAGES)` natively accepts a value: `/my-account/donations/` sets `get_query_var('donations')` to `''`, `/my-account/donations/don-001/` sets it to `'don-001'`. That gives pretty URLs, requires no new query var, plays well with the auto-flush guard we already had, and the existing `false === get_query_var('donations', false)` redirect-bounce check works for both shapes (bare list URL and detail URL alike). The alternative — `/my-account/donations/?donation=<id>` — would have needed a second query var registration and uglier URLs.
- **`redirect_non_demo_newsletters_endpoint` was renamed/expanded, not duplicated.** Phase 2's redirect was newsletters-specific. Rather than ship a parallel `redirect_non_demo_donations_endpoint`, I generalised it to `redirect_non_demo_v2_endpoints` checking both query vars in one pass. Same redirect target, same caps gate; future endpoints just add another `false !== get_query_var(...)` line. Cheaper than N parallel functions.
- **One detail template, four functional variants, branching in markup** — I considered splitting into `donation-details-recurring.php` / `donation-details-one-time.php` to keep each file shorter. But the variants share ~80% of their structure (same header layout, same date-row rhythm, same payment-method row, same billing-history table); split files would have duplicated all of that. One file with four explicit `if ( $is_recurring && $is_active )` / `elseif ( $is_cancelled )` / `else` blocks is denser but reads top-to-bottom as the spec.
- **JS snackbar duplication is intentional for now.** `snackbar()` and `ensureSnackbarContainer()` in `donations.js` are copy-pasted from `newsletters.js`. Phase 5 modals will be the third caller — that's the right time to extract `src/my-account/v2-demo/util/snackbar.js`. Two callers is "rule of three" territory, not premature abstraction yet, and refactoring Phase 2 in a Phase 3 commit muddies the diff.
- **Currency rendered as `$` / USD, not `£`.** Brief §7 schema is USD; Figma frames render in £. The data is currency-neutral and a `currency_symbol` field controls the rendering. Stuck with USD per brief; Phase 6 scenario fixtures could flip this if needed.
- **Translatable fake data strings — same call as Phase 2.** Every visible string (`Donation`, `Subtotal`, `VAT`, `Transaction fee`, `Visa`, `Amex`, etc.) is wrapped in `__()`. The card brand wraps feel a bit silly translated, but consistency beats a one-off carve-out.
- **Row-click affordance via JS, not CSS.** `<tr data-href>` with a delegated click handler in `donations.js` navigates on click. Cursor:pointer styling would have required scoped SCSS — not worth the escape-hatch on a prototype that's still composing primarily from utility classes. The user can still click "Manage donation" on the active recurring card; the previous-donations rows are functionally clickable but visually static. Phase 6 polish can revisit if it bothers anyone.

**Open questions**

- **CANCELLED badge looks subtler than Figma.** newspack-ui's `__badge--error` uses `var(--newspack-ui-color-error-0)` (the lightest red tint) for background; Figma renders it noticeably more saturated. Either Figma is using a different badge variant we should add (`--badge--error-strong`?), or the Figma frame is out of sync with the current badge tokens. Flagging as a Phase 6 design-review topic before raising it as a `newspack-ui` change.
- **Detail-page section gap reads tall.** Each kv section is its own `<section>` in a `__stack--gap-6` ancestor; the visible whitespace between First/Latest/Next donation rows is bigger than Figma. The fix would be a smaller gap (e.g. `--gap-4`) for sibling kv sections or grouping them under a single section — happy to tweak in PR review.
- **No "Donations w/ billing history" inline scenario yet.** The `billing_history_inline` flag in the data wires the inline-table form (Figma `3619:292407`) but defaults to false. Phase 6's `?v2-demo=<scenario>` machinery should expose it via something like `?v2-demo=billing-history`. Not blocking Phase 3.
- **"New payment method" Figma variant (`2636:46500`) is data-equivalent to the active variant.** I render it as the same active-recurring template, with donations.js surfacing a "Payment method updated." snackbar on first paint when a `?payment-updated=1` flag is present. Phase 5 will add that flag to the update-payment-method modal flow. Calling it out so the variant doesn't get re-implemented in Phase 5.

---

---

## Phase 4 — Subscriptions list + detail

> See [brief §10 → Phase 4](my-account-v2-prototype-brief.md#phase-4--subscriptions-list--detail-2-days). Figma section `2636:46116`.

_(empty)_

---

## Phase 5 — Modals

> See [brief §10 → Phase 5](my-account-v2-prototype-brief.md#phase-5--modals-1-day). All six flows.

_(empty)_

---

## Phase 6 — Polish + scenario fixtures

> See [brief §10 → Phase 6](my-account-v2-prototype-brief.md#phase-6--polish--scenario-fixtures-05-day).

_(empty)_

---

## Decision log (cross-phase)

A flat list of decisions that span phases or that future-you will want to find without scrolling. Each row links to the phase entry where it was made.

| Date | Decision | Where it lives |
|------|----------|---------------|
| 2026-04-28 | `[DEPRECATED] Newspack / Button` instances in Figma map to `.newspack-ui__button`. The component was renamed in Figma but the rename hasn't propagated to every frame. Use the modern class everywhere. | Pre-Phase 1 (resolved with Thomas; closed brief §9 Q9 before kickoff) |
| 2026-04-28 | Newsletter row anatomy resolved from a rendered design Thomas shared: square thumbnail (full image, not icon — fake data uses `picsum.photos/seed/{slug}/128/128`), frequency badge (display labels: Daily / Weekly / Monthly / Twice weekly / As needed, plus free-text fallbacks), optional `SUBSCRIBER-ONLY` outline badge, separate "Unsubscribe from all" row at the bottom. Categories in the w/sections variant are always-expanded section labels, **not** accordions. | Pre-Phase 2 (resolved with Thomas; closed brief §9 Q4 — accordion question) |
| 2026-04-28 | v2-demo `include_once` lives in `class-woocommerce-my-account.php` next to the v1 includes, not in `class-newspack.php`. Reason: v1 isn't loaded from `class-newspack.php` either; that's where the version + Reader Activation gating lives. Brief §10 Step 3 updated to match. | Phase 1 |
| 2026-04-28 | Endpoint flush strategy: **auto-flush via a one-time guard**, not a documented manual `wp rewrite flush` step. Implementation: `update_option( 'newspack_my_account_v2_demo_endpoints_version', X )` after the first flush, bumped each phase that adds an endpoint so the flush re-runs exactly once per change. Reason: the demo audience won't have CLI access. | Phase 1 sync (resolves brief §9 risk #2) |
| 2026-04-28 | All phases stack on the single draft PR #4679 (`prototype/my-account-demo`). Title and description updated on each push. Whole prototype lands as one merge once Phase 6 wraps. | Phase 1 sync |
| 2026-04-28 | When the prototype is ripped out (post-Phase 6 / when productionised into v1), cleanup must include: deleting the `newspack_my_account_v2_demo_endpoints_version` option, re-flushing rewrite rules so `/my-account/newsletters/` etc. stop resolving, and removing the body class scope. Tracked as a Phase 6 task. | Phase 1 sync |
| 2026-04-28 | Login-redirect query-string strip (logging in with `redirect_to=/my-account/?v2-demo=1` lands on `/edit-account/` without the flag) is **deferred to Phase 2**. Workaround in the meantime: bookmark a sub-endpoint URL like `/my-account/edit-account/?v2-demo=1`. Phase 2 will wrap `wc_get_account_endpoint_url()` to re-append the flag on every internal nav link, which absorbs the post-login case too. | Phase 1 sync (resolves brief §9 risk #4 timing) |
| 2026-04-28 | Endpoint registration must call `self::register_endpoints()` directly from the class' `init()` — _not_ `add_action('init', …)`. The class is itself loaded inside an `init` callback, so a deferred action registers too late and never fires. Direct call is effectively running on `init` priority 10, same moment WC core registers its endpoints. Code comment in `class-my-account-ui-v2-demo.php` explains the trap. | Phase 2 |
| 2026-04-28 | `ENDPOINTS_VERSION` constant bumped to `2` for Phase 2 (registers `newsletters`). Bump again in each subsequent phase that adds an endpoint (`donations` in Phase 3) so the auto-flush guard re-runs exactly once per change. | Phase 2 |
| 2026-04-28 | No newspack-ui additions needed for the newsletter row layout. Nested `__stack` (horizontal/vertical), `__stack--justify-between` for left/right pinning, `<img width height>` for image size, and `<hr>` (already styled by `_dividers.scss`) between vertical-stack children cover everything. Reinforces the brief §2.1 reflex: try more stacks before reaching for scoped SCSS. | Phase 2 |
| 2026-04-28 | Donation detail-page URLs use the rewrite endpoint's native value parameter — `/my-account/donations/<id>/` sets `get_query_var('donations')` to the id; bare `/my-account/donations/` sets it to `''`. No second query var, pretty URLs, single redirect-bounce check (`false === get_query_var('donations', false)`) covers list and detail alike. | Phase 3 |
| 2026-04-28 | `ENDPOINTS_VERSION` constant bumped to `3` for Phase 3 (`donations` is now registered alongside `newsletters`). Subsequent endpoint phases continue to bump per the auto-flush guard contract. | Phase 3 |
| 2026-04-28 | The auto-flush guard isn't atomic against PHP opcache. After the version bump, the first request that misses opcache (or the dev box that hadn't reset it) leaves the new endpoint un-registered before the flush — rules table contains the old set. Production deploys clear opcache so this won't bite, but dev/staging may need a one-shot `wp eval 'opcache_reset();'` + option-delete + `wp rewrite flush`. Flagging because each endpoint phase will face the same window. | Phase 3 |
| 2026-04-28 | Phase 2's `redirect_non_demo_newsletters_endpoint` was renamed to `redirect_non_demo_v2_endpoints` and generalised to check both `newsletters` and `donations` query vars in one pass. Future endpoint phases extend this single function rather than ship a parallel `redirect_non_demo_<thing>_endpoint`. | Phase 3 |
| 2026-04-28 | The recurring "no fees" detail variant (Figma `4339:17740`) is a `fees_covered = true` flag suppressing the Amount breakdown — one branch in the existing detail template, not a separate template. Phase 4's subscription `(no fees)` variant should reuse the same flag pattern. | Phase 3 |
| 2026-04-28 | newspack-ui has no `flex: 1` / equal-width-columns utility on `__stack`. The Figma 50/50 column layout (Amount section's label/value columns) was rebuilt as a vertical stack of horizontal `__stack--justify-between` rows — labels flush-left, values flush-right at the page edges. Pure composition; reads cleanly at 768px. The reflex when a layout primitive seems missing is "split into multiple single-row stacks," not "add `flex-grow`." | Phase 3 |

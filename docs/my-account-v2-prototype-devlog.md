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

_(empty — fill in when you start Phase 2)_

---

## Phase 3 — Donations list + detail

> See [brief §10 → Phase 3](my-account-v2-prototype-brief.md#phase-3--donations-list--detail-2-days). Figma frames listed in the brief.

_(empty)_

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

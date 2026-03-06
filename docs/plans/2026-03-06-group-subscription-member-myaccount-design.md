# Design: Group Subscription Member View in My Account

**Date:** 2026-03-06
**Scope:** `newspack-plugin` — `includes/plugins/woocommerce-subscriptions/group-subscription/`

## Problem

Users who are members of a group subscription (added by the subscription owner) have no way to view that subscription in My Account. The Subscriptions nav item is hidden for them, and WCS's `view-subscription` endpoint denies access since they are not the subscription owner.

## Goal

Allow group subscription members to see their group subscription in the My Account Subscriptions section, using standard WCS templates with a view-only experience. Custom restricted templates (e.g., hiding billing history) can be built in a follow-up.

## Decisions

- **Approach:** Filter `wcs_get_users_subscriptions` to inject group subscriptions, guarded to My Account pages only.
- **Mixed scenario (member + own subscription):** Both appear in the same list; the group subscription is visually badged as "Group subscription."
- **Detail view:** Full standard WCS template, but all action buttons stripped.
- **Scope guard:** All new behavior is limited to `is_account_page()` to prevent side effects in non-account contexts (e.g., trial-limit checks).

## Architecture

Four targeted changes — three new/modified methods in `Group_Subscription_MyAccount`, one template edit.

### 1. Inject group subscriptions into the subscriptions list

**Hook:** `wcs_get_users_subscriptions`, priority 15 (after the existing trash filter at priority 10)
**New method:** `inject_member_group_subscriptions( $subscriptions, $user_id )`

Logic:
- Guard: `is_account_page()` only.
- Get group subscriptions for user via `Group_Subscription::get_group_subscriptions_for_user( $user_id )` (returns `WC_Subscription[]`).
- Filter out trashed subscriptions.
- Deduplicate against existing subscriptions by ID.
- Merge and return.

**Cascade effects of this single filter:**
- Subscriptions list table shows the group subscription.
- `wcs_user_has_subscription()` internally calls `wcs_get_users_subscriptions()`, so the Subscriptions nav item becomes visible for group-member-only users automatically.
- `wcs_get_users_subscriptions()` called in `subscription-header.php` reflects the correct total count, so `$is_single` and the single-subscription redirect work correctly.

### 2. Grant `view_order` capability to group members

**Hook:** `map_meta_cap`, priority 15 (after WC's handler)
**New method:** `grant_group_member_view_order_cap( $caps, $cap, $user_id, $args )`

Logic:
- Guard: `is_account_page()` and `'view_order' === $cap`.
- Resolve subscription from `$args[0]`.
- If user is a group member of the subscription → return `['read']`, overriding WC's default `['manage_woocommerce']` mapping for non-owners.

WCS checks `current_user_can( 'view_order', $subscription->get_id() )` in `WCS_Template_Loader::get_view_subscription_template()` before rendering. Our hook runs after WC's `map_meta_cap` handler and replaces the required primitive capability with `read` (which all logged-in users have), granting access.

### 3. Strip all actions for non-manager group members

**Hook:** existing `wcs_view_subscription_actions` filter at priority 13
**Modified method:** `view_subscription_actions( $actions, $subscription, $user_id )`

Refactor the existing method to handle two explicit cases for group subscriptions:

1. **Non-manager group member** (user is a member but not the subscription owner/manager): return `[]` — no actions.
2. **Manager** (user is the subscription owner and a manager): add the "Manage members" action as before.

WCS's `wcs_get_all_user_actions_for_subscription()` already guards `reactivate`/`cancel`/`resubscribe` behind `edit_shop_subscription_status` — group members won't have this, so the initial actions array is already empty. The filter cleans up any actions added by other `wcs_view_subscription_actions` hooks (change payment method, address edit, early renewal, etc.) that may not independently check subscription ownership.

### 4. Visual badge in the subscriptions list template

**File:** `includes/plugins/woocommerce/my-account/templates/v1/my-subscriptions.php`

In the product name cell, detect if the current user is a non-owner group member:
```
$subscription->get_customer_id() !== get_current_user_id()
  && Group_Subscription::is_group_subscription( $subscription )
```
If true, render a badge after the product name using the existing badge pattern:
```html
<span class="newspack-ui__badge newspack-ui__badge--secondary">
  Group subscription
</span>
```

## What This Does Not Cover

- Custom restricted template for members (e.g., hiding billing history, orders table). This is a follow-up.
- Manager-only vs. member-only My Account menu items beyond the Subscriptions tab.
- Edge cases where a user is both manager and member of different group subscriptions simultaneously (handled naturally by existing `is_group_subscription` + `user_is_member` checks per subscription).

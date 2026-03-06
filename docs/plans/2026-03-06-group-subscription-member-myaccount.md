# Group Subscription Member My Account View — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow group subscription members to see and view their group subscription in My Account's Subscriptions section, with a view-only experience (no action buttons).

**Architecture:** Filter `wcs_get_users_subscriptions` to inject group subscriptions on account pages (cascades naturally to nav visibility and redirect behavior); grant `view_order` capability to group members via `map_meta_cap`; strip actions for non-manager group members via the existing `wcs_view_subscription_actions` filter; badge group subscriptions in the list template.

**Tech Stack:** PHP/WordPress hooks, WooCommerce Subscriptions filter system, PHPUnit for unit tests.

**Design doc:** `docs/plans/2026-03-06-group-subscription-member-myaccount-design.md`

---

## Context for implementors

### Key files

- **Main implementation file:** `includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`
- **Template to modify:** `includes/plugins/woocommerce/my-account/templates/v1/my-subscriptions.php`
- **New test file:** `tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`
- **Existing test helpers to copy pattern from:** `tests/unit-tests/content-gate/group-subscriptions.php`
- **WC mock functions:** `tests/mocks/wc-mocks.php` — contains `WC_Subscription`, `wcs_create_subscription()`, `wcs_get_subscription()`, `wcs_get_users_subscriptions()`

### How the test environment works

- `wcs_create_subscription($data)` adds a `WC_Subscription` to `$GLOBALS['subscriptions_database']`
- `wcs_get_subscription($id)` looks up by ID from that global
- `wcs_get_users_subscriptions($user_id)` returns subscriptions where `get_customer_id() === $user_id` — does **not** apply the WP filter
- `is_account_page()` does **not** exist in the test environment — methods guard on `function_exists('is_account_page')`, so they return early in tests unless we stub it
- Tests must define `is_account_page()` via a `function_exists` guard in the test file and control its return value via a global

### Running a specific test

```bash
cd repos/newspack-plugin
n test-php --filter TestGroupSubscriptionMyAccount
# or by group:
n test-php --group group-subscription-myaccount
```

---

## Task 1: Test infrastructure — new test file + `is_account_page` mock

**Files:**
- Create: `tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`

**Step 1: Create the test file with shared helpers and `is_account_page` mock**

```php
<?php
/**
 * Tests for Group_Subscription_MyAccount My Account integration.
 *
 * @package Newspack\Tests
 * @group group-subscription-myaccount
 */

namespace Newspack\Tests;

use Newspack\Group_Subscription;
use Newspack\Group_Subscription_MyAccount;
use Newspack\Group_Subscription_Settings;

// Stub is_account_page() so we can control it in tests.
// The real function is provided by WooCommerce and absent in the test environment.
if ( ! function_exists( 'is_account_page' ) ) {
	function is_account_page() {
		return $GLOBALS['newspack_test_is_account_page'] ?? false;
	}
}

// Stub wc_get_endpoint_url() used by get_manage_members_url().
if ( ! function_exists( 'wc_get_endpoint_url' ) ) {
	function wc_get_endpoint_url( $endpoint, $value = '', $permalink = '' ) {
		return $permalink . $endpoint . '/' . $value;
	}
}

// Stub wc_get_page_permalink() used by get_manage_members_url().
if ( ! function_exists( 'wc_get_page_permalink' ) ) {
	function wc_get_page_permalink( $page ) {
		return 'https://example.com/my-account/';
	}
}

/**
 * Test Group_Subscription_MyAccount My Account integration.
 */
class Test_Group_Subscription_MyAccount extends \WP_UnitTestCase {

	/**
	 * User IDs tracked for teardown.
	 *
	 * @var int[]
	 */
	protected $user_ids = [];

	/**
	 * Set up: simulate being on the account page.
	 */
	public function set_up() {
		parent::set_up();
		$GLOBALS['newspack_test_is_account_page'] = true;
	}

	/**
	 * Tear down: reset globals and subscriptions DB.
	 */
	public function tear_down() {
		global $subscriptions_database;
		$subscriptions_database = [];

		unset( $GLOBALS['newspack_test_is_account_page'] );

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = [];

		wp_set_current_user( 0 );
		parent::tear_down();
	}

	// ---- Helpers ----

	/**
	 * Create a reader user.
	 */
	private function create_reader_user( string $email = '' ): int {
		if ( ! $email ) {
			$email = 'reader-' . wp_generate_password( 6, false ) . '@test.com';
		}
		$user_id = wp_insert_user(
			[
				'user_login' => 'reader-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => $email,
				'role'       => 'subscriber',
			]
		);
		update_user_meta( $user_id, '_newspack_reader', true );
		$this->user_ids[] = $user_id;
		return $user_id;
	}

	/**
	 * Create a group subscription owned by $customer_id.
	 */
	private function create_group_subscription( int $customer_id ): \WC_Subscription {
		$sub = wcs_create_subscription(
			[
				'customer_id'    => $customer_id,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		return $sub;
	}

	/**
	 * Create a regular (non-group) subscription owned by $customer_id.
	 */
	private function create_regular_subscription( int $customer_id ): \WC_Subscription {
		return wcs_create_subscription(
			[
				'customer_id'    => $customer_id,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);
	}

	/**
	 * Add $member_id as a member of $subscription.
	 */
	private function add_member( int $member_id, \WC_Subscription $subscription ): void {
		add_user_meta( $member_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $subscription->get_id() );
	}
}
```

**Step 2: Run the (empty) test to verify setup**

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: 0 tests, no errors. Fix any PHP errors before continuing.

**Step 3: Commit**

```bash
cd repos/newspack-plugin
git add tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php
git commit -m "test: scaffold group subscription myaccount test class"
```

---

## Task 2: Inject group subscriptions — `inject_member_group_subscriptions`

**Files:**
- Modify: `includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`
- Modify: `tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`

### Step 1: Write failing tests

Add these test methods to `Test_Group_Subscription_MyAccount`:

```php
/**
 * Group subscriptions the user is a member of are injected into the list.
 */
public function test_inject_member_group_subscriptions_adds_group_sub() {
    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    $this->add_member( $member_id, $group_sub );

    // Start with an empty list (member has no owned subscriptions).
    $result = Group_Subscription_MyAccount::inject_member_group_subscriptions( [], $member_id );

    $this->assertArrayHasKey(
        $group_sub->get_id(),
        $result,
        'Group subscription should be injected for the member'
    );
}

/**
 * A subscription the member also owns is not duplicated.
 */
public function test_inject_does_not_duplicate_existing_subscription() {
    $owner_id  = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    // Owner is also a member via get_managers() check.
    $existing  = [ $group_sub->get_id() => $group_sub ];

    $result = Group_Subscription_MyAccount::inject_member_group_subscriptions( $existing, $owner_id );

    $this->assertCount( 1, $result, 'Should not duplicate a subscription already in the list' );
}

/**
 * Injection is skipped when not on an account page.
 */
public function test_inject_skipped_when_not_on_account_page() {
    $GLOBALS['newspack_test_is_account_page'] = false;

    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    $this->add_member( $member_id, $group_sub );

    $result = Group_Subscription_MyAccount::inject_member_group_subscriptions( [], $member_id );

    $this->assertEmpty( $result, 'Should not inject when not on account page' );
}

/**
 * Trashed group subscriptions are excluded.
 */
public function test_inject_excludes_trashed_subscriptions() {
    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();

    // Create a trashed group subscription.
    $trashed_sub = wcs_create_subscription(
        [
            'customer_id'    => $owner_id,
            'status'         => 'trash',
            'billing_period' => 'month',
        ]
    );
    $trashed_sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
    $this->add_member( $member_id, $trashed_sub );

    $result = Group_Subscription_MyAccount::inject_member_group_subscriptions( [], $member_id );

    $this->assertArrayNotHasKey(
        $trashed_sub->get_id(),
        $result,
        'Trashed subscription should not be injected'
    );
}
```

### Step 2: Run tests to verify they fail

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: 4 errors/failures with "Call to undefined method" or similar. The method doesn't exist yet.

### Step 3: Add `inject_member_group_subscriptions` and hook it in `init()`

In `class-group-subscription-myaccount.php`, add the hook in `init()`:

```php
add_filter( 'wcs_get_users_subscriptions', [ __CLASS__, 'inject_member_group_subscriptions' ], 15, 2 );
```

Then add the method:

```php
/**
 * Inject group subscriptions the current user is a member of into the subscriptions list.
 *
 * Only runs on My Account pages to avoid side effects (e.g. trial limit checks)
 * in non-account contexts.
 *
 * @param array $subscriptions Existing subscriptions keyed by subscription ID.
 * @param int   $user_id       The user ID.
 *
 * @return array
 */
public static function inject_member_group_subscriptions( $subscriptions, $user_id ) {
    if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() ) {
        return $subscriptions;
    }
    $existing_ids        = array_keys( $subscriptions );
    $group_subscriptions = Group_Subscription::get_group_subscriptions_for_user( $user_id );
    foreach ( $group_subscriptions as $group_subscription ) {
        if ( ! ( $group_subscription instanceof \WC_Subscription ) ) {
            continue;
        }
        if ( $group_subscription->has_status( 'trash' ) ) {
            continue;
        }
        if ( in_array( $group_subscription->get_id(), $existing_ids, true ) ) {
            continue;
        }
        $subscriptions[ $group_subscription->get_id() ] = $group_subscription;
    }
    return $subscriptions;
}
```

### Step 4: Run tests to verify they pass

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: 4 tests pass.

### Step 5: Commit

```bash
cd repos/newspack-plugin
git add includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php \
        tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php
git commit -m "feat(group-subscription): inject member group subscriptions into My Account list"
```

---

## Task 3: Grant `view_order` capability — `grant_group_member_view_order_cap`

**Files:**
- Modify: `includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`
- Modify: `tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`

### Step 1: Write failing tests

```php
/**
 * Group member receives ['read'] caps for view_order on their group subscription.
 */
public function test_grant_view_order_cap_for_group_member() {
    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    $this->add_member( $member_id, $group_sub );

    $result = Group_Subscription_MyAccount::grant_group_member_view_order_cap(
        [ 'manage_woocommerce' ], // WC's default mapping for non-owners
        'view_order',
        $member_id,
        [ $group_sub->get_id() ]
    );

    $this->assertEquals( [ 'read' ], $result, 'Group member should receive read cap for view_order' );
}

/**
 * Non-member does not get elevated caps.
 */
public function test_does_not_grant_view_order_cap_for_non_member() {
    $owner_id  = $this->create_reader_user();
    $stranger  = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );

    $original_caps = [ 'manage_woocommerce' ];
    $result        = Group_Subscription_MyAccount::grant_group_member_view_order_cap(
        $original_caps,
        'view_order',
        $stranger,
        [ $group_sub->get_id() ]
    );

    $this->assertEquals( $original_caps, $result, 'Non-member should not receive elevated caps' );
}

/**
 * Capability is not granted when not on an account page.
 */
public function test_grant_view_order_cap_skipped_off_account_page() {
    $GLOBALS['newspack_test_is_account_page'] = false;

    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    $this->add_member( $member_id, $group_sub );

    $original_caps = [ 'manage_woocommerce' ];
    $result        = Group_Subscription_MyAccount::grant_group_member_view_order_cap(
        $original_caps,
        'view_order',
        $member_id,
        [ $group_sub->get_id() ]
    );

    $this->assertEquals( $original_caps, $result, 'Should not grant cap outside account page' );
}

/**
 * Unrelated capabilities are passed through unchanged.
 */
public function test_grant_view_order_cap_ignores_other_caps() {
    $member_id     = $this->create_reader_user();
    $original_caps = [ 'manage_woocommerce' ];

    $result = Group_Subscription_MyAccount::grant_group_member_view_order_cap(
        $original_caps,
        'edit_posts', // different capability
        $member_id,
        [ 999 ]
    );

    $this->assertEquals( $original_caps, $result, 'Non-view_order caps should be passed through unchanged' );
}
```

### Step 2: Run tests to verify they fail

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: 4 new failures.

### Step 3: Add `grant_group_member_view_order_cap` and hook it in `init()`

Add the hook in `init()`:

```php
add_filter( 'map_meta_cap', [ __CLASS__, 'grant_group_member_view_order_cap' ], 15, 4 );
```

Add the method:

```php
/**
 * Grant the `view_order` capability to group subscription members on My Account pages.
 *
 * WCS checks current_user_can( 'view_order', $subscription->get_id() ) before rendering
 * the view-subscription template. WC maps view_order → manage_woocommerce for non-owners.
 * We override this to 'read' (a primitive cap all logged-in users have) for group members.
 *
 * @param string[] $caps    Primitive capabilities required.
 * @param string   $cap     The meta capability being checked.
 * @param int      $user_id The user ID.
 * @param array    $args    Additional arguments; $args[0] is the post/order ID.
 *
 * @return string[]
 */
public static function grant_group_member_view_order_cap( $caps, $cap, $user_id, $args ) {
    if ( 'view_order' !== $cap || ! function_exists( 'is_account_page' ) || ! \is_account_page() ) {
        return $caps;
    }
    $order_id     = isset( $args[0] ) ? absint( $args[0] ) : 0;
    $subscription = WooCommerce_Subscriptions::sanitize_subscription( $order_id );
    if ( ! $subscription ) {
        return $caps;
    }
    if ( Group_Subscription::user_is_member( $user_id, $subscription ) ) {
        return [ 'read' ];
    }
    return $caps;
}
```

### Step 4: Run tests to verify they pass

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: all tests pass.

### Step 5: Commit

```bash
cd repos/newspack-plugin
git add includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php \
        tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php
git commit -m "feat(group-subscription): grant view_order cap to group members on My Account"
```

---

## Task 4: Strip actions for non-manager group members — refactor `view_subscription_actions`

**Files:**
- Modify: `includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`
- Modify: `tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php`

### Step 1: Write failing tests

The existing method currently returns `$actions` unchanged for group members (non-owners). The tests below verify the new behavior: empty array for non-manager members, and correct behavior for managers and non-group subscriptions.

```php
/**
 * Non-manager group members get an empty actions array.
 */
public function test_view_subscription_actions_empty_for_non_manager_member() {
    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    $this->add_member( $member_id, $group_sub );

    $result = Group_Subscription_MyAccount::view_subscription_actions(
        [ 'cancel' => [ 'url' => '#', 'name' => 'Cancel' ] ],
        $group_sub,
        $member_id
    );

    $this->assertEmpty( $result, 'Non-manager group members should see no actions' );
}

/**
 * The subscription owner/manager gets a "Manage members" action added.
 */
public function test_view_subscription_actions_adds_manage_members_for_manager() {
    $owner_id  = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );

    $result = Group_Subscription_MyAccount::view_subscription_actions(
        [],
        $group_sub,
        $owner_id
    );

    $this->assertArrayHasKey( 'manage_members', $result, 'Manager should see Manage members action' );
    $this->assertStringContainsString( 'manage-members', $result['manage_members']['url'] );
}

/**
 * Non-group subscriptions are not modified.
 */
public function test_view_subscription_actions_unchanged_for_regular_subscription() {
    $owner_id    = $this->create_reader_user();
    $regular_sub = $this->create_regular_subscription( $owner_id );
    $actions     = [ 'cancel' => [ 'url' => '#', 'name' => 'Cancel' ] ];

    $result = Group_Subscription_MyAccount::view_subscription_actions(
        $actions,
        $regular_sub,
        $owner_id
    );

    $this->assertEquals( $actions, $result, 'Regular subscription actions should be returned unchanged' );
}

/**
 * Actions are unchanged when not on an account page.
 */
public function test_view_subscription_actions_unchanged_off_account_page() {
    $GLOBALS['newspack_test_is_account_page'] = false;

    $owner_id  = $this->create_reader_user();
    $member_id = $this->create_reader_user();
    $group_sub = $this->create_group_subscription( $owner_id );
    $this->add_member( $member_id, $group_sub );
    $actions = [ 'cancel' => [ 'url' => '#', 'name' => 'Cancel' ] ];

    $result = Group_Subscription_MyAccount::view_subscription_actions(
        $actions,
        $group_sub,
        $member_id
    );

    $this->assertEquals( $actions, $result, 'Actions should be unchanged when not on account page' );
}
```

### Step 2: Run tests to verify that the non-manager test fails

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: `test_view_subscription_actions_empty_for_non_manager_member` fails (currently returns actions unchanged).

### Step 3: Refactor `view_subscription_actions`

Replace the existing `view_subscription_actions` method body with:

```php
public static function view_subscription_actions( $actions, $subscription, $user_id ) {
    if ( ! function_exists( 'is_account_page' ) || ! \is_account_page() || ! Group_Subscription::is_group_subscription( $subscription ) ) {
        return $actions;
    }

    // Non-manager group members get a view-only experience: no actions.
    if ( $subscription->get_customer_id() !== $user_id && Group_Subscription::user_is_member( $user_id, $subscription ) ) {
        return [];
    }

    // Managers (subscription owners) get a "Manage members" action.
    if ( $subscription->get_customer_id() === $user_id && Group_Subscription::user_is_manager( $user_id, $subscription ) ) {
        $actions['manage_members'] = [
            'url'  => self::get_manage_members_url( $subscription ),
            'name' => __( 'Manage members', 'newspack-plugin' ),
        ];
    }

    return $actions;
}
```

### Step 4: Run tests to verify all pass

```bash
cd repos/newspack-plugin
n test-php --filter Test_Group_Subscription_MyAccount
```

Expected: all tests pass.

### Step 5: Commit

```bash
cd repos/newspack-plugin
git add includes/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php \
        tests/unit-tests/plugins/woocommerce-subscriptions/group-subscription/class-group-subscription-myaccount.php
git commit -m "feat(group-subscription): strip actions for non-manager group members in subscription view"
```

---

## Task 5: Badge group subscriptions in `my-subscriptions.php` template

This is a template change with no PHP unit test. Verify manually.

**Files:**
- Modify: `includes/plugins/woocommerce/my-account/templates/v1/my-subscriptions.php`

### Step 1: Identify the product name cell

In `my-subscriptions.php`, the product name cell is around line 36-43:

```php
<td class="subscription-product-name ...">
    <?php
    $items = $subscription->get_items();
    if ( ! empty( $items ) ) {
        $item = reset( $items );
        echo esc_html( $item->get_name() );
    }
    ?>
</td>
```

### Step 2: Add the group membership badge

Replace the product name cell contents with:

```php
<td class="subscription-product-name woocommerce-orders-table__cell woocommerce-orders-table__cell-subscription-product-name woocommerce-orders-table__cell-order-product-name" data-title="<?php esc_attr_e( 'Product', 'newspack-plugin' ); ?>">
    <?php
    $items = $subscription->get_items();
    if ( ! empty( $items ) ) {
        $item = reset( $items );
        echo esc_html( $item->get_name() );
    }
    $is_group_member_subscription = function_exists( 'Newspack\Group_Subscription::is_group_subscription' ) &&
        \Newspack\Group_Subscription::is_group_subscription( $subscription ) &&
        $subscription->get_customer_id() !== get_current_user_id();
    if ( $is_group_member_subscription ) :
        ?>
        <span class="newspack-ui__badge newspack-ui__badge--secondary">
            <?php esc_html_e( 'Group subscription', 'newspack-plugin' ); ?>
        </span>
    <?php endif; ?>
</td>
```

**Note on the function_exists check:** `Group_Subscription::is_group_subscription` is a static method, not a function. The correct guard is `class_exists( 'Newspack\\Group_Subscription' )`. Use that instead:

```php
$is_group_member_subscription = class_exists( 'Newspack\\Group_Subscription' )
    && \Newspack\Group_Subscription::is_group_subscription( $subscription )
    && $subscription->get_customer_id() !== get_current_user_id();
```

### Step 3: Manual verification steps

In the local WordPress environment:

1. **Log in as a reader who is a group subscription member** (not the owner).
2. Go to **My Account** → confirm the "Subscriptions" menu item is visible.
3. Confirm the subscriptions list shows the group subscription with a "Group subscription" badge next to the product name.
4. Click **View** on the group subscription.
5. Confirm the full subscription detail page renders (product, status, dates, billing history).
6. Confirm **no action buttons** appear (no cancel, no change payment, no manage members).
7. **Log in as the group subscription owner** — confirm they still see the "Manage members" action button on the detail page.
8. **Log in as a reader with their own subscription AND group membership** — confirm both appear in the list; own subscription has no badge, group subscription has the badge.

### Step 4: Commit

```bash
cd repos/newspack-plugin
git add includes/plugins/woocommerce/my-account/templates/v1/my-subscriptions.php
git commit -m "feat(group-subscription): badge group subscriptions in My Account list"
```

---

## Task 6: Full test suite — verify nothing is broken

### Step 1: Run the full plugin test suite

```bash
cd repos/newspack-plugin
n test-php
```

Expected: all existing tests still pass. Fix any regressions before moving on.

### Step 2: Run only the group subscription tests

```bash
cd repos/newspack-plugin
n test-php --group group-subscription-myaccount
```

Expected: all new tests pass.

### Step 3: Final commit if any fixes were needed

If you made any fixes to pass the full suite, commit them with an appropriate message.

---

## Quick reference: Existing code you'll be touching

### `init()` in `class-group-subscription-myaccount.php` (around line 39–50)

Add two new `add_filter` calls inside `init()` alongside the existing ones:

```php
add_filter( 'wcs_get_users_subscriptions', [ __CLASS__, 'inject_member_group_subscriptions' ], 15, 2 );
add_filter( 'map_meta_cap', [ __CLASS__, 'grant_group_member_view_order_cap' ], 15, 4 );
```

### Existing `view_subscription_actions` (around line 129–138)

This method is already hooked at priority 13 on `wcs_view_subscription_actions`. Task 4 refactors only the method body; the hook registration in `init()` stays as-is.

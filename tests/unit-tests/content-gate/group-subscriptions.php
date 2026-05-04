<?php
/**
 * Tests for the Group Subscription classes.
 *
 * @package Newspack\Tests\Content_Gate
 */

namespace Newspack\Tests\Content_Gate;

use Newspack\Group_Subscription;
use Newspack\Group_Subscription_Invite;
use Newspack\Group_Subscription_Settings;

/**
 * Tests for the Group Subscription and Group Subscription Invite classes.
 */
class Test_Group_Subscriptions extends \WP_UnitTestCase {

	/**
	 * User IDs for cleanup.
	 *
	 * @var int[]
	 */
	protected $user_ids = [];

	/**
	 * Teardown after tests.
	 */
	public function tear_down() {
		global $subscriptions_database;
		$subscriptions_database = [];

		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = [];

		wp_set_current_user( 0 );
		parent::tear_down();
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	/**
	 * Create a WC_Subscription for a given customer and register it in the
	 * global subscriptions database.
	 *
	 * @param int   $customer_id Customer/owner user ID.
	 * @param array $settings    Optional group-subscription settings to apply.
	 *                           Supported keys: 'enabled' (bool), 'limit' (int), 'name' (string).
	 * @return \WC_Subscription
	 */
	private function create_group_subscription( $customer_id, $settings = [] ) {
		$settings  = array_merge(
			[
				'enabled' => true,
				'limit'   => 0,
				'name'    => '',
			],
			$settings
		);
		$sub       = wcs_create_subscription(
			[
				'customer_id'    => $customer_id,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);
		// Enable group subscription directly via meta (mirrors how the settings
		// class stores and retrieves the data).
		if ( $settings['enabled'] ) {
			$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		}
		if ( $settings['limit'] > 0 ) {
			$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'limit', $settings['limit'] );
		}
		if ( ! empty( $settings['name'] ) ) {
			$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'name', $settings['name'] );
		}
		return $sub;
	}

	/**
	 * Create a plain (non-group) subscription.
	 *
	 * @param int $customer_id Customer/owner user ID.
	 * @return \WC_Subscription
	 */
	private function create_regular_subscription( $customer_id ) {
		return wcs_create_subscription(
			[
				'customer_id'    => $customer_id,
				'status'         => 'active',
				'billing_period' => 'month',
			]
		);
	}

	/**
	 * Create a reader user directly without going through Reader_Activation::register_reader()
	 * (which would authenticate and block subsequent registrations in the same test).
	 *
	 * @param string $email Optional reader email.
	 * @return int User ID.
	 */
	private function create_reader_user( $email = null ) {
		if ( ! $email ) {
			$email = 'reader-' . wp_generate_password( 6, false ) . '@group-test.com';
		}
		$user_id = wp_insert_user(
			[
				'user_login' => 'reader-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => $email,
				'role'       => 'subscriber',
			]
		);
		if ( ! is_wp_error( $user_id ) ) {
			// Mark as a reader so Reader_Activation::is_user_reader() returns true.
			update_user_meta( $user_id, '_newspack_reader', true );
			$this->user_ids[] = $user_id;
		}
		return $user_id;
	}

	/**
	 * Create a WordPress administrator user and grant the manage_woocommerce cap.
	 *
	 * @return int User ID.
	 */
	private function create_admin_user() {
		$user_id = wp_insert_user(
			[
				'user_login' => 'test-admin-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => 'admin-' . wp_generate_password( 6, false ) . '@test.com',
				'role'       => 'administrator',
			]
		);
		// Grant the WooCommerce capability manually since WC is mocked.
		$user = new \WP_User( $user_id );
		$user->add_cap( 'manage_woocommerce' );

		$this->user_ids[] = $user_id;
		return $user_id;
	}

	// -------------------------------------------------------------------------
	// Group_Subscription tests
	// -------------------------------------------------------------------------

	/**
	 * Test is_group_subscription() returns true for enabled group subscriptions
	 * and false for regular subscriptions.
	 */
	public function test_is_group_subscription() {
		$reader_id   = $this->create_reader_user();
		$group_sub   = $this->create_group_subscription( $reader_id );
		$regular_sub = $this->create_regular_subscription( $reader_id );

		$this->assertTrue(
			Group_Subscription::is_group_subscription( $group_sub ),
			'Enabled group subscription should return true'
		);
		$this->assertFalse(
			Group_Subscription::is_group_subscription( $regular_sub ),
			'Regular subscription without group meta should return false'
		);
	}

	/**
	 * Test is_group_subscription() also accepts a subscription ID.
	 */
	public function test_is_group_subscription_by_id() {
		$reader_id = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $reader_id );

		$this->assertTrue(
			Group_Subscription::is_group_subscription( $group_sub->get_id() ),
			'Should resolve subscription by ID'
		);
		$this->assertFalse(
			Group_Subscription::is_group_subscription( 99999 ),
			'Non-existent ID should return false'
		);
	}

	/**
	 * Test get_managers() returns the subscription owner.
	 */
	public function test_get_managers() {
		$reader_id = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $reader_id );

		$managers = Group_Subscription::get_managers( $group_sub );

		$this->assertCount( 1, $managers, 'Should have exactly one manager' );
		$this->assertContains( $reader_id, $managers, 'Owner should be listed as manager' );
	}

	/**
	 * Test get_managers() with a non-existent subscription returns an empty-ish result.
	 */
	public function test_get_managers_invalid_subscription() {
		$managers = Group_Subscription::get_managers( 99999 );
		$this->assertContains( 0, $managers, 'Invalid subscription should return [0]' );
	}

	/**
	 * Test get_members() returns users who have the group subscription meta.
	 */
	public function test_get_members() {
		$owner_id   = $this->create_reader_user();
		$member1_id = $this->create_reader_user();
		$member2_id = $this->create_reader_user();
		$group_sub  = $this->create_group_subscription( $owner_id );

		// Manually add members via the user meta that get_members() queries.
		add_user_meta( $member1_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $group_sub->get_id() );
		add_user_meta( $member2_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $group_sub->get_id() );

		$members = Group_Subscription::get_members( $group_sub );

		// get_members() may return IDs as strings (raw from DB), so compare after casting.
		$members_int = array_map( 'intval', $members );
		$this->assertCount( 2, $members_int );
		$this->assertContains( (int) $member1_id, $members_int );
		$this->assertContains( (int) $member2_id, $members_int );
	}

	/**
	 * Test get_members() returns empty array for a subscription with no members.
	 */
	public function test_get_members_empty() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		$members = Group_Subscription::get_members( $group_sub );

		$this->assertIsArray( $members );
		$this->assertEmpty( $members );
	}

	/**
	 * Test update_members() adds reader users to the group subscription.
	 */
	public function test_update_members_add() {
		$owner_id  = $this->create_reader_user();
		$member_id = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		$result = Group_Subscription::update_members( $group_sub, [ $member_id ] );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'members_added', $result );
		$this->assertArrayHasKey( $member_id, $result['members_added'], 'Member should appear in added list' );

		$members = Group_Subscription::get_members( $group_sub );
		// get_members() may return IDs as strings (raw from DB), so compare after casting.
		$this->assertContains( (int) $member_id, array_map( 'intval', $members ), 'Member should appear in get_members()' );
	}

	/**
	 * Test update_members() skips non-reader users.
	 */
	public function test_update_members_skips_non_readers() {
		$owner_id    = $this->create_reader_user();
		$non_reader  = wp_insert_user(
			[
				'user_login' => 'editor-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => 'editor-' . wp_generate_password( 6, false ) . '@test.com',
				'role'       => 'editor',
			]
		);
		$this->user_ids[] = $non_reader;
		$group_sub = $this->create_group_subscription( $owner_id );

		$result = Group_Subscription::update_members( $group_sub, [ $non_reader ] );

		$this->assertEmpty( $result['members_added'], 'Non-readers should not be added' );
	}

	/**
	 * Test update_members() does not add a member who is already a member.
	 */
	public function test_update_members_no_duplicates() {
		$owner_id  = $this->create_reader_user();
		$member_id = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		Group_Subscription::update_members( $group_sub, [ $member_id ] );
		$result = Group_Subscription::update_members( $group_sub, [ $member_id ] );

		$this->assertEmpty( $result['members_added'], 'Duplicate member should not be added a second time' );
		$this->assertCount( 1, Group_Subscription::get_members( $group_sub ) );
	}

	/**
	 * Test update_members() returns WP_Error when member limit is reached.
	 */
	public function test_update_members_limit_enforcement() {
		$owner_id  = $this->create_reader_user();
		$member1   = $this->create_reader_user();
		$member2   = $this->create_reader_user();
		// Limit is 1.
		$group_sub = $this->create_group_subscription( $owner_id, [ 'limit' => 1 ] );

		Group_Subscription::update_members( $group_sub, [ $member1 ] );
		$result = Group_Subscription::update_members( $group_sub, [ $member2 ] );

		$this->assertWPError( $result, 'Adding beyond the limit should return WP_Error' );
	}

	/**
	 * Test update_members() removes members correctly.
	 */
	public function test_update_members_remove() {
		$owner_id  = $this->create_reader_user();
		$member_id = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		Group_Subscription::update_members( $group_sub, [ $member_id ] );
		$result = Group_Subscription::update_members( $group_sub, [], [ $member_id ] );

		$this->assertArrayHasKey( $member_id, $result['members_removed'], 'Member should appear in removed list' );
		$this->assertEmpty( Group_Subscription::get_members( $group_sub ), 'Member list should be empty after removal' );
	}

	/**
	 * Test user_is_member() returns true for explicit members and false for the manager.
	 */
	public function test_user_is_member() {
		$owner_id   = $this->create_reader_user();
		$member_id  = $this->create_reader_user();
		$other_id   = $this->create_reader_user();
		$group_sub  = $this->create_group_subscription( $owner_id );

		Group_Subscription::update_members( $group_sub, [ $member_id ] );

		$this->assertFalse(
			Group_Subscription::user_is_member( $owner_id, $group_sub ),
			'Owner/manager should not be considered a member'
		);
		$this->assertTrue(
			Group_Subscription::user_is_member( $member_id, $group_sub ),
			'Added member should be considered a member'
		);
		$this->assertFalse(
			Group_Subscription::user_is_member( $other_id, $group_sub ),
			'Unrelated user should not be considered a member'
		);
	}

	/**
	 * Test user_is_member() returns null when the subscription is not a group subscription.
	 */
	public function test_user_is_member_non_group_subscription() {
		$reader_id   = $this->create_reader_user();
		$regular_sub = $this->create_regular_subscription( $reader_id );

		$result = Group_Subscription::user_is_member( $reader_id, $regular_sub );
		$this->assertNull( $result, 'Should return null for non-group subscriptions' );
	}

	/**
	 * Test user_is_manager() returns true only for the subscription owner.
	 */
	public function test_user_is_manager() {
		$owner_id  = $this->create_reader_user();
		$other_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		$this->assertTrue(
			Group_Subscription::user_is_manager( $owner_id, $group_sub ),
			'Owner should be manager'
		);
		$this->assertFalse(
			Group_Subscription::user_is_manager( $other_id, $group_sub ),
			'Non-owner should not be manager'
		);
	}

	/**
	 * Test user_is_manager() returns null for a non-group subscription.
	 */
	public function test_user_is_manager_non_group_subscription() {
		$reader_id   = $this->create_reader_user();
		$regular_sub = $this->create_regular_subscription( $reader_id );

		$result = Group_Subscription::user_is_manager( $reader_id, $regular_sub );
		$this->assertNull( $result, 'Should return null for non-group subscriptions' );
	}

	/**
	 * Test get_group_subscriptions_for_user() returns IDs when $ids_only is true.
	 */
	public function test_get_group_subscriptions_for_user_ids_only() {
		$owner_id  = $this->create_reader_user();
		$member_id = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		Group_Subscription::update_members( $group_sub, [ $member_id ] );

		$ids = Group_Subscription::get_group_subscriptions_for_user( $member_id, true );
		$this->assertContains( $group_sub->get_id(), $ids, 'Should include the group subscription ID' );
	}

	/**
	 * Test get_group_subscriptions_for_user() returns empty array for non-readers.
	 */
	public function test_get_group_subscriptions_for_non_reader() {
		$admin_id = $this->create_admin_user();

		$result = Group_Subscription::get_group_subscriptions_for_user( $admin_id, true );
		$this->assertEmpty( $result, 'Non-reader users should not have group subscriptions' );
	}

	/**
	 * Test get_group_subscriptions_for_user() returns empty when user has no memberships.
	 */
	public function test_get_group_subscriptions_for_user_with_no_memberships() {
		$reader_id = $this->create_reader_user();

		$result = Group_Subscription::get_group_subscriptions_for_user( $reader_id, true );
		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	// -------------------------------------------------------------------------
	// Group_Subscription_Settings name tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_subscription_settings() returns a default name based on the
	 * subscription owner's billing name when no custom name is set.
	 */
	public function test_group_name_defaults_to_owner_name() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		// Set billing name on the subscription so get_formatted_billing_full_name() returns a real name.
		$group_sub->data['billing_first_name'] = 'Jane';
		$group_sub->data['billing_last_name']  = 'Doe';

		$settings = Group_Subscription_Settings::get_subscription_settings( $group_sub );

		$this->assertNotEmpty( $settings['name'], 'Default name should not be empty' );
		$this->assertStringContainsString(
			'Jane',
			$settings['name'],
			'Default name should contain the owner first name'
		);
		$this->assertStringContainsString(
			"\u{2019}s Group",
			$settings['name'],
			'Default name should end with the possessive Group suffix'
		);
	}

	/**
	 * Test get_subscription_settings() returns a custom name when one is stored
	 * in subscription meta.
	 */
	public function test_group_name_custom_override() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id, [ 'name' => 'Acme Newsroom' ] );

		$settings = Group_Subscription_Settings::get_subscription_settings( $group_sub );

		$this->assertEquals( 'Acme Newsroom', $settings['name'] );
	}

	/**
	 * Test update_subscription_settings() persists a name change that is
	 * reflected in subsequent get_subscription_settings() calls.
	 */
	public function test_group_name_update_and_read_back() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		Group_Subscription_Settings::update_subscription_settings(
			$group_sub,
			[ 'name' => 'Daily Planet' ]
		);

		$settings = Group_Subscription_Settings::get_subscription_settings( $group_sub );

		$this->assertEquals( 'Daily Planet', $settings['name'] );
	}

	/**
	 * Test that an empty name in update_subscription_settings() stores an
	 * empty string, which causes get_subscription_settings() to fall back
	 * to the default owner-based name.
	 */
	public function test_group_name_empty_falls_back_to_default() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id, [ 'name' => 'Temp Name' ] );

		// Set billing name on the subscription so the fallback name is based on the actual owner name.
		$group_sub->data['billing_first_name'] = 'Jane';
		$group_sub->data['billing_last_name']  = 'Doe';

		Group_Subscription_Settings::update_subscription_settings(
			$group_sub,
			[ 'name' => '' ]
		);

		$settings = Group_Subscription_Settings::get_subscription_settings( $group_sub );

		// After clearing the custom name, it should revert to the default.
		$this->assertStringContainsString(
			'Jane',
			$settings['name'],
			'Clearing the name should revert to the default owner-based name'
		);
		$this->assertStringContainsString(
			"\u{2019}s Group",
			$settings['name'],
			'Default name should end with the possessive Group suffix'
		);
	}

	// -------------------------------------------------------------------------
	// Group_Subscription_Invite tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_expiration_time() returns the default (30 days).
	 */
	public function test_get_expiration_time_default() {
		$time = Group_Subscription_Invite::get_expiration_time();
		$this->assertEquals( 30 * DAY_IN_SECONDS, $time );
	}

	/**
	 * Test get_expiration_time() respects the filter.
	 */
	public function test_get_expiration_time_filter() {
		$callback = function() {
			return 7 * DAY_IN_SECONDS;
		};

		add_filter(
			'newspack_group_subscription_invite_expiration_time',
			$callback
		);

		$time = Group_Subscription_Invite::get_expiration_time();
		$this->assertEquals( 7 * DAY_IN_SECONDS, $time );

		remove_filter( 'newspack_group_subscription_invite_expiration_time', $callback );
	}

	/**
	 * Test is_invite_expired() returns false for a fresh invite.
	 */
	public function test_is_invite_expired_fresh() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		wp_set_current_user( $owner_id );

		$email  = 'fresh@example.com';
		$invite = Group_Subscription_Invite::generate_invite( $group_sub, $email );

		$this->assertIsArray( $invite );
		$this->assertFalse( Group_Subscription_Invite::is_invite_expired( $invite ) );
	}

	/**
	 * Test generate_invite() returns WP_Error for a non-existent subscription.
	 */
	public function test_generate_invite_invalid_subscription() {
		$admin_id = $this->create_admin_user();
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite( 99999, 'test@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_subscription',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite() returns WP_Error when the subscription is not a group subscription.
	 */
	public function test_generate_invite_not_group_subscription() {
		$admin_id    = $this->create_admin_user();
		$reader_id   = $this->create_reader_user();
		$regular_sub = $this->create_regular_subscription( $reader_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite( $regular_sub->get_id(), 'test@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_subscription',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite() returns WP_Error when the email is empty.
	 */
	public function test_generate_invite_empty_email() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), '' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_email',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite() returns WP_Error when the email belongs to an existing member.
	 */
	public function test_generate_invite_existing_member() {
		$admin_id     = $this->create_admin_user();
		$owner_id     = $this->create_reader_user();
		$member_email = 'member@example.com';
		$member_id    = $this->create_reader_user( $member_email );
		$group_sub    = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		// Add the user as an existing member of the subscription.
		update_user_meta( $member_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $group_sub->get_id() );

		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), $member_email );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_existing_user',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite() returns WP_Error when the email belongs to a WP user
	 * who is not a Reader Activation reader (e.g. an editor).
	 */
	public function test_generate_invite_non_reader_wp_user() {
		$admin_id     = $this->create_admin_user();
		$owner_id     = $this->create_reader_user();
		$group_sub    = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		// Create a WP user with editor role — not a reader (no _newspack_reader meta,
		// and editor is in the restricted roles list).
		$editor_email = 'editor@example.com';
		$editor_id    = wp_insert_user(
			[
				'user_login' => 'test-editor-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => $editor_email,
				'role'       => 'editor',
			]
		);
		$this->user_ids[] = $editor_id;

		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), $editor_email );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_non_reader',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite() succeeds when the current user has manage_woocommerce.
	 */
	public function test_generate_invite_as_woocommerce_admin() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'invite@example.com' );

		$this->assertIsArray( $result );
		$this->assertEquals( 'invite@example.com', $result['email'] );
	}

	/**
	 * Test generate_invite() succeeds when the current user is the subscription manager.
	 */
	public function test_generate_invite_as_subscription_manager() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		// Log in as the subscription owner (the manager).
		wp_set_current_user( $owner_id );

		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'invite@example.com' );

		$this->assertIsArray( $result );
		$this->assertEquals( 'invite@example.com', $result['email'] );
	}

	/**
	 * Test generate_invite() returns WP_Error when the member limit is reached.
	 */
	public function test_generate_invite_limit_reached() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		// Limit of 1 – one fresh invite will consume the full allowance.
		$group_sub = $this->create_group_subscription( $owner_id, [ 'limit' => 1 ] );
		wp_set_current_user( $admin_id );

		// First invite fills the slot.
		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'first@example.com' );

		// Second invite for a different email should hit the limit.
		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'second@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_limit_reached',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite() succeeds regardless of invite count when limit is 0 (unlimited).
	 */
	public function test_generate_invite_unlimited() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		// limit = 0 means unlimited.
		$group_sub = $this->create_group_subscription( $owner_id, [ 'limit' => 0 ] );
		wp_set_current_user( $admin_id );

		for ( $i = 1; $i <= 5; $i++ ) {
			$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), "user{$i}@example.com" );
			$this->assertIsArray( $result, "Invite #{$i} should succeed when limit is 0" );
		}
	}

	/**
	 * Test generate_invite() replaces an existing invite for the same email
	 * so duplicate invites are not accumulated.
	 */
	public function test_generate_invite_replaces_existing_email_invite() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$first   = Group_Subscription_Invite::generate_invite( $group_sub, 'repeat@example.com' );
		$second = Group_Subscription_Invite::generate_invite( $group_sub, 'repeat@example.com' );

		$this->assertIsArray( $first );
		$this->assertIsArray( $second );

		// There should be exactly one invite for this email in get_invites().
		$invites = Group_Subscription_Invite::get_invites( $group_sub );
		$this->assertCount( 1, $invites, 'Only one invite should exist for the same email' );
		$this->assertEquals( 'repeat@example.com', reset( $invites )['email'] );
	}

	/**
	 * Test generate_invite() stores the invite data on the subscription.
	 */
	public function test_generate_invite_stores_data() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result  = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'stored@example.com' );
		$invites = Group_Subscription_Invite::get_invites( $group_sub );

		$this->assertIsArray( $invites );
		$this->assertEquals( 'stored@example.com', reset( $invites )['email'] );
		$this->assertEquals( 'stored@example.com', $result['email'] );
	}

	/**
	 * Test get_invites() returns all invites for a subscription.
	 */
	public function test_get_invites() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'one@example.com' );
		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'two@example.com' );

		$invites = Group_Subscription_Invite::get_invites( $group_sub );

		$this->assertIsArray( $invites );
		$this->assertCount( 2, $invites );
		$this->assertEquals( 'one@example.com', reset( $invites )['email'] );
		$this->assertEquals( 'two@example.com', next( $invites )['email'] );
	}

	/**
	 * Test get_invites() filters out expired invites when $show_expired is false.
	 */
	public function test_get_invites_filters_expired() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		$email     = 'expired@example.com';
		wp_set_current_user( $owner_id );

		// Manually store an already-expired timestamp.
		add_filter(
			'newspack_group_subscription_invite_expiration_time',
			function() {
				return -31 * DAY_IN_SECONDS;
			}
		);
		$invite = Group_Subscription_Invite::generate_invite( $group_sub, $email );

		$group_sub->save();

		// With show_expired = false, expired invites should be filtered out.
		$invites = Group_Subscription_Invite::get_invites( $group_sub, false );
		$this->assertEmpty( $invites );

		// With show_expired = true (default), they should appear.
		$invites_all = Group_Subscription_Invite::get_invites( $group_sub, true );
		$this->assertCount( 1, $invites_all );
	}

	/**
	 * Test generate_invite() stores the invite with a valid key.
	 */
	public function test_generate_invite_stores_key() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'key-test@example.com' );

		$this->assertIsArray( $result );
		$invites = Group_Subscription_Invite::get_invites( $group_sub );
		$key     = array_key_first( $invites );
		$this->assertEquals( 32, strlen( $key ), 'Key should be 32 characters' );
	}

	/**
	 * Test get_invite_url() generates a valid URL with expected query params.
	 */
	public function test_get_invite_url() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'url+test@example.com' );
		$invites    = Group_Subscription_Invite::get_invites( $group_sub );
		$invite_key = array_key_first( $invites );
		$url        = Group_Subscription_Invite::get_invite_url( $group_sub->get_id(), $invite_key, 'url+test@example.com' );

		$parsed = wp_parse_url( $url );
		parse_str( $parsed['query'], $query );

		$this->assertEquals( 'group_invite', $query['action'] );
		$this->assertEquals( $invite_key, $query['key'] );
		$this->assertEquals( 'url+test@example.com', $query['email'] );
		$this->assertEquals( (string) $group_sub->get_id(), $query['subscription'] );
	}

	/**
	 * Test get_invite_by_key() returns the invite data for a valid key.
	 */
	public function test_get_invite_by_key() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'key-lookup@example.com' );
		$invites    = Group_Subscription_Invite::get_invites( $group_sub );
		$invite_key = array_key_first( $invites );
		$found      = Group_Subscription_Invite::get_invite_by_key( $group_sub->get_id(), $invite_key );

		$this->assertIsArray( $found );
		$this->assertEquals( 'key-lookup@example.com', $found['email'] );
	}

	/**
	 * Test get_invite_by_key() returns null for an invalid key.
	 */
	public function test_get_invite_by_key_invalid() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		$found = Group_Subscription_Invite::get_invite_by_key( $group_sub->get_id(), 'nonexistentkey' );

		$this->assertNull( $found );
	}

	/**
	 * Test cancel_invite() removes a pending invite.
	 */
	public function test_cancel_invite() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'cancel@example.com' );

		$before = Group_Subscription_Invite::get_invites( $group_sub );
		$this->assertEquals( 'cancel@example.com', reset( $before )['email'] );

		$cancelled = Group_Subscription_Invite::cancel_invite( $group_sub->get_id(), 'cancel@example.com' );
		$this->assertTrue( $cancelled );

		$after = Group_Subscription_Invite::get_invites( $group_sub );
		$this->assertEmpty( $after );
	}

	// -------------------------------------------------------------------------
	// Group_Subscription_Invite::accept_invite() tests
	// -------------------------------------------------------------------------

	/**
	 * Test accept_invite() adds the user to the group and deletes the invite.
	 */
	public function test_accept_invite() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$email     = 'accept@example.com';
		$member_id = $this->create_reader_user( $email );
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), $email );
		$invite_key = array_key_first( Group_Subscription_Invite::get_invites( $group_sub ) );
		$result     = Group_Subscription_Invite::accept_invite( $group_sub->get_id(), $invite_key, $email );

		$this->assertTrue( $result );
		$this->assertTrue( Group_Subscription::user_is_member( $member_id, $group_sub ) );
		$this->assertEmpty( Group_Subscription_Invite::get_invites( $group_sub ) );
	}

	/**
	 * Test accept_invite() returns WP_Error for expired invite.
	 */
	public function test_accept_invite_expired() {
		$owner_id  = $this->create_reader_user();
		$email     = 'expired-accept@example.com';
		$this->create_reader_user( $email );
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $owner_id );

		// Generate an expired invite.
		add_filter(
			'newspack_group_subscription_invite_expiration_time',
			function() {
				return -1;
			}
		);
		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), $email );
		remove_all_filters( 'newspack_group_subscription_invite_expiration_time' );

		$invite_key = array_key_first( Group_Subscription_Invite::get_invites( $group_sub->get_id(), true ) );
		$result     = Group_Subscription_Invite::accept_invite( $group_sub->get_id(), $invite_key, $email );

		$this->assertWPError( $result );
		$this->assertEquals( 'newspack_group_subscription_invite_expired', $result->get_error_code() );
	}

	/**
	 * Test accept_invite() returns WP_Error for invalid key.
	 */
	public function test_accept_invite_invalid_key() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		$result = Group_Subscription_Invite::accept_invite( $group_sub->get_id(), 'badkey', 'nobody@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals( 'newspack_group_subscription_invite_not_found', $result->get_error_code() );
	}

	/**
	 * Test accept_invite() returns WP_Error when email doesn't match the invite.
	 */
	public function test_accept_invite_email_mismatch() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), 'correct@example.com' );
		$invite_key = array_key_first( Group_Subscription_Invite::get_invites( $group_sub ) );
		$result     = Group_Subscription_Invite::accept_invite( $group_sub->get_id(), $invite_key, 'wrong@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals( 'newspack_group_subscription_invite_not_found', $result->get_error_code() );
	}

	/**
	 * Test accept_invite() with a newly created reader user.
	 */
	public function test_accept_invite_new_user() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$email     = 'new-reader@example.com';
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		Group_Subscription_Invite::generate_invite( $group_sub->get_id(), $email );
		$invite_key = array_key_first( Group_Subscription_Invite::get_invites( $group_sub ) );

		// Simulate creating the user (as process_invite_request would).
		$new_user_id = $this->create_reader_user( $email );

		$result = Group_Subscription_Invite::accept_invite( $group_sub->get_id(), $invite_key, $email );

		$this->assertTrue( $result );
		$this->assertTrue( Group_Subscription::user_is_member( $new_user_id, $group_sub ) );
	}

	/**
	 * Test accept_invite() respects member limit.
	 */
	public function test_accept_invite_respects_limit() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$member1   = $this->create_reader_user( 'member1@example.com' );
		$email2    = 'member2@example.com';
		$this->create_reader_user( $email2 );
		$group_sub = $this->create_group_subscription( $owner_id, [ 'limit' => 1 ] );
		wp_set_current_user( $admin_id );

		// Fill the single slot.
		Group_Subscription::update_members( $group_sub, [ $member1 ] );

		// Manually store an invite to bypass the limit check in generate_invite.
		$key     = wp_generate_password( 32, false );
		$invites = [
			$key => [
				'added_by'   => $admin_id,
				'email'      => $email2,
				'expiration' => time() + DAY_IN_SECONDS,
			],
		];
		$group_sub->update_meta_data( Group_Subscription_Invite::META, $invites );
		$group_sub->save();

		$result = Group_Subscription_Invite::accept_invite( $group_sub->get_id(), $key, $email2 );

		$this->assertWPError( $result, 'Should fail when member limit is reached' );
	}

	// -------------------------------------------------------------------------
	// search_group_name_where() tests
	// -------------------------------------------------------------------------

	/**
	 * Build a stub WP_Query object representing a subscription search.
	 *
	 * @param string $term Search term.
	 * @return \WP_Query
	 */
	private function build_subscription_search_query( $term ) {
		$query = new \WP_Query();
		$query->set( 's', $term );
		$query->set( 'post_type', 'shop_subscription' );
		$query->is_search = true;
		return $query;
	}

	/**
	 * Test that search_group_name_where() returns the search clause unchanged
	 * when the query is not a subscription search.
	 */
	public function test_search_group_name_where_skips_non_subscription_query() {
		$query = new \WP_Query();
		$query->set( 's', 'foo' );
		$query->set( 'post_type', 'post' );
		$query->is_search = true;

		$original = " AND ( ( wp_posts.post_title LIKE '%foo%' ) ) ";
		$result   = Group_Subscription_Settings::search_group_name_where( $original, $query );

		$this->assertEquals( $original, $result, 'Non-subscription queries should be untouched' );
	}

	/**
	 * Test that search_group_name_where() returns the search clause unchanged
	 * when the search clause is empty (no search performed).
	 */
	public function test_search_group_name_where_skips_empty_search() {
		$query  = $this->build_subscription_search_query( 'foo' );
		$result = Group_Subscription_Settings::search_group_name_where( '', $query );

		$this->assertEquals( '', $result, 'Empty search clause should be returned as-is' );
	}

	/**
	 * Test that search_group_name_where() wraps a simple search clause with
	 * an OR for the group name meta.
	 */
	public function test_search_group_name_where_wraps_simple_clause() {
		$query    = $this->build_subscription_search_query( 'acme' );
		$original = " AND ( ( wp_posts.post_title LIKE '%acme%' ) ) ";
		$result   = Group_Subscription_Settings::search_group_name_where( $original, $query );

		// The original search clause should still be present.
		$this->assertStringContainsString( "wp_posts.post_title LIKE '%acme%'", $result );
		// Our group name meta should be added with an OR.
		$this->assertStringContainsString( 'np_group_name.meta_value LIKE', $result );
		$this->assertStringContainsString( ' OR ', $result );
		// The clause should still start with " AND ".
		$this->assertStringStartsWith( ' AND ', $result );
	}

	/**
	 * Test that search_group_name_where() handles a multi-term search clause
	 * (where WP produces a more complex inner shape).
	 */
	public function test_search_group_name_where_handles_multi_term() {
		$query    = $this->build_subscription_search_query( 'foo bar' );
		$original = " AND ( ( ( wp_posts.post_title LIKE '%foo%' ) ) AND ( ( wp_posts.post_title LIKE '%bar%' ) ) ) ";
		$result   = Group_Subscription_Settings::search_group_name_where( $original, $query );

		// All original sub-clauses should still appear.
		$this->assertStringContainsString( "LIKE '%foo%'", $result );
		$this->assertStringContainsString( "LIKE '%bar%'", $result );
		// Our OR clause should be present.
		$this->assertStringContainsString( 'np_group_name.meta_value LIKE', $result );
		$this->assertStringContainsString( ' OR ', $result );
	}

	/**
	 * Test that search_group_name_where() escapes special characters in the
	 * search term so they don't break out of the SQL string.
	 */
	public function test_search_group_name_where_escapes_special_chars() {
		$query    = $this->build_subscription_search_query( "foo'bar" );
		$original = " AND ( ( wp_posts.post_title LIKE '%foo%' ) ) ";
		$result   = Group_Subscription_Settings::search_group_name_where( $original, $query );

		// The single quote should be escaped (doubled or backslash-escaped) — not appear raw.
		$this->assertStringNotContainsString( "foo'bar'", $result, 'Single quote in term must be escaped' );
		// Our OR clause should still be added.
		$this->assertStringContainsString( 'np_group_name.meta_value LIKE', $result );
	}

	// -------------------------------------------------------------------------
	// get_group_subscription_ids() cache tests
	// -------------------------------------------------------------------------

	/**
	 * Test that get_group_subscription_ids() reads from the transient cache
	 * when present, bypassing the underlying queries.
	 */
	public function test_get_group_subscription_ids_uses_transient_cache() {
		// Pre-seed the transient with a known set of IDs.
		$cached_ids = [ 101, 202, 303 ];
		set_transient(
			Group_Subscription_Settings::GROUP_SUBSCRIPTION_IDS_TRANSIENT,
			$cached_ids,
			5 * MINUTE_IN_SECONDS
		);

		$result = Group_Subscription_Settings::get_group_subscription_ids();

		$this->assertEquals( $cached_ids, $result, 'Should return the cached IDs verbatim' );

		// Cleanup.
		delete_transient( Group_Subscription_Settings::GROUP_SUBSCRIPTION_IDS_TRANSIENT );
	}

	/**
	 * Test that clear_group_subscription_ids_cache() deletes the transient.
	 */
	public function test_clear_group_subscription_ids_cache_deletes_transient() {
		set_transient(
			Group_Subscription_Settings::GROUP_SUBSCRIPTION_IDS_TRANSIENT,
			[ 1, 2, 3 ],
			5 * MINUTE_IN_SECONDS
		);

		$this->assertNotFalse(
			get_transient( Group_Subscription_Settings::GROUP_SUBSCRIPTION_IDS_TRANSIENT ),
			'Transient should exist before clearing'
		);

		Group_Subscription_Settings::clear_group_subscription_ids_cache();

		$this->assertFalse(
			get_transient( Group_Subscription_Settings::GROUP_SUBSCRIPTION_IDS_TRANSIENT ),
			'Transient should be deleted after clearing'
		);
	}
}

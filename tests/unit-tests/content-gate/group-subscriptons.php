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
	 *                           Supported keys: 'enabled' (bool), 'limit' (int).
	 * @return \WC_Subscription
	 */
	private function create_group_subscription( $customer_id, $settings = [] ) {
		$settings  = array_merge(
			[
				'enabled' => true,
				'limit'   => 0,
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
	 * Test user_is_member() returns true for explicit members and for the manager.
	 */
	public function test_user_is_member() {
		$owner_id   = $this->create_reader_user();
		$member_id  = $this->create_reader_user();
		$other_id   = $this->create_reader_user();
		$group_sub  = $this->create_group_subscription( $owner_id );

		Group_Subscription::update_members( $group_sub, [ $member_id ] );

		$this->assertTrue(
			Group_Subscription::user_is_member( $owner_id, $group_sub ),
			'Owner/manager should be considered a member'
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
	// Group_Subscription_Invite tests
	// -------------------------------------------------------------------------

	/**
	 * Test get_invite_expiration_time() returns the default (30 days).
	 */
	public function test_get_invite_expiration_time_default() {
		$time = Group_Subscription_Invite::get_invite_expiration_time();
		$this->assertEquals( 30 * DAY_IN_SECONDS, $time );
	}

	/**
	 * Test get_invite_expiration_time() respects the filter.
	 */
	public function test_get_invite_expiration_time_filter() {
		add_filter(
			'newspack_group_subscription_invite_expiration_time',
			function() {
				return 7 * DAY_IN_SECONDS;
			}
		);

		$time = Group_Subscription_Invite::get_invite_expiration_time();
		$this->assertEquals( 7 * DAY_IN_SECONDS, $time );

		remove_all_filters( 'newspack_group_subscription_invite_expiration_time' );
	}

	/**
	 * Test is_invite_expired() returns false for a fresh invite.
	 */
	public function test_is_invite_expired_fresh() {
		$invite = [ 'timestamp' => time() ];
		$this->assertFalse( Group_Subscription_Invite::is_invite_expired( $invite ) );
	}

	/**
	 * Test is_invite_expired() returns true for an invite older than the expiration.
	 */
	public function test_is_invite_expired_old() {
		$invite = [ 'timestamp' => time() - ( 31 * DAY_IN_SECONDS ) ];
		$this->assertTrue( Group_Subscription_Invite::is_invite_expired( $invite ) );
	}

	/**
	 * Test is_invite_expired() returns false for an invite right at the boundary.
	 */
	public function test_is_invite_expired_boundary() {
		// One second before expiry → should NOT be expired.
		$invite = [ 'timestamp' => time() - 30 * DAY_IN_SECONDS + 2 ];
		$this->assertFalse( Group_Subscription_Invite::is_invite_expired( $invite ) );
	}

	/**
	 * Test generate_invite_key() returns WP_Error for a non-existent subscription.
	 */
	public function test_generate_invite_key_invalid_subscription() {
		$admin_id = $this->create_admin_user();
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite_key( 99999, 'test@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_subscription',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite_key() returns WP_Error when the subscription is not a group subscription.
	 */
	public function test_generate_invite_key_not_group_subscription() {
		$admin_id    = $this->create_admin_user();
		$reader_id   = $this->create_reader_user();
		$regular_sub = $this->create_regular_subscription( $reader_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite_key( $regular_sub->get_id(), 'test@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_subscription',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite_key() returns WP_Error when the email is empty.
	 */
	public function test_generate_invite_key_empty_email() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), '' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_email',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite_key() returns WP_Error when the current user is neither
	 * a WooCommerce admin nor the subscription manager.
	 */
	public function test_generate_invite_key_non_manager_non_admin() {
		$owner_id    = $this->create_reader_user();
		$other_id    = $this->create_reader_user();
		$group_sub   = $this->create_group_subscription( $owner_id );

		// Log in as a reader who does not own the subscription.
		wp_set_current_user( $other_id );

		$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'invite@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_invalid_user',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite_key() succeeds when the current user has manage_woocommerce.
	 */
	public function test_generate_invite_key_as_woocommerce_admin() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'invite@example.com' );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'key', $result );
		$this->assertArrayHasKey( 'email', $result );
		$this->assertArrayHasKey( 'timestamp', $result );
		$this->assertArrayHasKey( 'user_id', $result );
		$this->assertEquals( 'invite@example.com', $result['email'] );
		$this->assertEquals( $admin_id, $result['user_id'] );
	}

	/**
	 * Test generate_invite_key() succeeds when the current user is the subscription manager.
	 */
	public function test_generate_invite_key_as_subscription_manager() {
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );

		// Log in as the subscription owner (the manager).
		wp_set_current_user( $owner_id );

		$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'invite@example.com' );

		$this->assertIsArray( $result );
		$this->assertEquals( 'invite@example.com', $result['email'] );
		$this->assertEquals( $owner_id, $result['user_id'] );
		$this->assertNotEmpty( $result['key'] );
	}

	/**
	 * Test generate_invite_key() returns WP_Error when the member limit is reached.
	 */
	public function test_generate_invite_key_limit_reached() {
		$admin_id = $this->create_admin_user();
		// Limit of 1 – one fresh invite will consume the full allowance.
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id, [ 'limit' => 1 ] );
		wp_set_current_user( $admin_id );

		// First invite for a different email fills the slot.
		Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'first@example.com' );

		// Second invite for yet another email should hit the limit.
		$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'second@example.com' );

		$this->assertWPError( $result );
		$this->assertEquals(
			'newspack_group_subscription_invite_limit_reached',
			$result->get_error_code()
		);
	}

	/**
	 * Test generate_invite_key() succeeds regardless of invite count when limit is 0 (unlimited).
	 */
	public function test_generate_invite_key_unlimited() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		// limit = 0 means unlimited.
		$group_sub = $this->create_group_subscription( $owner_id, [ 'limit' => 0 ] );
		wp_set_current_user( $admin_id );

		for ( $i = 1; $i <= 5; $i++ ) {
			$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), "user{$i}@example.com" );
			$this->assertIsArray( $result, "Invite #{$i} should succeed when limit is 0" );
		}
	}

	/**
	 * Test generate_invite_key() replaces an existing invite for the same email
	 * so duplicate invites are not accumulated.
	 */
	public function test_generate_invite_key_replaces_existing_email_invite() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$first  = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'repeat@example.com' );
		$second = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'repeat@example.com' );

		$this->assertIsArray( $first );
		$this->assertIsArray( $second );

		// The second key must differ from the first (a new key was generated).
		$this->assertNotEquals( $first['key'], $second['key'] );

		// There should be only one invite for this email stored on the subscription.
		$stored = $group_sub->get_meta( Group_Subscription_Invite::META );
		$email_invites = array_filter(
			$stored,
			function( $invite ) {
				return $invite['email'] === 'repeat@example.com';
			}
		);
		$this->assertCount( 1, $email_invites, 'Only one invite should exist for the same email' );
	}

	/**
	 * Test generate_invite_key() stores the invite data on the subscription.
	 */
	public function test_generate_invite_key_stores_data() {
		$admin_id  = $this->create_admin_user();
		$owner_id  = $this->create_reader_user();
		$group_sub = $this->create_group_subscription( $owner_id );
		wp_set_current_user( $admin_id );

		$result = Group_Subscription_Invite::generate_invite_key( $group_sub->get_id(), 'stored@example.com' );

		$stored = $group_sub->get_meta( Group_Subscription_Invite::META );
		$this->assertIsArray( $stored );
		$this->assertNotEmpty( $stored );
		$this->assertEquals( 'stored@example.com', $stored[0]['email'] );
		$this->assertEquals( $result['key'], $stored[0]['key'] );
	}
}

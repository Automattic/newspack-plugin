<?php
/**
 * Tests for the GoogleSiteKit integration's GA4 custom event parameters.
 *
 * @package Newspack\Tests
 */

use Newspack\GoogleSiteKit;
use Newspack\Group_Subscription;
use Newspack\Group_Subscription_Settings;
use Newspack\Institution;
use Newspack\Reader_Activation;

/**
 * Test the `group` GA4 custom event parameter.
 *
 * @group GoogleSiteKit_Group_Param
 */
class Newspack_Test_GoogleSiteKit_Group_Param extends WP_UnitTestCase {

	/**
	 * Test user ID (the "current" user during the test).
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Owner user ID for group subscriptions.
	 *
	 * @var int
	 */
	private static $owner_id;

	/**
	 * Enable the content gating feature flag and load WC mocks.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		if ( ! defined( 'NEWSPACK_CONTENT_GATES' ) ) {
			define( 'NEWSPACK_CONTENT_GATES', true );
		}
		require_once dirname( __DIR__, 2 ) . '/mocks/wc-mocks.php';
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Reset mock WC databases.
		global $subscriptions_database, $products_database;
		$subscriptions_database = [];
		$products_database      = [];

		self::$user_id = $this->factory->user->create(
			[
				'role'       => 'subscriber',
				'user_email' => 'reader@example.com',
			]
		);
		Reader_Activation::set_reader_verified( self::$user_id );

		self::$owner_id = $this->factory->user->create(
			[
				'role'       => 'subscriber',
				'user_email' => 'owner@example.com',
			]
		);

		// Make the reader the current user so get_custom_event_parameters() picks them up.
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_user_meta( self::$user_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY );
		Institution::invalidate_cache();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Helper: create a group subscription owned by $owner_id (with the user as a member if $member_id is given).
	 *
	 * @param int      $owner_id   Owner user ID.
	 * @param int|null $member_id  Member user ID, or null for none.
	 * @param int      $product_id Product ID.
	 * @param string   $name       Group name.
	 * @param string   $status     Subscription status.
	 * @return \WC_Subscription
	 */
	private function create_group_subscription( $owner_id, $member_id, $product_id, $name, $status = 'active' ) {
		$sub = wcs_create_subscription(
			[
				'customer_id'    => $owner_id,
				'status'         => $status,
				'billing_period' => 'month',
				'products'       => [ $product_id ],
			]
		);
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'name', $name );
		if ( $member_id ) {
			add_user_meta( $member_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $sub->get_id() );
		}
		return $sub;
	}

	/**
	 * Helper: create an institution post and refresh the cache.
	 *
	 * @param string $title Institution title.
	 * @param array  $rules Institution rules.
	 * @return int Institution post ID.
	 */
	private function create_institution( $title, $rules ) {
		$id = Institution::create( $title, '', $rules );
		Institution::invalidate_cache();
		return $id;
	}

	/**
	 * With no group subscriptions or institutions, `group` defaults to "none".
	 */
	public function test_group_defaults_to_none() {
		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertArrayHasKey( 'group', $params );
		$this->assertEquals( 'none', $params['group'] );
	}

	/**
	 * Owned group subscription contributes its name.
	 */
	public function test_group_includes_owned_group_subscription() {
		$this->create_group_subscription( self::$user_id, null, 600, 'Owner Group' );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'Owner Group', $params['group'] );
	}

	/**
	 * Group membership (non-owner) contributes the group name.
	 */
	public function test_group_includes_member_group_subscription() {
		$this->create_group_subscription( self::$owner_id, self::$user_id, 601, 'Member Group' );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'Member Group', $params['group'] );
	}

	/**
	 * Matching institution (via verified email domain) contributes its name.
	 */
	public function test_group_includes_matching_institution() {
		$this->create_institution( 'Test University', [ 'email_domain' => 'example.com' ] );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'Test University', $params['group'] );
	}

	/**
	 * Multiple group subscriptions and an institution all surface, sorted naturally.
	 */
	public function test_group_combines_owned_member_and_institution_sorted() {
		$this->create_group_subscription( self::$user_id, null, 602, 'Zeta Group' );
		$this->create_group_subscription( self::$owner_id, self::$user_id, 603, 'Beta Group' );
		$this->create_institution( 'Alpha University', [ 'email_domain' => 'example.com' ] );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'Alpha University, Beta Group, Zeta Group', $params['group'] );
	}

	/**
	 * Inactive group subscriptions do not contribute a name.
	 */
	public function test_group_excludes_cancelled_group_subscription() {
		$this->create_group_subscription( self::$user_id, null, 604, 'Active Owned', 'active' );
		$this->create_group_subscription( self::$owner_id, self::$user_id, 605, 'Cancelled Member', 'cancelled' );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'Active Owned', $params['group'] );
	}

	/**
	 * Anonymous (non-logged-in) requests get `group` = "none".
	 */
	public function test_group_for_anonymous_user_is_none() {
		wp_set_current_user( 0 );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'none', $params['group'] );
	}

	/**
	 * Owner who is also listed as a member is not double-counted.
	 */
	public function test_group_dedupes_owner_who_is_also_member() {
		$sub = $this->create_group_subscription( self::$user_id, null, 606, 'Self Group' );
		// Add the owner as a member too.
		add_user_meta( self::$user_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $sub->get_id() );

		$params = GoogleSiteKit::get_custom_event_parameters();

		$this->assertEquals( 'Self Group', $params['group'] );
	}
}

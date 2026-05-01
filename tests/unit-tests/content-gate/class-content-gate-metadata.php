<?php
/**
 * Tests the Content Gate metadata class.
 *
 * @package Newspack\Tests
 */

use Newspack\Content_Gate;
use Newspack\Group_Subscription;
use Newspack\Group_Subscription_Settings;
use Newspack\Institution;
use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Sync\Contact_Metadata\Content_Gate as Content_Gate_Metadata;

/**
 * Test Content Gate metadata functionality.
 *
 * @group Content_Gate_Metadata
 */
class Newspack_Test_Content_Gate_Metadata extends WP_UnitTestCase {

	/**
	 * Test user ID.
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
	 * Set up the WC mocks once for the class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		require_once dirname( __DIR__, 2 ) . '/mocks/wc-mocks.php';
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		Content_Gate_Metadata::reset_cache();

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
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_user_meta( self::$user_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY );
		Institution::invalidate_cache();
		parent::tear_down();
	}

	/**
	 * Helper to create a mock product and return its ID.
	 *
	 * @param int    $product_id Product ID.
	 * @param string $name       Product name.
	 * @return int Product ID.
	 */
	private function create_mock_product( $product_id, $name ) {
		\wc_create_mock_product(
			[
				'id'   => $product_id,
				'name' => $name,
			]
		);
		return $product_id;
	}

	/**
	 * Helper to create a subscription owned by a user.
	 *
	 * @param int   $owner_id   Owner user ID.
	 * @param array $product_ids Product IDs the subscription covers.
	 * @param array $overrides   Optional overrides for the subscription data.
	 * @return \WC_Subscription
	 */
	private function create_subscription( $owner_id, $product_ids, $overrides = [] ) {
		return \wcs_create_subscription(
			array_merge(
				[
					'customer_id'    => $owner_id,
					'status'         => 'active',
					'billing_period' => 'month',
					'products'       => $product_ids,
				],
				$overrides
			)
		);
	}

	/**
	 * Helper to create a group subscription with a name and add a member.
	 *
	 * @param int    $owner_id    Owner user ID.
	 * @param int    $member_id   Member user ID to add.
	 * @param array  $product_ids Product IDs the subscription covers.
	 * @param string $group_name  Group display name.
	 * @param array  $overrides   Optional subscription overrides (e.g., 'status').
	 * @return \WC_Subscription
	 */
	private function create_group_subscription_with_member( $owner_id, $member_id, $product_ids, $group_name, $overrides = [] ) {
		$sub = $this->create_subscription( $owner_id, $product_ids, $overrides );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'name', $group_name );
		add_user_meta( $member_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $sub->get_id() );
		return $sub;
	}

	/**
	 * Helper to create an institution post with given rules.
	 *
	 * @param string $title Title.
	 * @param array  $rules Institution rules (email_domain, ip_range, reader_data).
	 * @return int Institution post ID.
	 */
	private function create_institution( $title, $rules ) {
		$id = Institution::create( $title, '', $rules );
		Institution::invalidate_cache();
		return $id;
	}

	/**
	 * Helper to create a gate with custom access rules.
	 *
	 * @param string $title        Gate title.
	 * @param array  $access_rules Access rules array.
	 *
	 * @return int Gate post ID.
	 */
	private function create_gate_with_rules( $title, $access_rules ) {
		$gate_id = $this->factory->post->create(
			[
				'post_type'   => Content_Gate::GATE_CPT,
				'post_status' => 'publish',
				'post_title'  => $title,
			]
		);
		update_post_meta(
			$gate_id,
			'custom_access',
			[
				'active'       => true,
				'access_rules' => $access_rules,
			]
		);
		return $gate_id;
	}

	/**
	 * Helper to get metadata for a user.
	 *
	 * @param int $user_id User ID.
	 * @return array Metadata array.
	 */
	private function get_metadata_for_user( $user_id ) {
		$metadata = new Content_Gate_Metadata( $user_id );
		return $metadata->get_metadata();
	}

	/**
	 * Test that no gates configured returns empty metadata.
	 */
	public function test_no_gates_returns_empty() {
		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEmpty( $result['Content_Access'], 'No gates means empty Content_Access.' );
		$this->assertEmpty( $result['Content_Access_Source'], 'No gates means no source.' );
	}

	/**
	 * Test that invalid user returns empty array.
	 */
	public function test_no_user_returns_empty() {
		$result = $this->get_metadata_for_user( 0 );

		$this->assertEmpty( $result, 'Invalid user should return empty metadata.' );
	}

	/**
	 * Test user passing email domain rule.
	 */
	public function test_email_domain_pass() {
		$rules = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$this->create_gate_with_rules( 'Domain Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User with matching domain should have access.' );
		$this->assertEquals( 'domain', $result['Content_Access_Source'], 'Source should be "domain" for email domain rule.' );
	}

	/**
	 * Test user failing email domain rule.
	 */
	public function test_email_domain_fail() {
		$rules = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'other.com',
				],
			],
		];
		$this->create_gate_with_rules( 'Domain Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'No', $result['Content_Access'], 'User with non-matching domain should not have access.' );
		$this->assertEmpty( $result['Content_Access_Source'], 'Source should be empty when access is denied.' );
	}

	/**
	 * Test user passes one gate but fails another — access is granted.
	 */
	public function test_multiple_gates_pass_one() {
		$this->create_gate_with_rules(
			'Failing Gate',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'other.com',
					],
				],
			]
		);
		$this->create_gate_with_rules(
			'Passing Gate',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'example.com',
					],
				],
			]
		);

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User should have access when passing at least one gate.' );
		$this->assertEquals( 'domain', $result['Content_Access_Source'], 'Source should reflect the passing gate.' );
	}

	/**
	 * Test that duplicate sources are deduplicated.
	 */
	public function test_sources_deduplicated() {
		// Two gates with the same email domain rule type.
		$this->create_gate_with_rules(
			'Gate A',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'example.com',
					],
				],
			]
		);
		$this->create_gate_with_rules(
			'Gate B',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'example.com',
					],
				],
			]
		);

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEquals( 'domain', $result['Content_Access_Source'], 'Duplicate sources should be deduplicated.' );
	}

	/**
	 * Test that an active gate with empty rules grants access with no source.
	 */
	public function test_gate_with_empty_rules_returns_yes() {
		$gate_id = $this->factory->post->create(
			[
				'post_type'   => Content_Gate::GATE_CPT,
				'post_status' => 'publish',
				'post_title'  => 'Empty Rules Gate',
			]
		);
		update_post_meta(
			$gate_id,
			'custom_access',
			[
				'active'       => true,
				'access_rules' => [],
			]
		);

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'Gate with empty rules should grant access.' );
		$this->assertEmpty( $result['Content_Access_Source'], 'Gate with empty rules should have no source.' );
	}

	/**
	 * Test institution rule produces "group" source label.
	 */
	public function test_institution_rule_source() {
		$institution_id = $this->factory->post->create(
			[
				'post_type'   => 'np_institution',
				'post_status' => 'publish',
				'post_title'  => 'Test University',
			]
		);
		update_post_meta( $institution_id, 'np_institution_email_domain', 'example.com' );
		// Invalidate the institution cache so it picks up the new post.
		\Newspack\Institution::invalidate_cache();

		$rules = [
			[
				[
					'slug'  => 'institution',
					'value' => [ $institution_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Institution Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User matching institution should have access.' );
		$this->assertEquals( 'institution', $result['Content_Access_Source'], 'Source should be "institution" for institution rule.' );
	}

	/**
	 * Test OR logic between groups — user passes one group but fails another.
	 */
	public function test_or_logic_between_groups() {
		$rules = [
			// Group 1: fails.
			[
				[
					'slug'  => 'email_domain',
					'value' => 'other.com',
				],
			],
			// Group 2: passes.
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$this->create_gate_with_rules( 'OR Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User should have access when one group passes (OR logic).' );
		$this->assertEquals( 'domain', $result['Content_Access_Source'] );
	}

	// -------------------------------------------------------------------------
	// Content_Access_Source: subscription, group, filtered, domain, institution
	// -------------------------------------------------------------------------

	/**
	 * Test that an owned active subscription produces the product name as source.
	 */
	public function test_subscription_owned_source() {
		$product_id = $this->create_mock_product( 501, 'Premium Plan' );
		$this->create_subscription( self::$user_id, [ $product_id ] );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Subscription Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'Owner should have access via own subscription.' );
		$this->assertEquals( 'Premium Plan', $result['Content_Access_Source'], 'Source should be the product name for an owned subscription.' );
	}

	/**
	 * Test that owning multiple matching subscriptions emits each product name, sorted.
	 */
	public function test_subscription_owned_multiple_products_source() {
		$pro_id = $this->create_mock_product( 502, 'Pro Plan' );
		$ent_id = $this->create_mock_product( 503, 'Enterprise Plan' );
		$this->create_subscription( self::$user_id, [ $pro_id, $ent_id ] );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $pro_id, $ent_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Multi Subscription Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEquals( 'Enterprise Plan, Pro Plan', $result['Content_Access_Source'], 'Source should list all matched product names, sorted.' );
	}

	/**
	 * Test that group membership (not ownership) produces 'group' as source.
	 */
	public function test_subscription_group_source() {
		$product_id = $this->create_mock_product( 504, 'Group Plan' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $product_id ], 'ACME Corp' );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Group Subscription Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'Group member should have access.' );
		$this->assertEquals( 'group', $result['Content_Access_Source'], 'Source should be "group" for group-membership access.' );
	}

	/**
	 * Test the 'subscription' fallback when access is granted only via the
	 * `newspack_access_rules_has_active_subscription` filter (no real product or group match).
	 */
	public function test_subscription_filter_source() {
		$product_id = 505; // Intentionally unregistered — wc_get_product() will return false.
		$rule_value = [ $product_id ];

		// One-shot filter: pass the rule evaluation, then return $has unchanged
		// for the strict per-product and outer non-strict checks during labeling.
		$called   = false;
		$callback = function ( $has, $user_id, $product_ids, $strict ) use ( &$called ) {
			if ( ! $called && ! $strict ) {
				$called = true;
				return true;
			}
			return $has;
		};
		add_filter( 'newspack_access_rules_has_active_subscription', $callback, 10, 4 );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => $rule_value,
				],
			],
		];
		$this->create_gate_with_rules( 'Filtered Subscription Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		remove_filter( 'newspack_access_rules_has_active_subscription', $callback, 10 );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'Filter should grant access.' );
		$this->assertEquals( 'subscription', $result['Content_Access_Source'], 'Source should fall back to "subscription" when filter grants access without a product or group match.' );
	}

	// -------------------------------------------------------------------------
	// Content_Access_Group
	// -------------------------------------------------------------------------

	/**
	 * Test that a group subscription's name appears in Content_Access_Group.
	 */
	public function test_group_label_for_group_subscription() {
		$product_id = $this->create_mock_product( 510, 'Group Plan' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $product_id ], 'ACME Corp' );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Group Subscription Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEquals( 'ACME Corp', $result['Content_Access_Group'], 'Group name should appear in Content_Access_Group.' );
	}

	/**
	 * Test that membership in multiple group subscriptions produces sorted names.
	 */
	public function test_group_label_with_multiple_groups() {
		$pid_one = $this->create_mock_product( 511, 'Plan One' );
		$pid_two = $this->create_mock_product( 512, 'Plan Two' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $pid_one ], 'Beta Group' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $pid_two ], 'Alpha Group' );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $pid_one, $pid_two ],
				],
			],
		];
		$this->create_gate_with_rules( 'Multi Group Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Alpha Group, Beta Group', $result['Content_Access_Group'], 'Multiple group names should appear sorted naturally.' );
	}

	/**
	 * Test that a cancelled group subscription's name is excluded.
	 */
	public function test_group_label_excludes_cancelled_group_subscription() {
		$product_id = $this->create_mock_product( 513, 'Active Plan' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $product_id ], 'Active Group' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $product_id ], 'Cancelled Group', [ 'status' => 'cancelled' ] );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Mixed Status Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Active Group', $result['Content_Access_Group'], 'Cancelled group should not contribute a label.' );
	}

	/**
	 * Test that an owned regular (non-group) subscription does NOT produce a group label.
	 */
	public function test_group_label_empty_for_owned_subscription() {
		$product_id = $this->create_mock_product( 514, 'Solo Plan' );
		$this->create_subscription( self::$user_id, [ $product_id ] );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Solo Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEmpty( $result['Content_Access_Group'], 'Owned non-group subscriptions should not contribute a group label.' );
	}

	/**
	 * Test that an owned group subscription contributes its group name.
	 */
	public function test_group_label_for_owned_group_subscription() {
		$product_id = $this->create_mock_product( 517, 'Owner Plan' );
		$sub        = $this->create_subscription( self::$user_id, [ $product_id ] );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'name', 'Owner Group' );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Owner Group Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'Owner should have access via their own subscription.' );
		$this->assertEquals( 'Owner Plan', $result['Content_Access_Source'], 'Owner should see the product name as source.' );
		$this->assertEquals( 'Owner Group', $result['Content_Access_Group'], 'Owner should see the group name in Content_Access_Group.' );
	}

	/**
	 * Test that the same group subscription is not double-counted when the user is both owner and member.
	 */
	public function test_group_label_dedupes_owner_who_is_also_member() {
		$product_id = $this->create_mock_product( 518, 'Dual Role Plan' );
		$sub        = $this->create_subscription( self::$user_id, [ $product_id ] );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		$sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'name', 'Dual Role Group' );
		// Also list the owner as a member (edge case: should not produce a duplicate name).
		add_user_meta( self::$user_id, Group_Subscription::GROUP_SUBSCRIPTION_USER_META_KEY, $sub->get_id() );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Dual Role Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Dual Role Group', $result['Content_Access_Group'], 'Group name should appear once even when the user is both owner and member.' );
	}

	/**
	 * Test that owned and member group subscriptions both surface, sorted.
	 */
	public function test_group_label_combines_owned_and_member_groups() {
		$pid_owned  = $this->create_mock_product( 519, 'Owner Plan' );
		$pid_member = $this->create_mock_product( 520, 'Member Plan' );

		$owned_sub = $this->create_subscription( self::$user_id, [ $pid_owned ] );
		$owned_sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'enabled', 'yes' );
		$owned_sub->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_META_PREFIX . 'name', 'Owned Group' );

		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $pid_member ], 'Member Group' );

		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $pid_owned, $pid_member ],
				],
			],
		];
		$this->create_gate_with_rules( 'Combined Group Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Member Group, Owned Group', $result['Content_Access_Group'], 'Both owned and member group names should appear, sorted naturally.' );
	}

	/**
	 * Test that an institution match produces the institution name.
	 */
	public function test_group_label_for_institution() {
		$inst_id = $this->create_institution( 'Test University', [ 'email_domain' => 'example.com' ] );

		$rules = [
			[
				[
					'slug'  => 'institution',
					'value' => [ $inst_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Institution Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEquals( 'Test University', $result['Content_Access_Group'], 'Institution name should appear in Content_Access_Group.' );
	}

	/**
	 * Test that matching multiple institutions produces sorted names.
	 */
	public function test_group_label_with_multiple_institutions() {
		$inst_a = $this->create_institution( 'Zeta College', [ 'email_domain' => 'example.com' ] );
		$inst_b = $this->create_institution( 'Alpha University', [ 'email_domain' => 'example.com' ] );

		$rules = [
			[
				[
					'slug'  => 'institution',
					'value' => [ $inst_a, $inst_b ],
				],
			],
		];
		$this->create_gate_with_rules( 'Multi Institution Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Alpha University, Zeta College', $result['Content_Access_Group'], 'Institution names should appear sorted naturally.' );
	}

	/**
	 * Test that an email_domain rule produces no group label.
	 */
	public function test_group_label_empty_for_email_domain() {
		$rules = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$this->create_gate_with_rules( 'Domain Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEmpty( $result['Content_Access_Group'], 'Email domain rule should not contribute a group label.' );
	}

	/**
	 * Test that a user matching both a group subscription and an institution gets both names.
	 */
	public function test_group_label_for_group_subscription_and_institution() {
		$product_id = $this->create_mock_product( 516, 'Combo Plan' );
		$this->create_group_subscription_with_member( self::$owner_id, self::$user_id, [ $product_id ], 'ACME Corp' );
		$inst_id = $this->create_institution( 'State University', [ 'email_domain' => 'example.com' ] );

		// One gate, one rule group (AND logic) — both rules must pass.
		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
				[
					'slug'  => 'institution',
					'value' => [ $inst_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Group + Institution Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User passing both rules should have access.' );
		$this->assertEquals( 'ACME Corp, State University', $result['Content_Access_Group'], 'Both group subscription and institution names should appear, sorted.' );
	}

	/**
	 * Test that no access yields an empty Content_Access_Group.
	 */
	public function test_group_label_empty_when_access_denied() {
		$product_id = $this->create_mock_product( 515, 'Some Plan' );
		// User does not own and is not a member of any subscription.
		$rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ $product_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'No Access Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'No', $result['Content_Access'] );
		$this->assertEmpty( $result['Content_Access_Group'], 'Denied access should yield an empty group label.' );
	}
}

<?php
/**
 * Tests for the Content Gates class.
 *
 * @package Newspack\Tests\Content_Gate
 */

namespace Newspack\Tests\Content_Gate;

use Newspack\Access_Rules;
use Newspack\Content_Gate;
use Newspack\Content_Restriction_Control;

/**
 * Tests for the Content Gates class.
 */
class Test_Content_Gates extends \WP_UnitTestCase {

	/**
	 * Post ID
	 *
	 * @var int[]
	 */
	protected $post_ids = [];

	/**
	 * Gates array.
	 *
	 * @var int[]
	 */
	protected $gate_ids = [];

	/**
	 * Test set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->gate_ids[] = Content_Gate::create_gate( [ 'title' => 'Draft Gate' ] );
		Content_Gate::update_gate_settings(
			$this->gate_ids[0],
			[
				'title'         => 'Draft Gate',
				'status'        => 'draft',
				'priority'      => 0,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'registration'  => [
					'active'               => true,
					'metering'             => [
						'enabled' => false,
						'count'   => 0,
						'period'  => 'month',
					],
					'require_verification' => false,
					'gate_id'              => 0,
				],
			]
		);
		$this->gate_ids[] = Content_Gate::create_gate( [ 'title' => 'Trash Gate' ] );
		Content_Gate::update_gate_settings(
			$this->gate_ids[1],
			[
				'title'         => 'Trash Gate',
				'status'        => 'trash',
				'priority'      => 1,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'registration'  => [
					'active'               => true,
					'metering'             => [
						'enabled' => false,
						'count'   => 0,
						'period'  => 'month',
					],
					'require_verification' => false,
					'gate_id'              => 0,
				],
			]
		);
		$this->gate_ids[] = Content_Gate::create_gate( [ 'title' => 'Published Gate' ] );
		Content_Gate::update_gate_settings(
			$this->gate_ids[2],
			[
				'title'         => 'Published Gate',
				'status'        => 'publish',
				'priority'      => 2,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'registration'  => [
					'active'               => true,
					'metering'             => [
						'enabled' => false,
						'count'   => 0,
						'period'  => 'month',
					],
					'require_verification' => false,
					'gate_id'              => 0,
				],
			]
		);
		$this->gate_ids[] = Content_Gate::create_gate( [ 'title' => 'Published Gate w/ missing config' ] );
		Content_Gate::update_gate_settings(
			$this->gate_ids[3],
			[
				'title'         => 'Published Gate',
				'status'        => 'publish',
				'priority'      => 3,
				'content_rules' => [],
				'registration'  => [
					'active'               => false,
					'metering'             => [
						'enabled' => false,
						'count'   => 0,
						'period'  => 'month',
					],
					'require_verification' => false,
					'gate_id'              => 0,
				],
				'custom_access' => [
					'active'       => false,
					'metering'     => [
						'enabled' => false,
						'count'   => 0,
						'period'  => 'month',
					],
					'gate_id'      => 0,
					'access_rules' => [],
				],
			]
		);
		$this->post_ids[] = $this->factory->post->create();
	}

	/**
	 * Teardown after tests.
	 */
	public function tear_down() {
		foreach ( Content_Gate::get_gates() as $gate ) {
			wp_delete_post( $gate['id'], true );
		}
		foreach ( $this->post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
	}

	/**
	 * Test get_gates().
	 */
	public function test_get_gates() {
		$gates = Content_Gate::get_gates();
		$this->assertCount( 4, $gates, 'Default params get gates with all statuses' );
		$this->assertEquals( $this->gate_ids[0], $gates[0]['id'] );
		$this->assertEquals( $this->gate_ids[1], $gates[1]['id'] );
		$this->assertEquals( $this->gate_ids[2], $gates[2]['id'] );
		$this->assertEquals( $this->gate_ids[3], $gates[3]['id'] );

		$gates = Content_Gate::get_gates( Content_Gate::GATE_CPT, 'publish' );
		$this->assertCount( 2, $gates, 'If passing a post status, only get gates with that status' );
		$this->assertEquals( $this->gate_ids[2], $gates[0]['id'] );
		$this->assertEquals( $this->gate_ids[3], $gates[1]['id'] );
	}

	/**
	 * Test get_post_gates() (for front-end display).
	 */
	public function test_get_post_gates() {
		$gates = Content_Restriction_Control::get_post_gates( $this->post_ids[0] );
		$this->assertCount( 1, $gates, 'One gate for the post' );
		$this->assertEquals( $this->gate_ids[2], $gates[0]['id'], 'Gate with publish status and matching rules configuration is included' );
		$this->assertNotContains( $this->gate_ids[3], $gates, 'Gate with publish status but no rules configuration is not included' );
	}

	/**
	 * Test content rules.
	 */
	public function test_content_rules() {
		// Create test categories.
		$cat1 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 1',
			]
		);
		$cat2 = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category 2',
			]
		);

		// Create test posts.
		$post1 = $this->factory->post->create( [ 'post_category' => [ $cat1 ] ] );
		$post2 = $this->factory->post->create( [ 'post_category' => [ $cat2 ] ] );
		$post3 = $this->factory->post->create( [ 'post_category' => [] ] );
		$this->post_ids[] = $post1;
		$this->post_ids[] = $post2;
		$this->post_ids[] = $post3;

		// Update content rules to match posts in category 1.
		Content_Gate::update_post_content_rules(
			$this->gate_ids[2],
			[
				[
					'slug'  => 'category',
					'value' => [ $cat1 ],
				],
			]
		);

		$gates = Content_Restriction_Control::get_post_gates( $post1 );
		$this->assertCount( 1, $gates, 'One gate for the post in category 1' );
		$this->assertEquals( $this->gate_ids[2], $gates[0]['id'], 'Gate with publish status and matching rules configuration is included' );
		$this->assertNotContains( $this->gate_ids[3], $gates, 'Gate with publish status but no rules configuration is not included' );

		$gates = Content_Restriction_Control::get_post_gates( $post2 );
		$this->assertCount( 0, $gates, 'No gates for the post in category 2' );

		$gates = Content_Restriction_Control::get_post_gates( $post3 );
		$this->assertCount( 0, $gates, 'No gate for the post with no categories' );

		// Make the content rule an exclusion rule.
		Content_Gate::update_post_content_rules(
			$this->gate_ids[2],
			[
				[
					'slug'      => 'category',
					'value'     => [ $cat1 ],
					'exclusion' => true,
				],
			]
		);

		$gates = Content_Restriction_Control::get_post_gates( $post1 );
		$this->assertCount( 0, $gates, 'No gates for the post in category 1' );

		$gates = Content_Restriction_Control::get_post_gates( $post2 );
		$this->assertCount( 1, $gates, 'One gate for the post in category 2' );
		$this->assertEquals( $this->gate_ids[2], $gates[0]['id'], 'Gate with publish status and matching rules configuration is included' );

		$gates = Content_Restriction_Control::get_post_gates( $post3 );
		$this->assertCount( 1, $gates, 'One gate for the post with no categories' );
		$this->assertEquals( $this->gate_ids[2], $gates[0]['id'], 'Gate with publish status and matching rules configuration is included' );
	}

	/**
	 * Test that gate layouts are created when a gate is created.
	 */
	public function test_create_gate_creates_layouts() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Gate' ] );
		$this->gate_ids[] = $gate_id;

		$gate = Content_Gate::get_gate( $gate_id );
		$this->assertNotEmpty( $gate['registration']['gate_layout_id'], 'Registration layout ID should be set' );
		$this->assertNotEmpty( $gate['custom_access']['gate_layout_id'], 'Custom access layout ID should be set' );

		// Verify the layout posts exist.
		$registration_layout = get_post( $gate['registration']['gate_layout_id'] );
		$custom_access_layout = get_post( $gate['custom_access']['gate_layout_id'] );

		$this->assertNotNull( $registration_layout, 'Registration layout post should exist' );
		$this->assertNotNull( $custom_access_layout, 'Custom access layout post should exist' );
		$this->assertEquals( Content_Gate::GATE_LAYOUT_CPT, $registration_layout->post_type, 'Registration layout should be correct post type' );
		$this->assertEquals( Content_Gate::GATE_LAYOUT_CPT, $custom_access_layout->post_type, 'Custom access layout should be correct post type' );
		$this->assertEquals( 'publish', $registration_layout->post_status, 'Registration layout should be published' );
		$this->assertEquals( 'publish', $custom_access_layout->post_status, 'Custom access layout should be published' );
	}

	/**
	 * Test that layouts are deleted when a gate is permanently deleted.
	 */
	public function test_delete_gate_deletes_layouts() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Gate for Deletion' ] );
		$gate = Content_Gate::get_gate( $gate_id );

		$registration_layout_id = $gate['registration']['gate_layout_id'];
		$custom_access_layout_id = $gate['custom_access']['gate_layout_id'];

		// Verify layouts exist before deletion.
		$this->assertNotNull( get_post( $registration_layout_id ), 'Registration layout should exist before deletion' );
		$this->assertNotNull( get_post( $custom_access_layout_id ), 'Custom access layout should exist before deletion' );

		// Permanently delete the gate.
		wp_delete_post( $gate_id, true );

		// Verify layouts are deleted.
		$this->assertNull( get_post( $registration_layout_id ), 'Registration layout should be deleted' );
		$this->assertNull( get_post( $custom_access_layout_id ), 'Custom access layout should be deleted' );
	}

	/**
	 * Test that only layouts associated with the deleted gate are removed.
	 */
	public function test_delete_gate_only_deletes_own_layouts() {
		$gate1_id = Content_Gate::create_gate( [ 'title' => 'Gate 1' ] );
		$gate2_id = Content_Gate::create_gate( [ 'title' => 'Gate 2' ] );
		$this->gate_ids[] = $gate2_id;

		$gate1 = Content_Gate::get_gate( $gate1_id );
		$gate2 = Content_Gate::get_gate( $gate2_id );

		$gate1_registration_layout_id = $gate1['registration']['gate_layout_id'];
		$gate2_registration_layout_id = $gate2['registration']['gate_layout_id'];
		$gate2_custom_access_layout_id = $gate2['custom_access']['gate_layout_id'];

		// Delete gate 1.
		wp_delete_post( $gate1_id, true );

		// Gate 1's layout should be deleted.
		$this->assertNull( get_post( $gate1_registration_layout_id ), 'Gate 1 registration layout should be deleted' );

		// Gate 2's layouts should still exist.
		$this->assertNotNull( get_post( $gate2_registration_layout_id ), 'Gate 2 registration layout should still exist' );
		$this->assertNotNull( get_post( $gate2_custom_access_layout_id ), 'Gate 2 custom access layout should still exist' );
	}

	/**
	 * Test that deleting a gate handles missing layouts gracefully.
	 */
	public function test_delete_gate_handles_missing_layouts() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Gate' ] );
		$gate = Content_Gate::get_gate( $gate_id );

		$registration_layout_id = $gate['registration']['gate_layout_id'];

		// Manually delete one layout first.
		wp_delete_post( $registration_layout_id, true );
		$this->assertNull( get_post( $registration_layout_id ), 'Registration layout should be deleted' );

		// Deleting the gate should not cause errors even with missing layout.
		wp_delete_post( $gate_id, true );

		// Verify the gate is deleted.
		$this->assertNull( get_post( $gate_id ), 'Gate should be deleted' );
	}

	/**
	 * Test that deleting a gate handles gates without layouts (e.g., legacy gates).
	 */
	public function test_delete_gate_handles_gates_without_layouts() {
		// Create a gate and manually remove layout IDs to simulate a legacy gate.
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Legacy Gate' ] );
		$gate = Content_Gate::get_gate( $gate_id );

		// Delete the auto-created layouts and clear the settings.
		wp_delete_post( $gate['registration']['gate_layout_id'], true );
		wp_delete_post( $gate['custom_access']['gate_layout_id'], true );

		Content_Gate::update_registration_settings( $gate_id, [ 'gate_layout_id' => 0 ] );
		Content_Gate::update_custom_access_settings( $gate_id, [ 'gate_layout_id' => 0 ] );

		// Deleting the gate should not cause errors.
		wp_delete_post( $gate_id, true );

		// Verify the gate is deleted.
		$this->assertNull( get_post( $gate_id ), 'Gate should be deleted' );
	}

	/**
	 * Test that get_inline_gate_content_for_post returns default content when layout post doesn't exist.
	 */
	public function test_inline_gate_content_with_missing_layout() {
		$non_existent_id = 999999;

		$content = Content_Gate::get_inline_gate_content_for_post( $non_existent_id );

		// Should contain the clearfix div.
		$this->assertStringContainsString( 'clear:both', $content, 'Clearfix div should be present' );

		// Should contain the default gate content.
		$this->assertStringContainsString( 'This post is only available to members', $content, 'Default content should be present' );

		// Should be wrapped in gate container.
		$this->assertStringContainsString( 'newspack-content-gate__inline-gate', $content, 'Gate container should be present' );
	}

	/**
	 * Test that get_inline_gate_content_for_post returns actual content when layout post exists.
	 */
	public function test_inline_gate_content_with_existing_layout() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Gate' ] );
		$this->gate_ids[] = $gate_id;

		$gate = Content_Gate::get_gate( $gate_id );
		$layout_id = $gate['registration']['gate_layout_id'];

		// Update the layout with custom content.
		$custom_content = '<!-- wp:paragraph --><p>Custom gate message for testing.</p><!-- /wp:paragraph -->';
		wp_update_post(
			[
				'ID'           => $layout_id,
				'post_content' => $custom_content,
			]
		);

		// Set style to inline.
		update_post_meta( $layout_id, 'style', 'inline' );

		$content = Content_Gate::get_inline_gate_content_for_post( $layout_id );

		// Should contain the clearfix div.
		$this->assertStringContainsString( 'clear:both', $content, 'Clearfix div should be present' );

		// Should contain the custom content.
		$this->assertStringContainsString( 'Custom gate message for testing', $content, 'Custom content should be present' );

		// Should NOT contain the default content.
		$this->assertStringNotContainsString( 'This post is only available to members', $content, 'Default content should not be present' );

		// Should be wrapped in gate container.
		$this->assertStringContainsString( 'newspack-content-gate__inline-gate', $content, 'Gate container should be present' );
	}

	/**
	 * Test that get_inline_gate_content_for_post returns empty string for overlay style.
	 */
	public function test_inline_gate_content_returns_empty_for_overlay_style() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Gate' ] );
		$this->gate_ids[] = $gate_id;

		$gate = Content_Gate::get_gate( $gate_id );
		$layout_id = $gate['registration']['gate_layout_id'];

		// Set style to overlay.
		update_post_meta( $layout_id, 'style', 'overlay' );

		$content = Content_Gate::get_inline_gate_content_for_post( $layout_id );

		$this->assertEmpty( $content, 'Should return empty string for overlay style' );
	}

	/**
	 * Test that get_restricted_post_excerpt_for_gate uses defaults when layout doesn't exist.
	 */
	public function test_restricted_excerpt_with_missing_layout() {
		$post_id = $this->factory->post->create(
			[
				'post_content' => '<p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p><p>Fourth paragraph.</p>',
			]
		);
		$this->post_ids[] = $post_id;

		$post = get_post( $post_id );
		$non_existent_id = 999999;

		$excerpt = Content_Gate::get_restricted_post_excerpt_for_gate( $post, $non_existent_id );

		// Default visible_paragraphs is 2, so should have first two paragraphs.
		$this->assertStringContainsString( 'First paragraph', $excerpt, 'First paragraph should be present' );
		$this->assertStringContainsString( 'Second paragraph', $excerpt, 'Second paragraph should be present' );
		$this->assertStringNotContainsString( 'Third paragraph', $excerpt, 'Third paragraph should not be present' );
	}

	/**
	 * Test that get_restricted_post_excerpt_for_gate respects layout settings.
	 */
	public function test_restricted_excerpt_with_existing_layout() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Gate' ] );
		$this->gate_ids[] = $gate_id;

		$gate = Content_Gate::get_gate( $gate_id );
		$layout_id = $gate['registration']['gate_layout_id'];

		// Set visible paragraphs to 3.
		update_post_meta( $layout_id, 'visible_paragraphs', 3 );
		update_post_meta( $layout_id, 'style', 'inline' );
		update_post_meta( $layout_id, 'use_more_tag', false );

		$post_id = $this->factory->post->create(
			[
				'post_content' => '<p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p><p>Fourth paragraph.</p>',
			]
		);
		$this->post_ids[] = $post_id;

		$post = get_post( $post_id );
		$excerpt = Content_Gate::get_restricted_post_excerpt_for_gate( $post, $layout_id );

		// Should have first three paragraphs.
		$this->assertStringContainsString( 'First paragraph', $excerpt, 'First paragraph should be present' );
		$this->assertStringContainsString( 'Second paragraph', $excerpt, 'Second paragraph should be present' );
		$this->assertStringContainsString( 'Third paragraph', $excerpt, 'Third paragraph should be present' );
		$this->assertStringNotContainsString( 'Fourth paragraph', $excerpt, 'Fourth paragraph should not be present' );
	}

	/**
	 * Test access rules normalization from flat to grouped format.
	 */
	public function test_normalize_access_rules() {
		// Empty rules should return empty array.
		$result = Access_Rules::normalize_rules( [] );
		$this->assertEmpty( $result, 'Empty rules should return empty array' );

		// Flat rules should be wrapped in a single group.
		$flat_rules = [
			[
				'slug'  => 'subscription',
				'value' => [ 1, 2 ],
			],
			[
				'slug'  => 'email_domain',
				'value' => 'example.com',
			],
		];
		$result = Access_Rules::normalize_rules( $flat_rules );
		$this->assertCount( 1, $result, 'Flat rules should be wrapped in single group' );
		$this->assertEquals( $flat_rules, $result[0], 'Group should contain original rules' );

		// Already grouped rules should remain unchanged.
		$grouped_rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ 1 ],
				],
			],
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$result = Access_Rules::normalize_rules( $grouped_rules );
		$this->assertCount( 2, $result, 'Grouped rules should have 2 groups' );
		$this->assertEquals( $grouped_rules, $result, 'Grouped rules should remain unchanged' );
	}

	/**
	 * Test access rules evaluation with grouped OR logic.
	 */
	public function test_evaluate_access_rules_grouped() {
		// Empty rules should grant access.
		$result = Access_Rules::evaluate_rules( [] );
		$this->assertTrue( $result, 'Empty rules should grant access' );

		// Single empty group should grant access.
		$result = Access_Rules::evaluate_rules( [ [] ] );
		$this->assertTrue( $result, 'Single empty group should grant access' );
	}

	/**
	 * Test access rules evaluation with real pass/fail combinations.
	 */
	public function test_evaluate_access_rules_pass_fail_combinations() {
		// Create a test user with a specific email domain.
		$user_id = $this->factory->user->create(
			[
				'user_email' => 'test@allowed-domain.com',
			]
		);
		wp_set_current_user( $user_id );

		// Test 1: Flat legacy rules with passing rule.
		$flat_rules_pass = [
			[
				'slug'  => 'email_domain',
				'value' => 'allowed-domain.com',
			],
		];
		$result = Access_Rules::evaluate_rules( $flat_rules_pass );
		$this->assertTrue( $result, 'Flat rules with passing email_domain should grant access' );

		// Test 2: Flat legacy rules with failing rule.
		$flat_rules_fail = [
			[
				'slug'  => 'email_domain',
				'value' => 'other-domain.com',
			],
		];
		$result = Access_Rules::evaluate_rules( $flat_rules_fail );
		$this->assertFalse( $result, 'Flat rules with non-matching email_domain should deny access' );

		// Test 3: Flat rules with mixed pass/fail (AND logic - should fail).
		$flat_rules_mixed = [
			[
				'slug'  => 'email_domain',
				'value' => 'allowed-domain.com', // Passes.
			],
			[
				'slug'  => 'email_domain',
				'value' => 'other-domain.com', // Fails.
			],
		];
		$result = Access_Rules::evaluate_rules( $flat_rules_mixed );
		$this->assertFalse( $result, 'Flat rules with mixed results should deny access (AND logic)' );

		// Test 4: Multiple groups - first group fails, second passes (OR logic - should pass).
		$grouped_rules_or_pass = [
			// Group 1: Fails (non-matching domain).
			[
				[
					'slug'  => 'email_domain',
					'value' => 'other-domain.com',
				],
			],
			// Group 2: Passes (matching domain).
			[
				[
					'slug'  => 'email_domain',
					'value' => 'allowed-domain.com',
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $grouped_rules_or_pass );
		$this->assertTrue( $result, 'Multiple groups with at least one passing should grant access (OR logic)' );

		// Test 5: Multiple groups - all groups fail (OR logic - should fail).
		$grouped_rules_all_fail = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'domain-a.com',
				],
			],
			[
				[
					'slug'  => 'email_domain',
					'value' => 'domain-b.com',
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $grouped_rules_all_fail );
		$this->assertFalse( $result, 'Multiple groups with all failing should deny access' );

		// Test 6: Group with AND logic - both rules must pass.
		$grouped_and_logic = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'allowed-domain.com', // Passes.
				],
				[
					'slug'  => 'email_domain',
					'value' => 'other-domain.com', // Fails.
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $grouped_and_logic );
		$this->assertFalse( $result, 'Single group with mixed AND rules should deny access' );

		// Clean up.
		wp_delete_user( $user_id );
	}

	/**
	 * Test access rules evaluation with invalid or missing slug entries.
	 */
	public function test_evaluate_access_rules_invalid_entries() {
		// Create a test user.
		$user_id = $this->factory->user->create(
			[
				'user_email' => 'test@example.com',
			]
		);
		wp_set_current_user( $user_id );

		// Test 1: Rule with missing slug should be skipped (not block access).
		$rules_missing_slug = [
			[
				[
					'value' => 'some-value', // Missing 'slug' key.
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $rules_missing_slug );
		$this->assertTrue( $result, 'Rules with missing slug should be skipped and grant access' );

		// Test 2: Rule with non-existent slug should not block access.
		$rules_nonexistent_slug = [
			[
				[
					'slug'  => 'nonexistent_rule',
					'value' => 'some-value',
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $rules_nonexistent_slug );
		$this->assertTrue( $result, 'Rules with non-existent slug should not block access' );

		// Test 3: Mixed valid failing rule and invalid rule in same group.
		$rules_mixed_valid_invalid = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'other-domain.com', // Valid rule, fails.
				],
				[
					'slug'  => 'nonexistent_rule', // Invalid, passes.
					'value' => 'some-value',
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $rules_mixed_valid_invalid );
		$this->assertFalse( $result, 'Group with valid failing rule should deny access even with invalid rules' );

		// Test 4: Group with only invalid rules should pass.
		$rules_all_invalid = [
			[
				[
					'slug'  => 'nonexistent_rule_1',
					'value' => 'value1',
				],
				[
					'value' => 'no-slug', // Missing slug.
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $rules_all_invalid );
		$this->assertTrue( $result, 'Group with only invalid/skipped rules should grant access' );

		// Clean up.
		wp_delete_user( $user_id );
	}

	/**
	 * Test access rules evaluation requires logged-in user.
	 */
	public function test_evaluate_access_rules_requires_login() {
		// Ensure no user is logged in.
		wp_set_current_user( 0 );

		// Any valid rule should fail when user is not logged in.
		$rules = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$result = Access_Rules::evaluate_rules( $rules );
		$this->assertFalse( $result, 'Rules should deny access when user is not logged in' );
	}

	/**
	 * Test that custom_access settings return grouped access_rules format.
	 */
	public function test_custom_access_returns_grouped_rules() {
		// Create a gate with flat access rules (legacy format).
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Grouped Rules Gate' ] );
		$this->gate_ids[] = $gate_id;

		// Save flat rules directly to post meta (simulating legacy data).
		$custom_access = [
			'active'       => true,
			'metering'     => [
				'enabled' => false,
				'count'   => 0,
				'period'  => 'month',
			],
			'access_rules' => [
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		\update_post_meta( $gate_id, 'custom_access', $custom_access );

		// Retrieve settings - should be normalized to grouped format.
		$settings = Content_Gate::get_custom_access_settings( $gate_id );
		$this->assertTrue( $settings['active'], 'Active should be true' );
		$this->assertIsArray( $settings['access_rules'], 'access_rules should be an array' );

		// Check that flat rules were normalized to grouped format.
		$this->assertCount( 1, $settings['access_rules'], 'Should have one group' );
		$this->assertIsArray( $settings['access_rules'][0], 'First element should be an array (group)' );
		$this->assertCount( 1, $settings['access_rules'][0], 'Group should have one rule' );
		$this->assertEquals( 'email_domain', $settings['access_rules'][0][0]['slug'], 'Rule slug should be preserved' );
	}

	/**
	 * Helper to set a private static property on Content_Gate via reflection.
	 *
	 * @param string $property Property name.
	 * @param mixed  $value    Value to set.
	 */
	private function set_content_gate_property( $property, $value ) {
		$reflection = new \ReflectionProperty( Content_Gate::class, $property );
		$reflection->setAccessible( true );
		$reflection->setValue( null, $value );
	}

	/**
	 * Test comment filters on fully gated posts.
	 */
	public function test_comments_closed_on_gated_post() {
		$post_id = $this->post_ids[0];

		$this->set_content_gate_property( 'is_gated', true );
		$this->set_content_gate_property( 'is_metered', false );

		// Simulate queried object.
		$this->go_to( get_permalink( $post_id ) );

		$this->assertFalse( Content_Gate::filter_comments_open( true, $post_id ), 'Comments should be closed on gated post' );
		$this->assertEmpty( Content_Gate::filter_comments_array( [ 'comment1', 'comment2' ], $post_id ), 'Comments array should be empty on gated post' );
		$this->assertSame( 0, Content_Gate::filter_comments_number( 5, $post_id ), 'Comment count should be 0 on gated post' );

		// Reset.
		$this->set_content_gate_property( 'is_gated', false );
	}

	/**
	 * Test comment filters on metered posts.
	 */
	public function test_comments_closed_but_visible_on_metered_post() {
		$post_id = $this->post_ids[0];

		$this->set_content_gate_property( 'is_gated', false );
		$this->set_content_gate_property( 'is_metered', true );

		// Simulate queried object.
		$this->go_to( get_permalink( $post_id ) );

		$this->assertFalse( Content_Gate::filter_comments_open( true, $post_id ), 'Comments should be closed on metered post' );

		$comments = [ 'comment1', 'comment2' ];
		$this->assertSame( $comments, Content_Gate::filter_comments_array( $comments, $post_id ), 'Existing comments should remain visible on metered post' );
		$this->assertSame( 5, Content_Gate::filter_comments_number( 5, $post_id ), 'Comment count should be unchanged on metered post' );

		// Reset.
		$this->set_content_gate_property( 'is_metered', false );
	}

	/**
	 * Test comment filters do not affect unrelated posts.
	 */
	public function test_comments_unaffected_on_other_posts() {
		$post_id = $this->post_ids[0];
		$other_post_id = $this->factory->post->create();
		$this->post_ids[] = $other_post_id;

		$this->set_content_gate_property( 'is_gated', true );
		$this->set_content_gate_property( 'is_metered', false );

		// Simulate queried object as the gated post.
		$this->go_to( get_permalink( $post_id ) );

		// Filters should not affect the other post.
		$this->assertTrue( Content_Gate::filter_comments_open( true, $other_post_id ), 'Comments should remain open on non-gated post' );
		$comments = [ 'comment1' ];
		$this->assertSame( $comments, Content_Gate::filter_comments_array( $comments, $other_post_id ), 'Comments array should be unchanged on non-gated post' );
		$this->assertSame( 3, Content_Gate::filter_comments_number( 3, $other_post_id ), 'Comment count should be unchanged on non-gated post' );

		// Reset.
		$this->set_content_gate_property( 'is_gated', false );
	}

	/**
	 * Test comment filters pass through on unrestricted posts.
	 */
	public function test_comments_unaffected_on_unrestricted_post() {
		$post_id = $this->post_ids[0];

		$this->set_content_gate_property( 'is_gated', false );
		$this->set_content_gate_property( 'is_metered', false );

		$this->go_to( get_permalink( $post_id ) );

		$this->assertTrue( Content_Gate::filter_comments_open( true, $post_id ), 'Comments should remain open on unrestricted post' );
		$comments = [ 'comment1', 'comment2' ];
		$this->assertSame( $comments, Content_Gate::filter_comments_array( $comments, $post_id ), 'Comments array should be unchanged on unrestricted post' );
		$this->assertSame( 5, Content_Gate::filter_comments_number( 5, $post_id ), 'Comment count should be unchanged on unrestricted post' );
	}

	/**
	 * Test that already grouped access_rules remain unchanged.
	 */
	public function test_custom_access_preserves_grouped_rules() {
		$gate_id = Content_Gate::create_gate( [ 'title' => 'Test Preserve Grouped Rules Gate' ] );
		$this->gate_ids[] = $gate_id;

		// Save already grouped rules.
		$grouped_rules = [
			[
				[
					'slug'  => 'subscription',
					'value' => [ 1 ],
				],
			],
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$custom_access = [
			'active'       => true,
			'metering'     => [
				'enabled' => false,
				'count'   => 0,
				'period'  => 'month',
			],
			'access_rules' => $grouped_rules,
		];
		\update_post_meta( $gate_id, 'custom_access', $custom_access );

		// Retrieve settings - should remain grouped.
		$settings = Content_Gate::get_custom_access_settings( $gate_id );
		$this->assertCount( 2, $settings['access_rules'], 'Should have two groups' );
		$this->assertEquals( $grouped_rules, $settings['access_rules'], 'Grouped rules should be preserved' );
	}
}

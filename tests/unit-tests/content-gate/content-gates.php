<?php
/**
 * Tests for the Content Gates class.
 *
 * @package Newspack\Tests\Content_Gate
 */

namespace Newspack\Tests\Content_Gate;

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
		$this->gate_ids[] = Content_Gate::create_gate( 'Draft Gate' );
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
		$this->gate_ids[] = Content_Gate::create_gate( 'Trash Gate' );
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
		$this->gate_ids[] = Content_Gate::create_gate( 'Published Gate' );
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
		$this->gate_ids[] = Content_Gate::create_gate( 'Published Gate w/ missing config' );
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
		$gate_id = Content_Gate::create_gate( 'Test Gate' );
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
	}

	/**
	 * Test that layouts are deleted when a gate is permanently deleted.
	 */
	public function test_delete_gate_deletes_layouts() {
		$gate_id = Content_Gate::create_gate( 'Test Gate for Deletion' );
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
		$gate1_id = Content_Gate::create_gate( 'Gate 1' );
		$gate2_id = Content_Gate::create_gate( 'Gate 2' );
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
		$gate_id = Content_Gate::create_gate( 'Test Gate' );
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
		$gate_id = Content_Gate::create_gate( 'Legacy Gate' );
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
}

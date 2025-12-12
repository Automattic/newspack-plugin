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
				'description'   => 'Draft Gate',
				'status'        => 'draft',
				'priority'      => 0,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'access_rules'  => [
					[
						'slug'  => 'registration',
						'value' => true,
					],
				],
				'metering'      => [
					'enabled'          => false,
					'anonymous_count'  => 0,
					'registered_count' => 0,
					'period'           => 'month',
				],
			]
		);
		$this->gate_ids[] = Content_Gate::create_gate( 'Trash Gate' );
		Content_Gate::update_gate_settings(
			$this->gate_ids[1],
			[
				'title'         => 'Trash Gate',
				'description'   => 'Trash Gate',
				'status'        => 'trash',
				'priority'      => 1,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'access_rules'  => [
					[
						'slug'  => 'registration',
						'value' => true,
					],
				],
				'metering'      => [
					'enabled'          => false,
					'anonymous_count'  => 0,
					'registered_count' => 0,
					'period'           => 'month',
				],
			]
		);
		$this->gate_ids[] = Content_Gate::create_gate( 'Published Gate' );
		Content_Gate::update_gate_settings(
			$this->gate_ids[2],
			[
				'title'         => 'Published Gate',
				'description'   => 'Published Gate',
				'status'        => 'publish',
				'priority'      => 2,
				'content_rules' => [
					[
						'slug'  => 'post_types',
						'value' => [ 'post' ],
					],
				],
				'access_rules'  => [
					[
						'slug'  => 'registration',
						'value' => true,
					],
				],
				'metering'      => [
					'enabled'          => false,
					'anonymous_count'  => 0,
					'registered_count' => 0,
					'period'           => 'month',
				],
			]
		);
		$this->gate_ids[] = Content_Gate::create_gate( 'Published Gate w/ missing config' );
		Content_Gate::update_gate_settings(
			$this->gate_ids[3],
			[
				'title'         => 'Published Gate',
				'description'   => 'Published Gate w/ missing config',
				'status'        => 'publish',
				'priority'      => 3,
				'content_rules' => [],
				'access_rules'  => [],
				'metering'      => [
					'enabled'          => false,
					'anonymous_count'  => 0,
					'registered_count' => 0,
					'period'           => 'month',
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
}

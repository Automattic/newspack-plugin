<?php
/**
 * Tests for Block_Visibility class.
 *
 * @package Newspack\Tests
 * @group Block_Visibility
 */

use Newspack\Block_Visibility;

/**
 * Block_Visibility test case.
 */
class Newspack_Test_Block_Visibility extends WP_UnitTestCase {

	/**
	 * Test that the Block_Visibility class exists.
	 */
	public function test_class_exists() {
		$this->assertTrue( class_exists( 'Newspack\Block_Visibility' ) );
	}

	/**
	 * Test that the render_block filter is registered.
	 */
	public function test_render_block_filter_registered() {
		$this->assertNotFalse(
			has_filter( 'render_block', [ 'Newspack\Block_Visibility', 'filter_render_block' ] )
		);
	}

	/**
	 * Test that the enqueue_block_editor_assets action is registered.
	 */
	public function test_enqueue_block_editor_assets_action_registered() {
		$this->assertNotFalse(
			has_action( 'enqueue_block_editor_assets', [ 'Newspack\Block_Visibility', 'enqueue_block_editor_assets' ] )
		);
	}

	/**
	 * Test that the register_block_type_args filter is registered.
	 */
	public function test_register_block_type_args_filter_registered() {
		$this->assertNotFalse(
			has_filter( 'register_block_type_args', [ 'Newspack\Block_Visibility', 'register_block_type_args' ] )
		);
	}

	/**
	 * Helper to build a mock block array.
	 *
	 * @param string $name  Block name.
	 * @param array  $attrs Block attributes.
	 * @return array
	 */
	private function make_block( $name, $attrs = [] ) {
		return [
			'blockName' => $name,
			'attrs'     => $attrs,
			'innerHTML' => '<div>content</div>',
		];
	}

	/**
	 * Test that non-target blocks pass through unchanged.
	 */
	public function test_non_target_block_passes_through() {
		$result = Block_Visibility::filter_render_block( '<p>hello</p>', $this->make_block( 'core/paragraph' ) );
		$this->assertSame( '<p>hello</p>', $result );
	}

	/**
	 * Test that a target block with no attrs passes through unchanged.
	 */
	public function test_target_block_with_no_rules_passes_through() {
		$result = Block_Visibility::filter_render_block( '<div>hi</div>', $this->make_block( 'core/group', [] ) );
		$this->assertSame( '<div>hi</div>', $result );
	}

	/**
	 * Test that a target block with an empty rules object passes through unchanged.
	 */
	public function test_target_block_with_empty_rules_object_passes_through() {
		$result = Block_Visibility::filter_render_block(
			'<div>hi</div>',
			$this->make_block( 'core/group', [ 'newspackAccessControlRules' => [] ] )
		);
		$this->assertSame( '<div>hi</div>', $result );
	}

	/**
	 * Test that a target block with only inactive rules passes through unchanged.
	 */
	public function test_target_block_with_inactive_rules_passes_through() {
		$result = Block_Visibility::filter_render_block(
			'<div>hi</div>',
			$this->make_block( 'core/group', [
				'newspackAccessControlRules' => [
					'registration'  => [ 'active' => false ],
					'custom_access' => [ 'active' => false, 'access_rules' => [] ],
				],
			] )
		);
		$this->assertSame( '<div>hi</div>', $result );
	}
}

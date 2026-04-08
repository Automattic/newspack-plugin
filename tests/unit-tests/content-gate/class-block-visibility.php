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
	 * Test user ID.
	 *
	 * @var int
	 */
	private $test_user_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->test_user_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );

		// Register a simple test rule: passes only for our test user.
		\Newspack\Access_Rules::register_rule(
			[
				'id'       => 'test_rule',
				'name'     => 'Test Rule',
				'callback' => function( $user_id, $value ) {
					return intval( $user_id ) === intval( $value );
				},
			]
		);
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		Block_Visibility::reset_cache_for_tests();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

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
			$this->make_block(
				'core/group',
				[
					'newspackAccessControlRules' => [
						'registration'  => [ 'active' => false ],
						'custom_access' => [
							'active'       => false,
							'access_rules' => [],
						],
					],
				]
			)
		);
		$this->assertSame( '<div>hi</div>', $result );
	}

	/**
	 * Test that a target block with active rules passes through unchanged when is_admin() is true.
	 */
	public function test_target_block_with_rules_passes_through_in_admin() {
		set_current_screen( 'dashboard' );
		$block  = $this->make_block(
			'core/group',
			[
				'newspackAccessControlRules' => [
					'registration' => [ 'active' => true ],
				],
			]
		);
		$result = Block_Visibility::filter_render_block( '<div>admin view</div>', $block );
		$this->assertSame( '<div>admin view</div>', $result );
		unset( $GLOBALS['current_screen'] );
	}

	/**
	 * Registration: logged-out user does not match.
	 */
	public function test_registration_logged_out_does_not_match() {
		wp_set_current_user( 0 );
		$rules = [ 'registration' => [ 'active' => true ] ];
		$this->assertFalse( Block_Visibility::evaluate_rules_for_user_public( $rules, 0 ) );
	}

	/**
	 * Registration: logged-in user matches.
	 */
	public function test_registration_logged_in_matches() {
		$rules = [ 'registration' => [ 'active' => true ] ];
		$this->assertTrue( Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id ) );
	}

	/**
	 * Registration + require_verification: unverified user does not match.
	 */
	public function test_registration_unverified_does_not_match() {
		$rules = [
			'registration' => [
				'active'               => true,
				'require_verification' => true,
			],
		];
		$this->assertFalse( Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id ) );
	}

	/**
	 * Registration + require_verification: verified user matches.
	 */
	public function test_registration_verified_matches() {
		update_user_meta( $this->test_user_id, \Newspack\Reader_Activation::EMAIL_VERIFIED, true );
		$rules = [
			'registration' => [
				'active'               => true,
				'require_verification' => true,
			],
		];
		$this->assertTrue( Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id ) );
	}

	/**
	 * Custom access rule: matching user passes.
	 */
	public function test_access_rule_matching_user_passes() {
		$rules = [
			'custom_access' => [
				'active'       => true,
				'access_rules' => [ [ [ 'slug' => 'test_rule', 'value' => $this->test_user_id ] ] ],
			],
		];
		$this->assertTrue( Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id ) );
	}

	/**
	 * Custom access rule: non-matching user fails.
	 */
	public function test_access_rule_non_matching_user_fails() {
		$other_user = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		$rules      = [
			'custom_access' => [
				'active'       => true,
				'access_rules' => [ [ [ 'slug' => 'test_rule', 'value' => $this->test_user_id ] ] ],
			],
		];
		$this->assertFalse( Block_Visibility::evaluate_rules_for_user_public( $rules, $other_user ) );
	}

	/**
	 * AND logic: registration + access rules — both must pass.
	 */
	public function test_and_logic_both_must_pass() {
		$rules = [
			'registration'  => [ 'active' => true ],
			'custom_access' => [
				'active'       => true,
				'access_rules' => [ [ [ 'slug' => 'test_rule', 'value' => $this->test_user_id ] ] ],
			],
		];
		// Logged-in user who matches the access rule: passes.
		$this->assertTrue( Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id ) );

		// Logged-out user: fails (registration not met).
		Block_Visibility::reset_cache_for_tests();
		$this->assertFalse( Block_Visibility::evaluate_rules_for_user_public( $rules, 0 ) );
	}

	/**
	 * Caching: second call returns cached result without re-evaluation.
	 */
	public function test_result_is_cached() {
		$call_count = 0;
		\Newspack\Access_Rules::register_rule(
			[
				'id'       => 'counting_rule',
				'name'     => 'Counting Rule',
				'callback' => function( $user_id, $value ) use ( &$call_count ) {
					$call_count++;
					return true;
				},
			]
		);
		$rules = [
			'custom_access' => [
				'active'       => true,
				'access_rules' => [ [ [ 'slug' => 'counting_rule', 'value' => null ] ] ],
			],
		];
		Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id );
		Block_Visibility::evaluate_rules_for_user_public( $rules, $this->test_user_id );
		// Callback fired only once despite two calls with identical rules + user.
		$this->assertSame( 1, $call_count );
	}
}

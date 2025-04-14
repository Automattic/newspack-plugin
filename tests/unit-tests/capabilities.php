<?php
/**
 * Test_Capabilities class.
 *
 * @package Newspack
 */

use Newspack\Capabilities;

/**
 * Class Test_Capabilities
 */
class Test_Capabilities extends WP_UnitTestCase {
	/**
	 * Test the map_capabilities method.
	 */
	public function test_capabilities_mapping_post_to_post() {
		// Use the capabilities map filter.
		add_filter(
			'newspack_capabilities_map',
			fn() => [
				// 'newspack_post' caps should inherit from 'post'.
				'newspack_post' => 'post',
			]
		);

		// Mock the post types.
		$this->mock_post_type_object( 'newspack_post' );

		$user_all_caps = [
			'edit_posts'   => true,
			'delete_posts' => false,
		];
		$required_caps = [ 'edit_newspack_posts' ];

		$result = Capabilities::map_capabilities( $user_all_caps, $required_caps );
		$this->assertEquals( array_merge( $user_all_caps, [ 'edit_newspack_posts' => true ] ), $result, 'User with edit_posts cap should get the edit_newspack_post cap, too' );

		$user_all_caps = [
			'edit_posts'   => false,
			'delete_posts' => false,
		];
		$result = Capabilities::map_capabilities( $user_all_caps, $required_caps );
		$this->assertEquals( $user_all_caps, $result, 'User without edit_posts cap should not get the edit_newspack_post cap' );

		$user_all_caps = [
			'edit_posts'   => true,
			'delete_posts' => true,
		];
		$required_caps = [ 'edit_newspack_posts', 'delete_newspack_posts' ];
		$this->assertEquals(
			array_merge(
				$user_all_caps,
				[
					'edit_newspack_posts'   => true,
					'delete_newspack_posts' => true,
				]
			),
			Capabilities::map_capabilities( $user_all_caps, $required_caps ),
			'Multiple required caps are supported.'
		);

		add_filter(
			'newspack_capabilities_map',
			fn() => [
				// 'newspack_post' caps should inherit from 'page'.
				'newspack_post' => 'page',
			]
		);
		$result = Capabilities::map_capabilities( $user_all_caps, [ 'edit_newspack_posts' ] );
		$this->assertEquals(
			false,
			isset( $result['edit_newspack_posts'] ),
			"User can't edit posts which inherrit caps from pages (even though they can edit posts)."
		);
	}

	/**
	 * Test the map_capabilities method.
	 */
	public function test_capabilities_mapping_other_caps() {
		add_filter(
			'newspack_capabilities_map',
			fn() => [
				// 'newspack_widgets' caps should inherit from 'manage_options'.
				'newspack_widgets' => 'manage_options',
			]
		);
		$user_all_caps = [
			'manage_options' => true,
		];
		$this->assertEquals(
			array_merge( $user_all_caps, [ 'newspack_widgets' => true ] ),
			Capabilities::map_capabilities( $user_all_caps, [ 'newspack_widgets' ] ),
			'User who can manage_options can newspack_widgets too.'
		);
		$user_all_caps = [
			'manage_options' => false,
		];
		$this->assertEquals(
			$user_all_caps,
			Capabilities::map_capabilities( $user_all_caps, [ 'newspack_widgets' ] ),
			"User who can't manage_options can't newspack_widgets neither."
		);
	}

	/**
	 * Mock a post type object.
	 *
	 * @param string $post_type Post type name.
	 */
	private function mock_post_type_object( $post_type ) {
		$capabilities = [
			'edit_posts'   => 'edit_' . $post_type . 's',
			'delete_posts' => 'delete_' . $post_type . 's',
		];
		add_filter(
			'register_post_type_args',
			function( $args, $name ) use ( $post_type, $capabilities ) {
				if ( $name === $post_type ) {
					$args['cap'] = $capabilities;
				}
				return $args;
			},
			10,
			2
		);

		register_post_type( $post_type );
	}
}

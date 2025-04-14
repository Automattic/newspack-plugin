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
	public function test_capabilities_mapping() {
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
		$result = Capabilities::map_capabilities( $user_all_caps, $required_caps );
		$this->assertEquals(
			array_merge(
				$user_all_caps,
				[
					'edit_newspack_posts'   => true,
					'delete_newspack_posts' => true,
				]
			),
			$result,
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

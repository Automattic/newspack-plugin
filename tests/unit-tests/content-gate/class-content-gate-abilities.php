<?php
/**
 * Tests the Content Gate Ability Registry.
 *
 * @package Newspack\Tests
 */

use Newspack\Content_Gate_Abilities;
use Newspack\Content_Gate_Ability_Registry;

/**
 * Test Content Gate Ability Registry.
 *
 * @group Content_Gate_Abilities
 */
class Newspack_Test_Content_Gate_Abilities extends WP_UnitTestCase {

	/**
	 * Test that is_available returns false when the Abilities API is not loaded.
	 */
	public function test_is_available_returns_false_without_api() {
		if ( function_exists( 'wp_register_ability' ) ) {
			$this->markTestSkipped( 'Abilities API is loaded; cannot test unavailability.' );
		}
		$this->assertFalse( Content_Gate_Abilities::is_available() );
	}

	/**
	 * Test check-content-access returns unrestricted for a normal published post.
	 */
	public function test_check_content_access_unrestricted() {
		$post_id = self::factory()->post->create( [ 'post_status' => 'publish' ] );

		$result = Content_Gate_Ability_Registry::execute_check_content_access( [ 'post_id' => $post_id ] );

		$this->assertTrue( $result['has_access'] );
		$this->assertNull( $result['gate_id'] );
		$this->assertSame( 'no_gate', $result['reason'] );
	}

	/**
	 * Test check-content-access returns unrestricted for an invalid post ID.
	 */
	public function test_check_content_access_invalid_post() {
		$result = Content_Gate_Ability_Registry::execute_check_content_access( [ 'post_id' => 999999 ] );

		$this->assertTrue( $result['has_access'] );
		$this->assertNull( $result['gate_id'] );
		$this->assertSame( 'post_not_found', $result['reason'] );
	}

	/**
	 * Test check-content-access restores the original user after checking another user.
	 */
	public function test_check_content_access_restores_user() {
		$admin_id      = self::factory()->user->create( [ 'role' => 'administrator' ] );
		$subscriber_id = self::factory()->user->create( [ 'role' => 'subscriber' ] );
		$post_id       = self::factory()->post->create( [ 'post_status' => 'publish' ] );

		wp_set_current_user( $admin_id );

		Content_Gate_Ability_Registry::execute_check_content_access(
			[
				'post_id' => $post_id,
				'user_id' => $subscriber_id,
			]
		);

		$this->assertSame( $admin_id, get_current_user_id() );
	}

	/**
	 * Test check-content-access denies permission when a non-admin checks another user.
	 */
	public function test_check_content_access_permission_for_other_user() {
		$subscriber_a = self::factory()->user->create( [ 'role' => 'subscriber' ] );
		$subscriber_b = self::factory()->user->create( [ 'role' => 'subscriber' ] );
		$post_id      = self::factory()->post->create( [ 'post_status' => 'publish' ] );

		wp_set_current_user( $subscriber_a );

		$result = Content_Gate_Ability_Registry::execute_check_content_access(
			[
				'post_id' => $post_id,
				'user_id' => $subscriber_b,
			]
		);

		$this->assertSame( 'permission_denied', $result['reason'] );
	}

	/**
	 * Test list-gates returns an array.
	 */
	public function test_list_gates_returns_array() {
		$result = Content_Gate_Ability_Registry::execute_list_gates( [] );

		$this->assertIsArray( $result );
	}

	/**
	 * Test get-gate-for-post returns empty array for an ungated post.
	 */
	public function test_get_gate_for_post_ungated() {
		$post_id = self::factory()->post->create( [ 'post_status' => 'publish' ] );

		$result = Content_Gate_Ability_Registry::execute_get_gate_for_post( [ 'post_id' => $post_id ] );

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test get-metering-status returns metered false when no gate_id is provided.
	 */
	public function test_get_metering_status_disabled() {
		$result = Content_Gate_Ability_Registry::execute_get_metering_status( [] );

		$this->assertFalse( $result['metered'] );
	}
}

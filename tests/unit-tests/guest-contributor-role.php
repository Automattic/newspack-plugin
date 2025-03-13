<?php
/**
 * Tests the Guest_Contributor_Role.
 *
 * @package Newspack\Tests
 */

use Newspack\Guest_Contributor_Role;

/**
 * Tests the Guest_Contributor_Role.
 */
class Newspack_Test_Guest_Contributor_Role extends WP_UnitTestCase {

	public function set_up() { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		wp_reset_postdata();
	}

	/**
	 * On a post with author.
	 */
	public function test_guest_contributor_role_get_dummy_email() {
		$email_domain = Guest_Contributor_Role::get_dummy_email_domain();
		$user = get_userdata( 1 );

		$expected = $user->user_login . '@' . $email_domain;

		$dummy_email = Guest_Contributor_Role::get_dummy_email_address( $user );
		$this->assertSame( $expected, $dummy_email );

		$dummy_email = Guest_Contributor_Role::get_dummy_email_address( $user->user_login );
		$this->assertSame( $expected, $dummy_email );
	}

	/**
	 * On a post with author.
	 */
	public function test_guest_contributor_role_dummy_email_hiding_default() {
		$email_domain = Guest_Contributor_Role::get_dummy_email_domain();
		$user_id = \wp_insert_user(
			[
				'user_login' => 'guest-contributor',
				'user_pass'  => '123',
				'user_email' => 'guest-contributor@' . $email_domain,
				'role'       => Guest_Contributor_Role::CONTRIBUTOR_NO_EDIT_ROLE_NAME,
			]
		);
		$post_id = \wp_insert_post(
			[
				'post_title'  => 'Title',
				'post_status' => 'publish',
				'post_author' => $user_id,
			]
		);
		global $wp_query;
		$wp_query = new WP_Query(
			[
				'p' => $post_id,
			]
		);
		$post = get_post( $post_id );
		setup_postdata( $post );

		self::assertEquals(
			Guest_Contributor_Role::should_display_author_email( true ),
			false,
			'Email should be hidden for a Guest Contributor with a dummy email.'
		);

		// Update the user's email address.
		\wp_update_user(
			[
				'ID'         => $user_id,
				'user_email' => 'guest-contributor@legit-domain.com',
			]
		);
		self::assertEquals(
			Guest_Contributor_Role::should_display_author_email( true ),
			true,
			'Email should be displayed for a Guest Contributor with a regular email.'
		);
	}

	/**
	 * On a post with no author.
	 */
	public function test_guest_contributor_role_dummy_email_hiding_no_author() {
		global $wp_query;
		$wp_query->is_singular = true;
		$should_hide = Guest_Contributor_Role::should_display_author_email( true );
		self::assertEquals( null, get_the_author_meta( 'ID' ) );
		self::assertEquals(
			true,
			$should_hide,
			'Function should run successfully even if post apparently has no author. This can happen with co-authors-plus Guest Authors.'
		);
	}
}

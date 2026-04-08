<?php
/**
 * Tests the Comment Display Name functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Comment_Display_Name;

/**
 * Tests the Comment Display Name functionality.
 *
 * @group comment-display-name
 */
class Newspack_Test_Comment_Display_Name extends WP_UnitTestCase {

	/**
	 * Create a reader with a generic (email-derived) display name.
	 *
	 * @param string $email Reader email.
	 * @return int User ID.
	 */
	private function create_generic_reader( $email = 'jane.doe@example.com' ) {
		$user_id = Reader_Activation::register_reader( $email );
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * Test that the display name field renders for a reader with a generic display name.
	 */
	public function test_renders_field_for_generic_display_name() {
		$user_id = $this->create_generic_reader();

		ob_start();
		Comment_Display_Name::render_display_name_field();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'name="comment_display_name"', $output );
		$this->assertStringContainsString( 'required', $output );

		wp_delete_user( $user_id );
	}

	/**
	 * Test that the display name field does not render for a reader with a custom display name.
	 */
	public function test_does_not_render_for_custom_display_name() {
		$user_id = $this->create_generic_reader();
		wp_update_user(
			[
				'ID'           => $user_id,
				'display_name' => 'Jane Doe',
			] 
		);

		ob_start();
		Comment_Display_Name::render_display_name_field();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		wp_delete_user( $user_id );
	}

	/**
	 * Test that the display name field does not render for non-reader users.
	 */
	public function test_does_not_render_for_non_reader() {
		$admin_id = wp_insert_user(
			[
				'user_login' => 'test-admin',
				'user_pass'  => wp_generate_password(),
				'user_email' => 'admin@example.com',
				'role'       => 'administrator',
			] 
		);
		wp_set_current_user( $admin_id );

		ob_start();
		Comment_Display_Name::render_display_name_field();
		$output = ob_get_clean();

		$this->assertEmpty( $output );

		wp_delete_user( $admin_id );
	}

	/**
	 * Test that the display name field does not render for logged-out users.
	 */
	public function test_does_not_render_for_logged_out() {
		wp_set_current_user( 0 );

		ob_start();
		Comment_Display_Name::render_display_name_field();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}
}

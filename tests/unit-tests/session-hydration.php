<?php
/**
 * Tests the Session Hydration functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader_Activation\Session_Hydration;
use Newspack\Reader_Activation;

/**
 * Tests the Session Hydration functionality.
 */
class Newspack_Test_Session_Hydration extends WP_UnitTestCase {
	/**
	 * Test CID cookie name.
	 *
	 * @var string
	 */
	private static $test_cid = 'testcid12345';

	/**
	 * Test that CID binding creates a transient mapping CID to user ID.
	 */
	public function test_bind_cid_to_user() {
		$user_id = $this->factory->user->create( [ 'user_email' => 'reader@test.com' ] );
		$_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] = self::$test_cid; // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE

		Session_Hydration::bind_cid( $user_id );

		$stored_user_id = get_transient( 'newspack_cid_' . self::$test_cid );
		$this->assertEquals( $user_id, $stored_user_id );

		unset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		wp_delete_user( $user_id );
	}

	/**
	 * Test that CID binding does nothing when cookie is missing.
	 */
	public function test_bind_cid_without_cookie() {
		$user_id = $this->factory->user->create( [ 'user_email' => 'reader2@test.com' ] );
		unset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE

		Session_Hydration::bind_cid( $user_id );

		$stored = get_transient( 'newspack_cid_' . self::$test_cid );
		$this->assertFalse( $stored );

		wp_delete_user( $user_id );
	}
}

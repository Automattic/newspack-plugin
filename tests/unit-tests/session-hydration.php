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

	/**
	 * Test that the hydration endpoint returns a nonce when CID matches.
	 */
	public function test_hydration_endpoint_success() {
		$user_id = $this->factory->user->create( [ 'user_email' => 'reader3@test.com' ] );
		$_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] = self::$test_cid; // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE

		// Bind the CID.
		Session_Hydration::bind_cid( $user_id );

		// Simulate logged-in user.
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/reader/session' );
		$response = rest_do_request( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'nonce', $data );
		$this->assertNotEmpty( $data['nonce'] );

		// Transient should be deleted (one-time use).
		$this->assertFalse( get_transient( 'newspack_cid_' . self::$test_cid ) );

		unset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		wp_delete_user( $user_id );
	}

	/**
	 * Test that the hydration endpoint returns 403 when CID doesn't match.
	 */
	public function test_hydration_endpoint_cid_mismatch() {
		$user_id = $this->factory->user->create( [ 'user_email' => 'reader4@test.com' ] );

		// Bind the CID with correct value.
		$_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] = self::$test_cid; // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		Session_Hydration::bind_cid( $user_id );

		// Now request with a different CID.
		$_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] = 'wrongcid12345'; // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE

		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/reader/session' );
		$response = rest_do_request( $request );

		$this->assertEquals( 403, $response->get_status() );

		unset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		wp_delete_user( $user_id );
	}

	/**
	 * Test that the hydration endpoint returns 403 when no CID cookie is present.
	 */
	public function test_hydration_endpoint_no_cookie() {
		$user_id = $this->factory->user->create( [ 'user_email' => 'reader5@test.com' ] );
		unset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE

		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/reader/session' );
		$response = rest_do_request( $request );

		$this->assertEquals( 403, $response->get_status() );

		wp_delete_user( $user_id );
	}

	/**
	 * Test that unauthenticated requests get 401.
	 */
	public function test_hydration_endpoint_unauthenticated() {
		wp_set_current_user( 0 );
		$_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] = self::$test_cid; // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/reader/session' );
		$response = rest_do_request( $request );

		$this->assertEquals( 401, $response->get_status() );

		unset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
	}

	/**
	 * Test that the newsletter signup lists endpoint requires authentication.
	 */
	public function test_newsletter_signup_lists_requires_auth() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/reader-newsletter-signup-lists' );
		$response = rest_do_request( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test that the newsletter signup lists endpoint works for authenticated users.
	 */
	public function test_newsletter_signup_lists_authenticated() {
		$user_id = $this->factory->user->create( [ 'user_email' => 'reader6@test.com' ] );
		wp_set_current_user( $user_id );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/reader-newsletter-signup-lists' );
		$response = rest_do_request( $request );

		// Should succeed (200) — actual HTML content depends on newsletter plugin availability.
		$this->assertContains( $response->get_status(), [ 200, 204 ] );

		wp_delete_user( $user_id );
	}
}

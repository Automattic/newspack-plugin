<?php
/**
 * Tests the Magic Link functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Magic_Link;
use Newspack\Reader_Activation;

/**
 * Tests the Magic Link functionality.
 */
class Newspack_Test_Magic_Link extends WP_UnitTestCase {
	/**
	 * Reader user id.
	 *
	 * @var int
	 */
	private static $user_id = null;

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private static $admin_id = null;

	/**
	 * Setup for the tests.
	 */
	public function setUp() {
		// Enable reader activation.
		add_filter( 'newspack_reader_activation_enabled', '__return_true' );

		// Create sample reader.
		if ( empty( self::$user_id ) ) {
			self::$user_id = Reader_Activation::register_reader( 'reader@test.com', 'Test Reader' );
		}

		// Create sample admin.
		if ( empty( self::$admin_id ) ) {
			self::$admin_id = wp_insert_user(
				[
					'user_login' => 'sample-admin',
					'user_pass'  => wp_generate_password(),
					'user_email' => 'admin@test.com',
					'role'       => 'administrator',
				]
			);
		}
	}

	/**
	 * Assert valid token.
	 *
	 * @param array $token_data Token data. {
	 *   The token data.
	 *
	 *   @type string $token  The token.
	 *   @type string $client Client hash.
	 *   @type string $time   Token creation time.
	 * }
	 */
	public function assertToken( $token_data ) {
		$this->assertFalse( is_wp_error( $token_data ) );
		$this->assertIsString( $token_data['token'] );
		$this->assertIsString( $token_data['client'] );
		$this->assertIsInt( $token_data['time'] );
	}

	/**
	 * Test simple token generation.
	 */
	public function test_generate_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertToken( $token_data );
	}

	/**
	 * Test simple token validation.
	 */
	public function test_validate_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertToken( Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] ) );
	}

	/**
	 * Test single-use quality of a token.
	 */
	public function test_single_use_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );

		// First use should be valid.
		$first_validation = Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] );
		$this->assertToken( $first_validation );

		// Second use should error with "expired_token", since it was deleted by previous use.
		$second_validation = Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] );
		$this->assertTrue( is_wp_error( $second_validation ) );
		$this->assertEquals( 'expired_token', $second_validation->get_error_code() );
	}

	/**
	 * Test that generating a token for an admin returns an error.
	 */
	public function test_generate_token_for_admin() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$admin_id ) );
		$this->assertTrue( is_wp_error( $token_data ) );
		$this->assertEquals( 'newspack_magic_link_invalid_user', $token_data->get_error_code() );
	}

	/**
	 * Test that generating a token for a user with disabled magic links returns
	 * an error.
	 */
	public function test_generate_token_for_disabled_user() {
		update_user_meta( self::$user_id, Magic_Link::DISABLED_META, true );
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertTrue( is_wp_error( $token_data ) );
		$this->assertEquals( 'newspack_magic_link_invalid_user', $token_data->get_error_code() );
		delete_user_meta( self::$user_id, Magic_Link::DISABLED_META ); // Clean up.
	}

	/**
	 * Test that a self-served (unauthenticated) generated token contains a client
	 * hash for validation.
	 */
	public function test_generate_self_served_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertNotEmpty( $token_data['client'] );
	}

	/**
	 * Test that an admin generated token does not contain a client hash for
	 * validation.
	 */
	public function test_generate_admin_token() {
		wp_set_current_user( self::$admin_id );
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertEmpty( $token_data['client'] );
	}
}

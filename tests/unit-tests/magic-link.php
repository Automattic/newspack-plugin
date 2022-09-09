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
	 * Secondary reader user id.
	 *
	 * @var int
	 */
	private static $secondary_user_id = null;

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

		// Create a secondary sample reader.
		if ( empty( self::$secondary_user_id ) ) {
			self::$secondary_user_id = wp_insert_user(
				[
					'user_login' => 'secondary-user',
					'user_pass'  => wp_generate_password(),
					'user_email' => 'secondary@test.com',
				]
			);
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
	 *   @type string $otp    The OTP.
	 *   @type string $client Client hash.
	 *   @type string $time   Token creation time.
	 * }
	 */
	public function assertTokenIsValid( $token_data ) {
		$this->assertFalse( is_wp_error( $token_data ) );
		$this->assertIsString( $token_data['token'] );
		$this->assertIsString( $token_data['client'] );
		$this->assertIsInt( $token_data['time'] );
		$this->assertIsArray( $token_data['otp'] );
	}

	/**
	 * Test simple token generation.
	 */
	public function test_generate_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertTokenIsValid( $token_data );
	}

	/**
	 * Test simple token validation.
	 */
	public function test_validate_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$this->assertTokenIsValid( Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] ) );
	}

	/**
	 * Test single-use quality of a token.
	 */
	public function test_single_use_token() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );

		// First use should be valid.
		$first_validation = Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] );
		$this->assertTokenIsValid( $first_validation );

		// Second use should error with "invalid_token", since it was deleted by previous use.
		$second_validation = Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] );
		$this->assertTrue( is_wp_error( $second_validation ) );
		$this->assertEquals( 'invalid_token', $second_validation->get_error_code() );
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

	/**
	 * Test that valid token with different user ID.
	 */
	public function test_validate_token_with_different_user_id() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$validation = Magic_Link::validate_token( self::$secondary_user_id, $token_data['client'], $token_data['token'] );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'invalid_token', $validation->get_error_code() );
	}

	/**
	 * Test token OTP.
	 */
	public function test_token_otp() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$otp        = $token_data['otp'];
		$validation = Magic_Link::validate_otp( self::$user_id, $otp['hash'], $otp['code'] );
		$this->assertTokenIsValid( $validation );
	}

	/**
	 * Test invalid OTP code.
	 */
	public function test_invalid_token_otp() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$otp        = $token_data['otp'];
		$validation = Magic_Link::validate_otp( self::$user_id, $otp['hash'], 123456 );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'invalid_otp', $validation->get_error_code() );
	}

	/**
	 * Test OTP hash expiration.
	 */
	public function test_otp_hash_expiration() {
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$otp        = $token_data['otp'];

		for ( $i = 0; $i < Magic_Link::OTP_MAX_ATTEMPTS; $i++ ) {
			$validation = Magic_Link::validate_otp( self::$user_id, $otp['hash'], 12345 );
			$this->assertTrue( is_wp_error( $validation ) );
			$this->assertEquals( 'invalid_otp', $validation->get_error_code() );
		}

		// After max attempts, hash should be expired.
		$validation = Magic_Link::validate_otp( self::$user_id, $otp['hash'], 123456 );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'max_otp_attempts', $validation->get_error_code() );

		// Next attempt on the same hash should fail with invalid otp error again (hash was deleted).
		$validation = Magic_Link::validate_otp( self::$user_id, $otp['hash'], 123456 );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'invalid_otp', $validation->get_error_code() );
	}

	/**
	 * Test invalid token.
	 */
	public function test_invalid_token() {
		$token_data   = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$random_token = wp_generate_password( 32 );
		$validation   = Magic_Link::validate_token( self::$user_id, $token_data['client'], $random_token );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'invalid_token', $validation->get_error_code() );
	}

	/**
	 * Test invalid client hash.
	 */
	public function test_invalid_client_hash() {
		$token_data         = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		$random_client_hash = wp_generate_password( 32 );
		$validation         = Magic_Link::validate_token( self::$user_id, $random_client_hash, $token_data['token'] );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'invalid_client', $validation->get_error_code() );
	}

	/**
	 * Test that an expired token is invalid.
	 */
	public function test_expired_token() {
		// Filter the token expiration time to be 0 seconds.
		add_filter( 'newspack_magic_link_token_expiration', '__return_zero' );
		$token_data = Magic_Link::generate_token( get_user_by( 'id', self::$user_id ) );
		// Sleep for 1 second to ensure the token is expired.
		sleep( 1 );
		$validation = Magic_Link::validate_token( self::$user_id, $token_data['client'], $token_data['token'] );
		$this->assertTrue( is_wp_error( $validation ) );
		$this->assertEquals( 'invalid_token', $validation->get_error_code() );
	}
}

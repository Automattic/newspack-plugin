<?php
/**
 * Tests the Reader Activation functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader_Activation;

/**
 * Tests the Reader Activation functionality.
 */
class Newspack_Test_Reader_Activation extends WP_UnitTestCase {

	/**
	 * Test reader email.
	 *
	 * @var string
	 */
	private static $reader_email = 'reader@test.com';

	/**
	 * Test reader name.
	 *
	 * @var string
	 */
	private static $reader_name = 'Reader Test';

	/**
	 * Setup for the tests.
	 */
	public function setUp() {
		if ( ! defined( 'NEWSPACK_EXPERIMENTAL_READER_ACTIVATION' ) ) {
			define( 'NEWSPACK_EXPERIMENTAL_READER_ACTIVATION', true );
		}
	}

	/**
	 * Helper function to register sample reader
	 */
	private static function register_sample_reader() {
		return Reader_Activation::register_reader( self::$reader_email, self::$reader_name );
	}

	/**
	 * Test that registering a reader creates a user with reader meta.
	 */
	public function test_register_reader() {
		$user_id = self::register_sample_reader();
		$this->assertIsInt( $user_id );
		$this->assertInstanceOf( 'WP_User', get_user_by( 'email', self::$reader_email ) );
		$this->assertInstanceOf( 'WP_User', get_user_by( 'id', $user_id ) );
		$this->assertTrue( (bool) get_user_meta( $user_id, Reader_Activation::READER, true ) );
	}

	/**
	 * Test that verifying a reader register the proper meta.
	 */
	public function test_verify_reader_email() {
		$user_id = self::register_sample_reader();
		$user    = get_user_by( 'id', $user_id );
		$this->assertFalse( Reader_Activation::is_reader_verified( $user ) );
		$verified = Reader_Activation::verify_reader_email( get_user_by( 'id', $user_id ) );
		$this->assertTrue( $verified );
		$this->assertTrue( Reader_Activation::is_reader_verified( $user ) );
	}

	/**
	 * Test that registering an existing reader returns the inserted email.
	 */
	public function test_register_existing_reader() {
		self::register_sample_reader();
		// Reregister the same reader.
		$email = self::register_sample_reader();
		$this->assertEquals( $email, self::$reader_email );
	}

	/**
	 * Test method that validates if user is a reader.
	 */
	public function test_is_user_reader() {
		$user_id = wp_insert_user(
			[
				'user_login' => 'sample-admin',
				'user_pass'  => wp_generate_password(),
				'user_email' => 'test@test.com',
				'role'       => 'administrator',
			]
		);
		$this->assertFalse( Reader_Activation::is_user_reader( get_user_by( 'id', $user_id ) ) );

		$reader_id = self::register_sample_reader();
		$this->assertTrue( Reader_Activation::is_user_reader( get_user_by( 'id', $reader_id ) ) );
	}
}

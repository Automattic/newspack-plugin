<?php
/**
 * Tests the Reader entity class.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader;

require_once __DIR__ . '/../mocks/wc-mocks.php';

/**
 * Test the Reader class.
 */
class Newspack_Test_Reader extends WP_UnitTestCase {
	/**
	 * Create a test reader user.
	 *
	 * @param array $args Optional user args.
	 * @return int User ID.
	 */
	private function create_reader( $args = [] ) {
		$defaults = [
			'user_login' => 'testreader' . wp_rand(),
			'user_email' => 'reader' . wp_rand() . '@test.com',
			'first_name' => 'Test',
			'last_name'  => 'Reader',
			'role'       => 'subscriber',
		];
		return self::factory()->user->create( array_merge( $defaults, $args ) );
	}

	/**
	 * Test constructing a Reader by user ID.
	 */
	public function test_construct_by_id() {
		$user_id = $this->create_reader( [ 'user_email' => 'byid@test.com' ] );
		$reader  = new Reader( $user_id );

		$this->assertEquals( $user_id, $reader->get_id() );
		$this->assertEquals( 'byid@test.com', $reader->get_email() );
	}

	/**
	 * Test constructing a Reader by email.
	 */
	public function test_construct_by_email() {
		$user_id = $this->create_reader( [ 'user_email' => 'byemail@test.com' ] );
		$reader  = new Reader( 'byemail@test.com' );

		$this->assertEquals( $user_id, $reader->get_id() );
		$this->assertEquals( 'byemail@test.com', $reader->get_email() );
	}

	/**
	 * Test the static get() factory.
	 */
	public function test_get_returns_reader() {
		$user_id = $this->create_reader();
		$reader  = Reader::get( $user_id );

		$this->assertInstanceOf( Reader::class, $reader );
		$this->assertEquals( $user_id, $reader->get_id() );
	}

	/**
	 * Test get() returns false for non-existent user.
	 */
	public function test_get_returns_false_for_missing_user() {
		$this->assertFalse( Reader::get( 999999 ) );
		$this->assertFalse( Reader::get( 'nonexistent@test.com' ) );
	}

	/**
	 * Test core identity getters.
	 */
	public function test_identity_getters() {
		$user_id = $this->create_reader(
			[
				'first_name' => 'Jane',
				'last_name'  => 'Doe',
			]
		);
		$reader  = new Reader( $user_id );

		$this->assertEquals( 'Jane', $reader->get_first_name() );
		$this->assertEquals( 'Doe', $reader->get_last_name() );
		$this->assertEquals( 'Jane Doe', $reader->get_name() );
	}

	/**
	 * Test registration page persistence.
	 */
	public function test_registration_page_persistence() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		$reader->set_registration_page( 'https://example.com/register?utm_source=twitter&utm_medium=social' );
		$reader->save();

		// Load a fresh Reader to verify persistence.
		$reader2 = new Reader( $user_id );
		$this->assertEquals( 'https://example.com/register?utm_source=twitter&utm_medium=social', $reader2->get_registration_page() );
	}

	/**
	 * Test registration method persistence.
	 */
	public function test_registration_method_persistence() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		$reader->set_registration_method( 'registration-block' );
		$reader->save();

		$reader2 = new Reader( $user_id );
		$this->assertEquals( 'registration-block', $reader2->get_registration_method() );
	}

	/**
	 * Test signup UTM persistence.
	 */
	public function test_signup_utms_persistence() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		$reader->set_signup_utms(
			[
				'source' => 'twitter',
				'medium' => 'social',
			]
		);
		$reader->save();

		$reader2 = new Reader( $user_id );
		$this->assertEquals(
			[
				'source' => 'twitter',
				'medium' => 'social',
			],
			$reader2->get_signup_utms()
		);
	}

	/**
	 * Test set_signup_utms_from_url extracts UTMs correctly.
	 */
	public function test_signup_utms_from_url() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		$reader->set_signup_utms_from_url( 'https://example.com/page?utm_source=google&utm_medium=cpc&utm_campaign=spring' );
		$reader->save();

		$reader2 = new Reader( $user_id );
		$utms    = $reader2->get_signup_utms();
		$this->assertEquals( 'google', $utms['source'] );
		$this->assertEquals( 'cpc', $utms['medium'] );
		$this->assertEquals( 'spring', $utms['campaign'] );
	}

	/**
	 * Test that URLs without UTMs don't set anything.
	 */
	public function test_signup_utms_from_url_without_utms() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		$reader->set_signup_utms_from_url( 'https://example.com/page?foo=bar' );

		$this->assertEmpty( $reader->get_signup_utms() );
	}

	/**
	 * Test that save() only writes dirty properties.
	 */
	public function test_save_only_writes_dirty() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		// Set only registration_page.
		$reader->set_registration_page( 'https://example.com/register' );
		$reader->save();

		// Verify other meta was not written.
		$this->assertEquals( '', get_user_meta( $user_id, 'np_reader_connected_account', true ) );
		$this->assertEquals( 'https://example.com/register', get_user_meta( $user_id, 'np_reader_registration_page', true ) );
	}

	/**
	 * Test backward compatibility with existing meta.
	 */
	public function test_reads_existing_meta() {
		$user_id = $this->create_reader();
		// Simulate existing meta written by Reader_Activation.
		update_user_meta( $user_id, 'np_reader_registration_method', 'google' );
		update_user_meta( $user_id, 'np_reader_connected_account', 'google' );
		update_user_meta( $user_id, 'np_reader_email_verified', true );

		$reader = new Reader( $user_id );
		$this->assertEquals( 'google', $reader->get_registration_method() );
		$this->assertEquals( 'google', $reader->get_connected_account() );
		$this->assertTrue( $reader->is_verified() );
	}

	/**
	 * Test get_contact_data returns correct structure.
	 */
	public function test_get_contact_data_structure() {
		$user_id = $this->create_reader(
			[
				'user_email' => 'contact@test.com',
				'first_name' => 'Test',
				'last_name'  => 'Reader',
			]
		);
		$reader  = new Reader( $user_id );

		$reader->set_registration_page( 'https://example.com/register' );
		$reader->set_registration_method( 'registration-block' );
		$reader->set_signup_utms( [ 'source' => 'google' ] );
		$reader->save();

		$contact = $reader->get_contact_data();

		$this->assertArrayHasKey( 'email', $contact );
		$this->assertArrayHasKey( 'metadata', $contact );
		$this->assertEquals( 'contact@test.com', $contact['email'] );
		$this->assertEquals( 'Test Reader', $contact['name'] );

		// Verify metadata has the persisted fields.
		$this->assertEquals( $user_id, $contact['metadata']['account'] );
		$this->assertEquals( 'https://example.com/register', $contact['metadata']['registration_page'] );
		$this->assertEquals( 'registration-block', $contact['metadata']['registration_method'] );
		$this->assertNotEmpty( $contact['metadata']['registration_date'] );
	}

	/**
	 * Test get_contact_data includes signup UTMs as individual keys.
	 */
	public function test_get_contact_data_includes_utms() {
		$user_id = $this->create_reader();
		$reader  = new Reader( $user_id );

		$reader->set_signup_utms(
			[
				'source' => 'google',
				'medium' => 'cpc',
			]
		);
		$reader->save();

		$contact = $reader->get_contact_data();

		$this->assertEquals( 'google', $contact['metadata']['signup_page_utm_source'] );
		$this->assertEquals( 'cpc', $contact['metadata']['signup_page_utm_medium'] );
	}

	/**
	 * Test get_contact_data works without issues.
	 */
	public function test_get_contact_data_basic() {
		$user_id = $this->create_reader( [ 'user_email' => 'basic@test.com' ] );
		$reader  = new Reader( $user_id );

		$contact = $reader->get_contact_data();

		$this->assertIsArray( $contact );
		$this->assertEquals( 'basic@test.com', $contact['email'] );
		$this->assertArrayHasKey( 'metadata', $contact );
	}

	/**
	 * Test that registration metadata is persisted through the registration flow.
	 */
	public function test_registration_persists_metadata() {
		$metadata = [
			'registration_method' => 'auth-form',
			'current_page_url'    => 'https://example.com/subscribe?utm_source=newsletter&utm_campaign=spring',
		];

		$user_id = $this->create_reader( [ 'user_email' => 'newreader@test.com' ] );

		// Simulate what register_reader does after creating the user.
		$reader = new Reader( $user_id );
		if ( isset( $metadata['registration_method'] ) ) {
			$reader->set_registration_method( $metadata['registration_method'] );
		}
		if ( isset( $metadata['current_page_url'] ) ) {
			$reader->set_registration_page( $metadata['current_page_url'] );
			$reader->set_signup_utms_from_url( $metadata['current_page_url'] );
		}
		$reader->save();

		// Verify data survives a fresh load (simulating a retry scenario).
		$reader2 = new Reader( $user_id );
		$contact = $reader2->get_contact_data();

		$this->assertEquals( 'auth-form', $contact['metadata']['registration_method'] );
		$this->assertEquals(
			'https://example.com/subscribe?utm_source=newsletter&utm_campaign=spring',
			$contact['metadata']['registration_page']
		);
		$this->assertEquals( 'newsletter', $contact['metadata']['signup_page_utm_source'] );
		$this->assertEquals( 'spring', $contact['metadata']['signup_page_utm_campaign'] );
	}

	/**
	 * Test that reader contact data survives a simulated sync retry.
	 *
	 * This is the core scenario that was broken before: metadata like
	 * registration_page was only in the event payload but never persisted,
	 * so retries would lose it.
	 */
	public function test_contact_data_survives_retry() {
		$user_id = $this->create_reader( [ 'user_email' => 'retry@test.com' ] );

		// Simulate the initial registration flow persisting data.
		$reader = new Reader( $user_id );
		$reader->set_registration_page( 'https://example.com/signup?utm_source=twitter' );
		$reader->set_registration_method( 'registration-block' );
		$reader->set_signup_utms_from_url( 'https://example.com/signup?utm_source=twitter' );
		$reader->save();

		// Simulate what happens on retry: a fresh Reader is created from the user ID.
		// This is what Contact_Sync::execute_integration_retry() now does.
		$retry_reader = new Reader( $user_id );
		$contact      = $retry_reader->get_contact_data();

		// All registration metadata should be present.
		$this->assertEquals( 'https://example.com/signup?utm_source=twitter', $contact['metadata']['registration_page'] );
		$this->assertEquals( 'registration-block', $contact['metadata']['registration_method'] );
		$this->assertEquals( 'twitter', $contact['metadata']['signup_page_utm_source'] );
	}
}

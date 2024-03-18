<?php
/**
 * Tests the Reader Activation ESP data sync functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Newspack_Newsletters as Newspack_Newsletters_Internal;

/**
 * Test the Esp_Metadata_Sync class.
 */
class Newspack_Test_Reader_Activation_Sync extends WP_UnitTestCase {
	/**
	 * Gets a sample contact for the tests
	 *
	 * @return array
	 */
	public function get_sample_contact() {
		$contact = [
			'email'    => 'test@email.com',
			'name'     => 'Test Contact',
			'metadata' => [],
		];
		foreach ( array_keys( Newspack_Newsletters_Internal::$metadata_keys ) as $key ) {
			$contact['metadata'][ Newspack_Newsletters_Internal::get_metadata_key( $key ) ] = 'value';
		}
		return $contact;
	}

	/**
	 * Sets the Metadata keys option to the given value
	 *
	 * @param array|string $value The value to set the option to.
	 */
	public function set_option( $value ) {
		Newspack_Newsletters_Internal::update_metadata_fields( $value );
	}

	/**
	 * Test contact data sync to ESP.
	 */
	public function test_sync_contact_data() {
		// Set connected ESP to ActiveCampaign.
		\update_option( 'newspack_newsletters_service_provider', 'active_campaign' );
		$contact_data_with_raw_keys      = [
			'email'    => 'test@email.com',
			'name'     => 'Test Contact',
			'metadata' => [
				'account'           => 123,
				'registration_date' => '2023-12-11',
				'current_page_url'  => 'https://newspack.com/registration-page/',
			],
		];
		$contact_data_with_prefixed_keys = [
			'email'    => 'test@email.com',
			'name'     => 'Test Contact',
			'metadata' => [
				'NP_Account'           => 123,
				'NP_Registration Date' => '2023-12-11',
				'NP_Registration Page' => 'https://newspack.com/registration-page/',
			],
		];
		$contact_data_with_custom_prefix = [
			'email'    => 'test@email.com',
			'name'     => 'Test Contact',
			'metadata' => [
				'CU_Account'           => 123,
				'CU_Registration Date' => '2023-12-11',
				'CU_Registration Page' => 'https://newspack.com/registration-page/',
			],
		];

		// Raw metadata keys should be converted to prefixed keys.
		$this->assertEquals(
			$contact_data_with_prefixed_keys,
			Newspack_Newsletters_Internal::normalize_contact_data( $contact_data_with_raw_keys )
		);

		Newspack_Newsletters_Internal::update_metadata_prefix( 'CU_' );

		// Metadata keys should be prefixed with the custom prefix, if set.
		$this->assertEquals(
			$contact_data_with_custom_prefix,
			Newspack_Newsletters_Internal::normalize_contact_data( $contact_data_with_raw_keys )
		);

		// Clear from last test.
		\delete_option( Newspack_Newsletters_Internal::METADATA_PREFIX_OPTION );

		// Most keys should be exact.
		$contact_data_with_prefixed_keys['metadata']['NP_Invalid_Key'] = 'Invalid data';
		$this->assertEquals(
			array_diff( $contact_data_with_prefixed_keys['metadata'], Newspack_Newsletters_Internal::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'] ),
			[ 'NP_Invalid_Key' => 'Invalid data' ]
		);

		// But UTM keys can have arbitrary suffixes.
		unset( $contact_data_with_prefixed_keys['metadata']['NP_Invalid_Key'] );
		$contact_data_with_prefixed_keys['metadata']['NP_Signup UTM: foo'] = 'bar';
		$this->assertEquals(
			$contact_data_with_prefixed_keys,
			Newspack_Newsletters_Internal::normalize_contact_data( $contact_data_with_prefixed_keys )
		);

		// Set connected ESP to Mailchimp.
		\update_option( 'newspack_newsletters_service_provider', 'mailchimp' );

		// Mailchimp contact data should split the name into first/last name.
		$this->assertArrayHasKey( 'First Name', Newspack_Newsletters_Internal::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'] );
		$this->assertArrayHasKey( 'Last Name', Newspack_Newsletters_Internal::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with default fields
	 */
	public function test_with_default_option() {
		$contact = $this->get_sample_contact();
		$normalized = Newspack_Newsletters_Internal::normalize_contact_data( $contact );
		$this->assertSame( $contact, $normalized );
	}

	/**
	 * Test the normalize_contact_data method with the fields option set to empty
	 */
	public function test_with_empty_selected() {
		$contact = $this->get_sample_contact();
		$this->set_option( [] );
		$normalized = Newspack_Newsletters_Internal::normalize_contact_data( $contact );
		$this->assertEmpty( $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the fields option containing only invalid values
	 */
	public function test_with_all_invalid_selected() {
		$contact = $this->get_sample_contact();
		$this->set_option( [ 'invalid_1', 'invalid_2' ] );
		$normalized = Newspack_Newsletters_Internal::normalize_contact_data( $contact );
		$this->assertEmpty( $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the fields option containing only valid values
	 */
	public function test_with_all_valid_selected() {
		$contact = $this->get_sample_contact();
		$defaults = array_keys( Newspack_Newsletters_Internal::$metadata_keys );
		$this->set_option( [ Newspack_Newsletters_Internal::$metadata_keys[ $defaults[0] ], Newspack_Newsletters_Internal::$metadata_keys[ $defaults[1] ] ] );
		$normalized = Newspack_Newsletters_Internal::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[0] ), $normalized['metadata'] );
		$this->assertArrayHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[1] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[2] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[3] ), $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the option containing valid and invalid values
	 */
	public function test_with_valid_and_invalid_selected() {
		$contact  = $this->get_sample_contact();
		$defaults = array_keys( Newspack_Newsletters_Internal::$metadata_keys );
		$this->set_option( [ Newspack_Newsletters_Internal::$metadata_keys[ $defaults[0] ], Newspack_Newsletters_Internal::$metadata_keys[ $defaults[1] ], 'invalid' ] );
		$normalized = Newspack_Newsletters_Internal::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[0] ), $normalized['metadata'] );
		$this->assertArrayHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[1] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[2] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[3] ), $normalized['metadata'] );
		$this->assertCount( 2, $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the option containing UTM values.
	 * UTM field keys can have arbitrary suffixes.
	 */
	public function test_with_utm_fields() {
		$contact  = $this->get_sample_contact();
		$defaults = array_keys( Newspack_Newsletters_Internal::$metadata_keys );
		$this->set_option( [ Newspack_Newsletters_Internal::$metadata_keys['signup_page_utm'], Newspack_Newsletters_Internal::$metadata_keys['payment_page_utm'] ] );
		$contact['metadata'][ Newspack_Newsletters_Internal::get_metadata_key( 'signup_page_utm' ) . 'foo' ] = 'bar';
		$contact['metadata'][ Newspack_Newsletters_Internal::get_metadata_key( 'payment_page_utm' ) . 'yyy' ] = 'zzz';
		$normalized = Newspack_Newsletters_Internal::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Newspack_Newsletters_Internal::get_metadata_key( 'signup_page_utm' ) . 'foo', $normalized['metadata'] );
		$this->assertArrayHasKey( Newspack_Newsletters_Internal::get_metadata_key( 'payment_page_utm' ) . 'yyy', $normalized['metadata'] );
		$this->assertArrayNotHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[0] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Newspack_Newsletters_Internal::get_metadata_key( $defaults[1] ), $normalized['metadata'] );
	}
}

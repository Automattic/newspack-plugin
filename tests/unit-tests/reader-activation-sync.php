<?php
/**
 * Tests the Reader Activation ESP data sync functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Sync;
use Newspack\Reader_Activation\ESP_Sync;

require_once __DIR__ . '/../mocks/newsletters-mocks.php';

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
		foreach ( array_keys( Sync\Metadata::$keys ) as $key ) {
			$contact['metadata'][ Sync\Metadata::get_key( $key ) ] = 'value';
		}
		return $contact;
	}

	/**
	 * Sets the Metadata keys option to the given value
	 *
	 * @param array|string $value The value to set the option to.
	 */
	public function set_option( $value ) {
		Sync\Metadata::update_fields( $value );
	}

	/**
	 * Test whether reader data can be synced.
	 */
	public function test_can_esp_sync() {
		$this->assertFalse( ESP_Sync::can_esp_sync(), 'Reader data should not be syncable by default' );

		$errors = ESP_Sync::can_esp_sync( true );
		$this->assertInstanceOf( 'WP_Error', $errors );

		// Assert all errors.
		$this->assertTrue( $errors->has_errors() );
		$error_codes = $errors->get_error_codes();
		$this->assertNotContains( 'ras_not_enabled', $error_codes, 'Reader Activation is always enabled in test env' );
		$this->assertNotContains( 'ras_esp_sync_not_enabled', $error_codes, 'RAS ESP Sync is enabled by default' );
		$this->assertContains( 'esp_sync_not_allowed', $error_codes, 'RAS ESP Sync is not allowed on non-production site' );
		$this->assertContains( 'ras_esp_master_list_id_not_found', $error_codes, 'Missing master list ID' );

		// Disable ESP sync.
		Reader_Activation::update_setting( 'sync_esp', false );
		$errors = ESP_Sync::can_esp_sync( true );
		$this->assertContains( 'ras_esp_sync_not_enabled', $errors->get_error_codes(), 'RAS ESP Sync is disabled' );

		// Reenable ESP sync.
		Reader_Activation::update_setting( 'sync_esp', true );

		// Allow ESP sync via constant. We're not testing `Newspack_Manager::is_connected_to_production_manager()` here.
		define( 'NEWSPACK_ALLOW_READER_SYNC', true );
		$errors = ESP_Sync::can_esp_sync( true );
		$this->assertNotContains( 'esp_sync_not_allowed', $errors->get_error_codes(), 'RAS ESP Sync is allowed via constant' );

		// Set master list ID.
		update_option( 'newspack_newsletters_service_provider', 'mailchimp' );
		Reader_Activation::update_setting( 'mailchimp_audience_id', '123' );
		$errors = ESP_Sync::can_esp_sync( true );
		$this->assertNotContains( 'ras_esp_master_list_id_not_found', $errors->get_error_codes(), 'Master list ID is set' );

		$this->assertTrue( ESP_Sync::can_esp_sync(), 'Reader data should be syncable after conditions are met' );
	}

	/**
	 * Test whether reader data can be synced with a force constant.
	 */
	public function test_can_esp_sync_force() {
		define( 'NEWSPACK_FORCE_ALLOW_ESP_SYNC', true );
		$this->assertTrue( ESP_Sync::can_esp_sync(), 'Reader data should be syncable with a force constant' );
		$errors = ESP_Sync::can_esp_sync( true );
		$this->assertFalse( $errors->has_errors(), 'No errors should be returned with a force constant' );
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

		$this->assertEquals(
			$contact_data_with_prefixed_keys,
			Sync\Metadata::normalize_contact_data( $contact_data_with_raw_keys ),
			'Raw metadata keys should be converted to prefixed keys.'
		);

		Sync\Metadata::update_prefix( 'CU_' );

		$this->assertEquals(
			$contact_data_with_custom_prefix,
			Sync\Metadata::normalize_contact_data( $contact_data_with_raw_keys ),
			'Metadata keys should be prefixed with the custom prefix, if set.'
		);

		// Clear from last test.
		\delete_option( Sync\Metadata::PREFIX_OPTION );

		$contact_data_with_prefixed_keys['metadata']['NP_Invalid_Key'] = 'Invalid data';
		$this->assertEquals(
			array_diff( $contact_data_with_prefixed_keys['metadata'], Sync\Metadata::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'] ),
			[ 'NP_Invalid_Key' => 'Invalid data' ],
			'Most keys should be exact.'
		);

		unset( $contact_data_with_prefixed_keys['metadata']['NP_Invalid_Key'] );
		$contact_data_with_prefixed_keys['metadata']['NP_Signup UTM: foo'] = 'bar';
		$this->assertArrayHasKey(
			'NP_Signup UTM: foo',
			Sync\Metadata::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'],
			'But UTM keys can have arbitrary suffixes.'
		);

		// And UTM keys MUST have a suffix.
		$contact_data_with_prefixed_keys['metadata']['NP_Signup UTM: '] = 'foo';
		$contact_data_with_prefixed_keys['metadata']['signup_page_utm'] = 'bar';
		$contact_data_with_prefixed_keys['metadata']['signup_page_utm_'] = 'baz';
		$this->assertArrayNotHasKey(
			'NP_Signup UTM: ',
			Sync\Metadata::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'],
			'Prefixed UTM keys must have a suffix.'
		);
		$this->assertArrayNotHasKey(
			'signup_page_utm',
			Sync\Metadata::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'],
			'Raw UTM keys must have a suffix.'
		);
		$this->assertArrayNotHasKey(
			'NP_Signup UTM: ',
			Sync\Metadata::normalize_contact_data( $contact_data_with_prefixed_keys )['metadata'],
			'Raw UTM keys must have a suffix.'
		);
	}

	/**
	 * Test the normalize_contact_data method with default fields
	 */
	public function test_with_default_option() {
		$contact = $this->get_sample_contact();
		$normalized = Sync\Metadata::normalize_contact_data( $contact );

		// Strip unsuffixed UTM keys.
		unset( $contact['metadata'][ Sync\Metadata::get_key( 'signup_page_utm' ) ] );
		unset( $contact['metadata'][ Sync\Metadata::get_key( 'payment_page_utm' ) ] );

		$this->assertSame( $contact, $normalized, 'All default keys pass normalization except for unsuffixed UTM keys.' );
	}

	/**
	 * Test the normalize_contact_data method with the fields option set to empty
	 */
	public function test_with_empty_selected() {
		$contact = $this->get_sample_contact();
		$this->set_option( [] );
		$normalized = Sync\Metadata::normalize_contact_data( $contact );
		$this->assertEmpty( $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the fields option containing only invalid values
	 */
	public function test_with_all_invalid_selected() {
		$contact = $this->get_sample_contact();
		$this->set_option( [ 'invalid_1', 'invalid_2' ] );
		$normalized = Sync\Metadata::normalize_contact_data( $contact );
		$this->assertEmpty( $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the fields option containing only valid values
	 */
	public function test_with_all_valid_selected() {
		$contact = $this->get_sample_contact();
		$defaults = array_keys( Sync\Metadata::$keys );
		$this->set_option( [ Sync\Metadata::$keys[ $defaults[0] ], Sync\Metadata::$keys[ $defaults[1] ] ] );
		$normalized = Sync\Metadata::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Sync\Metadata::get_key( $defaults[0] ), $normalized['metadata'] );
		$this->assertArrayHasKey( Sync\Metadata::get_key( $defaults[1] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Sync\Metadata::get_key( $defaults[2] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Sync\Metadata::get_key( $defaults[3] ), $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the option containing valid and invalid values
	 */
	public function test_with_valid_and_invalid_selected() {
		$contact  = $this->get_sample_contact();
		$defaults = array_keys( Sync\Metadata::$keys );
		$this->set_option( [ Sync\Metadata::$keys[ $defaults[0] ], Sync\Metadata::$keys[ $defaults[1] ], 'invalid' ] );
		$normalized = Sync\Metadata::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Sync\Metadata::get_key( $defaults[0] ), $normalized['metadata'] );
		$this->assertArrayHasKey( Sync\Metadata::get_key( $defaults[1] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Sync\Metadata::get_key( $defaults[2] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Sync\Metadata::get_key( $defaults[3] ), $normalized['metadata'] );
		$this->assertCount( 2, $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the option containing UTM values.
	 * UTM field keys can have arbitrary suffixes.
	 */
	public function test_with_utm_fields() {
		$contact  = $this->get_sample_contact();
		$defaults = array_keys( Sync\Metadata::$keys );
		$this->set_option( [ Sync\Metadata::$keys['signup_page_utm'], Sync\Metadata::$keys['payment_page_utm'] ] );
		$contact['metadata'][ Sync\Metadata::get_key( 'signup_page_utm' ) . 'foo' ] = 'bar';
		$contact['metadata'][ Sync\Metadata::get_key( 'payment_page_utm' ) . 'yyy' ] = 'zzz';
		$normalized = Sync\Metadata::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Sync\Metadata::get_key( 'signup_page_utm' ) . 'foo', $normalized['metadata'] );
		$this->assertArrayHasKey( Sync\Metadata::get_key( 'payment_page_utm' ) . 'yyy', $normalized['metadata'] );
		$this->assertArrayNotHasKey( Sync\Metadata::get_key( $defaults[0] ), $normalized['metadata'] );
		$this->assertArrayNotHasKey( Sync\Metadata::get_key( $defaults[1] ), $normalized['metadata'] );
	}

	/**
	 * Test the normalize_contact_data method with the option containing raw UTM values.
	 */
	public function test_with_raw_utm_fields() {
		$contact  = $this->get_sample_contact();
		$defaults = array_keys( Sync\Metadata::$keys );
		$this->set_option( [ Sync\Metadata::$keys['signup_page_utm'], Sync\Metadata::$keys['payment_page_utm'] ] );
		$contact['metadata']['signup_page_utm_foo'] = 'bar';
		$contact['metadata']['payment_page_utm_yyy'] = 'zzz';
		$normalized = Sync\Metadata::normalize_contact_data( $contact );
		$this->assertArrayHasKey( Sync\Metadata::get_key( 'signup_page_utm' ) . 'foo', $normalized['metadata'] );
		$this->assertArrayHasKey( Sync\Metadata::get_key( 'payment_page_utm' ) . 'yyy', $normalized['metadata'] );
	}
}

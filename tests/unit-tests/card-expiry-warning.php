<?php
/**
 * Tests Card_Expiry_Warning.
 *
 * @package Newspack\Tests
 */

use Newspack\Card_Expiry_Warning;
use Newspack\Wizards\Newspack\Emails_Section;

/**
 * Tests Card_Expiry_Warning.
 */
class Newspack_Test_Card_Expiry_Warning extends WP_UnitTestCase {

	/**
	 * Test the email config is registered via the newspack_email_configs filter.
	 */
	public function test_email_config_registered() {
		$configs = apply_filters( 'newspack_email_configs', [] );
		$this->assertArrayHasKey( 'card-expiry-warning', $configs, 'card-expiry-warning email config should be registered.' );
	}

	/**
	 * Test the email config has all required keys.
	 */
	public function test_email_config_has_required_keys() {
		$configs       = apply_filters( 'newspack_email_configs', [] );
		$config        = $configs['card-expiry-warning'];
		$required_keys = [ 'name', 'category', 'label', 'description', 'template', 'editor_notice', 'from_email', 'available_placeholders' ];

		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $config, "Email config is missing required key '$key'." );
		}
	}

	/**
	 * Test the email config name matches the constant.
	 */
	public function test_email_config_name() {
		$configs = apply_filters( 'newspack_email_configs', [] );
		$config  = $configs['card-expiry-warning'];
		$this->assertSame( 'card-expiry-warning', $config['name'] );
	}

	/**
	 * Test the email config category is reader-revenue.
	 */
	public function test_email_config_category() {
		$configs = apply_filters( 'newspack_email_configs', [] );
		$config  = $configs['card-expiry-warning'];
		$this->assertSame( 'reader-revenue', $config['category'] );
	}

	/**
	 * Test the email config template file exists.
	 */
	public function test_email_config_template_exists() {
		$configs = apply_filters( 'newspack_email_configs', [] );
		$config  = $configs['card-expiry-warning'];
		$this->assertFileExists( $config['template'], 'Email template file should exist.' );
	}

	/**
	 * Test the email config has the expected placeholders.
	 */
	public function test_email_config_placeholders() {
		$configs      = apply_filters( 'newspack_email_configs', [] );
		$placeholders = $configs['card-expiry-warning']['available_placeholders'];
		$templates    = array_column( $placeholders, 'template' );

		$expected = [
			'*BILLING_FIRST_NAME*',
			'*CARD_LAST_4*',
			'*EXPIRY_DATE*',
			'*RENEWAL_DATE*',
			'*UPDATE_PAYMENT_URL*',
			'*CONTACT_EMAIL*',
			'*SITE_TITLE*',
			'*SITE_URL*',
		];

		foreach ( $expected as $token ) {
			$this->assertContains( $token, $templates, "Placeholder '$token' should be in available_placeholders." );
		}
	}

	/**
	 * Test the registry entry is present.
	 */
	public function test_registry_entry_present() {
		$registry = Emails_Section::get_email_registry();
		$this->assertArrayHasKey( 'card-expiry-warning', $registry, 'card-expiry-warning should be in the email registry.' );
	}

	/**
	 * Test the registry entry has the correct newspack_type.
	 */
	public function test_registry_entry_newspack_type() {
		$registry = Emails_Section::get_email_registry();
		$this->assertSame( 'card-expiry-warning', $registry['card-expiry-warning']['newspack_type'] );
	}

	/**
	 * Test the registry entry chip is reader-revenue.
	 */
	public function test_registry_entry_chip_is_reader_revenue() {
		$registry = Emails_Section::get_email_registry();
		$this->assertSame( 'reader-revenue', $registry['card-expiry-warning']['chip'] );
	}

	/**
	 * Test the registry entry is recommended.
	 */
	public function test_registry_entry_is_recommended() {
		$registry = Emails_Section::get_email_registry();
		$this->assertTrue( $registry['card-expiry-warning']['recommended'] );
	}

	/**
	 * Test the registry entry has woocommerce-subscriptions plugin dependency.
	 */
	public function test_registry_entry_plugin_dependency() {
		$registry = Emails_Section::get_email_registry();
		$this->assertSame( 'woocommerce-subscriptions', $registry['card-expiry-warning']['plugin_dependency'] );
	}

	/**
	 * Test the registry entry recipient is reader.
	 */
	public function test_registry_entry_recipient() {
		$registry = Emails_Section::get_email_registry();
		$this->assertSame( 'reader', $registry['card-expiry-warning']['recipient'] );
	}

	/**
	 * Test the default days before expiry is 14.
	 */
	public function test_days_before_expiry_default() {
		$this->assertSame( 14, Card_Expiry_Warning::get_days_before_expiry() );
	}

	/**
	 * Test the days before expiry is filterable.
	 */
	public function test_days_before_expiry_filterable() {
		add_filter( 'newspack_card_expiry_warning_days', fn() => 7 );
		$this->assertSame( 7, Card_Expiry_Warning::get_days_before_expiry() );
		remove_all_filters( 'newspack_card_expiry_warning_days' );
	}

	/**
	 * Test the registry entry appears after cancellation and before woo-renewal-reminder.
	 */
	public function test_registry_entry_order() {
		$slugs = array_keys( Emails_Section::get_email_registry() );

		$cancellation_idx       = array_search( 'cancellation', $slugs, true );
		$card_expiry_idx        = array_search( 'card-expiry-warning', $slugs, true );
		$renewal_reminder_idx   = array_search( 'woo-renewal-reminder', $slugs, true );

		$this->assertNotFalse( $card_expiry_idx, 'card-expiry-warning should be in the registry.' );
		$this->assertGreaterThan( $cancellation_idx, $card_expiry_idx, 'card-expiry-warning should appear after cancellation.' );
		$this->assertLessThan( $renewal_reminder_idx, $card_expiry_idx, 'card-expiry-warning should appear before woo-renewal-reminder.' );
	}
}

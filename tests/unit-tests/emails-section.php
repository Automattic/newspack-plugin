<?php
/**
 * Tests the Emails Section registry.
 *
 * @package Newspack\Tests
 */

use Newspack\Wizards\Newspack\Emails_Section;

/**
 * Tests the Emails Section registry.
 */
class Newspack_Test_Emails_Section extends WP_UnitTestCase {
	/**
	 * Test the registry has 23 entries.
	 */
	public function test_registry_has_23_entries() {
		$registry = Emails_Section::get_email_registry();
		$this->assertCount( 23, $registry );
	}

	/**
	 * Test the registry has 13 default-shown entries.
	 */
	public function test_registry_has_13_recommended() {
		$registry      = Emails_Section::get_email_registry();
		$recommended = array_filter(
			$registry,
			function ( $entry ) {
				return true === $entry['recommended'];
			}
		);
		$this->assertCount( 13, $recommended );
	}

	/**
	 * Test the registry has 4 entries with woocommerce-subscriptions dependency.
	 */
	public function test_registry_has_4_subscriptions_dependency() {
		$registry     = Emails_Section::get_email_registry();
		$with_woo_sub = array_filter(
			$registry,
			function ( $entry ) {
				return 'woocommerce-subscriptions' === $entry['plugin_dependency'];
			}
		);
		$this->assertCount( 4, $with_woo_sub );
	}

	/**
	 * Test all registry entries have a valid recipient value.
	 */
	public function test_registry_entries_have_recipient() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$this->assertContains( $entry['recipient'], [ 'reader', 'admin' ], "Entry '$slug' has an invalid recipient value." );
		}
	}

	/**
	 * Test all registry entries have non-empty labels and trigger descriptions.
	 */
	public function test_registry_entries_have_labels_and_triggers() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$this->assertNotEmpty( $entry['label'], "Entry '$slug' is missing a label." );
			$this->assertNotEmpty( $entry['trigger_description'], "Entry '$slug' is missing a trigger_description." );
		}
	}

	/**
	 * Test api_get_email_settings returns the expected response shape.
	 */
	public function test_api_get_email_settings_response_shape() {
		$result = Emails_Section::api_get_email_settings();

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'newspack_emails', $result );
		$this->assertArrayHasKey( 'post_type', $result );
		$this->assertIsArray( $result['newspack_emails'] );

		if ( class_exists( 'WooCommerce' ) ) {
			$this->assertArrayHasKey( 'admin_url', $result );
			$this->assertArrayHasKey( 'enable_woocommerce_email_editor', $result );
		}

		// Verify enriched fields on each Newspack email that has a registry_slug.
		// Guard: at least one enriched email must exist, otherwise the loop is vacuous.
		$enriched_keys   = [ 'label', 'recommended', 'view_category', 'trigger_description', 'registry_slug', 'recipient' ];
		$enriched_count  = 0;
		foreach ( $result['newspack_emails'] as $email ) {
			if ( empty( $email['registry_slug'] ) ) {
				continue;
			}
			++$enriched_count;
			foreach ( $enriched_keys as $key ) {
				$this->assertArrayHasKey( $key, $email, "Email '{$email['label']}' is missing enriched field '$key'." );
			}
		}
		$this->assertGreaterThan( 0, $enriched_count, 'Expected at least one enriched email in the response, but found none.' );
	}
}

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
	public function test_registry_has_13_default_shown() {
		$registry      = Emails_Section::get_email_registry();
		$default_shown = array_filter(
			$registry,
			function ( $entry ) {
				return true === $entry['default_shown'];
			}
		);
		$this->assertCount( 13, $default_shown );
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
	 * Test all registry entries have non-empty labels and trigger descriptions.
	 */
	public function test_registry_entries_have_labels_and_triggers() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$this->assertNotEmpty( $entry['label'], "Entry '$slug' is missing a label." );
			$this->assertNotEmpty( $entry['trigger_description'], "Entry '$slug' is missing a trigger_description." );
		}
	}
}

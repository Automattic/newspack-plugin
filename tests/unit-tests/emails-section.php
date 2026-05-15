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
	 * Test all registry entries have the required keys.
	 */
	public function test_registry_entries_have_required_keys() {
		$registry     = Emails_Section::get_email_registry();
		$required_keys = [ 'source', 'recommended', 'plugin_dependency', 'recipient', 'label', 'trigger_description' ];

		foreach ( $registry as $slug => $entry ) {
			foreach ( $required_keys as $key ) {
				$this->assertArrayHasKey( $key, $entry, "Entry '$slug' is missing required key '$key'." );
			}
		}
	}

	/**
	 * Test all registry entries have a valid source value.
	 */
	public function test_registry_entries_have_valid_source() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$this->assertContains( $entry['source'], [ 'newspack', 'woocommerce' ], "Entry '$slug' has an invalid source value." );
		}
	}

	/**
	 * Test all registry entries have a valid recipient value.
	 */
	public function test_registry_entries_have_valid_recipient() {
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
	 * Test recommended is always a boolean.
	 */
	public function test_registry_recommended_is_boolean() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$this->assertIsBool( $entry['recommended'], "Entry '$slug' has a non-boolean recommended value." );
		}
	}

	/**
	 * Test each entry has either newspack_type or woo_email_id, never both.
	 */
	public function test_registry_entries_have_exclusive_type_keys() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$has_newspack = isset( $entry['newspack_type'] );
			$has_woo      = isset( $entry['woo_email_id'] );
			$this->assertTrue( $has_newspack || $has_woo, "Entry '$slug' has neither newspack_type nor woo_email_id." );
			$this->assertFalse( $has_newspack && $has_woo, "Entry '$slug' has both newspack_type and woo_email_id." );
		}
	}

	/**
	 * Test newspack-source entries have newspack_type and woocommerce-source entries have woo_email_id.
	 */
	public function test_registry_source_matches_type_key() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			if ( 'newspack' === $entry['source'] ) {
				$this->assertArrayHasKey( 'newspack_type', $entry, "Newspack-source entry '$slug' is missing newspack_type." );
				$this->assertNotEmpty( $entry['newspack_type'], "Newspack-source entry '$slug' has empty newspack_type." );
			}
			if ( 'woocommerce' === $entry['source'] ) {
				$this->assertArrayHasKey( 'woo_email_id', $entry, "WooCommerce-source entry '$slug' is missing woo_email_id." );
				$this->assertNotEmpty( $entry['woo_email_id'], "WooCommerce-source entry '$slug' has empty woo_email_id." );
			}
		}
	}

	/**
	 * Test no duplicate newspack_type or woo_email_id values across entries.
	 */
	public function test_registry_no_duplicate_type_values() {
		$registry       = Emails_Section::get_email_registry();
		$newspack_types = [];
		$woo_ids        = [];

		foreach ( $registry as $slug => $entry ) {
			if ( isset( $entry['newspack_type'] ) ) {
				$this->assertNotContains( $entry['newspack_type'], $newspack_types, "Duplicate newspack_type '{$entry['newspack_type']}' in entry '$slug'." );
				$newspack_types[] = $entry['newspack_type'];
			}
			if ( isset( $entry['woo_email_id'] ) ) {
				$this->assertNotContains( $entry['woo_email_id'], $woo_ids, "Duplicate woo_email_id '{$entry['woo_email_id']}' in entry '$slug'." );
				$woo_ids[] = $entry['woo_email_id'];
			}
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
		$enriched_keys  = [ 'label', 'recommended', 'trigger_description', 'registry_slug', 'recipient', 'source' ];
		$enriched_count = 0;
		foreach ( $result['newspack_emails'] as $email ) {
			if ( empty( $email['registry_slug'] ) ) {
				// Fallback branch: verify defaults are set.
				$this->assertArrayHasKey( 'recommended', $email, 'Fallback email is missing recommended.' );
				$this->assertFalse( $email['recommended'], 'Fallback email should have recommended=false.' );
				$this->assertArrayHasKey( 'source', $email, 'Fallback email is missing source.' );
				continue;
			}
			++$enriched_count;
			foreach ( $enriched_keys as $key ) {
				$this->assertArrayHasKey( $key, $email, "Email '{$email['label']}' is missing enriched field '$key'." );
			}
		}
		$this->assertGreaterThan( 0, $enriched_count, 'Expected at least one enriched email in the response, but found none.' );
	}

	/**
	 * Test sort order: reader-revenue first, reader-activation second, other categories last.
	 */
	public function test_api_get_email_settings_sort_order() {
		$result     = Emails_Section::api_get_email_settings();
		$categories = array_column( $result['newspack_emails'], 'category' );

		// Build the expected group order: reader-revenue → reader-activation → everything else.
		$last_group = -1;
		$group_map  = [
			'reader-revenue'    => 0,
			'reader-activation' => 1,
		];
		foreach ( $categories as $i => $cat ) {
			$group = $group_map[ $cat ] ?? 2;
			$this->assertGreaterThanOrEqual( $last_group, $group, "Email at index $i (category '$cat') is out of sort order." );
			$last_group = $group;
		}
	}
}

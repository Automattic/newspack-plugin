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
		$required_keys = [ 'source', 'recommended', 'plugin_dependency', 'recipient', 'chip', 'label', 'trigger_description' ];

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
	 * Test all registry entries have a valid chip value.
	 */
	public function test_registry_entries_have_valid_chip() {
		$registry = Emails_Section::get_email_registry();
		foreach ( $registry as $slug => $entry ) {
			$this->assertContains( $entry['chip'], [ 'auth-account', 'reader-revenue' ], "Entry '$slug' has an invalid chip value." );
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
	 * Test dropped entries are absent from the registry.
	 */
	public function test_dropped_entries_are_absent() {
		$registry     = Emails_Section::get_email_registry();
		$dropped_slugs = [
			'woo-password-reset',
			'woo-processing-order',
			'woo-completed-order',
			'woo-on-hold-order',
			'woo-subscription-cancelled',
		];
		foreach ( $dropped_slugs as $slug ) {
			$this->assertArrayNotHasKey( $slug, $registry, "Dropped entry '$slug' should not be in the registry." );
		}
	}

	/**
	 * Test new WC Subscriptions entries are present with correct woo_email_id values.
	 */
	public function test_new_entries_are_present() {
		$registry = Emails_Section::get_email_registry();

		$this->assertArrayHasKey( 'woo-subscription-switch-complete', $registry );
		$this->assertSame( 'customer_completed_switch_order', $registry['woo-subscription-switch-complete']['woo_email_id'] );

		$this->assertArrayHasKey( 'woo-new-giftee-account', $registry );
		$this->assertSame( 'WCSG_Email_Customer_New_Account', $registry['woo-new-giftee-account']['woo_email_id'] );

		$this->assertArrayHasKey( 'woo-new-gift-order', $registry );
		$this->assertSame( 'recipient_completed_order', $registry['woo-new-gift-order']['woo_email_id'] );
	}

	/**
	 * Test renamed entries have updated labels.
	 */
	public function test_renamed_entries_have_updated_labels() {
		$registry = Emails_Section::get_email_registry();

		$this->assertSame( 'Renewal reminder', $registry['woo-renewal-reminder']['label'] );
		$this->assertSame( 'Failed order retry', $registry['woo-payment-retry']['label'] );
	}

	/**
	 * Test renewal reminder maps to the auto-renewal notification ID.
	 */
	public function test_renewal_reminder_maps_to_auto_renewal_id() {
		$registry = Emails_Section::get_email_registry();
		$this->assertSame( 'customer_notification_auto_renewal', $registry['woo-renewal-reminder']['woo_email_id'] );
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
		$enriched_keys  = [ 'label', 'recommended', 'trigger_description', 'registry_slug', 'recipient', 'source', 'chip' ];
		$enriched_count = 0;
		foreach ( $result['newspack_emails'] as $email ) {
			if ( empty( $email['registry_slug'] ) ) {
				// Fallback branch: verify defaults are set.
				$this->assertArrayHasKey( 'recommended', $email, 'Fallback email is missing recommended.' );
				$this->assertFalse( $email['recommended'], 'Fallback email should have recommended=false.' );
				$this->assertArrayHasKey( 'source', $email, 'Fallback email is missing source.' );
				$this->assertArrayHasKey( 'chip', $email, 'Fallback email is missing chip.' );
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

		// Build the expected group order: reader-revenue -> reader-activation -> everything else.
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

	/**
	 * Test admin-recipient emails are correctly classified.
	 */
	public function test_admin_recipient_emails() {
		$registry    = Emails_Section::get_email_registry();
		$admin_slugs = array_keys(
			array_filter(
				$registry,
				function ( $entry ) {
					return 'admin' === $entry['recipient'];
				}
			)
		);
		$this->assertContains( 'woo-new-order', $admin_slugs, 'new_order is an admin email.' );
	}

	/**
	 * Test that the newspack_emails_registry filter can add entries.
	 */
	public function test_emails_registry_filter() {
		$fake_entry = [
			'source'              => 'newspack',
			'newspack_type'       => 'test-filter-email',
			'recommended'         => false,
			'plugin_dependency'   => null,
			'recipient'           => 'reader',
			'chip'                => 'auth-account',
			'label'               => 'Test filter email',
			'trigger_description' => 'Added via filter.',
		];

		$callback = function ( $registry ) use ( $fake_entry ) {
			$registry['test-filter-email'] = $fake_entry;
			return $registry;
		};

		add_filter( 'newspack_emails_registry', $callback );
		$registry = Emails_Section::get_email_registry();
		remove_filter( 'newspack_emails_registry', $callback );

		$this->assertArrayHasKey( 'test-filter-email', $registry, 'Filter-added entry should be present in the registry.' );
		$this->assertSame( $fake_entry, $registry['test-filter-email'] );
	}

	/**
	 * Test registry insertion order within source groups.
	 *
	 * The UI relies on registry order to determine display order within
	 * each category group (reader-revenue, reader-activation, woocommerce).
	 */
	public function test_registry_order_within_groups() {
		$slugs = array_keys( Emails_Section::get_email_registry() );

		// Reader-revenue group: receipt -> welcome -> cancellation.
		$this->assertLessThan(
			array_search( 'welcome', $slugs, true ),
			array_search( 'receipt', $slugs, true ),
			'receipt should appear before welcome.'
		);
		$this->assertLessThan(
			array_search( 'cancellation', $slugs, true ),
			array_search( 'welcome', $slugs, true ),
			'welcome should appear before cancellation.'
		);

		// Reader-activation group: verification -> login-link -> set-new-password.
		$this->assertLessThan(
			array_search( 'login-link', $slugs, true ),
			array_search( 'verification', $slugs, true ),
			'verification should appear before login-link.'
		);
		$this->assertLessThan(
			array_search( 'set-new-password', $slugs, true ),
			array_search( 'login-link', $slugs, true ),
			'login-link should appear before set-new-password.'
		);
	}
}

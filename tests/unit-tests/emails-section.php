<?php
/**
 * Tests for the unified email config schema (NPPD-1550).
 *
 * @package Newspack\Tests
 */

use Newspack\Emails;
use Newspack\Reader_Activation_Emails;
use Newspack\Reader_Revenue_Emails;
use Newspack\WooCommerce_Emails;
use Newspack\Wizards\Newspack\Emails_Section;

/**
 * Tests the unified Emails config schema and the wizard response builder.
 *
 * Covers the five test buckets called out in the NPPD-1550 plan:
 * - 7a schema-completeness across providers
 * - 7b per-provider content
 * - 7c response shape of api_get_email_settings()
 * - 7d WooCommerce integration registration
 * - 7e default-merge mechanism
 */
class Newspack_Test_Emails_Section extends WP_UnitTestCase {
	/*
	 * ------------------------------------------------------------------
	 * 7a — Schema-completeness
	 * ------------------------------------------------------------------
	 * Iterates every config from `newspack_email_configs` after defaults
	 * are applied. Catches provider classes that forget to declare the
	 * new fields, or that declare invalid values.
	 */

	/**
	 * Every config has the four new schema fields after defaults are applied.
	 */
	public function test_email_configs_have_all_required_fields() {
		$configs = Emails::get_email_configs();
		$this->assertNotEmpty( $configs, 'Expected at least one registered email config.' );

		foreach ( $configs as $type => $config ) {
			$this->assertArrayHasKey( 'trigger_description', $config, "Config '$type' is missing trigger_description." );
			$this->assertIsString( $config['trigger_description'], "Config '$type' trigger_description must be a string." );

			$this->assertArrayHasKey( 'recipient', $config, "Config '$type' is missing recipient." );
			$this->assertContains(
				$config['recipient'],
				[ 'reader', 'admin' ],
				"Config '$type' has an invalid recipient value."
			);

			$this->assertArrayHasKey( 'recommended', $config, "Config '$type' is missing recommended." );
			$this->assertIsBool( $config['recommended'], "Config '$type' recommended must be a bool." );

			$this->assertArrayHasKey( 'chip', $config, "Config '$type' is missing chip." );
			$this->assertContains(
				$config['chip'],
				[ 'auth-account', 'reader-revenue' ],
				"Config '$type' has an invalid chip value."
			);
		}
	}

	/*
	 * ------------------------------------------------------------------
	 * 7b — Per-provider content
	 * ------------------------------------------------------------------
	 * Asserts each provider class registers entries with the expected
	 * field values. Catches data regressions when providers are touched.
	 */

	/**
	 * Reader-revenue provider: all three entries chip='reader-revenue' and recommended.
	 */
	public function test_reader_revenue_provider_entries() {
		$configs = Emails::get_email_configs();

		$expected = [
			Reader_Revenue_Emails::EMAIL_TYPES['RECEIPT'] => 'Sent after a successful payment.',
			Reader_Revenue_Emails::EMAIL_TYPES['WELCOME'] => 'Sent to new supporters after their first payment.',
			Reader_Revenue_Emails::EMAIL_TYPES['CANCELLATION'] => 'Sent when a reader cancels their subscription.',
		];

		foreach ( $expected as $type => $trigger_description ) {
			$this->assertArrayHasKey( $type, $configs, "Reader-revenue type '$type' not registered." );
			$this->assertSame( 'reader-revenue', $configs[ $type ]['chip'], "Type '$type' should chip to reader-revenue." );
			$this->assertSame( 'reader', $configs[ $type ]['recipient'], "Type '$type' should target reader." );
			$this->assertTrue( $configs[ $type ]['recommended'], "Type '$type' should be recommended." );
			$this->assertSame( $trigger_description, $configs[ $type ]['trigger_description'] );
		}
	}

	/**
	 * Reader-activation provider: all entries chip='auth-account', recipient='reader'.
	 * Recommended is true for the four core sign-in flows, false for the rest.
	 */
	public function test_reader_activation_provider_entries() {
		$configs = Emails::get_email_configs();

		$recommended_types = [
			Reader_Activation_Emails::EMAIL_TYPES['VERIFICATION'],
			Reader_Activation_Emails::EMAIL_TYPES['MAGIC_LINK'],
			Reader_Activation_Emails::EMAIL_TYPES['OTP_AUTH'],
			Reader_Activation_Emails::EMAIL_TYPES['RESET_PASSWORD'],
		];
		$non_recommended_types = [
			Reader_Activation_Emails::EMAIL_TYPES['DELETE_ACCOUNT'],
			Reader_Activation_Emails::EMAIL_TYPES['NON_READER'],
		];

		foreach ( array_merge( $recommended_types, $non_recommended_types ) as $type ) {
			$this->assertArrayHasKey( $type, $configs, "Reader-activation type '$type' not registered." );
			$this->assertSame( 'auth-account', $configs[ $type ]['chip'], "Type '$type' should chip to auth-account." );
			$this->assertSame( 'reader', $configs[ $type ]['recipient'], "Type '$type' should target reader." );
			$this->assertNotEmpty( $configs[ $type ]['trigger_description'], "Type '$type' should have a trigger description." );
		}
		foreach ( $recommended_types as $type ) {
			$this->assertTrue( $configs[ $type ]['recommended'], "Type '$type' should be recommended." );
		}
		foreach ( $non_recommended_types as $type ) {
			$this->assertFalse( $configs[ $type ]['recommended'], "Type '$type' should NOT be recommended." );
		}
	}

	/**
	 * Group-subscription-invite provider: chip='reader-revenue' (paid product), not recommended.
	 */
	public function test_group_subscription_invite_provider_entry() {
		$configs = Emails::get_email_configs();
		$type    = 'group-subscription-invite';

		$this->assertArrayHasKey( $type, $configs, 'Group subscription invite config not registered.' );
		$this->assertSame( 'reader-revenue', $configs[ $type ]['chip'] );
		$this->assertSame( 'reader', $configs[ $type ]['recipient'] );
		$this->assertFalse( $configs[ $type ]['recommended'] );
		$this->assertSame( 'Sent to invite a reader to join a group subscription.', $configs[ $type ]['trigger_description'] );
	}

	/*
	 * ------------------------------------------------------------------
	 * 7c — Response shape of api_get_email_settings()
	 * ------------------------------------------------------------------
	 * Verifies the wizard endpoint response structure after the rewrite:
	 * top-level keys are correct, each newspack_emails row carries the
	 * new schema fields, no view_category leakage, and the sort grouping
	 * holds (reader-revenue → reader-activation → other).
	 */

	/**
	 * Response has the expected top-level shape, and rows carry the new fields.
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

		$required_row_fields = [
			'label',
			'registry_slug',
			'trigger_description',
			'recipient',
			'recommended',
			'chip',
			'source',
			'category',
			'status',
		];
		foreach ( $result['newspack_emails'] as $email ) {
			foreach ( $required_row_fields as $field ) {
				$this->assertArrayHasKey( $field, $email, "Row '{$email['label']}' is missing field '$field'." );
			}
		}
	}

	/**
	 * `view_category` is dead — it was called out in slice 1 review feedback
	 * and the response builder no longer emits it.
	 */
	public function test_api_get_email_settings_omits_view_category() {
		$result = Emails_Section::api_get_email_settings();
		foreach ( $result['newspack_emails'] as $email ) {
			$this->assertArrayNotHasKey( 'view_category', $email );
		}
	}

	/**
	 * Sort order: reader-revenue first, then reader-activation, then everything else.
	 */
	public function test_api_get_email_settings_sort_order() {
		$result    = Emails_Section::api_get_email_settings();
		$group_map = [
			'reader-revenue'    => 0,
			'reader-activation' => 1,
		];

		$last_group = -1;
		foreach ( $result['newspack_emails'] as $i => $email ) {
			$group = $group_map[ $email['category'] ?? '' ] ?? 2;
			$this->assertGreaterThanOrEqual(
				$last_group,
				$group,
				"Email at index $i (category '{$email['category']}') is out of sort order."
			);
			$last_group = $group;
		}
	}

	/*
	 * ------------------------------------------------------------------
	 * 7d — WooCommerce integration
	 * ------------------------------------------------------------------
	 * The "WC inactive" branch is the only one we can test deterministically
	 * without a WC mock in this environment. When WooCommerce is loaded in
	 * a real environment the active-branch assertions kick in.
	 */

	/**
	 * With WooCommerce not active, the filter returns the input unchanged.
	 */
	public function test_woocommerce_emails_get_email_configs_with_wc_inactive() {
		if ( class_exists( 'WooCommerce' ) ) {
			$this->markTestSkipped( 'WooCommerce is loaded in this environment; inactive-branch test does not apply.' );
		}
		$input  = [ 'some-existing-config' => [ 'name' => 'some-existing-config' ] ];
		$result = WooCommerce_Emails::get_email_configs( $input );
		$this->assertSame( $input, $result, 'When WC is not active, the filter should pass through unchanged.' );
	}

	/**
	 * With WooCommerce active, recognized WC email IDs are injected with
	 * wc_email_instance attached; unrecognized IDs are silently absent.
	 */
	public function test_woocommerce_emails_get_email_configs_with_wc_active() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			$this->markTestSkipped( 'WooCommerce is not loaded in this environment.' );
		}
		$configs = Emails::get_email_configs();

		// At minimum, customer_new_account is core WC (no plugin_dependency).
		// If WC is active, we expect it in the unified config set.
		$this->assertArrayHasKey( 'customer_new_account', $configs, 'Core WC customer_new_account should be registered.' );
		$this->assertSame( 'woocommerce', $configs['customer_new_account']['source'] );
		$this->assertArrayHasKey( 'wc_email_instance', $configs['customer_new_account'] );
		$this->assertInstanceOf( \WC_Email::class, $configs['customer_new_account']['wc_email_instance'] );
	}

	/*
	 * ------------------------------------------------------------------
	 * 7e — Default-merge mechanism
	 * ------------------------------------------------------------------
	 * Direct coverage of Emails::apply_config_defaults() — the core
	 * pattern dkoo asked for. Catches changes to the documented defaults
	 * and regressions in the merge logic.
	 */

	/**
	 * Partial config gets the documented defaults filled in.
	 */
	public function test_apply_config_defaults_fills_missing_fields() {
		$partial = [
			'name'     => 'test-email',
			'label'    => 'Test Email',
			'category' => 'reader-activation',
		];
		$merged = Emails::apply_config_defaults( $partial );

		$this->assertSame( '', $merged['trigger_description'] );
		$this->assertSame( 'reader', $merged['recipient'] );
		$this->assertTrue( $merged['recommended'] );
		$this->assertSame( 'auth-account', $merged['chip'] );

		// Declared fields pass through unchanged.
		$this->assertSame( 'test-email', $merged['name'] );
		$this->assertSame( 'Test Email', $merged['label'] );
		$this->assertSame( 'reader-activation', $merged['category'] );
	}

	/**
	 * A config that declares the new fields keeps its values — defaults
	 * do not clobber explicit declarations.
	 */
	public function test_apply_config_defaults_preserves_declared_fields() {
		$full = [
			'name'                => 'test-email',
			'trigger_description' => 'A specific trigger.',
			'recipient'           => 'admin',
			'recommended'         => false,
			'chip'                => 'reader-revenue',
		];
		$merged = Emails::apply_config_defaults( $full );

		$this->assertSame( 'A specific trigger.', $merged['trigger_description'] );
		$this->assertSame( 'admin', $merged['recipient'] );
		$this->assertFalse( $merged['recommended'] );
		$this->assertSame( 'reader-revenue', $merged['chip'] );
	}

	/**
	 * A third-party provider can register with no new fields at all and
	 * still get a complete config back out of Emails::get_email_configs().
	 *
	 * This is the contract that makes the schema extension non-breaking
	 * for downstream integrations.
	 */
	public function test_email_configs_filter_partial_provider_gets_defaults() {
		$type     = 'test-partial-third-party-config';
		$callback = function ( $configs ) use ( $type ) {
			$configs[ $type ] = [
				'name'     => $type,
				'category' => 'reader-activation',
				'label'    => 'Third-party',
			];
			return $configs;
		};

		add_filter( 'newspack_email_configs', $callback );
		$configs = Emails::get_email_configs();
		remove_filter( 'newspack_email_configs', $callback );

		$this->assertArrayHasKey( $type, $configs );
		$this->assertSame( '', $configs[ $type ]['trigger_description'] );
		$this->assertSame( 'reader', $configs[ $type ]['recipient'] );
		$this->assertTrue( $configs[ $type ]['recommended'] );
		$this->assertSame( 'auth-account', $configs[ $type ]['chip'] );
	}
}

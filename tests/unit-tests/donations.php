<?php
/**
 * Tests Donations features.
 *
 * @package Newspack\Tests
 */

use Newspack\Donations;
use Newspack\Plugin_Manager;
use Newspack\Reader_Revenue_Wizard;

/**
 * Tests Donations features.
 */
class Newspack_Test_Donations extends WP_UnitTestCase {
	/**
	 * Settings.
	 */
	public function test_donations_settings_wc() {
		$donation_settings = Donations::get_donation_settings();
		self::assertTrue(
			is_wp_error( $donation_settings ),
			'Since WC is the default platform, donations settings return a WP error if WC plugins are not active.'
		);
		self::assertEquals(
			'wc',
			Donations::get_platform_slug(),
			'WC is the default donations platform.'
		);
	}

	/**
	 * Settings shape.
	 */
	public function test_donations_settings() {
		Donations::set_platform_slug( 'stripe' );
		$donation_settings = Donations::get_donation_settings();
		self::assertEquals(
			[
				'amounts',
				'tiered',
				'disabledFrequencies',
				'platform',
				'minimumDonation',
				'currencySymbol',
				'billingFields',
			],
			array_keys( $donation_settings ),
			'Donation settings have the expected keys.'
		);
	}

	/**
	 * Settings shape.
	 */
	public function test_donations_settings_migration() {
		Donations::set_platform_slug( 'stripe' );
		update_option(
			Donations::DONATION_SETTINGS_OPTION,
			[
				'suggestedAmounts'        => [ 1, 2, 3 ],
				'suggestedAmountUntiered' => 4,
			]
		);
		$donation_settings = Donations::get_donation_settings();
		self::assertEquals(
			[
				'once'  => [ 12, 24, 36, 48 ],
				'month' => [ 1, 2, 3, 4 ],
				'year'  => [ 12, 24, 36, 48 ],
			],
			$donation_settings['amounts'],
			'Donation settings are migrated.'
		);
	}

	/**
	 * Stripe integration.
	 */
	public function test_donations_stripe() {
		self::assertTrue(
			Donations::can_use_stripe_platform(),
			'Stripe platform can be used - AMP plugin is not installed.'
		);
		Plugin_Manager::activate( 'amp' );
		self::assertFalse(
			Donations::can_use_stripe_platform(),
			"Stripe platform can't be used - AMP plugin is active."
		);
		self::assertFalse(
			Donations::can_use_streamlined_donate_block(),
			'The streamlined block cannot be used either.'
		);

		define( 'NEWSPACK_AMP_PLUS_ENABLED', true );
		self::assertTrue(
			Donations::can_use_stripe_platform(),
			'Stripe platform can be used - site uses AMP Plus mode.'
		);

		self::assertFalse(
			Donations::can_use_streamlined_donate_block(),
			'The streamlined block cannot be used until Stripe platform is configured.'
		);

		// Set Stripe as platform.
		Donations::set_platform_slug( 'stripe' );
		self::assertEquals(
			'stripe',
			Donations::get_platform_slug(),
			'Stripe is set as platform.'
		);

		self::assertFalse(
			Donations::can_use_streamlined_donate_block(),
			'The streamlined block still cannot be used, keys are needed.'
		);

		// Update Stripe settings.
		$publishable_key = 'pk_test_123';
		$secret_key      = 'sk_test_123';
		$rr_wizard       = new Reader_Revenue_Wizard();
		$rr_wizard->update_stripe_settings(
			[
				'testMode'           => true,
				'testPublishableKey' => $publishable_key,
				'testSecretKey'      => $secret_key,
				'currency'           => 'EUR',
			]
		);

		$reader_revenue_data = $rr_wizard->fetch_all_data();
		self::assertEquals(
			$reader_revenue_data['stripe_data']['usedPublishableKey'],
			$publishable_key,
			'Used publishable key is set.'
		);
		self::assertEquals(
			$reader_revenue_data['stripe_data']['usedSecretKey'],
			$secret_key,
			'Used secret key is set.'
		);

		self::assertTrue(
			Donations::can_use_streamlined_donate_block(),
			'The streamlined block can be used now.'
		);
	}
}

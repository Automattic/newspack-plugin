<?php
/**
 * Tests Donations features.
 *
 * @package Newspack\Tests
 */

use Newspack\Donations;
use Newspack\Plugin_Manager;
use Newspack\Reader_Revenue_Wizard;

require_once dirname( __FILE__ ) . '/../mocks/wc-mocks.php';

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
	 * Stripe integration.
	 */
	public function test_donations_stripe() {
		self::assertFalse(
			Donations::is_using_streamlined_donate_block(),
			'The streamlined block still cannot be used, keys are needed.'
		);

		// Update Stripe settings.
		$publishable_key = 'pk_test_123';
		$secret_key      = 'sk_test_123';
		$rr_wizard       = new Reader_Revenue_Wizard();
		$rr_wizard->update_stripe_settings(
			[
				'enabled'            => true,
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
			Donations::is_using_streamlined_donate_block(),
			'The streamlined block can be used now.'
		);
	}
}

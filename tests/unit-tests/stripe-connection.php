<?php
/**
 * Tests Stripe features.
 *
 * @package Newspack\Tests
 */

use Newspack\Stripe_Connection;

/**
 * Tests Stripe features.
 */
class Newspack_Test_Stripe extends WP_UnitTestCase {
	/**
	 * Data retrieval when not yet configured.
	 */
	public function test_stripe_data_retrieval_unconfigured() {
		$default_data  = Stripe_Connection::get_default_stripe_data();
		$expected_data = array_merge(
			$default_data,
			[
				'usedPublishableKey' => '',
				'usedSecretKey'      => '',
			]
		);
		self::assertEquals(
			$expected_data,
			Stripe_Connection::get_stripe_data(),
			'When Stripe is not configured, default data is returned, with set used keys.'
		);
	}
}

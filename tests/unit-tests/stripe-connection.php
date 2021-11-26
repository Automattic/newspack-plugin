<?php
/**
 * Tests Stripe features.
 *
 * @package Newspack\Tests
 */

use Newspack\Stripe_Connection;
use Newspack\Donations;
use Stripe\Stripe;

require_once dirname( __FILE__ ) . '/../class-stripemockhttpclient.php';

/**
 * Tests Stripe features.
 */
class Newspack_Test_Stripe extends WP_UnitTestCase {
	public function setUp() { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		\Stripe\ApiRequestor::setHttpClient( new StripeMockHTTPClient() );
	}

	/**
	 * Set up Stripe.
	 */
	private static function configure_stripe_as_platform() {
		update_option( Donations::NEWSPACK_READER_REVENUE_PLATFORM, 'stripe', true );
		Stripe_Connection::update_stripe_data(
			[
				'testMode'       => false,
				'secretKey'      => 'sk_live_123',
				'publishableKey' => 'pk_live_123',
			]
		);
	}

	/**
	 * Configuration.
	 */
	public function test_stripe_configuration() {
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

		self::assertEquals(
			'Stripe secret key not provided.',
			Stripe_Connection::get_connection_error(),
			'Connection error is as expected.'
		);

		self::configure_stripe_as_platform();
		self::assertEquals(
			false,
			Stripe_Connection::get_connection_error(),
			'Connection error is false when configured.'
		);

		Stripe_Connection::update_stripe_data(
			[
				'currency' => 'CHF',
			]
		);
		self::assertEquals(
			'CHF',
			Stripe_Connection::get_stripe_data()['currency'],
			'Currency can be updated.'
		);
	}

	/**
	 * List webhooks.
	 */
	public static function test_stripe_list_webhooks() {
		self::configure_stripe_as_platform();
		self::assertEquals(
			[],
			Stripe_Connection::list_webhooks(),
			'Empty webhooks list is initially returned.'
		);
	}

	/**
	 * Handling a donation.
	 */
	public static function test_stripe_handle_donation() {
		self::configure_stripe_as_platform();
		$donation_config = [
			'amount'           => 100,
			'frequency'        => 'once',
			'email_address'    => 'foo@bar.baz',
			'full_name'        => 'Boo Bar',
			'token_data'       => [
				'id'   => 'tok_123',
				'card' => [ 'id' => 'card_number_one' ],
			],
			'client_metadata'  => [],
			'payment_metadata' => [],
		];
		$response        = Stripe_Connection::handle_donation( $donation_config );
		self::assertEquals(
			[
				'error'         => null,
				'status'        => null,
				'client_secret' => 'pi_number_one',
			],
			$response,
			'For a once donation, client secret is returned.'
		);

		$saved_customers = StripeMockHTTPClient::get_database( 'customers' );
		self::assertEquals(
			1,
			count( $saved_customers ),
			'There is one saved customer.'
		);
		self::assertEquals(
			$donation_config['email_address'],
			$saved_customers[0]['email'],
			'The customer has the expected email address.'
		);
	}
}

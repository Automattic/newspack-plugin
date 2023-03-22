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
require_once dirname( __FILE__ ) . '/../mocks/wc-mocks.php';

/**
 * Tests Stripe features.
 */
class Newspack_Test_Stripe extends WP_UnitTestCase {
	public function set_up() { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		\Stripe\ApiRequestor::setHttpClient( new StripeMockHTTPClient() );
	}

	/**
	 * Set up Stripe.
	 */
	private static function configure_stripe_gateway() {
		Stripe_Connection::update_stripe_data(
			[
				'enabled'        => true,
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
		$gateways = WC_Payment_Gateways::instance()->payment_gateways();
		if ( isset( $gateways['stripe'] ) ) {
			$stripe = $gateways['stripe'];
			$stripe->reset_testing_options();
		}

		self::assertEquals(
			'Stripe secret key not provided.',
			Stripe_Connection::get_connection_error(),
			'Connection error is as expected.'
		);

		// Enable, so the gateway is initialized.
		Stripe_Connection::update_stripe_data( [ 'enabled' => true ] );

		$expected_data = [
			'enabled'            => true,
			'testMode'           => false,
			'usedPublishableKey' => null,
			'usedSecretKey'      => null,
			'publishableKey'     => null,
			'secretKey'          => null,
			'testPublishableKey' => null,
			'testSecretKey'      => null,
			'fee_multiplier'     => '2.9',
			'fee_static'         => '0.3',
			'currency'           => 'USD',
			'location_code'      => 'US',
			'newsletter_list_id' => '',
		];
		self::assertEquals(
			$expected_data,
			Stripe_Connection::get_stripe_data(),
			'When Stripe is not configured, default data is returned, with set used keys.'
		);

		self::configure_stripe_gateway();

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
		// Update it back to USD.
		Stripe_Connection::update_stripe_data(
			[
				'currency' => 'USD',
			]
		);

		self::assertEquals(
			'US',
			Stripe_Connection::get_stripe_data()['location_code'],
			'Location code is US by default.'
		);
		update_option( 'woocommerce_default_country', 'FR' );
		self::assertEquals(
			'FR',
			Stripe_Connection::get_stripe_data()['location_code'],
			'Location code is assumed from WC\'s settings.'
		);
		update_option( 'woocommerce_default_country', 'BR:SP' );
		self::assertEquals(
			'BR',
			Stripe_Connection::get_stripe_data()['location_code'],
			'Location code is assumed from WC\'s settings, when a regional code was set.'
		);
	}

	/**
	 * Handling a donation.
	 */
	public static function test_stripe_handle_donation() {
		self::configure_stripe_gateway();
		$donation_config = [
			'amount'              => 100,
			'frequency'           => 'once',
			'email_address'       => 'foo@bar.baz',
			'full_name'           => 'Boo Bar',
			'tokenization_method' => null,
			'source_id'           => 'src_123',
			'client_metadata'     => [],
			'payment_metadata'    => [],
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

	/**
	 * Creating payload for WooCommerce.
	 */
	public static function test_stripe_wc_transaction_payload() {
		self::configure_stripe_gateway();
		$customer = [
			'id'       => 'cus_123',
			'name'     => 'John Doe',
			'email'    => 'test@example.com',
			'metadata' => [
				'clientId' => 'abc123',
				'userId'   => 42,
			],
		];
		$payment  = [
			'id'                  => 'pm_123',
			'amount'              => 100,
			'currency'            => 'usd',
			'invoice'             => 'in_123',
			'created'             => 1234567890,
			'balance_transaction' => 'txn_123',
			'referer'             => 'sample_referer',
			'newspack_popup_id'   => 123,
		];
		self::assertEquals(
			Stripe_Connection::create_wc_transaction_payload( $customer, $payment ),
			[
				'email'                         => 'test@example.com',
				'name'                          => 'John Doe',
				'stripe_id'                     => 'pm_123',
				'stripe_customer_id'            => 'cus_123',
				'stripe_fee'                    => 0.01,
				'stripe_net'                    => 0.02,
				'stripe_invoice_billing_reason' => 'subscription_create',
				'stripe_subscription_id'        => 'sub_123',
				'date'                          => 1234567890,
				'amount'                        => 1.0,
				'frequency'                     => 'once',
				'currency'                      => 'USD',
				'client_id'                     => 'abc123',
				'user_id'                       => 42,
				'subscribed'                    => false,
				'referer'                       => 'sample_referer',
				'newspack_popup_id'             => 123,
			]
		);
	}
}

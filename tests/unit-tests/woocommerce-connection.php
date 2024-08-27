<?php
/**
 * Tests WooCommerce connection.
 *
 * @package Newspack\Tests
 */

use Newspack\WooCommerce_Connection;

require_once __DIR__ . '/../mocks/wc-mocks.php';

/**
 * Tests WooCommerce connection.
 */
class Newspack_Test_WooCommerce_Connection extends WP_UnitTestCase {
	const USER_DATA = [
		'user_login' => 'test_user',
		'user_email' => 'test@example.com',
		'user_pass'  => 'password',
		'meta_input' => [
			'first_name'     => 'John',
			'last_name'      => 'Doe',
			'wc_total_spent' => 100,
		],
	];

	private static $user_id = null; // phpcs:ignore Squiz.Commenting.VariableComment.Missing

	public static function set_up_before_class() { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		self::$user_id = wp_insert_user( self::USER_DATA );
	}

	public function set_up() { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing
		// Clear the mock orders DB.
		global $orders_database;
		$orders_database = [];
		// Reset the user.
		wp_delete_user( self::$user_id );
		self::$user_id = wp_insert_user( self::USER_DATA );
	}

	/**
	 * Test payment metadata extraction - basic shape of the data.
	 */
	public function test_woocommerce_connection_payment_metadata_basic() {
		$order_data = [
			'customer_id' => self::$user_id,
			'status'      => 'completed',
			'total'       => 50,
			'meta'        => [
				'utm' => [
					'source'   => 'test_source',
					'campaign' => 'test_campaign',
					'term'     => 'test_term',
					'content'  => 'test_content',
				],
			],
		];
		$order = \wc_create_order( $order_data );
		$payment_page_url = 'https://example.com/donate';
		$contact_data = WooCommerce_Connection::get_contact_from_order( $order, $payment_page_url );
		$today = gmdate( 'Y-m-d' );
		$this->assertEquals(
			[
				'email'    => self::USER_DATA['user_email'],
				'name'     => self::USER_DATA['meta_input']['first_name'] . ' ' . self::USER_DATA['meta_input']['last_name'],
				'metadata' => [
					'NP_Payment Page'                    => $payment_page_url,
					'NP_Membership Status'               => 'customer',
					'NP_Product Name'                    => '',
					'NP_Last Payment Amount'             => '$' . $order_data['total'],
					'NP_Last Payment Date'               => $today,
					'NP_Payment UTM: source'             => 'test_source',
					'NP_Payment UTM: medium'             => '',
					'NP_Payment UTM: campaign'           => 'test_campaign',
					'NP_Payment UTM: term'               => 'test_term',
					'NP_Payment UTM: content'            => 'test_content',
					'NP_Current Subscription Start Date' => '',
					'NP_Current Subscription End Date'   => '',
					'NP_Billing Cycle'                   => '',
					'NP_Recurring Payment'               => '',
					'NP_Next Payment Date'               => '',
					'NP_Total Paid'                      => '$' . ( self::USER_DATA['meta_input']['wc_total_spent'] + $order_data['total'] ),
					'NP_Account'                         => self::$user_id,
					'NP_Registration Date'               => $today,
				],
			],
			$contact_data
		);
	}

	/**
	 * Test payment metadata extraction - with different location of UTM meta.
	 * Newspack will set the 'utm' order meta, but when importing data, a one-to-one relation
	 * might be needed. In such a case, a field in the imported data would correspond to
	 * a string meta field, instead of the UTM params being stored as serialized values.
	 */
	public function test_woocommerce_connection_payment_metadata_utm() {
		$order_data = [
			'customer_id' => self::$user_id,
			'status'      => 'completed',
			'total'       => 50,
			'meta'        => [
				'utm_source'   => 'test_source',
				'utm_campaign' => 'test_campaign',
			],
		];
		$order = \wc_create_order( $order_data );
		$contact_data = WooCommerce_Connection::get_contact_from_order( $order );
		$this->assertEquals( 'test_source', $contact_data['metadata']['NP_Payment UTM: source'] );
		$this->assertEquals( 'test_campaign', $contact_data['metadata']['NP_Payment UTM: campaign'] );
	}

	/**
	 * Test payment metadata extraction using a failed order.
	 */
	public function test_woocommerce_connection_payment_metadata_with_failed_order() {
		$order = \wc_create_order(
			[
				'customer_id' => self::$user_id,
				'status'      => 'failed',
				'total'       => 60,
			]
		);
		$contact_data = WooCommerce_Connection::get_contact_from_order( $order );
		$this->assertEmpty( $contact_data['metadata']['NP_Last Payment Date'] );
		$this->assertEmpty( $contact_data['metadata']['NP_Last Payment Amount'] );
	}

	/**
	 * Test payment metadata extraction - using customer as source.
	 */
	public function test_woocommerce_connection_payment_metadata_from_customer() {
		$order_data = [
			'customer_id' => self::$user_id,
			'status'      => 'completed',
			'total'       => 70,
		];
		$order = \wc_create_order( $order_data );
		$contact_data = WooCommerce_Connection::get_contact_from_customer( self::$user_id );
		$this->assertEquals( '$' . $order_data['total'], $contact_data['metadata']['NP_Last Payment Amount'] );
		$this->assertEquals( gmdate( 'Y-m-d' ), $contact_data['metadata']['NP_Last Payment Date'] );
	}

	/**
	 * Test payment metadata extraction - using customer who's last order was failed as source.
	 */
	public function test_woocommerce_connection_payment_metadata_from_customer_with_last_order_failed() {
		$completed_order_data = [
			'customer_id' => self::$user_id,
			'status'      => 'completed',
			'total'       => 70,
			'date_paid'   => gmdate( 'Y-m-d', strtotime( '-1 week' ) ),
		];
		$order = \wc_create_order( $completed_order_data );
		// A more recent, but failed, order.
		$failed_order_data = [
			'customer_id' => self::$user_id,
			'status'      => 'failed',
			'total'       => 89,
		];
		$order = \wc_create_order( $failed_order_data );
		$contact_data = WooCommerce_Connection::get_contact_from_customer( self::$user_id );
		$this->assertEquals( '$' . $completed_order_data['total'], $contact_data['metadata']['NP_Last Payment Amount'] );
		$this->assertEquals( $completed_order_data['date_paid'], $contact_data['metadata']['NP_Last Payment Date'] );
	}
}

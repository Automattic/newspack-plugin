<?php
/**
 * Stripe mock HTTP client.
 *
 * @package Newspack\Tests
 */

use Stripe\Stripe;

/**
 * Stripe mock HTTP client.
 */
class StripeMockHTTPClient {
	/**
	 * The database of the mock client.
	 */ // phpcs:ignore Squiz.Commenting.VariableComment.MissingVar
	public static $database = [ // phpcs:ignore Squiz.Commenting.VariableComment.Missing
		'products'  => [],
		'customers' => [],
	];

	/**
	 * Create list response object.
	 *
	 * @param array $data Data to return.
	 */
	private static function list_response( $data ) {
		return [
			'object'   => 'list',
			'data'     => $data,
			'has_more' => false,
		];
	}

	/**
	 * Peek into the mock database.
	 *
	 * @param string $key Option key.
	 */
	public static function get_database( $key = null ) {
		if ( null === $key ) {
			return self::$database;
		}
		return self::$database[ $key ];
	}

	/**
	 * Request handler.
	 *
	 * @param string $method Method.
	 * @param string $path Request path.
	 * @param string $headers Request headers.
	 * @param string $params Request params.
	 */
	public function request( $method, $path, $headers, $params ) {
		$endpoint = str_replace( 'https://api.stripe.com', '', $path );
		$response = [ 'status' => 'success' ];
		preg_match( '/\/(\w*)\/(\w*)\/?(\w*)/', $endpoint, $matches );
		[ $match, $api_version, $resource, $id ] = $matches;
		switch ( $resource ) {
			case 'products':
				switch ( $method ) {
					case 'get':
						$response = self::list_response( self::$database['products'] );
						break;
					case 'post':
						break;
				}
				break;
			case 'customers':
				switch ( $method ) {
					case 'get':
						$response = self::list_response( self::$database['customers'] );
						break;
					case 'post':
						if ( isset( $params['email'], $params['name'] ) ) {
							$customer                      = [
								'object'         => 'customer',
								'id'             => 'cus_' . wp_rand(),
								'email'          => $params['email'],
								'name'           => $params['name'],
								'default_source' => 'card_number_one',
							];
							self::$database['customers'][] = $customer;
							$response                      = $customer;
							break;
						}
				}
				break;
			case 'payment_intents':
				switch ( $method ) {
					case 'post':
						$response = [ 'client_secret' => 'pi_number_one' ];
						break;
				}
				break;
			case 'balance_transactions':
				switch ( $method ) {
					case 'get':
						$response = [
							'fee' => 1,
							'net' => 2,
						];
						break;
				}
				break;
			case 'invoices':
				switch ( $method ) {
					case 'get':
						$response = [
							'billing_reason' => 'subscription_create',
							'subscription'   => 'sub_123',
							'lines'          => [ 'data' => [ [ 'price' => [ 'recurring' => [ 'interval' => 'month' ] ] ] ] ],
						];
						break;
				}
		}
		$code    = 200;
		$headers = [];
		return [ wp_json_encode( $response ), $code, $headers ];
	}
}

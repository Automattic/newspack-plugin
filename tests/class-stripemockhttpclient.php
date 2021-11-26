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
		'webhooks'  => [],
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
		$response = [];
		switch ( $endpoint ) {
			case '/v1/webhook_endpoints':
				switch ( $method ) {
					case 'get':
						$response = self::list_response( self::$database['webhooks'] );
						break;
				}
				break;
			case '/v1/products':
				switch ( $method ) {
					case 'get':
						$response = self::list_response( self::$database['products'] );
						break;
					case 'post':
						break;
				}
				break;
			case '/v1/customers':
				switch ( $method ) {
					case 'get':
						$response = self::list_response( self::$database['customers'] );
						break;
					case 'post':
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
				break;
			case '/v1/payment_intents':
				switch ( $method ) {
					case 'post':
						$response = [ 'client_secret' => 'pi_number_one' ];
						break;
				}
		}
		$code    = 200;
		$headers = [];
		return [ wp_json_encode( $response ), $code, $headers ];
	}
}

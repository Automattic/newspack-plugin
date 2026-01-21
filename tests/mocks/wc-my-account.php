<?php
/**
 * WooCommerce account URL mock.
 *
 * @package Newspack\Tests
 */

if ( ! function_exists( 'wc_get_account_endpoint_url' ) ) {
	/**
	 * Stub WooCommerce account URL helper for tests.
	 *
	 * @param string $endpoint Endpoint name.
	 *
	 * @return string
	 */
	function wc_get_account_endpoint_url( $endpoint ) {
		return 'https://example.com/my-account';
	}
}

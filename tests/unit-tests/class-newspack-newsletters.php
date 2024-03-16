<?php
/**
 * Mock for the \Newspack_Newsletters plugin class, from the Newsletters plugin
 *
 * @package Newspack\Tests
 */

/**
 * Mock Class for \Newspack Newsletters
 */
class Newspack_Newsletters {
	const EMAIL_HTML_META = 'newspack_email_html';

	/**
	 * Mock method for service_provider.
	 */
	public static function service_provider() {
		return \get_option( 'newspack_newsletters_service_provider', false );
	}
}

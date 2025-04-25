<?php
/**
 * Log WooCommerce events
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Class for logging WooCommerce events.
 */
class WooCommerce_Logs {
	/**
	 * Initialize the class.
	 */
	public static function init() {
		add_filter( 'woocommerce_add_error', [ __CLASS__, 'log_error_notices' ] );
	}

	/**
	 * Log error notices.
	 *
	 * @param string $message The error message.
	 */
	public static function log_error_notices( $message ) {
		Logger::newspack_log( 'newspack_woocommerce_error_notice', $message );
		return $message;
	}
}
WooCommerce_Logs::init();

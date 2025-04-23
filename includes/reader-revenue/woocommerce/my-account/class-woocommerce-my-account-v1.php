<?php
/**
 * Newspack "My Account" customizations v1.x.x.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Newspack "My Account" customizations v1.x.x.
 */
class WooCommerce_My_Account_V1 {
	/**
	 * Initialize.
	 *
	 * @codeCoverageIgnore
	 */
	public static function init() {
		\add_filter( 'body_class', [ __CLASS__, 'add_body_class' ] );
	}

	/**
	 * Add a body class to the My Account page.
	 *
	 * @param array $classes The body classes.
	 * @return array The body classes.
	 */
	public static function add_body_class( $classes ) {
		$classes[] = 'newspack-my-account';
		return $classes;
	}
}
WooCommerce_My_Account_V1::init();

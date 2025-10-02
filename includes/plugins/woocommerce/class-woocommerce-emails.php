<?php
/**
 * Enable Woos block email editor.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

use WP_REST_Request, WP_REST_Response, WP_REST_Server;

/**
 * WooCommerce Emails class.
 */
class WooCommerce_Emails {
	/**
	 * Option to track if the feature is enabled.
	 *
	 * @var string
	 */
	const WOOCOMMERCE_EMAILS_OPTION = 'newspack_woocommerce_feature_email_improvements_enabled';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'option_woocommerce_feature_email_improvements_enabled', [ __CLASS__, 'force_enable_woocommerce_emails' ], 10, 2 );
	}

	/**
	 * Force enable WooCommerce email improvements.
	 *
	 * @param mixed  $value  Current value.
	 * @param string $option Option name.
	 */
	public static function force_enable_woocommerce_emails( $value, $option ) {
		if ( self::is_enabled() ) {
			return 'yes';
		}
		return $value;
	}

	/**
	 * Update the option to enable WooCommerce block email editor.
	 *
	 * @param bool $enabled Whether to enable the feature.
	 */
	public static function set_enabled( $enabled ) {
		update_option( self::WOOCOMMERCE_EMAILS_OPTION, $enabled ? 'yes' : 'no' );
	}

	/**
	 * Check if WooCommerce block email editor is enabled. Default to enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return 'yes' === get_option( self::WOOCOMMERCE_EMAILS_OPTION, 'yes' );
	}
}
WooCommerce_Emails::init();

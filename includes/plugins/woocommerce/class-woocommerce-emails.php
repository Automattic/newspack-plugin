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
	const WOOCOMMERCE_EMAIL_EDITOR_OPTION = 'newspack_woocommerce_feature_block_email_editor_enabled';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_filter( 'option_woocommerce_feature_block_email_editor_enabled', [ __CLASS__, 'override_woocommerce_email_editor_option' ], 10, 2 );
	}

	/**
	 * Force enable WooCommerce email editor.
	 *
	 * @param mixed  $value  Current value.
	 * @param string $option Option name.
	 */
	public static function override_woocommerce_email_editor_option( $value, $option ) {
		return self::is_enabled();
	}

	/**
	 * Update the option to enable WooCommerce block email editor.
	 *
	 * @param bool $enable Whether to enable the feature.
	 */
	public static function set_enabled( $enable ) {
		update_option( self::WOOCOMMERCE_EMAIL_EDITOR_OPTION, $enable ? 'yes' : 'no' );
	}

	/**
	 * Check if WooCommerce block email editor is enabled. Default to enabled.
	 *
	 * @return string 'yes' if enabled, 'no' if not.
	 */
	public static function is_enabled() {
		return get_option( self::WOOCOMMERCE_EMAIL_EDITOR_OPTION, 'yes' );
	}
}
WooCommerce_Emails::init();

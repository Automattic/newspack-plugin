<?php
/**
 * AMP improvements for WP GDPR Cookie Notice.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Improves the server performance of sites using WP GDPR Cookie Notice by eliminating an un-cacheable
 * ajax call that would get fired on every pageload.
 */
class WP_GDPR_Cookie_Notice_Performance {

	/**
	 * Init.
	 */
	public static function init() {
		add_action( 'wp_footer', [ __CLASS__, 'modify_render_callback' ], 99 );
		add_action( 'login_footer', [ __CLASS__, 'modify_render_callback' ], 99 );
	}

	/**
	 * Replace the cookie notice render callbacks with our own more performant version.
	 * This is inherently a pretty ugly method because there isn't a nice filter we can use for this modification.
	 */
	public static function modify_render_callback() {
		global $wp_filter;

		if (
			! function_exists( 'wp_gdpr_cookie_notice' ) 
			|| is_customize_preview() 
			|| ! function_exists( 'is_amp_endpoint' ) 
			|| ! is_amp_endpoint() 
		) {
			return;
		}

		$current_action = current_action();
		if ( 'wp_footer' !== $current_action && 'login_footer' !== $current_action ) {
			return;
		}

		// The original render callbacks are hooked at priority 100.
		if ( empty( $wp_filter[ $current_action ]->callbacks['100'] ) ) {
			return;
		}

		// Replace the render function with our own custom one.
		foreach ( $wp_filter[ $current_action ]->callbacks['100'] as $index => $callback ) {
			if (
				isset( $callback['function'] ) 
				&& is_array( $callback['function'] ) 
				&& is_object( $callback['function'][0] )
				&& 'Felix_Arntz\WP_GDPR_Cookie_Notice\Cookie_Notice\Cookie_Notice' === get_class( $callback['function'][0] )
			) {
				$wp_filter[ $current_action ]->callbacks['100'][ $index ]['function'] = [ __CLASS__, 'custom_render' ];
			}
		}
	}

	/**
	 * Replace the cookie notice rendering with a modified version.
	 */
	public static function custom_render() {
		include_once 'class-newspack-cookie-notice-amp-markup.php';

		$plugin_controller = wp_gdpr_cookie_notice();
		$service           = $plugin_controller->get_service( 'cookie_notice' );

		$markup = new Newspack_Cookie_Notice_AMP_Markup( 
			$service->get_form(),
			$plugin_controller->get_service( 'shortcodes' ),
			$plugin_controller->get_service( 'options' )
		);
		$markup->render();
	}
}
WP_GDPR_Cookie_Notice_Performance::init();


<?php
/**
 * Newspack Magic Links functionality.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * The Meta Pixel class
 */
class Meta_Pixel {

	/**
	 * The option name
	 */
	const OPTION_NAME = 'newspack_meta_pixel';

	/**
	 * Initialize hooks
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'wp_head', [ __CLASS__, 'print_head_snippet' ], 100 );
		add_action( 'wp_footer', [ __CLASS__, 'print_footer_snippet' ] );
	}

	/**
	 * Validates the active argument
	 *
	 * @param mixed $value The value to be validated.
	 * @return boolean
	 */
	public static function validate_active( $value ) {
		return is_bool( $value );
	}

	/**
	 * Validates the pixel_id argument
	 *
	 * @param mixed $value The value to be validated.
	 * @return boolean
	 */
	public static function validate_pixel_id( $value ) {
		return ctype_digit( $value ) || is_int( $value );
	}

	/**
	 * Callback for the REST API GET method
	 *
	 * @return \WP_REST_Response
	 */
	public static function api_get() {
		return rest_ensure_response( self::get_option() );
	}

	/**
	 * Callback for the REST API POST method to save the settings
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response
	 */
	public static function api_save( $request ) {
		$pixel_id = $request->get_param( 'pixel_id' );
		$active   = $request->get_param( 'active' );
		$value    = compact( 'pixel_id', 'active' );
		update_option( self::OPTION_NAME, self::sanitize_option( $value ) );
		return rest_ensure_response( self::get_option(), 200 );
	}

	/**
	 * Gets the current value of the option
	 *
	 * @return array
	 */
	public static function get_option() {
		return get_option( self::OPTION_NAME, self::get_default_values() );
	}

	/**
	 * Checks if Meta pixel option is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return self::get_option()['active'];
	}

	/**
	 * Gets the stored pixel ID. If Meta Pixel option is not active, ignore the saved option
	 *
	 * @return string
	 */
	public static function get_pixel_id() {
		if ( ! self::is_active() ) {
			return '';
		}
		return self::get_option()['pixel_id'];
	}

	/**
	 * Get settings default values
	 *
	 * @return array
	 */
	public static function get_default_values() {
		return [
			'active'   => false,
			'pixel_id' => '',
		];
	}

	/**
	 * Sanitizes settings
	 *
	 * @param array $value The settings value.
	 * @return array
	 */
	public static function sanitize_option( $value ) {
		$defaults  = self::get_default_values();
		$sanitized = [];
		if ( ! is_array( $value ) ) {
			return $defaults;
		}
		if ( isset( $value['active'] ) ) {
			$sanitized['active'] = (bool) $value['active'];
		} else {
			$sanitized['active'] = $defaults['active'];
		}
		if ( isset( $value['pixel_id'] ) ) {
			$sanitized['pixel_id'] = (string) $value['pixel_id']; // store as string to avoid PHP_INT_MAX problems.
		} else {
			$sanitized['pixel_id'] = $defaults['pixel_id'];
		}
		return $sanitized;
	}

	/**
	 * Checks if AMP plugin is enabled and if the current response is being server as AMP
	 *
	 * @return boolean
	 */
	public static function is_amp() {
		return function_exists( 'is_amp_endpoint' ) && is_amp_endpoint();
	}

	/**
	 * Gets the template for the img tag snippet
	 *
	 * @return string
	 */
	public static function get_img_snippet() {
		return '<img height="1" width="1" style="display: none;" src="https://www.facebook.com/tr?id=__PIXEL_ID__&ev=PageView&noscript=1&cd%5Bpage_title%5D=Homepage&cd%5Bpost_type%5D=page&cd%5Bpost_id%5D=125&cd%5Bplugin%5D=PixelYourSite&cd%5Buser_role%5D=guest&cd%5Bevent_url%5D=leogermani.jurassic.tube%2F" alt="">';
	}

	/**
	 * Gets the template for the script tag snippet
	 *
	 * @return string
	 */
	public static function get_script_snippet() {
		return "
		<script>
		!function(f,b,e,v,n,t,s)
		{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
		n.callMethod.apply(n,arguments):n.queue.push(arguments)};
		if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
		n.queue=[];t=b.createElement(e);t.async=!0;
		t.src=v;s=b.getElementsByTagName(e)[0];
		s.parentNode.insertBefore(t,s)}(window, document,'script',
		'https://connect.facebook.net/en_US/fbevents.js');
		fbq('init', '__PIXEL_ID__');
		fbq('track', 'PageView');
		</script>
		";
	}

	/**
	 * Prints sinppets in the header
	 *
	 * @return void
	 */
	public static function print_head_snippet() {
		if ( self::is_amp() ) {
			return;
		}
		$pixel_id = self::get_pixel_id();
		if ( empty( $pixel_id ) ) {
			return;
		}
		echo str_replace( '__PIXEL_ID__', intval( $pixel_id ), self::get_script_snippet() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Prints snippets in the footer
	 *
	 * @return void
	 */
	public static function print_footer_snippet() {
		$pixel_id = self::get_pixel_id();
		if ( empty( $pixel_id ) ) {
			return;
		}
		// If AMP plugin is enabled, it will convert the image into a <amp-pixel> tag.
		echo '<noscript>' . str_replace( '__PIXEL_ID__', intval( $pixel_id ), self::get_img_snippet() ) . '</noscript>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

Meta_Pixel::init();

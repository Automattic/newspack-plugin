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
		return '<img height="1" width="1" style="display: none;" src="https://www.facebook.com/tr?id=$PIXEL_ID$&ev=PageView&noscript=1&cd%5Bpage_title%5D=Homepage&cd%5Bpost_type%5D=page&cd%5Bpost_id%5D=125&cd%5Bplugin%5D=PixelYourSite&cd%5Buser_role%5D=guest&cd%5Bevent_url%5D=leogermani.jurassic.tube%2F" alt="">';
	}

	/**
	 * Gets the template for the script tag snippet
	 *
	 * @return string
	 */
	public static function get_script_snippet() {
		return '<script type="text/javascript" id="pys-js-extra">
		/* <![CDATA[ */
		var pysOptions = {"staticEvents":{"facebook":{"init_event":[{"delay":0,"type":"static","name":"PageView","pixelIds":["$PIXEL_ID$"],"eventID":"b69f94f7-5424-467e-a856-124844a132e9","params":{"page_title":"Homepage","post_type":"page","post_id":125,"plugin":"PixelYourSite","user_role":"guest","event_url":"leogermani.jurassic.tube\/"},"e_id":"init_event","ids":[],"hasTimeWindow":false,"timeWindow":0,"woo_order":"","edd_order":""}]}},"dynamicEvents":{"woo_add_to_cart_on_button_click":{"facebook":{"delay":0,"type":"dyn","name":"AddToCart","pixelIds":["$PIXEL_ID$"],"eventID":"78439eb7-a9fc-43cd-926e-670d06c4c8f2","params":{"page_title":"Homepage","post_type":"page","post_id":125,"plugin":"PixelYourSite","user_role":"guest","event_url":"leogermani.jurassic.tube\/"},"e_id":"woo_add_to_cart_on_button_click","ids":[],"hasTimeWindow":false,"timeWindow":0,"woo_order":"","edd_order":""}}},"triggerEvents":[],"triggerEventTypes":[],"facebook":{"pixelIds":["$PIXEL_ID$"],"advancedMatching":[],"removeMetadata":false,"contentParams":{"post_type":"page","post_id":125,"content_name":"Homepage"},"commentEventEnabled":true,"wooVariableAsSimple":false,"downloadEnabled":true,"formEventEnabled":true,"ajaxForServerEvent":true,"serverApiEnabled":false,"wooCRSendFromServer":false},"debug":"","siteUrl":"https:\/\/leogermani.jurassic.tube","ajaxUrl":"https:\/\/leogermani.jurassic.tube\/wp-admin\/admin-ajax.php","enable_remove_download_url_param":"1","cookie_duration":"7","last_visit_duration":"60","gdpr":{"ajax_enabled":false,"all_disabled_by_api":false,"facebook_disabled_by_api":false,"analytics_disabled_by_api":false,"google_ads_disabled_by_api":false,"pinterest_disabled_by_api":false,"bing_disabled_by_api":false,"facebook_prior_consent_enabled":true,"analytics_prior_consent_enabled":true,"google_ads_prior_consent_enabled":null,"pinterest_prior_consent_enabled":true,"bing_prior_consent_enabled":true,"cookiebot_integration_enabled":false,"cookiebot_facebook_consent_category":"marketing","cookiebot_analytics_consent_category":"statistics","cookiebot_google_ads_consent_category":null,"cookiebot_pinterest_consent_category":"marketing","cookiebot_bing_consent_category":"marketing","consent_magic_integration_enabled":false,"real_cookie_banner_integration_enabled":false,"cookie_notice_integration_enabled":false,"cookie_law_info_integration_enabled":false},"woo":{"enabled":true,"addToCartOnButtonEnabled":true,"addToCartOnButtonValueEnabled":true,"addToCartOnButtonValueOption":"price","singleProductId":null,"removeFromCartSelector":"form.woocommerce-cart-form .remove","addToCartCatchMethod":"add_cart_js"},"edd":{"enabled":false}};
		/* ]]> */
		</script>';
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
		echo str_replace( '$PIXEL_ID$', intval( $pixel_id ), self::get_script_snippet() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
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
		echo '<noscript>' . str_replace( '$PIXEL_ID$', intval( $pixel_id ), self::get_img_snippet() ) . '</noscript>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}

Meta_Pixel::init();

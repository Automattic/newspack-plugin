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
}

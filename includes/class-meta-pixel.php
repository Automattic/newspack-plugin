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
	 * Initializes the hooks
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_init', [ __CLASS__, 'register_setting' ] );
		add_action( 'rest_api_init', [ __CLASS__, 'register_setting' ] );
	}

	/**
	 * Register the settings
	 *
	 * @return void
	 */
	public static function register_setting() {
		register_setting(
			'newspack_plugin',
			self::OPTION_NAME,
			array(
				'show_in_rest'      => array(
					'schema' => array(
						'type'       => 'object',
						'properties' => array(
							'active'   => array(
								'type' => 'boolean',
							),
							'pixel_id' => array(
								'type' => 'string',
							),
						),
					),
				),
				'type'              => 'object',
				'sanitize_callback' => [ __CLASS__, 'sanitize_option' ],
				'default'           => self::get_default_values(),
			)
		);
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
			$sanitized['pixel_id'] = (string) $value['pixel_id'];
		} else {
			$sanitized['pixel_id'] = $defaults['pixel_id'];
		}
		return $sanitized;
	}
}

Meta_Pixel::init();

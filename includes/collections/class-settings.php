<?php
/**
 * Collections Settings handler.
 *
 * @package Newspack
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

/**
 * Collections settings management.
 */
class Settings {

	/**
	 * Option name for all collection settings.
	 */
	const OPTION_NAME = 'newspack_collections_settings';

	/**
	 * Settings fields and their defaults.
	 */
	const FIELDS = [
		'custom_naming_enabled' => false,
		'custom_name'           => '',
		'custom_singular_name'  => '',
		'custom_slug'           => '',
		'subscribe_link'        => '',
	];

	/**
	 * Get all collection settings with defaults applied.
	 *
	 * @return array Collection settings.
	 */
	public static function get_settings() {
		$collection_settings = get_option( self::OPTION_NAME, [] );

		return wp_parse_args( $collection_settings, self::FIELDS );
	}

	/**
	 * Update collection settings.
	 *
	 * @param array $settings Settings to update.
	 * @return bool True on success, false on failure.
	 */
	public static function update_settings( $settings ) {
		$current_settings = get_option( self::OPTION_NAME, [] );
		$updated_settings = array_merge( $current_settings, $settings );

		return update_option( self::OPTION_NAME, $updated_settings );
	}

	/**
	 * Update a specific setting.
	 *
	 * @param string $key   Setting key.
	 * @param mixed  $value Setting value.
	 * @return bool True on success, false on failure.
	 */
	public static function update_setting( $key, $value ) {
		$current_settings         = get_option( self::OPTION_NAME, [] );
		$current_settings[ $key ] = $value;

		return update_option( self::OPTION_NAME, $current_settings );
	}

	/**
	 * Get a specific setting.
	 *
	 * @param string $key Setting key.
	 * @return mixed Setting value or null if not set.
	 */
	public static function get_setting( $key ) {
		$settings = self::get_settings();

		return isset( $settings[ $key ] ) ? $settings[ $key ] : null;
	}

	/**
	 * Get REST API args for collection fields.
	 *
	 * @return array REST API arguments.
	 */
	public static function get_rest_args() {
		return [
			'custom_naming_enabled' => [
				'required'          => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			],
			'custom_name'           => [
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
			],
			'custom_singular_name'  => [
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
			],
			'custom_slug'           => [
				'required'          => false,
				'sanitize_callback' => function ( $value ) {
					return sanitize_title( is_string( $value ) ? $value : '' );
				},
			],
			'subscribe_link'        => [
				'required'          => false,
				'sanitize_callback' => 'esc_url_raw',
			],
		];
	}

	/**
	 * Update collection settings from REST request.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array Updated collection settings.
	 */
	public static function update_from_request( $request ) {
		$collection_settings = get_option( self::OPTION_NAME, [] );

		foreach ( array_keys( self::FIELDS ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$collection_settings[ $key ] = $request->get_param( $key );
			}
		}

		update_option( self::OPTION_NAME, $collection_settings );

		return self::get_settings();
	}
}

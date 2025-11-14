<?php
/**
 * WooCommerce Content Gate Metering.
 *
 * @package Newspack
 */

namespace Newspack;

/**
 * WooCommerce Content Gate Metering class.
 */
class Metering_Countdown {

	const OPTION_PREFIX = 'np_countdown_banner_';

	/**
	 * Get all settings with default values for the countdown banner.
	 *
	 * @return array Default countdown settings.
	 */
	public static function get_default_settings() {
		return [
			'enabled'      => false,
			'style'        => 'light',
			'cta_label'    => __( 'Subscribe now and get unlimited access.', 'newspack' ),
			'button_label' => __( 'Subscribe now', 'newspack' ),
			'cta_url'      => '',
		];
	}

	/**
	 * Get all settings for the countdown banner.
	 *
	 * @param string $key Optional key to get a specific setting. If not provided, all settings will be returned.
	 *
	 * @return array Countdown settings.
	 */
	public static function get_settings( $key = null ) {
		$settings = self::get_default_settings();
		if ( $key && isset( $settings[ $key ] ) ) {
			return get_option( self::OPTION_PREFIX . $key, $settings[ $key ] );
		}
		foreach ( $settings as $key => $value ) {
			$settings[ $key ] = get_option( self::OPTION_PREFIX . $key, $value );
		}
		return $settings;
	}

	/**
	 * Update settings for the countdown banner.
	 *
	 * @param array $settings New countdown settings.
	 *
	 * @return array|\WP_Error Updated countdown settings or error if update fails.
	 */
	public static function update_settings( $settings ) {
		$default_settings = self::get_default_settings();
		$current_settings = self::get_settings();
		foreach ( $settings as $key => $value ) {
			if ( isset( $current_settings[ $key ] ) ) {
				if ( $key === 'style' && ! in_array( $value, [ 'light', 'dark' ], true ) ) {
					continue;
				}
				if ( empty( $value ) ) {
					delete_option( self::OPTION_PREFIX . $key );
					$current_settings[ $key ] = $default_settings[ $key ];
					continue;
				}
				update_option( self::OPTION_PREFIX . $key, $value );
				$current_settings[ $key ] = $value;
			}
		}
		return $current_settings;
	}
}

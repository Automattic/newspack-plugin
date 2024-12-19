<?php
/**
 * Newspack's Syndication Settings
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Syndication
 */
class Syndication {
	/**
	 * The name of the option that stores the settings.
	 *
	 * @TODO: Consider a more relevant option name e.g. 'newspack_syndication_settings'.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'newspack_settings';

	/**
	 * The prefix for the module enabled settings.
	 *
	 * @var string
	 */
	const MODULE_ENABLED_PREFIX = 'module_enabled_';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Get all settings.
	 */
	public static function get_settings() {
		$default_settings = [
			self::MODULE_ENABLED_PREFIX . 'rss'            => false,
			self::MODULE_ENABLED_PREFIX . 'media-partners' => false,
		];
		return wp_parse_args( get_option( self::OPTION_NAME ), $default_settings );
	}

	/**
	 * Get the list of available optional modules.
	 */
	public static function get_available_optional_modules() {
		return [ 'rss' ];
	}

	/**
	 * Get settings.
	 */
	public static function api_get_settings() {
		return self::get_settings();
	}

	/**
	 * Check if an optional module is active.
	 *
	 * @param string $module_name Name of the module.
	 */
	public static function is_optional_module_active( $module_name ) {
		$settings     = self::get_settings();
		$setting_name = self::MODULE_ENABLED_PREFIX . $module_name;
		if ( isset( $settings[ $setting_name ] ) ) {
			return $settings[ $setting_name ];
		}
		return false;
	}

	/**
	 * Activate an optional module.
	 *
	 * @param string $module_name Name of the module.
	 */
	public static function activate_optional_module( $module_name ) {
		return self::update_setting( self::MODULE_ENABLED_PREFIX . $module_name, true );
	}

	/**
	 * Update a single setting value.
	 *
	 * @param string $key Setting key.
	 * @param string $value Setting value.
	 */
	private static function update_setting( $key, $value ) {
		$settings = self::get_settings();
		if ( isset( $settings[ $key ] ) ) {
			$settings[ $key ] = $value;
			update_option( self::OPTION_NAME, $settings );
		}
		return $settings;
	}

	/**
	 * Update settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response with the info.
	 */
	public static function api_update_settings( $request ) {
		$settings = self::get_settings();
		foreach ( self::get_available_optional_modules() as $module_name ) {
			$setting_name              = self::MODULE_ENABLED_PREFIX . $module_name;
			$settings[ $setting_name ] = $request->get_param( $setting_name );
		}
		update_option( self::OPTION_NAME, $settings );
		return self::get_settings();
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Settings', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Configure settings.', 'newspack' );
	}

	/**
	 * Get the duration of this wizard.
	 *
	 * @return string A description of the expected duration (e.g. '10 minutes').
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}
}

<?php
/**
 * One Signal plugin configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of AMP.
 */
class OneSignal_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'onesignal-free-web-push-notifications';

	/**
	 * Configure One Signal for Newspack use.
	 */
	public function configure() {}

	/**
	 * Get whether the One Signal plugin is active and set up.
	 *
	 * @return bool Whether One Signal plugin is installed and activated.
	 */
	public function is_configured() {
		return class_exists( 'OneSignal' );
	}

	/**
	 * Get a One Signal option.
	 *
	 * @param string $option_name The option name.
	 * @param string $default Default value for the option if unset.
	 * @return WP_Error|array One Signal options.
	 */
	public function get( $option_name, $default = null ) {
		if ( ! $this->is_configured() ) {
			return $this->unconfigured_error();
		}
		$settings = \OneSignal::get_onesignal_settings();
		return isset( $settings[ $option_name ] ) ? $settings[ $option_name ] : $default;
	}

	/**
	 * Set One Signal App ID.
	 *
	 * @param string $app_id One Signal App ID.
	 */
	public function setAppID( $app_id ) {
		if ( ! $this->is_configured() ) {
			return $this->unconfigured_error();
		}

		// From: https://github.com/wp-plugins/onesignal-free-web-push-notifications/blob/cf7427c91ec0da7417f5d4a3c204daaa04156ab1/onesignal-admin.php#L60.
		if ( ! preg_match( '/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/', $app_id, $m ) ) {
			return new \WP_Error(
				'newspack_invalid_onesignal_app_id',
				esc_html__( 'Invalid One Signal App IDs.', 'newspack' ),
				[
					'status' => 400,
					'level'  => 'fatal',
				]
			);
		}
		$settings           = \OneSignal::get_onesignal_settings();
		$settings['app_id'] = $app_id;
		\OneSignal::save_onesignal_settings( $settings );
	}

	/**
	 * Set One Signal API Key.
	 *
	 * @param string $app_rest_api_key One Signal API Key.
	 */
	public function setRestAPIKey( $app_rest_api_key ) {
		if ( ! $this->is_configured() ) {
			return $this->unconfigured_error();
		}
		$settings                     = \OneSignal::get_onesignal_settings();
		$settings['app_rest_api_key'] = $app_rest_api_key;
		\OneSignal::save_onesignal_settings( $settings );
	}

	/**
	 * Error to return if the plugin is not installed and activated.
	 *
	 * @return WP_Error
	 */
	private function unconfigured_error() {
		return new \WP_Error(
			'newspack_missing_required_plugin',
			esc_html__( 'The One Signal plugin is not installed and activated. Install and/or activate it to access this feature.', 'newspack' ),
			[
				'status' => 400,
				'level'  => 'fatal',
			]
		);
	}
}

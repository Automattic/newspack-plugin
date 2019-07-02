<?php
/**
 * AMP plugin configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;
defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Provide an interface for configuring and querying the configuration of AMP.
 */
class Progressive_WP_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'progressive-wp';

	/**
	 * List of retrievable fields.
	 *
	 * @var array
	 */
	public $fields = [
		'site_icon',
		'firebase-serverkey',
		'firebase-senderid',
		'installable-mode',
		'offline-page',
	];

	/**
	 * Configure AMP for Newspack use.
	 *
	 * @return bool || WP_Error Return true if successful, or WP_Error if not.
	 */
	public function configure() {
		return true;
	}

	/**
	 * Retrieve one value
	 *
	 * @param string $setting The key of the value.
	 * @var string || WP_Error
	 */
	public function get( $setting = '' ) {
		if ( ! in_array( $setting, $this->fields ) ) {
			return new WP_Error( 'newspack_field_not_found', 'Setting could not be retrieved' );
		}
		$method = $this->setting_to_function_name( $setting, 'get' );
		if ( method_exists( $this, $method ) ) {
			return $this->{ $method }();
		}
		if ( function_exists( 'pwp_settings' ) ) {
			return pwp_settings()->get_setting( $setting );
		}
		return null;
	}

	/**
	 * Update one setting value
	 *
	 * @param string $setting The setting name.
	 * @param string $value The setting value.
	 * @var null || WP_Error
	 */
	public function update( $setting = '', $value = '' ) {
		if ( ! in_array( $setting, $this->fields ) ) {
			return new WP_Error( 'newspack_field_not_found', 'Field could not be updated' );
		}
		$method = $this->setting_to_function_name( $setting, 'update' );
		if ( method_exists( $this, $method ) ) {
			return $this->{ $method }( $value );
		}
		if ( function_exists( 'pwp_settings' ) ) {
			$options = get_option( 'pwp-settings' );

			$options[ $setting ] = $value;
			update_option( 'pwp-settings', $options );
		}
	}

	/**
	 * Retrieve Site Icon
	 *
	 * @var string
	 */
	public function get_site_icon() {
		$site_icon = get_option( 'site_icon' );
		if ( ! $site_icon ) {
			return null;
		}
		$url = wp_get_attachment_image_src( $site_icon );
		return [
			'id'  => $site_icon,
			'url' => $url[0],
		];
	}

	/**
	 * Update Site Icon
	 *
	 * @param string $site_icon The site icon.
	 */
	public function update_site_icon( $site_icon ) {
		if ( ! empty( $site_icon['id'] ) ) {
			update_option( 'site_icon', intval( $site_icon['id'] ) );
		}
	}

	/**
	 * Update Progressive WP's Firebase Credentials Set option
	 *
	 * @param bool $set Whether Firebase credentials are set.
	 */
	public function firebase_credentials_set( $set ) {
		update_option( 'pwp_firebase_credentials_set', $set ? 'yes' : 'no' );
	}

	/**
	 * Determine whether a module is enabled.
	 *
	 * @param string Module slug.
	 * @return bool Whether the module is enabled or not.
	 */
	public function is_module_enabled( $module ) {
		switch ( $module ) {
			case 'add_to_homescreen':
				return 'none' !== $this->get( 'installable-mode' );
			case 'offline_usage':
				$setting = $this->get( 'offline-page' );
				return 'page' === get_post_type( $setting );
			case 'push_notifications':
				return 'yes' === get_option( 'pwp_firebase_credentials_set', 'no' );
			default:
				return false;
		}
	}

}

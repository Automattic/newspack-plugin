<?php
/**
 * Static class for managing all configuration managers.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;
defined( 'ABSPATH' ) || exit;

/**
 * List and instantiate configuration managers.
 */
class Configuration_Managers {
	/**
	 * A registry of all configuration managers, keyed to the plugin slug.
	 *
	 * @var array
	 */
	protected static $configuration_managers = [
		'jetpack'         => [
			'filename'   => 'class-jetpack-configuration-manager.php',
			'class_name' => 'Jetpack_Configuration_Manager',
		],
		'amp'             => [
			'filename'   => 'class-amp-configuration-manager.php',
			'class_name' => 'AMP_Configuration_Manager',
		],
		'google-site-kit' => [
			'filename'   => 'class-site-kit-configuration-manager.php',
			'class_name' => 'Site_Kit_Configuration_Manager',
		],
	];

	/**
	 * Convenience class to instantiate a plugin's configuration manager.
	 *
	 * @param string $slug The plugin slug.
	 * @var Configuration_Manager || WP_Error
	 */
	public static function configuration_manager_class_for_plugin_slug( $slug ) {
		if ( empty( self::$configuration_managers[ $slug ] ) ) {
			return new WP_Error(
				'newspack_configuration_manager_not_found',
				esc_html__( 'No configuration manager exists for this plugin.', 'newspack' )
			);
		}
		require_once NEWSPACK_ABSPATH . 'includes/configuration_managers/' . self::$configuration_managers[ $slug ]['filename'];

		$classname     = 'Newspack\\' . self::$configuration_managers[ $slug ]['class_name'];
		$instantiation = new $classname();

		return $instantiation;
	}

	/**
	 * Convenience class to configure a plugin.
	 *
	 * @param string $slug The plugin slug.
	 * @var bool || WP_Error
	 */
	public static function configure( $slug ) {
		$configuration_manager = self::configuration_manager_class_for_plugin_slug( $slug );
		if ( is_wp_error( $configuration_manager ) ) {
			return $configuration_manager;
		}
		return $configuration_manager->configure();
	}

	/**
	 * Convenience class to get configuration status of a plugin.
	 *
	 * @param string $slug The plugin slug.
	 * @var bool
	 */
	public static function is_configured( $slug ) {
		$configuration_manager = self::configuration_manager_class_for_plugin_slug( $slug );
		if ( is_wp_error( $configuration_manager ) ) {
			return false;
		}
		return $configuration_manager->is_configured();
	}
}

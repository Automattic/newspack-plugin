<?php
/**
 * Newspack setup
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * General purpose class for managing installation/activation of plugins.
 */
class Plugin_Manager {

	/**
	 * Determine whether plugin installation is allowed in the current environment.
	 *
	 * @return bool
	 */
	public static function can_install_plugins() {
		if ( ( defined( 'DISALLOW_FILE_EDIT' ) && DISALLOW_FILE_EDIT ) || ( defined( 'DISALLOW_FILE_MODS' ) && DISALLOW_FILE_MODS ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Activate a plugin, installing it first if necessary.
	 *
	 * @param string $plugin The plugin slug or URL to the plugin.
	 * @return bool True on success. False on failure or if plugin was already activated.
	 */
	public static function activate( $plugin ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_slug = $plugin;

		// if it's a url, parse the slug from the URL.
		if ( wp_http_validate_url( $plugin ) ) {
			$plugin_slug = self::get_plugin_slug_from_url( $plugin );
			if ( ! $plugin_slug ) {
				return false;
			}
		}

		$installed_plugins = self::get_installed_plugins();

		// Install the plugin if it's not installed already.
		$plugin_installed = isset( $installed_plugins[ $plugin_slug ] );
		if ( ! $plugin_installed ) {
			$plugin_installed = self::install( $plugin );
		}
		if ( ! $plugin_installed ) {
			return false;
		}

		// Refresh the installed plugin list if the plugin isn't present because we just installed it.
		if ( ! isset( $installed_plugins[ $plugin_slug ] ) ) {
			$installed_plugins = self::get_installed_plugins();
		}

		if ( is_plugin_active( $installed_plugins[ $plugin_slug ] ) ) {
			return false;
		}

		$activated = activate_plugin( $installed_plugins[ $plugin_slug ] );
		if ( is_wp_error( $activated ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Deactivate a plugin.
	 *
	 * @param string $plugin_file The path to the plugin file. e.g. 'newspack/newspack.php'.
	 * @return bool True on success. False on failure.
	 */
	public static function deactivate( $plugin_file ) {
		$installed_plugins = self::get_installed_plugins();
		if ( ! in_array( $plugin_file, $installed_plugins ) ) {
			return false;
		}

		deactivate_plugins( $plugin_file );
		return true;
	}

	/**
	 * Get a simple list of all installed plugins.
	 *
	 * @return array of 'plugin_slug => plugin_file_path' entries for all installed plugins.
	 */
	public static function get_installed_plugins() {
		$installed_plugins = array_reduce( array_keys( get_plugins() ), array( __CLASS__, 'reduce_plugin_info' ) );
		if ( empty( $installed_plugins ) ) {
			$installed_plugins = [];
		}
		return $installed_plugins;
	}

	/**
	 * Parse a plugin slug from the URL to download a plugin.
	 *
	 * @param string $url The URL to a plugin zip file.
	 * @return string|bool Parsed slug on success. False on failure.
	 */
	public static function get_plugin_slug_from_url( $url ) {
		$url = wp_http_validate_url( $url );
		if ( ! $url || ! stripos( $url, '.zip' ) ) {
			return false;
		}

		$result = preg_match_all( '/\/([^\.\/*]+)/', $url, $matches );
		if ( ! $result ) {
			return false;
		}

		$group = end( $matches );
		$slug  = end( $group );
		return $slug;
	}

	/**
	 * Installs a plugin.
	 *
	 * @param string $plugin Plugin slug or URL to plugin zip file.
	 * @return bool True on success. False on failure.
	 */
	public static function install( $plugin ) {
		if ( ! self::can_install_plugins() ) {
			return false;
		}

		if ( wp_http_validate_url( $plugin ) ) {
			return self::install_from_url( $plugin );
		} else {
			return self::install_from_wporg( $plugin );
		}
	}

	/**
	 * Uninstall a plugin.
	 *
	 * @param string $plugin_file The path to the plugin file. e.g. 'newspack/newspack.php'.
	 * @return bool True on success. False on failure.
	 */
	public static function uninstall( $plugin_file ) {
		if ( ! self::can_install_plugins() ) {
			return false;
		}

		$success = (bool) delete_plugins( [ $plugin_file ] );
		if ( $success ) {
			wp_clean_plugins_cache();
		}
		return $success;
	}

	/**
	 * Install a plugin from the WordPress.org plugin repo.
	 *
	 * @param string $plugin_slug The slug for the plugin.
	 * @return bool True on success. False on failure.
	 */
	protected static function install_from_wporg( $plugin_slug ) {
		// Quick check to make sure plugin directory doesn't already exist.
		$plugin_directory = WP_PLUGIN_DIR . '/' . $plugin_slug;
		if ( is_dir( $plugin_directory ) ) {
			return false;
		}

		if ( ! function_exists( 'plugins_api' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		}

		$plugin_info = plugins_api(
			'plugin_information',
			[
				'slug'   => $plugin_slug,
				'fields' => [
					'short_description' => false,
					'sections'          => false,
					'requires'          => false,
					'rating'            => false,
					'ratings'           => false,
					'downloaded'        => false,
					'last_updated'      => false,
					'added'             => false,
					'tags'              => false,
					'compatibility'     => false,
					'homepage'          => false,
					'donate_link'       => false,
				],
			]
		);

		if ( is_wp_error( $plugin_info ) ) {
			return false;
		}

		return self::install_from_url( $plugin_info->download_link );
	}

	/**
	 * Install a plugin from an arbitrary URL.
	 *
	 * @param string $plugin_url The URL to the plugin zip file.
	 * @return bool True on success. False on failure.
	 */
	protected static function install_from_url( $plugin_url ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		WP_Filesystem();

		$skin     = new \Automatic_Upgrader_Skin();
		$upgrader = new \WP_Upgrader( $skin );

		$download = $upgrader->download_package( $plugin_url );
		if ( is_wp_error( $download ) ) {
			return false;
		}

		$working_dir = $upgrader->unpack_package( $download );
		if ( is_wp_error( $working_dir ) ) {
			return false;
		}

		$result = $upgrader->install_package(
			[
				'source'        => $working_dir,
				'destination'   => WP_PLUGIN_DIR,
				'clear_working' => true,
				'hook_extra'    => [
					'type'   => 'plugin',
					'action' => 'install',
				],
			]
		);
		if ( is_wp_error( $result ) ) {
			return false;
		}

		wp_clean_plugins_cache();
		return true;
	}

	/**
	 * Reduce get_plugins() info to form 'folder => file'.
	 *
	 * @param array  $plugins Associative array of plugin files to paths.
	 * @param string $key Plugin relative path. Example: newspack/newspack.php.
	 * @return array
	 */
	private static function reduce_plugin_info( $plugins, $key ) {
		$path               = explode( '/', $key );
		$folder             = current( $path );
		$plugins[ $folder ] = $key;
		return $plugins;
	}
}

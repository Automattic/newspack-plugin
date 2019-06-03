<?php
/**
 * Newspack setup
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * General purpose class for managing installation/activation of plugins.
 */
class Plugin_Manager {

	/**
	 * Get info about all the managed plugins and their status.
	 *
	 * @todo Define what the structure of this looks like better and load it up from a config or something.
	 *
	 * @return array of plugins info.
	 */
	public static function get_managed_plugins() {
		$managed_plugins = [
			'jetpack'                    => [
				'Name'        => __( 'Jetpack', 'newspack' ),
				'Description' => esc_html__( 'Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.', 'newspack' ),
				'Author'      => 'Automattic',
				'PluginURI'   => 'https://jetpack.com/',
				'AuthorURI'   => 'https://automattic.com/',
				'Download'    => 'wporg',
			],
			'amp'                        => [
				'Name'        => __( 'AMP', 'newspack' ),
				'Description' => esc_html__( 'Enable AMP on your WordPress site, the WordPress way.', 'newspack' ),
				'Author'      => 'WordPress.com VIP, XWP, Google, and contributors',
				'PluginURI'   => 'https://amp-wp.org/',
				'AuthorURI'   => 'https://github.com/ampproject/amp-wp/graphs/contributors',
				'Download'    => 'wporg',
			],
			'woocommerce-gateway-stripe' => [
				'Name'        => __( 'WooCommerce Stripe Gateway', 'newspack' ),
				'Description' => esc_html__( 'Take credit card payments on your store using Stripe.', 'newspack' ),
				'Author'      => 'WooCommerce',
				'PluginURI'   => 'https://woocommerce.com/',
				'AuthorURI'   => 'https://woocommerce.com/',
				'Download'    => 'wporg',
			],
		];

		$default_info = [
			'Name'        => '',
			'Description' => '',
			'Author'      => '',
			'Version'     => '',
			'PluginURI'   => '',
			'AuthorURI'   => '',
			'TextDomain'  => '',
			'DomainPath'  => '',
			'Download'    => '',
			'Status'      => '',
		];

		// Add plugin status info and fill in defaults.
		$installed_plugins = self::get_installed_plugins();
		foreach ( $managed_plugins as $plugin_slug => $managed_plugin ) {
			$status = 'uninstalled';
			if ( isset( $installed_plugins[ $plugin_slug ] ) ) {
				if ( is_plugin_active( $installed_plugins[ $plugin_slug ] ) ) {
					$status = 'active';
				} else {
					$status = 'inactive';
				}
			}
			$managed_plugins[ $plugin_slug ]['Status'] = $status;
			$managed_plugins[ $plugin_slug ]           = wp_parse_args( $managed_plugins[ $plugin_slug ], $default_info );
		}
		return $managed_plugins;
	}

	/**
	 * Determine whether plugin installation is allowed in the current environment.
	 *
	 * @return bool
	 */
	public static function can_install_plugins() {
		if ( ( defined( 'DISALLOW_FILE_EDIT' ) && DISALLOW_FILE_EDIT ) ||
			( defined( 'DISALLOW_FILE_MODS' ) && DISALLOW_FILE_MODS ) ) {
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

		$plugin_slug = self::get_plugin_slug( $plugin );
		if ( ! $plugin_slug ) {
			return new WP_Error( 'newspack_invalid_plugin', __( 'Invalid plugin.', 'newspack' ) );
		}

		$installed_plugins = self::get_installed_plugins();

		// Install the plugin if it's not installed already.
		$plugin_installed = isset( $installed_plugins[ $plugin_slug ] );
		if ( ! $plugin_installed ) {
			$plugin_installed = self::install( $plugin );
		}
		if ( is_wp_error( $plugin_installed ) ) {
			return $plugin_installed;
		}

		// Refresh the installed plugin list if the plugin isn't present because we just installed it.
		if ( ! isset( $installed_plugins[ $plugin_slug ] ) ) {
			$installed_plugins = self::get_installed_plugins();
		}

		if ( is_plugin_active( $installed_plugins[ $plugin_slug ] ) ) {
			return new WP_Error( 'newspack_plugin_already_active', __( 'The plugin is already active.', 'newspack' ) );
		}

		$activated = activate_plugin( $installed_plugins[ $plugin_slug ] );
		if ( is_wp_error( $activated ) ) {
			return new WP_Error( 'newspack_plugin_failed_activation', $activated->get_error_message() );
		}

		return true;
	}

	/**
	 * Deactivate a plugin.
	 *
	 * @param string $plugin The plugin slug (e.g. 'newspack') or path to the plugin file. e.g. ('newspack/newspack.php').
	 * @return bool True on success. False on failure.
	 */
	public static function deactivate( $plugin ) {
		$installed_plugins = self::get_installed_plugins();
		if ( ! in_array( $plugin, $installed_plugins ) && ! isset( $installed_plugins[ $plugin ] ) ) {
			return new WP_Error( 'newspack_plugin_not_installed', __( 'The plugin is not installed.', 'newspack' ) );
		}

		if ( isset( $installed_plugins[ $plugin ] ) ) {
			$plugin_file = $installed_plugins[ $plugin ];
		} else {
			$plugin_file = $plugin;
		}

		if ( ! is_plugin_active( $plugin_file ) ) {
			return new WP_Error( 'newspack_plugin_not_active', __( 'The plugin is not active.', 'newspack' ) );
		}

		deactivate_plugins( $plugin_file );
		if ( is_plugin_active( $plugin_file ) ) {
			return new WP_Error( 'newspack_plugin_failed_deactivation', __( 'Failed to deactivate plugin.', 'newspack' ) );
		}
		return true;
	}

	/**
	 * Get a simple list of all installed plugins.
	 *
	 * @return array of 'plugin_slug => plugin_file_path' entries for all installed plugins.
	 */
	public static function get_installed_plugins() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return array_reduce( array_keys( get_plugins() ), array( __CLASS__, 'reduce_plugin_info' ) );
	}

	/**
	 * Parse a plugin slug from the slug or URL to download a plugin.
	 *
	 * @param string $plugin A plugin slug or the URL to a plugin zip file.
	 * @return string|bool Parsed slug on success. False on failure.
	 */
	public static function get_plugin_slug( $plugin ) {
		if ( ! is_string( $plugin ) || empty( $plugin ) ) {
			return false;
		}

		$url = wp_http_validate_url( $plugin );

		// A plugin slug was passed in, so just return it.
		if ( ! $url ) {
			return $plugin;
		}

		if ( ! stripos( $url, '.zip' ) ) {
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
			return new WP_Error( 'newspack_plugin_failed_install', __( 'Plugins cannot be installed.', 'newspack' ) );
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
	 * @param string $plugin The plugin slug (e.g. 'newspack') or path to the plugin file. e.g. ('newspack/newspack.php').
	 * @return bool True on success. False on failure.
	 */
	public static function uninstall( $plugin ) {
		if ( ! self::can_install_plugins() ) {
			return new WP_Error( 'newspack_plugin_failed_uninstall', __( 'Plugins cannot be uninstalled.', 'newspack' ) );
		}

		$installed_plugins = self::get_installed_plugins();
		if ( ! in_array( $plugin, $installed_plugins ) && ! isset( $installed_plugins[ $plugin ] ) ) {
			return new WP_Error( 'newspack_plugin_failed_uninstall', __( 'The plugin is not installed.', 'newspack' ) );
		}

		if ( isset( $installed_plugins[ $plugin ] ) ) {
			$plugin_file = $installed_plugins[ $plugin ];
		} else {
			$plugin_file = $plugin;
		}

		// Deactivate plugin before uninstalling.
		self::deactivate( $plugin_file );

		if ( ! function_exists( 'request_filesystem_credentials' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$success = (bool) delete_plugins( [ $plugin_file ] );
		if ( $success ) {
			wp_clean_plugins_cache();
			return true;
		}
		return new WP_Error( 'newspack_plugin_failed_uninstall', __( 'The plugin could not be uninstalled.', 'newspack' ) );
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
			return new WP_Error( 'newspack_plugin_already_installed', __( 'The plugin directory already exists.', 'newspack' ) );
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
			return new WP_Error( 'newspack_plugin_failed_install', $plugin_info->get_error_message() );
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
		$upgrader->init();

		$download = $upgrader->download_package( $plugin_url );
		if ( is_wp_error( $download ) ) {
			return new WP_Error( 'newspack_plugin_failed_install', $download->get_error_message() );
		}

		$working_dir = $upgrader->unpack_package( $download );
		if ( is_wp_error( $working_dir ) ) {
			return new WP_Error( 'newspack_plugin_failed_install', $working_dir->get_error_message() );
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
			return new WP_Error( 'newspack_plugin_failed_install', $result->get_error_message() );
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
		$path   = explode( '/', $key );
		$folder = current( $path );

		// Strip version info from key. (e.g. 'woocommerce-stripe-gateway-4.1.2' should just be 'woocommerce-stripe-gateway').
		$folder = preg_replace( '/[\-0-9\.]+$/', '', $folder );

		$plugins[ $folder ] = $key;
		return $plugins;
	}
}

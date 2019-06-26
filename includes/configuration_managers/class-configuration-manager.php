<?php
/**
 * Plugin configuration manager, abstract class.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;
defined( 'ABSPATH' ) || exit;

/**
 * Provide an interface for configuring and querying the configuration of Newspack-managed plugins.
 */
abstract class Configuration_Manager {
	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	protected $slug = '';

	/**
	 * Retrieve data for this plugin.
	 *
	 * @var object
	 */
	protected function get_plugin_data() {
		$managed_plugins = Plugin_Manager::get_managed_plugins();
		try {
			$plugin = $managed_plugins[ $this->slug ];
		} catch ( Exception $e ) {
			return new WP_Error( 'newspack_plugin_not_found', __( 'The plugin is not found.', 'newspack' ) );
		}
		return $plugin;
	}

	/**
	 * Determines whether the plugin is installed and activated.
	 *
	 * @return bool Plugin activation state.
	 */
	public function is_active() {
		$plugin = $this->get_plugin_data();
		$status = isset( $plugin['Status'] ) ? $plugin['Status'] : null;
		return 'active' === $status;
	}

	/**
	 * Determines whether the plugin is installed (but not necessarily activated);
	 *
	 * @return bool Plugin installation state.
	 */
	public function is_installed() {
		$plugin = $this->get_plugin_data();
		$status = isset( $plugin['Status'] ) ? $plugin['Status'] : null;
		return 'uninstalled' !== $status;
	}

	/**
	 * Option name to determine if plugin has ever been configured by Newspack.s
	 *
	 * @return string
	 */
	public function has_configured_option_key() {
		return 'newspack_has_configured_plugin_' . $this->slug;
	}

	/**
	 * Sets an option indicating that Newspack has configured this plugin at least once.
	 *
	 * @param bool $value Has plugin been configured.
	 * @return void
	 */
	public function set_newspack_has_configured( $value ) {
		update_option( $this->has_configured_option_key(), boolval( $value ) );
	}

	/**
	 * Determines whether the plugin is ready for use. This will mean different things for different plugins.
	 *
	 * @return bool Plugin ready state.
	 */
	public function is_configured() {
		return $this->is_active() && get_option( $this->has_configured_option_key() );
	}

	/**
	 * Configure the plugin. Meant to be called immediately after installation/activation.
	 *
	 * @return void
	 */
	abstract public function configure();

}

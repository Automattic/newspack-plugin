<?php
/**
 * Jetpack plugin configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Common functionality for admin wizards. Override this class.
 */
class Jetpack_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'jetpack';

	/**
	 * Get this wizard's name.
	 *
	 * @return string The wizard name.
	 */
	public function configure() {
		return true;
	}

	/**
	 * Is Jetpack installed and connected?
	 *
	 * @return bool Plugin ready state.
	 */
	public function is_configured() {
		if ( $this->is_active() && class_exists( 'Jetpack' ) && \Jetpack::is_active() ) {
			return true;
		}
		return false;
	}
}




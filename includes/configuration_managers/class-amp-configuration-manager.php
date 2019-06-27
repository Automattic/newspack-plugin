<?php
/**
 * AMP plugin configuration manager.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/configuration_managers/class-configuration-manager.php';

/**
 * Common functionality for admin wizards. Override this class.
 */
class AMP_Configuration_Manager extends Configuration_Manager {

	/**
	 * The slug of the plugin.
	 *
	 * @var string
	 */
	public $slug = 'amp';

	/**
	 * Get this wizard's name.
	 *
	 * @return string The wizard name.
	 */
	public function configure() {
		$active = $this->is_active();
		if ( ! $active || is_wp_error( $active ) ) {
			return $active;
		}
		if ( class_exists( 'AMP_Options_Manager' ) ) {
			\AMP_Options_Manager::update_option( 'theme_support', \AMP_Theme_Support::STANDARD_MODE_SLUG );
		}
		$this->set_newspack_has_configured( true );
		return true;
	}
}

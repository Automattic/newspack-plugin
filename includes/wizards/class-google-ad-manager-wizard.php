<?php
/**
 * Newspack's Google Ad Manager setup.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Google_Ad_Manager_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-google-ad-manager-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Google Ad Manager', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'An advanced ad inventory creation and management platform, allowing you to be specific about ad placements.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}

	/**
	 * Check whether SiteKit is installed and active.
	 *
	 * @return bool | WP_Error True on success, WP_Error on failure.
	 */
	protected function check_required_plugins_installed() {
		if ( ! is_defined( 'GOOGLESITEKIT_VERSION' ) ) {
			return new WP_Error(
				'newspack_missing_required_plugin',
				esc_html__( 'The Google SiteKit plugin is not installed and activated. Install and/or activate it to access this feature.', 'newspack' ),
				[
					'status' => 400,
					'level'  => 'fatal',
				]
			);
		}

		return true;
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-google-ad-manager-wizard',
			Newspack::plugin_url() . '/assets/dist/googleAdManager.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/googleAdManager.js' ),
			true
		);

		wp_register_style(
			'newspack-google-ad-manager-wizard',
			Newspack::plugin_url() . '/assets/dist/googleAdManager.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/googleAdManager.css' )
		);
		wp_style_add_data( 'newspack-google-ad-manager-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-google-ad-manager-wizard' );
	}
}

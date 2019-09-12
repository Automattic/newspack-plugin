<?php
/**
 * Newspack setup
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main Newspack Class.
 */
final class Newspack {

	/**
	 * The single instance of the class.
	 *
	 * @var Newspack
	 */
	protected static $_instance = null;

	/**
	 * Main Newspack Instance.
	 * Ensures only one instance of Newspack is loaded or can be loaded.
	 *
	 * @return Newspack - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	/**
	 * Newspack Constructor.
	 */
	public function __construct() {
		$this->define_constants();
		$this->includes();
		add_action( 'admin_menu', [ $this, 'remove_all_newspack_options' ], 1 );
	}

	/**
	 * Define WC Constants.
	 */
	private function define_constants() {
		define( 'NEWSPACK_VERSION', '0.0.1' );
		define( 'NEWSPACK_ABSPATH', dirname( NEWSPACK_PLUGIN_FILE ) . '/' );
	}

	/**
	 * Include required core files used in admin and on the frontend.
	 * e.g. include_once NEWSPACK_ABSPATH . 'includes/foo.php';
	 */
	private function includes() {
		include_once NEWSPACK_ABSPATH . 'includes/util.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-plugin-manager.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-admin-plugins-screen.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-api.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-profile.php';

		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-setup-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-dashboard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-components-demo.php';

		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-mailchimp-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-newsletter-block-wizard.php';

		/* Unified Wizards */
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-advertising-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-analytics-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-performance-wizard.php';
		include_once NEWSPACK_ABSPATH . '/includes/wizards/class-reader-revenue-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-syndication-wizard.php';
		include_once NEWSPACK_ABSPATH . '/includes/wizards/class-seo-wizard.php';

		include_once NEWSPACK_ABSPATH . 'includes/class-wizards.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-checklists.php';

		include_once NEWSPACK_ABSPATH . 'includes/class-handoff-banner.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-donations.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-pwa.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-amp-enhancements.php';

		include_once NEWSPACK_ABSPATH . 'includes/configuration_managers/class-configuration-managers.php';
	}

	/**
	 * Get the URL for the Newspack plugin directory.
	 *
	 * @return string URL
	 */
	public static function plugin_url() {
		return untrailingslashit( plugins_url( '/', NEWSPACK_PLUGIN_FILE ) );
	}

	/**
	 * Reset Newspack by removing all newspack prefixed options. Triggered by the query param reset_newspack_settings=1
	 */
	public function remove_all_newspack_options() {
		if ( filter_input( INPUT_GET, 'reset_newspack_settings', FILTER_SANITIZE_STRING ) === '1' ) {
			$all_options = wp_load_alloptions();
			foreach ( $all_options as $key => $value ) {
				if ( strpos( $key, 'newspack' ) === 0 || strpos( $key, '_newspack' ) === 0 ) {
					delete_option( $key );
				}
			}
		}
	}
}
Newspack::instance();

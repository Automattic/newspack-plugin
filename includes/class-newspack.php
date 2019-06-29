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
		include_once NEWSPACK_ABSPATH . '/includes/wizards/class-subscriptions-onboarding-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-subscriptions-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-google-adsense-wizard.php';
		include_once NEWSPACK_ABSPATH . 'includes/wizards/class-performance-wizard.php';

		include_once NEWSPACK_ABSPATH . 'includes/class-wizards.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-checklists.php';

		include_once NEWSPACK_ABSPATH . 'includes/class-handoff-banner.php';

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
}
Newspack::instance();

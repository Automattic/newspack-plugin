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
		$this->init_hooks();
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
		include_once NEWSPACK_ABSPATH . 'includes/class-plugin-manager.php';
		include_once NEWSPACK_ABSPATH . 'includes/class-api.php';
	}

	/**
	 * Hook into actions and filters.
	 * e.g. add_action( 'foo', 'bar' );
	 */
	private function init_hooks() {

	}
}
Newspack::instance();

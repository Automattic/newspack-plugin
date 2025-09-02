<?php
/**
 * Nextdoor integration for Newspack.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Nextdoor integration class.
 */
class Nextdoor {

	/**
	 * The single instance of the class.
	 *
	 * @var Nextdoor
	 */
	protected static $instance = null;

	/**
	 * Main Nextdoor Instance.
	 * Ensures only one instance of Nextdoor is loaded or can be loaded.
	 *
	 * @return Nextdoor - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', [ $this, 'init' ] );
	}

	/**
	 * Initialize the class.
	 */
	public function init() {
		// Only initialize if the module is active.
		if ( ! Optional_Modules::is_optional_module_active( 'nextdoor' ) ) {
			return;
		}

		// Add custom capability.
		add_action( 'admin_init', [ $this, 'add_nextdoor_capability' ] );
	}

	/**
	 * Add custom Nextdoor capability to appropriate roles.
	 */
	public function add_nextdoor_capability() {
		$roles_with_cap = [ 'administrator', 'editor' ];

		// Filter for roles that should have Nextdoor capabilities.
		$roles_with_cap = apply_filters( 'newspack_nextdoor_publish_cap_roles', $roles_with_cap );

		foreach ( $roles_with_cap as $role_name ) {
			$role = get_role( $role_name );
			if ( $role && ! $role->has_cap( 'np_nextdoor_publish_posts' ) ) {
				$role->add_cap( 'np_nextdoor_publish_posts' );
			}
		}
	}
}

Nextdoor::instance();

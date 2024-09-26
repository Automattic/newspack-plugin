<?php
/**
 * Network Settings Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Settings extends Wizard {

	use \Newspack\Wizards\Traits\Admin_Header;

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-network';

	/**
	 * High menu priority since we need Newspack Plugin to exist before we can modify it.
	 *
	 * @var int
	 */
	protected $menu_priority = 99;

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Include Network Utils
		// @TODO MOVE THIS include code back into THIS CLASS.  this is the only class that needs it.
		include_once 'class-network-utils.php';

		// Override parent hooks.
		add_action( 'admin_menu', [ Network_Utils::class, 'move_network_menu' ], $this->menu_priority );

		if ( $this->is_wizard_page() ) {
			$this->admin_header_init( [ 'title' => $this->get_name() ] );
		}
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Network / Settings', 'newspack-plugin' );
	}


	/**
	 * Add an admin page for the wizard to live on.
	 */
	// public function add_page() {

	// 	// @todo: remove these comments
	// 	return;

    //     // if site role isn't set or is "node".
    //     if ( false == Network_Utils::has_site_role() || Network_Utils::is_node() ) {
			
	// 		// Remove Network Plugin menu.
	// 		// remove_menu_page( $this->slug );

	// 		// Add parent menu.
	// 		// add_menu_page(
	// 		// 	$this->get_name(),
	// 		// 	Network_Utils::$parent_menu_title,
	// 		// 	$this->capability,
	// 		// 	$this->slug,
	// 		// 	'', // No rendering, let the Newspack Plugin render itself.
	// 		// 	Network_Utils::get_parent_menu_icon(),
	// 		// 	Network_Utils::$parent_menu_position
	// 		// );

    //     } else {

    //         // add_submenu_page(
    //         //     'edit.php?post_type=newspack_hub_nodes',
    //         //     $this->get_name(),
    //         //     __( 'Settings', 'newspack-plugin' ),
    //         //     $this->capability,
    //         //     $this->slug,
    //         //     array( '\Newspack_Network\Admin', 'render_page' ),
    //         // );
    
    //     }

    // }
}

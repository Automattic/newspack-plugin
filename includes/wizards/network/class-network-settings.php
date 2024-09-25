<?php
/**
 * Network Settings Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Settings extends Wizard {

	use Admin_Header;

	const PAGE_TITLE = 'Network / Settings';

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
		include_once 'class-network-utils.php';

		// Override parent hooks.
		add_action( 'admin_menu', [ $this, 'add_page' ], $this->menu_priority );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );

		if ( $this->is_wizard_page() ) {
			// Enqueue Wizards Admin Header.
			$this->admin_header_init(
				[
					'tabs'  => [], 
					'title' => $this->get_name(), 
				]
			);
		}
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( static::PAGE_TITLE, 'newspack-plugin' );
	}

	/**
	 * Load up common JS/CSS for wizards.
	 */
	public function enqueue_scripts_and_styles() {
		
		if ( false == $this->is_wizard_page() ) return;
		
		Newspack::load_common_assets();

	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {

        // if site role isn't set or is "node".
        if ( false == Network_Utils::has_site_role() || Network_Utils::is_node() ) {
			
			Network_Utils::move_network_menu();

			// Remove Network Plugin menu.
			// remove_menu_page( $this->slug );

			// Add parent menu.
			// add_menu_page(
			// 	$this->get_name(),
			// 	Network_Utils::$parent_menu_title,
			// 	$this->capability,
			// 	$this->slug,
			// 	'', // No rendering, let the Newspack Plugin render itself.
			// 	Network_Utils::get_parent_menu_icon(),
			// 	Network_Utils::$parent_menu_position
			// );

        } else {

            // add_submenu_page(
            //     'edit.php?post_type=newspack_hub_nodes',
            //     $this->get_name(),
            //     __( 'Settings', 'newspack-plugin' ),
            //     $this->capability,
            //     $this->slug,
            //     array( '\Newspack_Network\Admin', 'render_page' ),
            // );
    
        }

    }
}

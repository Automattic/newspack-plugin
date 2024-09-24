<?php
/**
 * Network Nodes Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Nodes extends Wizard {

	use Admin_Header;

	// const URL = 'admin.php?page=newspack-network';
    // const CPT_NAME = 'newspack_hub_nodes';
	

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	// protected $slug = 'newspack_hub_nodes';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Include Network Utils
		include_once 'class-network-utils.php';

		// @todo: can more of these hooks be moved into if( is_wizard_page() )??
		// review what needs to load or not on each page...

		add_action( 'admin_menu', [ $this, 'add_page' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
        add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

		if ( $this->is_wizard_page() ) {
			// Enqueue Wizards Admin Tabs script.
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
		return esc_html__( 'Network / Nodes', 'newspack-plugin' );
	}

	/**
	 * Check if we are on the CPT edit screen.
	 *
	 * @return bool true if browsing `edit.php?post_type=newspack_spnsrs_cpt`, false otherwise.
	 */
	public function is_wizard_page() {
		global $pagenow;
		if ( 'edit.php' !== $pagenow ) {
			return false;
		}
		return isset( $_GET['post_type'] ) && $_GET['post_type'] === $this->slug; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

    /**
	 * Update the CPT args.
	 *
	 * @param array $args The sponsor args.
	 * @param array $post_type The post type name.
	 * @return array Modified sponsor cpt args.
	 */
	public function update_sponsors_cpt_args( $args, $post_type ) {
		if ( $post_type === static::CPT_NAME ) {
			// Move the CPT under the Advertising menu. Necessary to hide default Sponsors CPT menu item.
			// $args['show_in_menu'] = static::PARENT_URL;
		}
		return $args;
	}



	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}
		Newspack::load_common_assets();
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {

		if ( false == class_exists( '\Newspack_Network\Admin' ) ) {
			return;
		}

        if ( false == method_exists( '\Newspack_Network\Admin', 'render_page' ) ) {
            return;
        }

		// @todo: also check render_page function exits on class / ronchambers

        // If Hub, this Wizard is the parent menu item.
        if( 'hub' === get_option( 'newspack_network_site_role', '' ) ) {

            // Parent menu page
            // add_menu_page(
            //     $this->get_name(),
            //     Network_Utils::$parent_menu_title,
            //     $this->capability,
            //     'rgcparent', //Network_Utils::get_parent_menu_slug(),
            //     array( $this, 'render_wizard' ),
            //     Network_Utils::get_parent_menu_icon(),
            //     Network_Utils::$parent_menu_position,
            // );

			// add_submenu_page(
			// 	'rgcparent',
			// 	__( 'my2title', 'newspack-plugin' ),
			// 	__( 'my2menu', 'newspack-plugin' ),
			// 	$this->capability,
			// 	'myrgcpage2',
			// 	array( $this, 'render_wizard' )
			// );
	


			add_menu_page(
				'page title 1',
				'mymenu1',
				$this->capability,
				'mypagekit',
			);

			add_submenu_page(
				'mypagekit',
				'my2title',
				'my2title2',
				$this->capability,
				'mypagekit',
				array( $this, 'myrender1' )
			);
	










        } else {

            add_submenu_page(
                $this->slug,
                __( 'Advertising / Display Ads', 'newspack-plugin' ),
                __( 'Display Ads', 'newspack-plugin' ),
                $this->capability,
                $this->slug,
                array( $this, 'render_wizard' )
            );
    
        }



    }

	public function myrender1(){
		echo "yes one";
	}

	public function myrender2(){
		echo "yes two";
	}

}

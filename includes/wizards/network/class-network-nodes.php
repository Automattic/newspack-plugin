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

	const PLUGIN_OVERRIDE = 'newspack-network/newspack-network.php';
	const URL = 'admin.php?page=newspack-network';
    const CPT_NAME = 'newspack_hub_nodes';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack_hub_nodes';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( static::PLUGIN_OVERRIDE ) ) {
			return;
		}

		// @todo: can more of these hooks be moved into if( is_wizard_page() )??
		// review what needs to load or not on each page...

		add_action( 'admin_menu', [ $this, 'add_page' ], 99 );
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
			$args['show_in_menu'] = static::PARENT_URL;
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

		// @todo fix blue tint / ronchambers
		
        $icon = 'data:image/svg+xml;base64,' . base64_encode( '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="1.5"/><path d="M12 4.36719C9.97145 5.3866 8.5 8.41883 8.5 12.0009C8.5 15.6603 10.0356 18.7459 12.1321 19.6979" stroke="white" stroke-width="1.5"/><path d="M12 4.3653C14.0286 5.38471 15.5 8.41694 15.5 11.9991C15.5 15.5812 14.0286 18.6134 12 19.6328" stroke="white" stroke-width="1.5"/><line x1="20" y1="14.5" x2="4" y2="14.5" stroke="white" stroke-width="1.5"/><line x1="4" y1="9.5" x2="20" y2="9.5" stroke="white" stroke-width="1.5"/></svg>' );

        // If Hub, this Wizard is the parent menu item.
        if( 'hub' === get_option( 'newspack_network_site_role', '' ) ) {

            // Parent menu page
            add_menu_page(
                $this->get_name(),
                'Network',
                $this->capability,
                'edit.php?post_type=newspack_hub_nodes',
                '',
                $icon,
                3.9
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
}

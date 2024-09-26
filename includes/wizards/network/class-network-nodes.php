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

	const CPT        = 'newspack_hub_nodes';
	const PAGE_TITLE = 'Network / Nodes';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Detecting all CPT page(s) is difficult (impossible?) prior to current_screen (?).
		// Move constructor logic to current_screen.
		add_action( 'current_screen', [ $this, 'current_screen' ] );

	}

	/**
	 * current_screen acting as this class's contructor.
	 *
	 * @return void
	 */
	public function current_screen() {

		// urls to detect: 
		// edit.php?post_type=newspack_hub_nodes
		// post-new.php?post_type=newspack_hub_nodes
		// post.php?post=139&action=edit (EDIT SCREEN)
		// Do logic inside admin_init.  This should be early enough in the hooks.

		global $current_screen;

		if( $current_screen->post_type !== static::CPT ) return;


		// Override parent hooks.
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );

		// Enqueue Wizards Admin Header.
		$this->admin_header_init(
			[
				'tabs'  => [], 
				'title' => $this->get_name(), 
			]
		);

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
		
		if ( false == $this->is_wizard_cpt_page() ) return;
		
		Newspack::load_common_assets();

	}

	/**
	 * Is Wizard admin CPT page being viewed.
	 *
	 * @return bool 
	 */
	public function is_wizard_cpt_page() {
		
		// global $pagenow;
		// echo $pagenow; 
		// exit();
		// if ( 'edit.php' !== $pagenow ) {
		// 	return false;
		// }
		// return isset( $_GET['post_type'] ) && $_GET['post_type'] === static::CPT_NAME; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		return filter_input( INPUT_GET, 'post_type', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) === static::CPT;
	}
}

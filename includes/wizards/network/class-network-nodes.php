<?php
/**
 * Network Nodes Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Nodes extends Wizard {

	use \Newspack\Wizards\Traits\Admin_Header;

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Detecting all CPT page(s) is difficult (impossible?) prior to current_screen (?).
		// edit.php?post_type=newspack_hub_nodes
		// post-new.php?post_type=newspack_hub_nodes
		// post.php?post=139&action=edit (EDIT SCREEN)
		// Move constructor logic into current_screen.
		add_action(
			'current_screen',
			function() {
			
				global $current_screen;

				// Return if not current CPT.
				if ( empty( $current_screen->post_type ) || 'newspack_hub_nodes' !== $current_screen->post_type ) {
					return;
				}
	
				// Enqueue Wizards Admin Header.
				$this->admin_header_init( [ 'title' => $this->get_name() ] );
			}
		);
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Network / Nodes', 'newspack-plugin' );
	}
}

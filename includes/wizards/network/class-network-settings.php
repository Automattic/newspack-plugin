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

		// Load on ALL Network pages. Use a high priority to load after Network Plugin itself loads.
		add_action( 'admin_menu', [ $this, 'admin_menu' ], $this->menu_priority );

		// Only continue for the current page.
		if ( false == $this->is_wizard_page() ) {
			return;
		}

		$this->admin_header_init( [ 'title' => $this->get_name() ] );

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
	 * Admin Menu hook to move Network admin menu higher into the Newspack area.
	 * Hook priority should be high so this code runs after Network plugin loads.
	 *
	 * @return void
	 */
	public function admin_menu() {

		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		global $menu;
		
		// Find the Newspack Network menu item in the admin menu.
		$network_key = null;
		foreach ( $menu as $k => $v ) {
			// Get the network key from the menu array.
			if ( $v[2] == 'newspack-network' ) {
				$network_key = $k;
				break;
			}
		}
		
		// Verify a key was found
		if( empty( $network_key ) ) {
			return;
		}
		
		// Adjust the network menu attributes.
		$menu[$network_key][0] = 'Network';
		$menu[$network_key][6] = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M12 3.3c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8s-4-8.8-8.8-8.8zm6.5 5.5h-2.6C15.4 7.3 14.8 6 14 5c2 .6 3.6 2 4.5 3.8zm.7 3.2c0 .6-.1 1.2-.2 1.8h-2.9c.1-.6.1-1.2.1-1.8s-.1-1.2-.1-1.8H19c.2.6.2 1.2.2 1.8zM12 18.7c-1-.7-1.8-1.9-2.3-3.5h4.6c-.5 1.6-1.3 2.9-2.3 3.5zm-2.6-4.9c-.1-.6-.1-1.1-.1-1.8 0-.6.1-1.2.1-1.8h5.2c.1.6.1 1.1.1 1.8s-.1 1.2-.1 1.8H9.4zM4.8 12c0-.6.1-1.2.2-1.8h2.9c-.1.6-.1 1.2-.1 1.8 0 .6.1 1.2.1 1.8H5c-.2-.6-.2-1.2-.2-1.8zM12 5.3c1 .7 1.8 1.9 2.3 3.5H9.7c.5-1.6 1.3-2.9 2.3-3.5zM10 5c-.8 1-1.4 2.3-1.8 3.8H5.5C6.4 7 8 5.6 10 5zM5.5 15.3h2.6c.4 1.5 1 2.8 1.8 3.7-1.8-.6-3.5-2-4.4-3.7zM14 19c.8-1 1.4-2.2 1.8-3.7h2.6C17.6 17 16 18.4 14 19z"></path></svg>');

		// Try to move the network item to a higher position near "Newspack".
		$new_position = '3.9';

		// if position/key collision, keep increasing increment.
		while( array_key_exists( $new_position, $menu ) ) {
			$new_position .= '9';
		}

		// Move network menu in the array.
		$menu[$new_position] = $menu[$network_key];
		unset( $menu[$network_key] );

	}
}

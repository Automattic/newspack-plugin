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
		// @todo fix blue tint and/or mouseover: ronchambers
		$menu[$network_key][6] = 'data:image/svg+xml;base64,' . base64_encode( '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="1.5"/><path d="M12 4.36719C9.97145 5.3866 8.5 8.41883 8.5 12.0009C8.5 15.6603 10.0356 18.7459 12.1321 19.6979" stroke="white" stroke-width="1.5"/><path d="M12 4.3653C14.0286 5.38471 15.5 8.41694 15.5 11.9991C15.5 15.5812 14.0286 18.6134 12 19.6328" stroke="white" stroke-width="1.5"/><line x1="20" y1="14.5" x2="4" y2="14.5" stroke="white" stroke-width="1.5"/><line x1="4" y1="9.5" x2="20" y2="9.5" stroke="white" stroke-width="1.5"/></svg>');
		
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

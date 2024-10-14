<?php
/**
 * Network (Plugin) Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Wizard extends Wizard {

	use \Newspack\Wizards\Traits\Admin_Header;

	/**
	 * Newspack Network plugin's Admin screen definitions (see below).
	 *
	 * @var array
	 */
	private $admin_screens = [];

	/**
	 * Screen type: admin page or post type.
	 *
	 * @var string
	 */
	private $screen_type = '';

	/**
	 * Constructor.
	 */
	public function __construct() {

		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}
		
		// Admin screens based on Newspack Network plugin's admin pages and post types.
		$this->admin_screens = [
			'page'      => [
				'newspack-network'                      => __( 'Network / Settings', 'newspack-plugin' ),
				'newspack-network-event-log'            => __( 'Network / Event Log', 'newspack-plugin' ),
				'newspack-network-membership-plans'     => __( 'Network / Membership Plans', 'newspack-plugin' ),
				'newspack-network-distributor-settings' => __( 'Network / Distributor Settings', 'newspack-plugin' ),
				'newspack-network-node'                 => __( 'Network / Node Settings', 'newspack-plugin' ),
			],
			'post_type' => [
				'newspack_hub_nodes'   => __( 'Network / Nodes', 'newspack-plugin' ),
				'np_hub_orders'        => __( 'Network / Orders', 'newspack-plugin' ),
				'np_hub_subscriptions' => __( 'Network / Subscriptions', 'newspack-plugin' ),
			],
		];

		// Move entire Network Menu. Use a high priority to load after Network Plugin itself loads.
		add_action( 'admin_menu', [ $this, 'move_menu' ], 99 );

		// Use current_screen for better detection of which admin screen we might be on.
		add_action( 'current_screen', [ $this, 'current_screen' ] );
	}

	/**
	 * Current screen callback to detect Network admin screens.
	 *
	 * @return void
	 */
	public function current_screen(): void {

		global $current_screen, $plugin_page;

		$set_and_show = function( $slug, $screen_type ) {
			// Set properties for use by get_name and is_wizard_page functions.
			$this->slug = $slug;
			$this->screen_type = $screen_type;

			// Add CSS to body.
			add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

			// Display Wizard Admin Header.
			$this->admin_header_init( [ 'title' => $this->get_name() ] );
		};

		// Check for admin page screen type.
		if ( isset( $this->admin_screens['page'][ $plugin_page ] ) ) {
			$set_and_show( $plugin_page, 'page' );
			return;
		}

		// Check for admin post type screen: Listings page and classic editor (add new + edit), but not block editor.
		if ( ! empty( $current_screen->post_type ) 
			&& ! empty( $this->admin_screens['post_type'][ $current_screen->post_type ] )
			&& false == $current_screen->is_block_editor ) {
			$set_and_show( $current_screen->post_type, 'post_type' );
			return;
		}
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html( $this->admin_screens[ $this->screen_type ][ $this->slug ] );
	}

	/**
	 * Is a Network admin page or post_type being viewed. Used by 'add_body_class' callback.
	 *
	 * @return bool Is current wizard page or not.
	 */
	public function is_wizard_page() {
		return isset( $this->admin_screens[ $this->screen_type ][ $this->slug ] );
	}

	/**
	 * Admin Menu hook to move entire Network admin menu higher into the Newspack area.
	 *
	 * @return void
	 */
	public function move_menu() {

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
		
		// Verify a key was found.
		if ( empty( $network_key ) ) {
			return;
		}
		
		// Adjust the network menu attributes.
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $network_key ][0] = 'Network';
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $network_key ][6] = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M12 3.3c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8s-4-8.8-8.8-8.8zm6.5 5.5h-2.6C15.4 7.3 14.8 6 14 5c2 .6 3.6 2 4.5 3.8zm.7 3.2c0 .6-.1 1.2-.2 1.8h-2.9c.1-.6.1-1.2.1-1.8s-.1-1.2-.1-1.8H19c.2.6.2 1.2.2 1.8zM12 18.7c-1-.7-1.8-1.9-2.3-3.5h4.6c-.5 1.6-1.3 2.9-2.3 3.5zm-2.6-4.9c-.1-.6-.1-1.1-.1-1.8 0-.6.1-1.2.1-1.8h5.2c.1.6.1 1.1.1 1.8s-.1 1.2-.1 1.8H9.4zM4.8 12c0-.6.1-1.2.2-1.8h2.9c-.1.6-.1 1.2-.1 1.8 0 .6.1 1.2.1 1.8H5c-.2-.6-.2-1.2-.2-1.8zM12 5.3c1 .7 1.8 1.9 2.3 3.5H9.7c.5-1.6 1.3-2.9 2.3-3.5zM10 5c-.8 1-1.4 2.3-1.8 3.8H5.5C6.4 7 8 5.6 10 5zM5.5 15.3h2.6c.4 1.5 1 2.8 1.8 3.7-1.8-.6-3.5-2-4.4-3.7zM14 19c.8-1 1.4-2.2 1.8-3.7h2.6C17.6 17 16 18.4 14 19z"></path></svg>' );

		// Try to move the network item to a higher position near "Newspack".
		$new_position = '3.9';

		// if position/key collision, keep increasing increment.
		while ( array_key_exists( $new_position, $menu ) ) {
			$new_position .= '9';
		}

		// Move network menu in the array.
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $new_position ] = $menu[ $network_key ];
		unset( $menu[ $network_key ] );
	}
}

<?php
/**
 * Network (Plugin) Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;
use Newspack_Network\Site_Role as Newspack_Network_Site_Role;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Wizard extends Wizard {

	use Admin_Header;

	/**
	 * Newspack Network plugin's Admin screen definitions (see constructor).
	 *
	 * @var array
	 */
	private $admin_screens = [];

	/**
	 * The parent menu item name.
	 *
	 * @var string
	 */
	public $parent_menu = 'newspack-network';

	/**
	 * Order relative to the Newspack Dashboard menu item.
	 *
	 * @var int
	 */
	public $menu_order = 5;

	/**
	 * Constructor.
	 */
	public function __construct() {

		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Admin screens based on Newspack Network plugin's admin pages and post types.
		$this->admin_screens = [
			// admin pages.
			'newspack-network'                      => __( 'Network / Settings', 'newspack-plugin' ),
			'newspack-network-event-log'            => __( 'Network / Event Log', 'newspack-plugin' ),
			'newspack-network-membership-plans'     => __( 'Network / Membership Plans', 'newspack-plugin' ),
			'newspack-network-distributor-settings' => __( 'Network / Distributor Settings', 'newspack-plugin' ),
			'newspack-network-node'                 => __( 'Network / Node Settings', 'newspack-plugin' ),
			// post types.
			'newspack_hub_nodes'                    => __( 'Network / Nodes', 'newspack-plugin' ),
			'np_hub_orders'                         => __( 'Network / Orders', 'newspack-plugin' ),
			'np_hub_subscriptions'                  => __( 'Network / Subscriptions', 'newspack-plugin' ),
		];

		// Update menu information.
		add_action( 'admin_menu', [ $this, 'modify_menu' ], 11 );

		// Display screen.
		if ( $this->is_wizard_page() ) {
			
			// Set active menu item for hidden screens.
			add_filter( 'submenu_file', [ $this, 'submenu_file' ] );

			// Add CSS to body.
			add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

			// Display header.
			$this->admin_header_init(
				[
					'title' => $this->get_name(),
					'tabs'  => $this->get_tabs(),
				]
			);
		}
	}

	/**
	 * Get the name for this current screen's wizard. Required by parent abstract.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html( $this->admin_screens[ $this->get_screen_slug() ] );
	}

	/**
	 * Get slug if we're currently viewing a Network screen.
	 * 
	 * @return string
	 */
	private function get_screen_slug() {
		
		global $pagenow;

		// @todo: set return value to static var to only run the code below once.

		$sanitized_page = sanitize_text_field( $_GET['page'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$sanitized_post_type = sanitize_text_field( $_GET['post_type'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// @todo Post type add new: post-new.php?post_type={post_type} / $current_screen->is_block_editor / stop css body class and admin header enqueue on block editor.
		// @todo Post type edit: post.php?post={id}&action=edit / $current_screen->is_block_editor / stop css body class and admin header enqueue on block editor.

		// Check for normal admin page screen: admin.php?page={page} .
		if ( 'admin.php' === $pagenow && isset( $this->admin_screens[ $sanitized_page ] ) ) {
			return $sanitized_page;
		}

		// Check for admin post type listing screen: edit.php?post_type={post_type} .
		if ( 'edit.php' === $pagenow && isset( $this->admin_screens[ $sanitized_post_type ] ) ) {
			return $sanitized_post_type;
		}

		return '';
	}

	/**
	 * Wrapper for Network Plugin's is_node/is_hub functions. Also called by Newspack_Dashboard.
	 */
	public static function get_site_role() {

		$is_node_function = [ Newspack_Network_Site_Role::class, 'is_node' ];
		if ( is_callable( $is_node_function ) && call_user_func( $is_node_function ) ) {
			return 'node';
		}

		$is_hub_function = [ Newspack_Network_Site_Role::class, 'is_hub' ];
		if ( is_callable( $is_hub_function ) && call_user_func( $is_hub_function ) ) {
			return 'hub';
		}

		return '';
	}

	/**
	 * Get admin header tabs (if exists) for current sreen.
	 *
	 * @return array Tabs. Default []
	 */
	private function get_tabs() {
		
		if ( in_array( $this->get_screen_slug(), [ 'newspack-network', 'newspack-network-node', 'newspack-network-distributor-settings' ], true ) ) {

			if ( '' === static::get_site_role() ) {
				return [];
			}

			$tabs = [
				[
					'textContent' => esc_html__( 'Site Role', 'newspack-plugin' ),
					'href'        => admin_url( 'admin.php?page=newspack-network' ),
				],
			];

			if ( 'hub' === static::get_site_role() ) {
				$tabs[] = [
					'textContent' => esc_html__( 'Distributor Settings', 'newspack-plugin' ),
					'href'        => admin_url( 'admin.php?page=newspack-network-distributor-settings' ),
				];
			} elseif ( 'node' === static::get_site_role() ) {
				$tabs[] = [
					'textContent' => esc_html__( 'Node Settings', 'newspack-plugin' ),
					'href'        => admin_url( 'admin.php?page=newspack-network-node' ),
				];
			}
			
			return $tabs;

		}

		return [];
	}

	/**
	 * Is a Network admin page or post_type being viewed. Needed for 'add_body_class' callback.
	 *
	 * @return bool Is current wizard page or not.
	 */
	public function is_wizard_page() {
		return isset( $this->admin_screens[ $this->get_screen_slug() ] );
	}

	/**
	 * Admin Menu hook to modify Network admin menu.
	 * 
	 * The code below will modify the global $menu instead of overriding the different add_menu_page/add_submenu_page functions.
	 * It's just a lot easier to use the code below because the Network Plugin has different submenu pages for each of the
	 * different Site Roles (none, is_node, is_hub). It became difficult to try to rebuild the menu/submenus based on the current
	 * Site Role, some of which have a first submenu item of an "admin page" for is_node, but "post type" for is_hub.
	 * 
	 * Page/Post Type loading order:
	 * 
	 *  No site role: MENU PARENT URL: admin.php?page=newspack-network
	 *    callback: class-admin.php add_admin_meun - doesn't display, most likely becasue wp is hiding single item menus
	 *    callback: node settings (node) add menu  - doesn't show because if is_node is false.
	 *  Node role: MENU PARENT URL: admin.php?page=newspack-network
	 *    callback: class-admin.php add_admin_meun - yes it displays
	 *    callback: node settings (node) add menu  - yes it displays
	 *  Hub role: MENU PARENT URL: edit.php?post_type=newspack_hub_nodes
	 *    callback: hub class nodes register post type - 'show_in_menu' is set to Network_Admin::PAGE_SLUG
	 *    callback: hub db subscriptions cpt           - 'show_in_menu' is set to Network_Admin::PAGE_SLUG
	 *    callback: hub db orders cpt                  - 'show_in_menu' is set to Network_Admin::PAGE_SLUG
	 *    callback: class-admin.php add_admin_meun     - yes it displays (this defines the parent $menu item but shows 4th)
	 *    callback: hub event log add menu             - yes it displays
	 *    callback: hub membership menu                - yes it displays
	 *    callback: hub districtubor settings add menu - yes it displays
	 * 
	 * @return void
	 */
	public function modify_menu() {
		global $menu;

		// Find the Newspack Network menu item in the admin menu.
		$network_key = null;
		foreach ( $menu as $k => $v ) {
			// Get the network key from the menu array.
			if ( $v[2] === $this->parent_menu ) {
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
		$menu[ $network_key ][0] = __( 'Network', 'newspack-plugin' );
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $network_key ][6] = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M12 3.3c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8s-4-8.8-8.8-8.8zm6.5 5.5h-2.6C15.4 7.3 14.8 6 14 5c2 .6 3.6 2 4.5 3.8zm.7 3.2c0 .6-.1 1.2-.2 1.8h-2.9c.1-.6.1-1.2.1-1.8s-.1-1.2-.1-1.8H19c.2.6.2 1.2.2 1.8zM12 18.7c-1-.7-1.8-1.9-2.3-3.5h4.6c-.5 1.6-1.3 2.9-2.3 3.5zm-2.6-4.9c-.1-.6-.1-1.1-.1-1.8 0-.6.1-1.2.1-1.8h5.2c.1.6.1 1.1.1 1.8s-.1 1.2-.1 1.8H9.4zM4.8 12c0-.6.1-1.2.2-1.8h2.9c-.1.6-.1 1.2-.1 1.8 0 .6.1 1.2.1 1.8H5c-.2-.6-.2-1.2-.2-1.8zM12 5.3c1 .7 1.8 1.9 2.3 3.5H9.7c.5-1.6 1.3-2.9 2.3-3.5zM10 5c-.8 1-1.4 2.3-1.8 3.8H5.5C6.4 7 8 5.6 10 5zM5.5 15.3h2.6c.4 1.5 1 2.8 1.8 3.7-1.8-.6-3.5-2-4.4-3.7zM14 19c.8-1 1.4-2.2 1.8-3.7h2.6C17.6 17 16 18.4 14 19z"></path></svg>' );
	}

	/**
	 * Submenu file filter. Used to determine active submenu items.
	 * 
	 * For admin pages return slug only.
	 * For admin post types return url: edit.php?post_type={post_type}
	 * 
	 * @param string $submenu_file Submenu file to be overridden.
	 * @return string
	 */
	public function submenu_file( $submenu_file ) {
		if ( 'newspack-network-distributor-settings' === filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) ) {
			return 'newspack-network';
		}
		return $submenu_file;
	}
}

<?php
/**
 * Network (Plugin) Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;
use Newspack_Network\Admin as Newspack_Network_Admin;
use Newspack_Network\Site_Role as Newspack_Network_Site_Role;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Wizard extends Wizard {

	use Admin_Header;

	/**
	 * Network plugin's Admin screen definitions (see constructor).
	 *
	 * @var array
	 */
	private $admin_screens = [];

	/**
	 * Primary slug for these wizard screens.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-network';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Define admin screens based on Newspack Network plugin's admin pages and post types.
		$this->admin_screens = [
			// Admin pages:
			'newspack-network'                      => __( 'Network / Site Role', 'newspack-plugin' ),
			'newspack-network-event-log'            => __( 'Network / Event Log', 'newspack-plugin' ),
			'newspack-network-membership-plans'     => __( 'Network / Membership Plans', 'newspack-plugin' ),
			'newspack-network-distributor-settings' => __( 'Network / Distributor Settings', 'newspack-plugin' ),
			'newspack-network-node'                 => __( 'Network / Node Settings', 'newspack-plugin' ),
			// Admin post types:
			'newspack_hub_nodes'                    => __( 'Network / Nodes', 'newspack-plugin' ),
			'np_hub_orders'                         => __( 'Network / Orders', 'newspack-plugin' ),
			'np_hub_subscriptions'                  => __( 'Network / Subscriptions', 'newspack-plugin' ),
		];

		parent::__construct();

		remove_action( 'admin_menu', [ Newspack_Network_Admin::class, 'add_admin_menu' ], 10 );

		// Other adjustments to menu/submenu (run on all pages since it changes the menu).
		// add_filter( 'admin_menu', [ $this, 'submenu_adjustments' ], $this->menu_priority );

		// Set active menu item for hidden screens.
		// add_filter( 'parent_file', [ $this, 'parent_file' ], $this->menu_priority );
		// add_filter( 'submenu_file', [ $this, 'submenu_file' ], $this->menu_priority );

		if( $this->is_wizard_page() ) {

			$this->admin_header_init([
				'title' => $this->get_name(),
				// 'tabs' => $this->get_tabs(),
			]);

		}
	}

	/**
	 * Add the Network menu page. Called from parent constructor 'admin_menu'.
	 */
	public function add_page() {

		if ( is_callable( [ Newspack_Network_Admin::class, 'render_page' ] ) ) {

			$page_suffix = add_menu_page(
				__( 'Network', 'newspack-plugin' ),
				__( 'Network', 'newspack-plugin' ),
				$this->capability,
				$this->slug,
				[ Newspack_Network_Admin::class, 'render_page' ],
				'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M12 3.3c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8s-4-8.8-8.8-8.8zm6.5 5.5h-2.6C15.4 7.3 14.8 6 14 5c2 .6 3.6 2 4.5 3.8zm.7 3.2c0 .6-.1 1.2-.2 1.8h-2.9c.1-.6.1-1.2.1-1.8s-.1-1.2-.1-1.8H19c.2.6.2 1.2.2 1.8zM12 18.7c-1-.7-1.8-1.9-2.3-3.5h4.6c-.5 1.6-1.3 2.9-2.3 3.5zm-2.6-4.9c-.1-.6-.1-1.1-.1-1.8 0-.6.1-1.2.1-1.8h5.2c.1.6.1 1.1.1 1.8s-.1 1.2-.1 1.8H9.4zM4.8 12c0-.6.1-1.2.2-1.8h2.9c-.1.6-.1 1.2-.1 1.8 0 .6.1 1.2.1 1.8H5c-.2-.6-.2-1.2-.2-1.8zM12 5.3c1 .7 1.8 1.9 2.3 3.5H9.7c.5-1.6 1.3-2.9 2.3-3.5zM10 5c-.8 1-1.4 2.3-1.8 3.8H5.5C6.4 7 8 5.6 10 5zM5.5 15.3h2.6c.4 1.5 1 2.8 1.8 3.7-1.8-.6-3.5-2-4.4-3.7zM14 19c.8-1 1.4-2.2 1.8-3.7h2.6C17.6 17 16 18.4 14 19z"></path></svg>' ),
				3.6
			);

			add_submenu_page(
				$this->slug,
				__( 'Settings', 'newspack-plugin' ), // Renamed from Site Role.
				__( 'Settings', 'newspack-plugin' ), // Renamed from Site Role.
				$this->capability,
				$this->slug,
				[ Newspack_Network_Admin::class, 'render_page' ]
			);

			add_action( 'load-' . $page_suffix, [ Newspack_Network_Admin::class, 'admin_init' ] );

		}

	}

	/**
	 * Enqueue scripts and styles. Called by parent constructor 'admin_enqueue_scripts'.
	 */
	public function enqueue_scripts_and_styles() {
		// Scripts and styles are enqueued by Admin Header.
		return;
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

		// Check for normal admin page screen: admin.php?page={page}
		if ( 'admin.php' === $pagenow && isset( $this->admin_screens[ $sanitized_page ] ) ) {
			return $sanitized_page;
		}

		// Check for admin post type listing screen: edit.php?post_type={post_type}
		if( 'edit.php' === $pagenow && isset( $this->admin_screens[ $sanitized_post_type ] ) ) {
			return $sanitized_post_type;
		}

		return '';
	}

	/**
	 * Wrapper for Network Plugin's is_node/is_hub functions.
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
			} else if ( 'node' === static::get_site_role() ) {
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
	 * Is a Network admin page or post_type being viewed. Needed for parent constructor => 'add_body_class' callback.
	 *
	 * @return bool Is current wizard page or not.
	 */
	public function is_wizard_page() {
		return isset( $this->admin_screens[ $this->get_screen_slug() ] );
	}

	/**
	 * Submenu adjustments for Network menu items.
	 *
	 * @return void
	 */
	public function submenu_adjustments() {

		global $submenu;

		if ( 'node' === static::get_site_role() ) {

			// 
			remove_submenu_page( $this->slug, 'newspack-network-node' );
			add_submenu_page(
				'', // No parent menu item, means its not on the menu.
				$this->admin_screens[ 'page' ][ 'newspack-network-node' ],
				$this->admin_screens[ 'page' ][ 'newspack-network-node' ],
				$this->capability,
				'newspack-network-node',
				[ \Newspack_Network\Node\Settings::class, 'render' ]
			);
	
		}

		if ( 'hub' === static::get_site_role() ) {

			remove_submenu_page( $this->slug, 'newspack-network-distributor-settings' );
			add_submenu_page(
				'', // No parent menu item, means its not on the menu.
				$this->admin_screens[ 'page' ][ 'newspack-network-distributor-settings' ],
				$this->admin_screens[ 'page' ][ 'newspack-network-distributor-settings' ],
				$this->capability,
				'newspack-network-distributor-settings',
				[ \Newspack_Network\Hub\Distributor_Settings::class, 'render' ]
			);
		}

		// Renaming.		
		if ( isset( $submenu[ $this->slug ] ) ) {
			// By reference.
			foreach ( $submenu[ $this->slug ] as &$item ) {
				if ( $item[0] === 'Site Role' ) {
					$item[0] = 'Settings';
				}
			}
		}
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
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'newspack-network-distributor-settings' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return 'newspack-network';
		}	
		return $submenu_file;
	}
}

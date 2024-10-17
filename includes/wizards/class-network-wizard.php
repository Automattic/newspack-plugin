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
	 * Priority setting for re-ordering admin submenu items after Network Plugin loaded.
	 *
	 * @var int.
	 */
	protected $menu_priority = 99;

	/**
	 * Constant value of parent menu slug.
	 * 
	 * @var string
	 */
	const PARENT_SLUG = 'newspack-network';

	/**
	 * Screen type: admin page or post type. Dynamicaly set based on current screen.
	 *
	 * @var string
	 */
	private $screen_type = '';

	/**
	 * Note: Dynamically set based on currently detected screen.
	 *
	 * @var string
	 */
	protected $slug = '';

	/**
	 * Constructor.
	 */
	public function __construct() {

		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}
		
		// Define admin screens based on Newspack Network plugin's admin pages and post types.
		$this->admin_screens = [
			'page'      => [
				'newspack-network'                      => __( 'Network / Site Role', 'newspack-plugin' ),
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


		// add_filter( 'add_menu_classes', function ( $menu ) {
		// 	$menu[6][4] = 'wp-has-submenu wp-has-current-submenu wp-menu-open menu-top toplevel_page_newspack-network menu-top-first';
		// 	error_log( print_r( $menu, true ) );
		// 	return $menu;
		// });


		

		// Move entire Network Menu. Use a high priority to load after Network Plugin itself loads.
		// This should fire for all admin screens, not just Network screens.
		add_action( 'admin_menu', [ $this, 'parent_menu_move' ], $this->menu_priority );

		// Other adjustments to menu/submenu (run on all pages since it changes the menu).
		add_filter( 'admin_menu', [ $this, 'submenu_adjustments' ], $this->menu_priority );

		// Below filters are used to determine active menu items.
		// add_filter( 'parent_file', [ $this, 'parent_file' ], $this->menu_priority );
		// add_filter( 'submenu_file', [ $this, 'submenu_file' ], $this->menu_priority );

		return;

		// Test for Screen now, instead of waiting for hooks (admin_menu >> admin_init >> current_screen).
		if( $this->detect_and_set_screen() ) {

			// Add CSS to body. ( calls is_wizard_page() ).
			add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

			// Enqueue Wizard Admin Header for this Screen.
			$this->admin_header_init([
				'title' => $this->get_name(),
				'tabs' => $this->get_tabs(),
			]);

		}
	}

	/**
	 * Detect if and which Network admin screen we're currently viewing.  Set values, otherwise false.
	 * 
	 * @return bool True if we're on a current Network admin screen.
	 */
	public function detect_and_set_screen(): bool {
		
		global $pagenow;

		// @todo Post type add new: post-new.php?post_type={post_type} / $current_screen->is_block_editor / stop css body class and admin header enqueue on block editor.
		// @todo Post type edit: post.php?post={id}&action=edit / $current_screen->is_block_editor / stop css body class and admin header enqueue on block editor.

		// Check for normal admin page screen: admin.php?page={page}
		if ( 'admin.php' === $pagenow ) {
			$sanitized_page = sanitize_text_field( $_GET['page'] ?? null ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( isset( $this->admin_screens['page'][ $sanitized_page ] ) ) {
				$this->slug = $sanitized_page;
				$this->screen_type = 'page';
				return true;
			}
		}

		// Check for admin post type listing screen: edit.php?post_type={post_type}
		if( 'edit.php' === $pagenow ) {
			$sanitized_post_type = sanitize_text_field( $_GET['post_type'] ?? null ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if( empty( $sanitized_post_type ) || empty( $this->admin_screens['post_type'][ $sanitized_post_type ] ) ) {
				return false;
			}
			$this->slug = $sanitized_post_type;
			$this->screen_type = 'post_type';
			return true;
		}

		return false;
	}

	/**
	 * Get the name for this current screen's wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html( $this->admin_screens[ $this->screen_type ][ $this->slug ] );
	}

	/**
	 * Get admin header tabs (if exists) for current sreen.
	 *
	 * @return array Tabs. Default []
	 */
	private function get_tabs() {
		
		if ( 'page' === $this->screen_type && in_array( $this->slug, [ 'newspack-network', 'newspack-network-node', 'newspack-network-distributor-settings' ], true ) ) {

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
	 * Wrapper for Network Plugin's is_node/is_hub functions.
	 */
	public static function get_site_role() {
	
		$is_node_function = [ '\Newspack_Network\Site_Role', 'is_node' ];
		if ( is_callable( $is_node_function ) && call_user_func( $is_node_function ) ) {
			return 'node';
		}

		$is_hub_function = [ '\Newspack_Network\Site_Role', 'is_hub' ];
		if ( is_callable( $is_hub_function ) && call_user_func( $is_hub_function ) ) {
			return 'hub';
		}

		return '';
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
	 * Parent file filter. Used to determine active menu items.
	 *
	 * @param string $parent_file Parent file to be overridden.
	 * @return string 
	 */
	public function parent_file( $parent_file ) {
		global $pagenow, $typenow;
		
		return 'newspack-network';
		
		// if ( in_array( $pagenow, [ 'post.php', 'post-new.php' ] ) && $typenow === static::CPT_NAME ) {
			// return 'edit.php?post_type=newspack_hub_nodes';
			
		// }
		
		// if ( isset( $_GET['page'] ) && $_GET['page'] === 'newspack-network-distributor-settings' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// @todo hub vs node: return 'admin.php?page=newspack-network';
			// return 'edit.php?post_type=newspack_hub_nodes';
		// }
	
		return $parent_file;
	}

	/**
	 * Admin Menu hook to move entire Network's parent admin menu higher into the Newspack area.
	 * 
	 * Format of global $menu:
	 * 
	 * $menu = [
	 *     ...
	 *     [4.42163] => [
	 *         0 => 'Newspack Network',
	 *         1 => 'manage_options',
	 *         2 => 'newspack-network',
	 *         ...
	 *     ],
	 *     ...
	 * ]
	 *
	 * @return void
	 */
	public function parent_menu_move() {

		global $menu;
		
		// Find the Newspack Network menu item in the admin menu (see format in doc block above).
		$current_index = null;
		foreach ( $menu as $index => $item ) {
			// Get the network key from the menu array.
			if ( $item[2] === static::PARENT_SLUG ) {
				$current_index = $index;
				break;
			}
		}
		
		// Verify a key was found.
		if ( empty( $current_index ) ) {
			return;
		}
		
		// Adjust the network menu attributes.
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $current_index ][0] = __( 'Network', 'newspack-plugin' );
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $current_index ][6] = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M12 3.3c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8s-4-8.8-8.8-8.8zm6.5 5.5h-2.6C15.4 7.3 14.8 6 14 5c2 .6 3.6 2 4.5 3.8zm.7 3.2c0 .6-.1 1.2-.2 1.8h-2.9c.1-.6.1-1.2.1-1.8s-.1-1.2-.1-1.8H19c.2.6.2 1.2.2 1.8zM12 18.7c-1-.7-1.8-1.9-2.3-3.5h4.6c-.5 1.6-1.3 2.9-2.3 3.5zm-2.6-4.9c-.1-.6-.1-1.1-.1-1.8 0-.6.1-1.2.1-1.8h5.2c.1.6.1 1.1.1 1.8s-.1 1.2-.1 1.8H9.4zM4.8 12c0-.6.1-1.2.2-1.8h2.9c-.1.6-.1 1.2-.1 1.8 0 .6.1 1.2.1 1.8H5c-.2-.6-.2-1.2-.2-1.8zM12 5.3c1 .7 1.8 1.9 2.3 3.5H9.7c.5-1.6 1.3-2.9 2.3-3.5zM10 5c-.8 1-1.4 2.3-1.8 3.8H5.5C6.4 7 8 5.6 10 5zM5.5 15.3h2.6c.4 1.5 1 2.8 1.8 3.7-1.8-.6-3.5-2-4.4-3.7zM14 19c.8-1 1.4-2.2 1.8-3.7h2.6C17.6 17 16 18.4 14 19z"></path></svg>' );

		// Try to move the network item to a higher position near "Newspack".
		$new_position = '3.9';

		// if position/key collision, keep increasing increment.
		while ( array_key_exists( $new_position, $menu ) ) {
			$new_position .= '9';
		}

		// Move network menu in the array.
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $new_position ] = $menu[ $current_index ];
		unset( $menu[ $current_index ] );
	}

	/**
	 * Submenu adjustments for Network menu items.
	 *
	 * @return void
	 */
	public function submenu_adjustments() {

		global $submenu;

		remove_submenu_page( static::PARENT_SLUG, 'newspack-network-distributor-settings' );
		add_submenu_page(
			'', // No parent menu item, means its not on the menu.
			'hi', // $this->admin_screens[ 'page' ][ 'newspack-network-distributor-settings' ],
			'ehllo',
			$this->capability,
			'newspack-network-distributor-settings',
			[ \Newspack_Network\Hub\Distributor_Settings::class, 'render' ]
		);


		// 

		// error_log( print_r( $submenu['newspack-network'], true ) );
		// error_log( print_r( $submenu[''], true ) );
		
		if ( isset( $submenu[ static::PARENT_SLUG ] ) ) {
			foreach ( $submenu[ static::PARENT_SLUG ] as $index => &$item ) {
				if ( $item[0] === 'Site Role' ) {
					$item[0] = 'Settings';
				}
				// else if ( $item[2] === 'newspack-network-distributor-settings' ) {
				// 	unset($submenu['newspack-network'][$index]);
				// }
			}
		}

		// $submenu[''][] = $item;

		// error_log( print_r( $submenu['newspack-network'], true ) );
		// error_log( print_r( $submenu[''], true ) );

	}

	/**
	 * Submenu file filter. Used to determine active submenu items.
	 *
	 * @param string $submenu_file Submenu file to be overridden.
	 * @return string
	 */
	public function submenu_file( $submenu_file ) {

		// Admin page:
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'newspack-network-distributor-settings' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return 'newspack-network';
		}

		// Admin post type:
		// return 'edit.php?post_type=np_hub_orders';
		// return 'edit.php?post_type=np_hub_subscriptions';
	
		return $submenu_file;
	}
}

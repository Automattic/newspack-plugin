<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;

use Newspack_Network\Admin as Newspack_Network_Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up general store info.
 */
class Network_Wizard extends Wizard {

	use Admin_Header;

	/**
	 * Screen type for admin pages.
	 *
	 * @var string
	 */ 
	const SCREEN_TYPE_PAGE = 'page';

	/**
	 * Screen type for admin post types.
	 *
	 * @var string
	 */
	const SCREEN_TYPE_POST_TYPE = 'post_type';

	/**
	 * Newspack Network plugin's Admin screen definitions (see below).
	 *
	 * @var array
	 */
	protected $admin_screens = [];

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-network';

	/**
	 * The current wp-admin post type.
	 *
	 * @var string
	 */
	protected $current_admin_post_type;

	/**
	 * The current wp-admin page.
	 *
	 * @var string
	 */
	protected $current_admin_page;

	/**
	 * Network_Nodes Constructor.
	 */
	public function __construct() {
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}
		parent::__construct();

		$this->current_admin_post_type = sanitize_text_field( $_GET['post_type'] ?? null ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$this->current_admin_page = sanitize_text_field( $_GET['page'] ?? null ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		remove_action( 'admin_menu', [ Newspack_Network_Admin::class, 'add_admin_menu' ], 10 );

		// Admin screens based on Newspack Network plugin's admin pages and post types.
		$this->admin_screens = [
			static::SCREEN_TYPE_PAGE      => [
				'newspack-network'                      => __( 'Network / Settings', 'newspack-plugin' ),
				'newspack-network-event-log'            => __( 'Network / Event Log', 'newspack-plugin' ),
				'newspack-network-membership-plans'     => __( 'Network / Membership Plans', 'newspack-plugin' ),
				'newspack-network-distributor-settings' => __( 'Network / Distributor Settings', 'newspack-plugin' ),
				'newspack-network-node'                 => __( 'Network / Node Settings', 'newspack-plugin' ),
			],
			static::SCREEN_TYPE_POST_TYPE => [
				'newspack_hub_nodes'   => __( 'Network / Nodes', 'newspack-plugin' ),
				'np_hub_orders'        => __( 'Network / Orders', 'newspack-plugin' ),
				'np_hub_subscriptions' => __( 'Network / Subscriptions', 'newspack-plugin' ),
			],
		];

		if ( $this->is_wizard_page() ) {
			$this->admin_header_init(
				[ 
					'title' => $this->get_page_name(), 
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
		return esc_html__( 'Network', 'newspack-plugin' );
	}

	/**
	 * Check if we are on an admin page.
	 *
	 * @return bool true if browsing ?page=, false otherwise.
	 */
	private function is_admin_page() {
		return isset( $this->admin_screens[ static::SCREEN_TYPE_PAGE ][ $this->current_admin_page ] );
	}

	/**
	 * Check if we are on an admin post type page.
	 *
	 * @return bool true if browsing ?post_type=, false otherwise.
	 */
	private function is_admin_post_type() {
		return isset( $this->admin_screens[ static::SCREEN_TYPE_POST_TYPE ][ $this->current_admin_post_type ] );
	}
	
	/**
	 * Derive the page name based on the current page or post_type parameter.
	 *
	 * @return string The page name.
	 */
	public function get_page_name() {

		// Is ?page=.
		if ( $this->is_admin_page() ) {
			return $this->admin_screens[ static::SCREEN_TYPE_PAGE ][ $this->current_admin_page ];
		}

		// Is ?post_type=.
		if ( $this->is_admin_post_type() ) {
			return $this->admin_screens[ static::SCREEN_TYPE_POST_TYPE ][ $this->current_admin_post_type ];
		}

		return $this->get_name();
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
	 * Check if we are on the Sponsors CPT edit screen.
	 *
	 * @return bool true if browsing `edit.php?post_type=newspack_hub_nodes`, false otherwise.
	 */
	public function is_wizard_page() {
		global $pagenow;
		if ( ! in_array( $pagenow, [ 'edit.php', 'admin.php' ], true ) ) {
			return false;
		}
		
		return $this->is_admin_page() || $this->is_admin_post_type();
	}

	/**
	 * Add the Network menu page.
	 */
	public function add_page() {
		if ( method_exists( Newspack_Network_Admin::class, 'render_page' ) ) {
			add_menu_page(
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
				__( 'Site Role', 'newspack-plugin' ),
				__( 'Site Role', 'newspack-plugin' ),
				$this->capability,
				$this->slug,
				[ Newspack_Network_Admin::class, 'render_page' ]
			);
		}
	}
}

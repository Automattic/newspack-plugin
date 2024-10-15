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
class Network extends Wizard {

	use Admin_Header;

	/**
	 * Newspack Network CPT names.
	 * 
	 * @var array
	 */
	const CPT_NAMES = [
		'newspack_hub_nodes',
		'np_hub_subscriptions',
		'np_hub_orders',
	];

	/**
	 * Refers to Newspack Network admin.php page slugs.
	 * 
	 * @var array
	 */
	const ADMIN_PAGE_SLUGS = [
		'newspack-network',
		'newspack-network-event-log',
		'newspack-network-membership-plans',
		'newspack-network-distributor-settings',
		'newspack-network-node',
	];

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
	 * Derive the page name based on the current page or post_type parameter.
	 *
	 * @return string The page name.
	 */
	public function get_page_name() {

		if ( in_array( $this->current_admin_post_type, static::CPT_NAMES, true ) ) {
			return match ( $this->current_admin_post_type ) { 
				'newspack_hub_nodes'   => __( 'Network / Node', 'newspack-plugin' ), 
				'np_hub_subscriptions' => __( 'Network / Subscriptions', 'newspack-plugin' ), 
				'np_hub_orders'        => __( 'Network / Orders', 'newspack-plugin' ),
				default                => $this->get_name(),
			};
		}

		if ( in_array( $this->current_admin_page, static::ADMIN_PAGE_SLUGS, true ) ) {
			return match ( $this->current_admin_page ) {
				'newspack-network'                      => __( 'Network / Site Role', 'newspack-plugin' ),
				'newspack-network-event-log'            => __( 'Network / Event Log', 'newspack-plugin' ),
				'newspack-network-membership-plans'     => __( 'Network / Membership Plans', 'newspack-plugin' ),
				'newspack-network-distributor-settings' => __( 'Network / Distributor Settings', 'newspack-plugin' ),
				'newspack-network-node'                 => __( 'Network / Node', 'newspack-plugin' ),
				default                                 => $this->get_name(),
			};
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
		
		// CPT page.
		if ( isset( $this->current_admin_post_type ) && in_array( $this->current_admin_post_type, static::CPT_NAMES, true ) ) {
			return true;
		}
		if ( isset( $this->current_admin_page ) && in_array( $this->current_admin_page, static::ADMIN_PAGE_SLUGS, true ) ) {
			return true;
		}
		return false;
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
				array( Newspack_Network_Admin::class, 'render_page' ),
				'dashicons-admin-site-alt3', // Not correct, must be inline SVG.
				3.6
			);
			add_submenu_page(
				$this->slug,
				__( 'Site Role', 'newspack-plugin' ),
				__( 'Site Role', 'newspack-plugin' ),
				$this->capability,
				$this->slug,
				array( Newspack_Network_Admin::class, 'render_page' )
			);
		}
	}
}

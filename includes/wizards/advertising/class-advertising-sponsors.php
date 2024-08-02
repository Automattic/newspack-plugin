<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack_Sponsors\Settings;
use Newspack\Wizards\Traits\Admin_Tabs;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up general store info.
 */
class Advertising_Sponsors extends Wizard {

	use Admin_Tabs;

	/**
	 * Newspack Sponsors CPT name.
	 * 
	 * @var string
	 */
	const NEWSPACK_SPONSORS_CPT = 'newspack_spnsrs_cpt';

	/**
	 * Sponsors CPT list path.
	 * 
	 * @var string
	 */
	const SPONSORS_EDIT_PAGE = 'edit.php?post_type=newspack_spnsrs_cpt';

	/** 
	 * Advertising Page path.
	 * 
	 * @var string
	 */
	const ADVERTISING_PAGE = 'admin.php?page=advertising-display-ads';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'advertising-sponsors';


	/**
	 * Parent Wizard slug
	 *
	 * @var string
	 */
	protected $parent_slug = 'advertising-display-ads';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * High menu priority since we need core registrations to exist before we can modify them.
	 *
	 * @var int
	 */
	protected $menu_priority = 99;

	/**
	 * Advertising_Sponsors Constructor.
	 */
	public function __construct() {
		if ( ! is_plugin_active( 'newspack-sponsors/newspack-sponsors.php' ) ) {
			return;
		}
		parent::__construct();

		add_action( 'admin_menu', [ $this, 'move_sponsors_cpt_menu' ] );
		add_action( 'register_post_type_args', [ $this, 'update_sponsors_cpt_args' ], 10, 2 );

		// Below filters are used to determine active menu items.
		add_filter( 'parent_file', [ $this, 'parent_file' ] );
		add_filter( 'submenu_file', [ $this, 'submenu_file' ] );

		if ( $this->is_wizard_page() ) {
			// Enqueue Wizards Admin Tabs script.
			$this->enqueue_admin_tabs(
				[
					'tabs'  => [
						[
							'textContent' => esc_html__( 'All Sponsors', 'newspack-plugin' ),
							'href'        => admin_url( static::SPONSORS_EDIT_PAGE ),
						],
						[
							'textContent' => esc_html__( 'Settings', 'newspack-plugin' ),
							'href'        => admin_url( static::SPONSORS_EDIT_PAGE . '&page=newspack-sponsors-settings-admin' ),
						],
					], 
					'title' => $this->get_name(), 
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
		return esc_html__( 'Advertising / Sponsors', 'newspack-plugin' );
	}

	/**
	 * Check if we are on the Sponsors CPT edit screen.
	 *
	 * @return bool true if browsing `edit.php?post_type=newspack_spnsrs_cpt`, false otherwise.
	 */
	public function is_wizard_page() {
		global $pagenow;
		if ( 'edit.php' !== $pagenow ) {
			return false;
		}
		return isset( $_GET['post_type'] ) && $_GET['post_type'] === static::NEWSPACK_SPONSORS_CPT; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}
		Newspack::load_common_assets();
		wp_register_style(
			'advertising-display-ads',
			Newspack::plugin_url() . '/dist/billboard.css',
			$this->get_style_dependencies(),
			NEWSPACK_PLUGIN_VERSION
		);
		wp_style_add_data( 'advertising-display-ads', 'rtl', 'replace' );
		wp_enqueue_style( 'advertising-display-ads' );
	}

	/**
	 * Move Sponsors CPT menu item under the ($) Advertising menu.
	 */
	public function move_sponsors_cpt_menu() {
		global $submenu;
		if ( isset( $submenu[ $this->parent_slug ] ) ) {
			$submenu[ $this->parent_slug ][] = array( // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				__( 'Sponsors', 'newspack-plugin' ),
				'manage_options',
				static::SPONSORS_EDIT_PAGE,
			);
		}

		// Register Settings page.
		add_submenu_page(
			null, // No parent menu item, means its not on the menu.
			__( 'Newspack Sponsors: Site-Wide Settings', 'newspack-sponsors' ),
			__( 'Settings', 'newspack-sponsors' ),
			'manage_options',
			'newspack-sponsors-settings-admin',
			[ Settings::class, 'create_admin_page' ]
		);
	}

	/**
	 * Update the Sponsor CPT args.
	 *
	 * @param array $args The sponsor args.
	 * @param array $post_type The post type name.
	 * @return array Modified sponsor cpt args.
	 */
	public function update_sponsors_cpt_args( $args, $post_type ) {
		if ( $post_type === static::NEWSPACK_SPONSORS_CPT ) {
			// Move the CPT under the Advertising menu. Necessary to hide default Sponsors CPT menu item.
			$args['show_in_menu'] = static::ADVERTISING_PAGE;
		}
		return $args;
	}

	/**
	 * Parent file filter. Used to determine active menu items.
	 *
	 * @param string $parent_file Parent file to be overridden.
	 * @return string 
	 */
	public function parent_file( $parent_file ) {
		global $pagenow, $typenow;

		if ( in_array( $pagenow, [ 'post.php', 'post-new.php' ] ) && $typenow === static::NEWSPACK_SPONSORS_CPT ) {
			return 'advertising-display-ads';
		}
		
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'newspack-sponsors-settings-admin' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return static::ADVERTISING_PAGE;
		}
	
		return $parent_file;
	}

	/**
	 * Submenu file filter. Used to determine active submenu items.
	 *
	 * @param string $submenu_file Submenu file to be overridden.
	 * @return string
	 */
	public function submenu_file( $submenu_file ) {
		if ( isset( $_GET['page'] ) && $_GET['page'] === 'newspack-sponsors-settings-admin' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return static::SPONSORS_EDIT_PAGE;
		}
	
		return $submenu_file;
	}
}

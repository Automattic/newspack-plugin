<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Tabs;
use Newspack_Sponsors\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up general store info.
 */
class Advertising_Sponsors extends Wizard {

	use Admin_Tabs;

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
		parent::__construct();

		add_action( 'admin_menu', [ $this, 'move_sponsors_cpt_menu' ] );
		add_action( 'register_post_type_args', [ $this, 'update_sponsors_cpt_args' ], 10, 2 );

		add_filter(
			'admin_page_newspack-sponsors-settings-admin',
			function( $t, $e = '' ) {
				$stop = true;
				return $t;
			},
			10,
			2 
		);

		if ( $this->is_edit_screen() ) {
			// Enqueue Wizards Admin Tabs script.
			$this->enqueue_admin_tabs(
				[
					[
						'textContent' => esc_html__( 'All Sponsors', 'newspack' ),
						'href'        => admin_url( 'edit.php?post_type=newspack_spnsrs_cpt' ),
					],
					[
						'textContent' => esc_html__( 'Settings', 'newspack' ),
						'href'        => admin_url( 'edit.php?post_type=newspack_spnsrs_cpt&page=newspack-sponsors-settings-admin' ),
					],
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
		return esc_html__( 'Sponsors', 'newspack' );
	}

	/**
	 * Check if we are on the Sponsors CPT edit screen.
	 *
	 * @return bool true if browsing `edit.php?post_type=newspack_spnsrs_cpt`, false otherwise.
	 */
	private function is_edit_screen() {
		global $pagenow;
		if ( 'edit.php' !== $pagenow ) {
			return false;
		}
		return isset( $_GET['post_type'] ) && 'newspack_spnsrs_cpt' === $_GET['post_type']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_edit_screen() ) {
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
				__( 'Sponsors', 'textdomain' ),
				'manage_options',
				'edit.php?post_type=newspack_spnsrs_cpt',
			);
		}

		// Register Settings.
		add_submenu_page(
			null, // No parent menu.
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
		if ( 'newspack_spnsrs_cpt' === $post_type ) {
			// Move the CPT under the Advertising menu. Necessary to hide default Sponsors CPT menu item.
			$args['show_in_menu'] = 'admin.php?page=advertising-display-ads';
		}
		return $args;
	}
}

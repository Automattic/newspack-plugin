<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack_Sponsors\Settings as Newspack_Sponsors_Settings;
use Newspack\Wizards\Traits\Admin_Header;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up general store info.
 */
class Advertising_Sponsors extends Wizard {

	use Admin_Header;

	/**
	 * Newspack Sponsors CPT name.
	 *
	 * @var string
	 */
	const CPT_NAME = 'newspack_spnsrs_cpt';

	/**
	 * Sponsors CPT list path.
	 *
	 * @var string
	 */
	const CPT_URL = 'edit.php?post_type=newspack_spnsrs_cpt';

	/**
	 * Advertising Page slug.
	 *
	 * @var string
	 */
	const PARENT_SLUG = 'advertising-display-ads';

	/**
	 * Advertising Page path.
	 *
	 * @var string
	 */
	const PARENT_URL = 'admin.php?page=advertising-display-ads';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Advertising_Sponsors Constructor.
	 */
	public function __construct() {
		if ( ! is_plugin_active( 'newspack-sponsors/newspack-sponsors.php' ) ) {
			return;
		}

		// Move Sponsors CPT under Advertising menu.
		add_action( 'register_post_type_args', [ $this, 'update_sponsors_cpt_args' ], 10, 2 );

		// Move Sponsors Settings page (after Sponsors Plugin loads - set priority > 10 ).
		add_action( 'admin_menu', [ $this, 'move_sponsors_settings_menu' ], 11 );

		if ( $this->is_wizard_page() ) {

			// Below filters are used to determine active menu items.
			add_filter( 'parent_file', [ $this, 'parent_file' ] );
			add_filter( 'submenu_file', [ $this, 'submenu_file' ] );

			// Add CSS classes by calling parent add_body_class() .
			add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

			// Initialize Wizards Admin Header.
			$this->admin_header_init(
				[
					'tabs'  => [
						[
							'textContent' => esc_html__( 'All Sponsors', 'newspack-plugin' ),
							'href'        => admin_url( static::CPT_URL ),
						],
						[
							'textContent' => esc_html__( 'Settings', 'newspack-plugin' ),
							'href'        => admin_url( static::CPT_URL . '&page=newspack-sponsors-settings-admin' ),
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
		return isset( $_GET['post_type'] ) && $_GET['post_type'] === static::CPT_NAME; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * Move the Sponsors Settings menu location.
	 */
	public function move_sponsors_settings_menu() {

		// Remove the Settings page that was added by Sponsors Plugin.
		remove_submenu_page( static::CPT_URL, 'newspack-sponsors-settings-admin' );

		// Re-add the Settings page as hidden if we're on the CPT screen.
		if ( $this->is_wizard_page() ) {

			add_submenu_page(
				'', // No parent menu item, means its not on the menu.
				__( 'Newspack Sponsors: Site-Wide Settings', 'newspack-plugin' ),
				__( 'Settings', 'newspack-plugin' ),
				$this->capability,
				'newspack-sponsors-settings-admin',
				[ Newspack_Sponsors_Settings::class, 'create_admin_page' ]
			);

		}
	}

	/**
	 * Update the Sponsor CPT args.
	 *
	 * @param array $args The sponsor args.
	 * @param array $post_type The post type name.
	 * @return array Modified sponsor cpt args.
	 */
	public function update_sponsors_cpt_args( $args, $post_type ) {
		if ( $post_type === static::CPT_NAME ) {
			// Move the CPT under the Advertising menu. Necessary to hide default Sponsors CPT menu item.
			$args['show_in_menu'] = static::PARENT_SLUG;
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

		if ( in_array( $pagenow, [ 'post.php', 'post-new.php' ] ) && $typenow === static::CPT_NAME ) {
			return static::PARENT_SLUG;
		}

		if ( isset( $_GET['page'] ) && $_GET['page'] === 'newspack-sponsors-settings-admin' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return static::PARENT_URL;
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
			return static::CPT_URL;
		}

		return $submenu_file;
	}
}

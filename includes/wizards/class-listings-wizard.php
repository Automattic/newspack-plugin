<?php
/**
 * Listings (Plugin) Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;
use Newspack_Listings\Core as Newspack_Listings_Core;
use Newspack_Listings\Settings as Newspack_Listings_Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Listings_Wizard extends Wizard {

	use Admin_Header;

	/**
	 * Listings plugin's Admin screen definitions (see constructor).
	 *
	 * @var array
	 */
	private $admin_screens = [];

	/**
	 * Must be run after Listings Plugin.
	 *
	 * @var int.
	 */
	protected $menu_priority = 11;

	/**
	 * Primary slug for these wizard screens.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-listings';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-listings/newspack-listings.php' ) ) {
			return;
		}

		// Define admin screens based on Newspack Listings plugin's admin pages and post types.
		$this->admin_screens = [
			// Admin post types:
			'newspack_lst_event'               => __( 'Listings / Events', 'newspack-plugin' ),
			'newspack_lst_generic'             => __( 'Listings / Generic Listings', 'newspack-plugin' ),
			'newspack_lst_mktplce'             => __( 'Listings / Marketplace Listings', 'newspack-plugin' ),
			'newspack_lst_place'               => __( 'Listings / Places', 'newspack-plugin' ),
			// Admin pages:
			'newspack-listings-settings-admin' => __( 'Listings / Settings', 'newspack-plugin' ),
		];

		// Remove Listings plugin's menu setup.
		remove_action( 'admin_menu', [ Newspack_Listings_Core::class, 'add_plugin_page' ] );

		// Hooks: 'admin_menu':'add_page', 'admin_enqueue_scripts':'enqueue_scripts_and_styles', 'admin_body_class':'add_body_class'.
		parent::__construct();

		// Display screen.
		if( $this->is_wizard_page() ) {

			$this->admin_header_init([
				'title' => $this->get_name(),
			]);

		}
	}

	/**
	 * Add the Listings menu page. Called from parent constructor 'admin_menu'.
	 * 
	 * Replaces Listings Plugin's 'admin_menu' action => Newspack_Listings\Core => 'add_plugin_page'
	 */
	public function add_page() {

		// Top-level menu item.
		add_menu_page(
			__( 'Listings', 'newspack-plugin'),
			__( 'Listings', 'newspack-plugin'),
			'edit_posts', // Copied from Listings plugin...see docblock note above.
			$this->slug,
			'',
			'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M18 5.5H6a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-.5-.5ZM6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm1 5h1.5v1.5H7V9Zm1.5 4.5H7V15h1.5v-1.5ZM10 9h7v1.5h-7V9Zm7 4.5h-7V15h7v-1.5Z"></path></svg>'),
			3.4
		);

        if ( is_callable( [ Newspack_Listings_Settings::class, 'create_admin_page' ] ) ) {
			
			// Settings menu link.
			add_submenu_page(
				$this->slug,
				$this->admin_screens['newspack-listings-settings-admin'],
				__( 'Settings', 'newspack-plugin' ),
				$this->capability,
				'newspack-listings-settings-admin',
				[ Newspack_Listings_Settings::class, 'create_admin_page' ]
			);

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
	 * Get slug if we're currently viewing a Listings screen.
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
	 * Is a Listings admin page or post_type being viewed. Needed for parent constructor => 'add_body_class' callback.
	 *
	 * @return bool Is current wizard page or not.
	 */
	public function is_wizard_page() {
		return isset( $this->admin_screens[ $this->get_screen_slug() ] );
	}

}

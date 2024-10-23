<?php
/**
 * Newsletters (Plugin) Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;
use Newspack_Newsletters;
use Newspack_Newsletters_Ads;
use Newspack_Newsletters_Settings;
use Newspack_Newsletters\Tracking\Admin as Newspack_Newsletters_Tracking_Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Newsletters_Wizard extends Wizard {

	use Admin_Header;

	/**
	 * Newsletters plugin's Admin screen definitions (see constructor).
	 *
	 * @var array
	 */
	private $admin_screens = [];

	/**
	 * Must be run after Newsletters Plugin.
	 *
	 * @var int.
	 */
	protected $menu_priority = 11;

	/**
	 * Primary slug for these wizard screens.
	 *
	 * @var string
	 */
	// protected $slug = 'newspack_nl_cpt';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-newsletters/newspack-newsletters.php' ) ) {
			return;
		}

		// Define admin screens based on Newspack Newsletters plugin's admin pages and post types.
		$this->admin_screens = [

			// Admin pages:
			'newspack-newsletters-settings-admin' => __( 'Newsletters / Settings', 'newspack-plugin' ),
			'newspack-newsletters-tracking'       => __( 'Newsletters / Settings', 'newspack-plugin' ),

			// Admin post types:
			'newspack_nl_cpt'                     => __( 'Newsletters / All Newsletters', 'newspack-plugin' ),
			'newspack_nl_ads_cpt'                 => __( 'Newsletters / Advertising', 'newspack-plugin' ),
			
			// Admin taxonomies:
			'newspack_nl_advertiser'              => __( 'Newsletters / Advertising', 'newspack-plugin' ),

		];

		// Menu removals.
		remove_action( 'admin_menu', [ Newspack_Newsletters_Ads::class, 'add_ads_page' ] );
		remove_action( 'admin_menu', [ Newspack_Newsletters_Settings::class, 'add_plugin_page' ] );
		remove_action( 'admin_menu', [ Newspack_Newsletters_Tracking_Admin::class, 'add_settings_page' ] );

		// Hooks: 'admin_menu':'add_page', 'admin_enqueue_scripts':'enqueue_scripts_and_styles', 'admin_body_class':'add_body_class'.
		parent::__construct();

		// Adjust post types.
		add_action( 'registered_post_type', [ $this, 'registered_post_type_newsletters' ] );
		
		// Adjust taxonomies.
		add_action( 'registered_taxonomy', [ $this, 'registered_taxonomy_advertiser' ] );
		
		// Display screen.
		if( $this->is_wizard_page() ) {

			// Set active menu item for hidden screens.
			add_filter( 'submenu_file', [ $this, 'submenu_file' ] );

			// Remove Newsletters branding (blue banner bar) from all screens.
			remove_action( 'admin_enqueue_scripts', [ Newspack_Newsletters::class, 'branding_scripts' ] );

			// Add the admin header.
			$this->admin_header_init([
				'title' => $this->get_name(),
				'tabs' => $this->get_tabs(),
			]);

		}
	}

	/**
	 * Adjusts the Newsletters menu. Called from parent constructor 'admin_menu'.
	 * 
	 */
	public function add_page() {
		
		// Move the entire Newsletters CPT menu.
		$this->move_cpt_menu();

		// Remove "Add New" menu item.
		remove_submenu_page('edit.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT, 'post-new.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT );

		// Remove catetory and tags. For remove_submenu_page() to match (===) on submenu slug: "&" in urls need be replaced with "&amp;".
		remove_submenu_page('edit.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT, 'edit-tags.php?taxonomy=category&amp;post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT );
		remove_submenu_page('edit.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT, 'edit-tags.php?taxonomy=post_tag&amp;post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT );

		// Re-add Ads (Advertising) item with updated title. ( See 'remove_action' above. See Newsletters Plugin: Newspack_Newsletters_Ads > 'add_ads_page' )
		add_submenu_page(
			'edit.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT,
			__( 'Newsletters Advertising', 'newspack-plugin' ),
			__( 'Advertising', 'newspack-plugin' ),
			'edit_others_posts', // As defined in original callback.
			'/edit.php?post_type=' . Newspack_Newsletters_Ads::CPT,
			null, // As defined in original callback.
			2 // As defined in original callback.
		);

		// Re-add Settings page. (See remove_action above.  See Newsletters Plugin: Newspack_Newsletters_Settings > 'add_plugin_page'.
		if ( is_callable( [ Newspack_Newsletters_Settings::class, 'create_admin_page' ] ) ) {
			add_submenu_page(
				'edit.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT,
				esc_html__( 'Newsletters Settings', 'newspack-plugin' ),
				esc_html__( 'Settings', 'newspack-plugin' ),
				'manage_options', // As defined in original callback.
				'newspack-newsletters-settings-admin',
				[ Newspack_Newsletters_Settings::class, 'create_admin_page' ]
			);
		}

		// Re-add Tracking page. ( See remove_action above.  See Newsletters Plugin: Newspack_Newsletters\Tracking\Admin > 'add_settings_page'.
		if ( is_callable( [ Newspack_Newsletters_Tracking_Admin::class, 'render_settings_page' ] ) ) {
						
			$tracking_title = esc_html__( 'Newsletters Tracking Options', 'newspack-plugin' );
			$tracking_hook = add_submenu_page(
				'',
				$tracking_title,
				esc_html__( 'Tracking', 'newspack-plugin' ),
				'manage_options', // As defined in original callback.
				'newspack-newsletters-tracking',
				[ Newspack_Newsletters_Tracking_Admin::class, 'render_settings_page' ]
			);

			// In cases where the $submenu hidden item array ( $submenu[''] = array of hidden submenu items ) is defined after the parent_slug's
			// item array ( $submenu['post type url or menu-slug'] = array of submenu items ), the HTML Title will not be set and a debug.log
			// deprecated notice will be written: 
			//     PHP Deprecated:  strip_tags(): Passing null ... is deprecated in wp-admin/admin-header.php on line 36
			// If the hidden array is defined before the parent slug array, then the HTML Title is shown and no debug.log notice.
			// To avoid this issue completely, so we don't need to worry about where things are in the $submenu array, we'll proactivally
			// set the title here just in case.
			add_action( "load-{$tracking_hook}", fn() => $GLOBALS['title'] = $tracking_title );
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
	 * Get slug if we're currently viewing a Newsletters screen.
	 * 
	 * @return string
	 */
	private function get_screen_slug() {
		
		global $pagenow;

		// @todo: set return value to static var to only run the code below once.

		$sanitized_page      = sanitize_text_field( $_GET['page'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$sanitized_post_type = sanitize_text_field( $_GET['post_type'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$sanitized_taxonomy  = sanitize_text_field( $_GET['taxonomy'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// @todo Post type add new: post-new.php?post_type={post_type} / $current_screen->is_block_editor / stop css body class and admin header enqueue on block editor.
		// @todo Post type edit: post.php?post={id}&action=edit / $current_screen->is_block_editor / stop css body class and admin header enqueue on block editor.

		// Check for normal admin page screen: admin.php?page={page}
		if ( 'admin.php' === $pagenow && isset( $this->admin_screens[ $sanitized_page ] ) ) {
			return $sanitized_page;
		}

		// Check for edit.php.
		if( 'edit.php' === $pagenow ) {

			// Post type must exist.
			if ( empty( $this->admin_screens[ $sanitized_post_type ] ) ) {
				return '';
			}

			// Post Type with page: edit.php?post_type={post_type}&page={page}
			if ( isset( $this->admin_screens[ $sanitized_page ] ) ) {
				return $sanitized_page;
			}

			// Post type list screen: edit.php?post_type={post_type}
			return $sanitized_post_type;

		}

		// Check for taxonomy list: edit-tags.php?taxonomy={taxonomy}&post_type={post_type}
		if( 'edit-tags.php' === $pagenow && isset( $this->admin_screens[ $sanitized_post_type ] ) && isset( $this->admin_screens[ $sanitized_taxonomy ] ) ) {
			return $sanitized_taxonomy;
		}

		// Check for taxonomy edit: term.php?taxonomy={taxonomy}&post_type={post_type}.....
		if( 'term.php' === $pagenow && isset( $this->admin_screens[ $sanitized_post_type ] ) && isset( $this->admin_screens[ $sanitized_taxonomy ] ) ) {
			return $sanitized_taxonomy;
		}

		return '';
	}

	/**
	 * Get admin header tabs (if exists) for current sreen.
	 *
	 * @return array Tabs. Default []
	 */
	private function get_tabs() {

		$screen_slug = $this->get_screen_slug();

		if ( in_array( $screen_slug, [ 'newspack_nl_ads_cpt', 'newspack_nl_advertiser' ], true ) ) {

			return [
				[
					'textContent' => esc_html__( 'Ads', 'newspack-plugin' ),
					'href'        => admin_url( 'edit.php?post_type=newspack_nl_ads_cpt' ),
				],
				[
					'textContent'   => esc_html__( 'Advertisers', 'newspack-plugin' ),
					'href'          => admin_url( 'edit-tags.php?taxonomy=newspack_nl_advertiser&post_type=newspack_nl_cpt' ),
					// force selected tab for url: term.php?taxonomy=newspack_nl_advertiser&tag_ID=32&post_type=newspack_nl_cpt...
					'forceSelected' => ( 'newspack_nl_advertiser' === $screen_slug ),
				],
			];

		}

		if ( in_array( $screen_slug, [ 'newspack-newsletters-settings-admin', 'newspack-newsletters-tracking' ], true ) ) {

			return [
				[
					'textContent' => esc_html__( 'Settings', 'newspack-plugin' ),
					'href'        => admin_url( 'edit.php?post_type=newspack_nl_cpt&page=newspack-newsletters-settings-admin' ),
				],
				[
					'textContent' => esc_html__( 'Tracking', 'newspack-plugin' ),
					'href'        => admin_url( 'edit.php?post_type=newspack_nl_cpt&page=newspack-newsletters-tracking' ),
				],
			];

		}

		return [];

	}

	/**
	 * Is a Newsletters admin page or post_type being viewed. Needed for parent constructor => 'add_body_class' callback.
	 *
	 * @return bool Is current wizard page or not.
	 */
	public function is_wizard_page() {
		return isset( $this->admin_screens[ $this->get_screen_slug() ] );
	}

	/**
	 * Move CPT Menu using a decimal value. (CPT objects only allow integer positions).
	 *
	 * @return void
	 */
	private function move_cpt_menu() {

		// @todo: Is there a better way to set a CPT Menu position to a decimal value????

		global $menu;
		
		// Look for the Newsletters parent menu in the admin menu.
		$current_position = null;
		foreach ( $menu as $position => $item ) {
			// Test each item until found.
			if ( $item[2] === 'edit.php?post_type=' . Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT ) {
				$current_position = $position;
				break;
			}
		}
		
		// Verify a key was found.
		if ( empty( $current_position ) ) {
			return;
		}
		
		// Move the item to a higher position near "Newspack".
		$new_position = '3.3';

		// if position/key collision, keep increasing increment... 3.3 => 3.33 => 3.333 ...
		while ( array_key_exists( $new_position, $menu ) ) {
			$new_position .= '3';
		}

		// Move menu in the array.
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$menu[ $new_position ] = $menu[ $current_position ];
		unset( $menu[ $current_position ] );

	}

	/**
	 * Callback when Newsletters CPT is registered.
	 *
	 * @param string $post_type
	 * @return void
	 */
	public function registered_post_type_newsletters( $post_type ) {

		global $wp_post_types;

		if ( Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT !== $post_type ) {
			return;
		}
		if ( empty( $wp_post_types[ $post_type ] ) ) {
			return;
		}
		
		// Change menu icon.
		// @TODO get SVG from Figma? This one is "envelope" from: https://wordpress.github.io/gutenberg/?path=/story/icons-icon--library
		$wp_post_types[ $post_type ]->menu_icon = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm2-.5h14c.3 0 .5.2.5.5v1L12 13.5 4.5 7.9V7c0-.3.2-.5.5-.5Zm-.5 3.3V17c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5V9.8L12 15.4 4.5 9.8Z"></path></svg>');

	}

	/**
	 * Callback when Advertiser Taxonomy is registered.  Do not show in menu for IA Epic.
	 *
	 * @param string $taxonomy
	 * @return void
	 */
	public function registered_taxonomy_advertiser( $taxonomy ) {

		global $wp_taxonomies;

		if ( Newspack_Newsletters_Ads::ADVERTISER_TAX !== $taxonomy ) {
			return;
		}
		if ( empty( $wp_taxonomies[ $taxonomy ] ) ) {
			return;
		}

		$wp_taxonomies[ $taxonomy ]->show_in_menu = false;
	
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

		// Advertisers Taxonomy: ( replace & with &amp; )
		// Note, this will also match term edit: term.php?taxonomy=newspack_nl_advertiser&post_type=newspack_nl_cpt....
		if ( 'edit-tags.php?taxonomy=newspack_nl_advertiser&amp;post_type=newspack_nl_cpt' === $submenu_file ) {
			return 'edit.php?post_type=newspack_nl_ads_cpt';
		}	

		// Post type with settings page:
		if ( 'newspack-newsletters-tracking' === $this->get_screen_slug() ) {
			return 'newspack-newsletters-settings-admin';
		}

		return $submenu_file;
	}
}

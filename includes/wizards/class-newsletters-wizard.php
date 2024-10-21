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
	protected $slug = 'newspack_nl_cpt';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-newsletters/newspack-newsletters.php' ) ) {
			return;
		}

		// Define admin screens based on Newspack Newsletters plugin's admin pages and post types.
		$this->admin_screens = [

			// Admin post types:
			'newspack_nl_cpt'                     => __( 'Newsletters / All Newsletters', 'newspack-plugin' ),
			'newspack_nl_ads_cpt'                 => __( 'Newsletters / Advertising', 'newspack-plugin' ),
			
			// @todo: Admin taxonomies:
			// 'edit-tags.php?taxonomy={taxonomy}&post_type={post_type}'
			// 'newspack_nl_cpt-newspack_nl_advertiser' => __( 'Newsletters / Advertising', 'newspack-plugin' ),
			
			// Admin pages:
			'newspack-newsletters-settings-admin' => __( 'Newsletters / Settings', 'newspack-plugin' ),

		];

		// Hide Advertisers Taxonomy from menu.
		add_action( 'registered_taxonomy', [ $this, 'registered_taxonomy_advertiser' ] );
		
		// Change Newsletters icon in menu.
		add_action( 'registered_post_type', [ $this, 'registered_post_type_newsletters' ] );

		// Hooks: 'admin_menu':'add_page', 'admin_enqueue_scripts':'enqueue_scripts_and_styles', 'admin_body_class':'add_body_class'.
		parent::__construct();

		return;

		// Display screen.
		if( $this->is_wizard_page() ) {

			$this->admin_header_init([
				'title' => $this->get_name(),
			]);

		}
	}

	/**
	 * Adjusts the Newsletters menu. Called from parent constructor 'admin_menu'.
	 * 
	 * Adjusts Newsletters Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT position and icon.
	 */
	public function add_page() {
		
		// @todo: is this the only way to set a CPT to a decimal value????
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
	 * Is a Newsletters admin page or post_type being viewed. Needed for parent constructor => 'add_body_class' callback.
	 *
	 * @return bool Is current wizard page or not.
	 */
	public function is_wizard_page() {
		return isset( $this->admin_screens[ $this->get_screen_slug() ] );
	}

	public function registered_post_type_newsletters( $post_type ) {

		global $wp_post_types;

		if ( Newspack_Newsletters::NEWSPACK_NEWSLETTERS_CPT !== $post_type ) {
			return;
		}
		if ( empty( $wp_post_types[ $post_type ] ) ) {
			return;
		}

		// @TODO get SVG from Figma? This one is "envelope" from: https://wordpress.github.io/gutenberg/?path=/story/icons-icon--library
		$wp_post_types[ $post_type ]->menu_icon = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm2-.5h14c.3 0 .5.2.5.5v1L12 13.5 4.5 7.9V7c0-.3.2-.5.5-.5Zm-.5 3.3V17c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5V9.8L12 15.4 4.5 9.8Z"></path></svg>');

	}

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

}

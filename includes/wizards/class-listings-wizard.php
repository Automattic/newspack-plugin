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
	 * Primary slug for these wizard screens.
	 *
	 * @var string
	 */
	protected $slug = 'newspack_lst_event';

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

		// Hooks: 'admin_menu'=>'add_page', 'admin_enqueue_scripts'=>'enqueue_scripts_and_styles', 'admin_body_class'=>'add_body_class'.
		parent::__construct();

		// Remove Listings plugin's menu setup.
		remove_action( 'admin_menu', [ Newspack_Listings_Core::class, 'add_plugin_page' ], 10 );

		// Display screen.
		if( $this->is_wizard_page() ) {

			$this->admin_header_init([
				'title' => $this->get_name(),
			]);

		}
	}

	/**
	 * Add the Listings menu page. Called from parent constructor 'admin_menu'.
	 */
	public function add_page() {

		// Top-level menu item.
		add_menu_page(
			'Newspack Listings',
			'Listings',
			'edit_posts',
			'newspack-listings',
			'',
			'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZmZmIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNS41IDcuNWgydjJoLTJ6bTIgNGgtMnYyaDJ6bTEtNGg3djJoLTd6bTcgNGgtN3YyaDd6Ii8+PHBhdGggY2xpcC1ydWxlPSJldmVub2RkIiBkPSJtNC42MjUgM2MtLjg5NyAwLTEuNjI1LjcyOC0xLjYyNSAxLjYyNXYxMS43NWMwIC44OTguNzI4IDEuNjI1IDEuNjI1IDEuNjI1aDExLjc1Yy44OTggMCAxLjYyNS0uNzI3IDEuNjI1LTEuNjI1di0xMS43NWMwLS44OTctLjcyNy0xLjYyNS0xLjYyNS0xLjYyNXptMTEuNzUgMS41aC0xMS43NWEuMTI1LjEyNSAwIDAgMCAtLjEyNS4xMjV2MTEuNzVjMCAuMDY5LjA1Ni4xMjUuMTI1LjEyNWgxMS43NWEuMTI1LjEyNSAwIDAgMCAuMTI1LS4xMjV2LTExLjc1YS4xMjUuMTI1IDAgMCAwIC0uMTI1LS4xMjV6IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJtMjEuNzUgOGgtMS41djExYzAgLjY5LS41NiAxLjI1LTEuMjQ5IDEuMjVoLTEzLjAwMXYxLjVoMTMuMDAxYTIuNzQ5IDIuNzQ5IDAgMCAwIDIuNzQ5LTIuNzV6Ii8+PC9zdmc+Cg==',
			3.4
		);

        if ( is_callable( [ Newspack_Listings_Settings::class, 'create_admin_page' ] ) ) {

            add_submenu_page(
                'newspack-listings',
                __( 'Newspack Listings: Site-Wide Settings', 'newspack-listings' ),
                __( 'Settings', 'newspack-listings' ),
                'manage_options',
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

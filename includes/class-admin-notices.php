<?php
/**
 * Newspack admin notices.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_PLUGIN_VISIT', 'newspack_return_path' );
define( 'NEWSPACK_LAST_URL_OPTION', 'newspack_last_url' );

/**
 * Manages the API as a whole.
 */
class Admin_Notices {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'current_screen', [ $this, 'persist_current_url' ] );
		add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_menu' ), 95 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_styles' ] );
	}

	/**
	 * Add Back to Newspack to the Admin Bar
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Instance of the Admin.
	 */
	public function add_admin_bar_menu( $wp_admin_bar ) {
		if ( ! $this->needs_handoff_return_ui() ) {
			return;
		}
		$newspack_link = get_option( NEWSPACK_LAST_URL_OPTION );

		$admin_bar_menu_args = array(
			'id'    => 'newspack',
			'title' => $this->get_admin_bar_menu_title(),
			'href'  => esc_url( $newspack_link ),
		);
		$wp_admin_bar->add_menu( $admin_bar_menu_args );
	}

	/**
	 * Enqueue styles for admin bar.
	 */
	public function enqueue_styles() {

		wp_register_style(
			'newspack-admin-bar',
			Newspack::plugin_url() . '/assets/dist/adminNotices.css',
			[],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/adminNotices.css' )
		);
		wp_enqueue_style( 'newspack-admin-bar' );

	}

	/**
	 * Gets the menu title markup.
	 *
	 * @return string Admin bar title markup.
	 */
	protected function get_admin_bar_menu_title() {
		return '<span class="newspack-title">' . __( 'Newspack', 'newspack' ) . '</span> <div class="newspack-logo svg"><span class="screen-reader-text">' . __( 'Newspack', 'newspack' ) . '</span></div>';
	}

	/**
	 * Register the slug of plugin that is about to be visited.
	 *
	 * @param  array $plugin Slug of plugin to be visited.
	 * @return void
	 */
	public static function register_admin_notice_for_plugin( $plugin ) {
		update_option( NEWSPACK_PLUGIN_VISIT, $plugin );
	}

	/**
	 * Should handoff return UI be shown?
	 *
	 * @return bool
	 */
	public static function needs_handoff_return_ui() {
		return get_option( NEWSPACK_PLUGIN_VISIT ) ? true : false;
	}

	/**
	 * If the current admin page is part of the Newspack dashboard, store the URL as an option.
	 *
	 * @param WP_Screen $current_screen The current screen object.
	 * @return void
	 */
	public function persist_current_url( $current_screen ) {
		if ( stristr( $current_screen->id, 'newspack' ) ) {
			update_option( NEWSPACK_LAST_URL_OPTION, filter_input( INPUT_SERVER, 'REQUEST_URI', FILTER_SANITIZE_URL ) );
			update_option( NEWSPACK_PLUGIN_VISIT, null );
		}
	}
}
new Admin_Notices();

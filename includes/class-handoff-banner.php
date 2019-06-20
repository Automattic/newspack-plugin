<?php
/**
 * Newspack admin notices.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_HANDOFF', 'newspack_handoff' );
define( 'NEWSPACK_HANDOFF_RETURN_URL', 'newspack_handoff_return_url' );

/**
 * Manages the API as a whole.
 */
class Handoff_Banner {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'current_screen', [ $this, 'persist_current_url' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_styles' ], 1 );
		add_action( 'admin_notices', [ $this, 'insert_handoff_banner' ], 1 );
	}

	/**
	 * Render element into which Handoff Banner will be rendered.
	 *
	 * @return void.
	 */
	public function insert_handoff_banner() {
		if ( ! $this->needs_handoff_return_ui() ) {
			return;
		}
		$newspack_handoff_return_url = get_option( NEWSPACK_HANDOFF_RETURN_URL );
		echo sprintf( "<div id='newspack-handoff-banner' data-primary_button_url='%s'></div>", esc_attr( $newspack_handoff_return_url ) );
	}

	/**
	 * Enqueue script and styles for Handoff Banner.
	 */
	public function enqueue_styles() {
		if ( ! $this->needs_handoff_return_ui() ) {
			return;
		}
		$handle = 'newspack-handoff-banner';
		wp_register_style(
			$handle,
			Newspack::plugin_url() . '/assets/dist/handoff-banner.css',
			[],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/handoff-banner.css' )
		);
		wp_enqueue_style( $handle );

		wp_register_script(
			$handle,
			Newspack::plugin_url() . '/assets/dist/handoff-banner.js',
			[ 'wp-element', 'wp-editor', 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/handoff-banner.js' ),
			true
		);
		wp_enqueue_script( $handle );

	}

	/**
	 * Register the slug of plugin that is about to be visited.
	 *
	 * @param  array $plugin Slug of plugin to be visited.
	 * @return void
	 */
	public static function register_handoff_for_plugin( $plugin ) {
		update_option( NEWSPACK_HANDOFF, $plugin );
	}

	/**
	 * Should handoff return UI be shown?
	 *
	 * @return bool
	 */
	public static function needs_handoff_return_ui() {
		return get_option( NEWSPACK_HANDOFF ) ? true : false;
	}

	/**
	 * If the current admin page is part of the Newspack dashboard, store the URL as an option.
	 *
	 * @param WP_Screen $current_screen The current screen object.
	 * @return void
	 */
	public function persist_current_url( $current_screen ) {
		if ( stristr( $current_screen->id, 'newspack' ) ) {
			update_option( NEWSPACK_HANDOFF_RETURN_URL, filter_input( INPUT_SERVER, 'REQUEST_URI', FILTER_SANITIZE_URL ) );
			update_option( NEWSPACK_HANDOFF, null );
		}
	}
}
new Handoff_Banner();

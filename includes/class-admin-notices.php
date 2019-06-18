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
	 * Display admin notices on non-Newspack plugin admin pages.
	 *
	 * @return void
	 */
	public static function display_admin_notices() {
		$newspack_return_path = get_option( NEWSPACK_PLUGIN_VISIT );
		if ( ! $newspack_return_path ) {
			return;
		}
		$newspack_link = get_option( NEWSPACK_LAST_URL_OPTION );
		?>
		<div class="notice notice-error">
			<p>Back to <a href='<?php echo esc_url( $newspack_link ); ?>'>Newspack</a></p>
		</div>
		<?php
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

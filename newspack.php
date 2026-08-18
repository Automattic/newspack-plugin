<?php
/**
 * Plugin Name: Newspack (final version, please migrate)
 * Description: Final version released from the legacy plugin repository. This copy will not receive further updates. Download the current version at https://newspack.com/download-center
 * Version: 6.42.5
 * Author: Automattic
 * Author URI: https://newspack.com/
 * License: GPL2
 * Text Domain: newspack-plugin
 * Domain Path: /languages/
 *
 * @package         Newspack_Plugin
 */

defined( 'ABSPATH' ) || exit;

define( 'NEWSPACK_PLUGIN_VERSION', '6.42.5' );

// Path to the main Newspack plugin file.
if ( ! defined( 'NEWSPACK_PLUGIN_FILE' ) ) {
	define( 'NEWSPACK_PLUGIN_FILE', __FILE__ );
}

// Base directory name for the Newspack plugin.
if ( ! defined( 'NEWSPACK_PLUGIN_BASEDIR' ) ) {
	define( 'NEWSPACK_PLUGIN_BASEDIR', dirname( plugin_basename( NEWSPACK_PLUGIN_FILE ) ) );
}

require_once __DIR__ . '/vendor/autoload.php';

// Action Scheduler.
require_once __DIR__ . '/vendor/woocommerce/action-scheduler/action-scheduler.php';

// Include the main Newspack class.
if ( ! class_exists( 'Newspack' ) ) {
	include_once __DIR__ . '/includes/class-newspack.php';
}

/**
 * Warn administrators that this build came from the legacy plugin repository.
 */
function newspack_plugin_legacy_repo_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="notice notice-error">
		<p><strong><?php esc_html_e( 'You are running an outdated version of the Newspack plugin.', 'newspack-plugin' ); ?></strong></p>
		<p>
			<?php
			printf(
				wp_kses(
					/* translators: 1: URL of the announcement post. 2: URL of the download center. */
					__( 'This is the final version released from the legacy plugin repository, and it will not receive further updates. <a href="%1$s">Read the announcement</a>, then download the current version from the <a href="%2$s">Newspack download center</a>.', 'newspack-plugin' ),
					[
						'a' => [
							'href' => [],
						],
					]
				),
				esc_url( 'https://newspack.com/newspack-plugins-and-themes-have-a-new-home/' ),
				esc_url( 'https://newspack.com/download-center' )
			);
			?>
		</p>
	</div>
	<?php
}

/*
 * Newspack wizard screens call remove_all_actions() on the notice hooks at priority -9999,
 * so this notice runs ahead of that to stay visible on every admin screen.
 */
add_action( 'all_admin_notices', 'newspack_plugin_legacy_repo_notice', -99999 );

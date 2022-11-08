<?php
/**
 * Newspack setup wizard. Required plugins, introduction, and data collection.
 *
 * @package Newspack
 */

namespace Newspack\CLI;

use WP_CLI;
use WP_REST_Request;

defined( 'ABSPATH' ) || exit;

/**
 * Setup Newspack CLI command.
 */
class Setup {

	/**
	 * Sets up a testing site
	 *
	 * This is a command used to set up a testing site from scratch, installing required plugins and running the onboard wizard automatically
	 *
	 * ## OPTIONS
	 * [--skip-ras]
	 * : If set, will not add the EXPERIMENTAL RAS flag to wp-config
	 *
	 * @param array $args Positional arguments.
	 * @param array $assoc_args Assoc arguments.
	 * @return void
	 */
	public function __invoke( $args, $assoc_args ) {
		do_action( 'rest_api_init' );
		$user_id = 0;
		while ( ! current_user_can( 'manage_options' ) ) {
			$user_id++;
			wp_set_current_user( $user_id );
		}

		$user_name = wp_get_current_user()->user_login;

		WP_CLI::line( "Logged in as $user_name" );

		$this->plugins();

		$this->initial_content();

		$this->campaigns_config();

		$this->amp_plus();

		if ( ! WP_CLI\Utils\get_flag_value( $assoc_args, 'skip-ras', false ) ) {
			$this->ras_beta();
		}

		WP_CLI::success( 'Done!' );
	}

	/**
	 * Do the initial-check request
	 *
	 * @return array The plugins array
	 */
	private function get_initial_check() {
		$request  = new WP_REST_Request( 'GET', '/' . NEWSPACK_API_NAMESPACE . '/wizard/newspack-setup-wizard/initial-check' );
		$response = rest_do_request( $request );
		return $response->data['plugins'];
	}

	/**
	 * Gets the initial check and loops though plugins. Configures plugins that are not yet active
	 *
	 * @return void
	 */
	private function plugins() {
		WP_CLI::line( 'Checking for required plugins' );
		$plugins = $this->get_initial_check();

		foreach ( $plugins as $plugin ) {
			if ( $plugin['Status'] === 'active' ) {
				WP_CLI::line( $plugin['Name'] . ' is already configured' );
				continue;
			}
			$this->configure_plugin( $plugin );
		}
	}

	/**
	 * Configures a plugin
	 *
	 * @param array $plugin The plugin array fetched in the initial-check.
	 * @return void
	 */
	private function configure_plugin( $plugin ) {
		$request = new WP_REST_Request( 'POST', '/' . NEWSPACK_API_NAMESPACE . '/plugins/' . $plugin['Slug'] . '/configure' );
		WP_CLI::line( 'Configuring ' . $plugin['Name'] );
		$response = rest_do_request( $request );
		WP_CLI::success( 'Plugin configured' );
	}

	/**
	 * Populates the site with initial content
	 *
	 * @return void
	 */
	private function initial_content() {
		WP_CLI::line( 'Creating Initial Content' );
		$request = new WP_REST_Request( 'POST', '/' . NEWSPACK_API_NAMESPACE . '/wizard/newspack-setup-wizard/starter-content/init' );
		$request->set_query_params( [ 'type' => 'generated' ] );
		$response = rest_do_request( $request );

		WP_CLI::line( 'Creating Posts' );
		for ( $i = 0; $i < 40; $i++ ) {
			$request  = new WP_REST_Request( 'POST', '/' . NEWSPACK_API_NAMESPACE . '/wizard/newspack-setup-wizard/starter-content/post/' . $i );
			$response = rest_do_request( $request );
			echo '.';
		}
		WP_CLI::success( 'Posts created' );


		$request  = new WP_REST_Request( 'POST', '/' . NEWSPACK_API_NAMESPACE . '/wizard/newspack-setup-wizard/starter-content/homepage' );
		$response = rest_do_request( $request );
		WP_CLI::success( 'Home page configured' );

		$request  = new WP_REST_Request( 'POST', '/' . NEWSPACK_API_NAMESPACE . '/wizard/newspack-setup-wizard/starter-content/theme' );
		$response = rest_do_request( $request );
		WP_CLI::success( 'Theme configured' );

		$request  = new WP_REST_Request( 'POST', '/' . NEWSPACK_API_NAMESPACE . '/wizard/newspack-setup-wizard/complete' );
		$response = rest_do_request( $request );
		WP_CLI::success( 'Initial content completed.' );
	}

	/**
	 * Creates the newspack-popups-config file
	 *
	 * @return void
	 */
	private function campaigns_config() {
		global $table_prefix;
		$filename = WP_CONTENT_DIR . '/newspack-popups.config.php';
		if ( ! file_exists( $filename ) ) {
			$content  = "<?php \n";
			$content .= sprintf( "define( 'DB_NAME', '%s' );\n", DB_NAME );
			$content .= sprintf( "define( 'DB_USER', '%s' );\n", DB_USER );
			$content .= sprintf( "define( 'DB_PASSWORD', '%s' );\n", DB_PASSWORD );
			$content .= sprintf( "define( 'DB_HOST', '%s' );\n", DB_HOST );
			$content .= sprintf( "define( 'DB_CHARSET', '%s' );\n", DB_CHARSET );
			$content .= sprintf( "define( 'DB_PREFIX', '%s' );\n", $table_prefix );
			$content .= "define( 'NEWSPACK_POPUPS_DEBUG', true );\n";

			file_put_contents( $filename, $content );

			WP_CLI::success( 'Campaigns config created.' );

		}

	}

	/**
	 * Adds a new line to wp-config
	 *
	 * @param string $line The line to be addeed.
	 * @return void
	 */
	private function add_to_wpconfig( $line ) {
		$file     = ABSPATH . '/wp-config.php';
		$string   = '/* Add any custom values between this line and the "stop editing" line. */';
		$contents = file_get_contents( $file );

		if ( ! strpos( $contents, $line ) ) {
			$contents = str_replace(
				$string,
				$string . "\n" . $line . "\n",
				$contents
			);

			file_put_contents( $file, $contents );
		}

	}

	/**
	 * Adds the AMP Plus flag to wp-config
	 *
	 * @return void
	 */
	private function amp_plus() {
		$this->add_to_wpconfig( "define( 'NEWSPACK_AMP_PLUS_ENABLED', true );" );
		WP_CLI::success( 'AMP Plus configured.' );
	}

	/**
	 * Adds the Experimental RAS flag wp-config
	 *
	 * @return void
	 */
	private function ras_beta() {
		$this->add_to_wpconfig( "define( 'NEWSPACK_EXPERIMENTAL_READER_ACTIVATION', true );" );
		WP_CLI::success( 'RAS enabled.' );
	}
}

<?php
/**
 * Newspack plugin CLI initializer
 *
 * @package Newspack
 */

namespace Newspack\CLI;

use WP_CLI;

defined( 'ABSPATH' ) || exit;

/**
 * Initializer CLI commands
 */
class Initializer {

	/**
	 * Adds CLI commands. Do not call directly or before init hooks
	 *
	 * @return void
	 */
	public static function register_comands() {

		require_once dirname( __FILE__ ) . '/class-setup.php';

		if ( ! defined( 'WP_CLI' ) ) {
			return;
		}

		WP_CLI::add_command( 'newspack setup', 'Newspack\CLI\Setup' );

	}

}

add_action( 'cli_init', [ Initializer::class, 'register_comands' ] );

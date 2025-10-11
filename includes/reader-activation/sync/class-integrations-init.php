<?php
/**
 * Integrations Initialization
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync;

defined( 'ABSPATH' ) || exit;

/**
 * Integrations Initialization Class.
 *
 * Initializes integrations system, registers example integrations,
 * and sets up REST API.
 */
class Integrations_Init {
	/**
	 * Initialize integrations system.
	 */
	public static function init() {
		// Include required files.
		require_once __DIR__ . '/class-integrations.php';
		require_once __DIR__ . '/integrations/class-integration.php';
		require_once __DIR__ . '/integrations/class-example-integration.php';
		require_once __DIR__ . '/integrations/class-esp.php';

		// Initialize REST API.
		Integrations::init_rest_api();

		// Register example integration (for demonstration).
		self::register_example_integrations();

		// Hook for other plugins/code to register their integrations.
		do_action( 'newspack_reader_activation_register_integrations' );
	}

	/**
	 * Register the example integration.
	 */
	private static function register_example_integrations() {
		$example_integration = new Integrations\Example_Integration();
		Integrations::register( $example_integration );

		$esp_integration = new Integrations\ESP();
		Integrations::register( $esp_integration );
	}
}

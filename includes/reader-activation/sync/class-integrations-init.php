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

		add_action( 'init', [ __CLASS__, 'init_callback' ], 5 );
	}

	/**
	 * Callback for init action to register integrations and popup criteria.
	 */
	public static function init_callback() {
		// Register default integrations.
		self::register_default_integrations();

		self::register_popup_criteria();

		// Hook for other plugins/code to register their integrations.
		do_action( 'newspack_reader_activation_register_integrations' );
	}

	/**
	 * Register the default integrations.
	 */
	private static function register_default_integrations() {
		$example_integration = new Integrations\Example_Integration();
		Integrations::register( $example_integration );

		$esp_integration = new Integrations\ESP();
		Integrations::register( $esp_integration );
	}

	/**
	 * Register popup criteria for all active integrations.
	 */
	private static function register_popup_criteria() {
		if ( ! class_exists( '\Newspack_Popups_Criteria' ) ) {
			return;
		}

		$integrations = Integrations::get_active_integrations();

		foreach ( $integrations as $integration ) {
			$metadata = $integration->get_metadata_keys();
			foreach ( $metadata as $label ) {
				\Newspack_Popups_Criteria::register_criteria( $label );
			}
		}
	}
}

<?php
/**
 * Newspack's Connections Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WP_Query;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Connections_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-connections-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return \esc_html__( 'Connections', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Connections to third-party services.', 'newspack' );
	}

	/**
	 * Get the duration of this wizard.
	 *
	 * @return string A description of the expected duration (e.g. '10 minutes').
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		\wp_register_script(
			'newspack-connections-wizard',
			Newspack::plugin_url() . '/dist/connections.js',
			$this->get_script_dependencies( [] ),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/connections.js' ),
			true
		);
		\wp_localize_script(
			'newspack-connections-wizard',
			'newspack_connections_data',
			[
				'can_connect_google' => Google_OAuth::is_oauth_configured(),
			]
		);
		\wp_enqueue_script( 'newspack-connections-wizard' );
	}

	/**
	 * Check if wizard is configured and should be displayed.
	 *
	 * @return bool True if necessary variables are present.
	 */
	public static function configured() {
		return WPCOM_OAuth::wpcom_client_id();
	}
}

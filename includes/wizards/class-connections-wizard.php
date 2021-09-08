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
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
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
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/connections',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_connections' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/connections/(?P<provider>[\a-z]+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_create_connection' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'provider' => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					],
					'service'  => [
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
	}

	/**
	 * Get all connections.
	 *
	 * @param WP_REST_Request $request Request.
	 */
	public static function api_get_connections( $request ) {
		$connections = [];
		return \rest_ensure_response( $connections );
	}

	/**
	 * Create a new connection.
	 *
	 * @param WP_REST_Request $request Request.
	 */
	public function api_create_connection( $request ) {
		$provider = $request->get_param( 'provider' );
		switch ( $provider ) {
			default:
				return wp_send_json_error( [ 'message' => __( 'Provider not implemented.', 'newspack' ) ], 404 );
		}
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

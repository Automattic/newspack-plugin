<?php
/**
 * Performance Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Performance_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-performance-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'install_plugins';
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
		return esc_html__( 'Performance', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Set up and maintain Progressive Web App functionality.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '10 minutes', 'newspack' );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			'newspack/v1/wizard/',
			'/performance/',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			'newspack/v1/wizard/',
			'/performance/',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_update_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Handle GET endpoint.
	 */
	public function api_get_settings() {
		return rest_ensure_response( $this->get_settings() );
	}

	/**
	 * Handle POST endpoint.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function api_update_settings( $request ) {
		require_once NEWSPACK_ABSPATH . 'includes/configuration_managers/class-progressive-wp-configuration-manager.php';
		$configuration_manager = new Progressive_WP_Configuration_Manager();
		if ( empty( $request['settings'] ) ) {
			return new WP_Error( 'newspack_invalid_update', 'Invalid update' );
		}
		$settings = $request['settings'];
		if ( ! empty( $settings['site_icon'] ) ) {
			$configuration_manager->update_site_icon( $settings['site_icon'] );
		}
		return rest_ensure_response( $this->get_settings() );
	}

	/**
	 * Get all settings
	 */
	public function get_settings() {
		require_once NEWSPACK_ABSPATH . 'includes/configuration_managers/class-progressive-wp-configuration-manager.php';
		$configuration_manager = new Progressive_WP_Configuration_Manager();
		return [
			'add_to_homescreen'            => true,
			'site_icon'                    => $configuration_manager->get( 'site_icon' ),
			'offline_usage'                => true,
			'push_notifications'           => true,
			'push_notification_server_key' => 'boo',
			'push_notification_sender_id'  => 'hoo',
		];
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-performance-wizard',
			Newspack::plugin_url() . '/assets/dist/performance.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/performance.js' ),
			true
		);

		wp_register_style(
			'newspack-performance-wizard',
			Newspack::plugin_url() . '/assets/dist/performance.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/performance.css' )
		);
		wp_style_add_data( 'newspack-performance-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-performance-wizard' );
	}
}

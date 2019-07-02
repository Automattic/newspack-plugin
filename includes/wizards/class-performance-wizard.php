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
		if ( empty( $request['settings'] ) ) {
			return new WP_Error( 'newspack_invalid_update', __( 'Invalid update' ) );
		}
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'progressive-wp' );
		if ( is_wp_error( $configuration_manager ) ) {
			return $configuration_manager;
		}
		$settings = $request['settings'];

		if ( isset( $settings['push_notifications'] ) ) {
			if ( $settings['push_notifications'] ) {
				$push_notification_server_key = isset( $settings['push_notification_server_key'] ) ? trim( $settings['push_notification_server_key'] ) : null;
				$push_notification_sender_id  = isset( $settings['push_notification_sender_id'] ) ? trim( $settings['push_notification_sender_id'] ) : null;
				if ( ! $push_notification_server_key || ! $push_notification_sender_id ) {
					return new WP_Error(
						'newspack_incomplete_firebase_fields',
						__( 'Firebase Server Key and Sender ID must be set in order to use Push Notifications.' ),
						[
							'status' => 400,
							'level'  => 'notice',
						]
					);
				} else {
					$configuration_manager->firebase_credentials_set( true );
				}
			} else {
				$configuration_manager->firebase_credentials_set( false );
			}
		}

		if( isset( $settings['add_to_homescreen'] ) ) {
			$configuration_manager->update( 'installable-mode', $settings['add_to_homescreen'] ? 'normal' : 'none' );
		}

		if ( isset( $settings['site_icon'] ) ) {
			$height = isset( $settings['site_icon']['height'] ) ? $settings['site_icon']['height'] : 0;
			$width  = isset( $settings['site_icon']['width'] ) ? $settings['site_icon']['width'] : 0;
			if ( $height !== $width ) {
				return new WP_Error(
					'newspack_site_icon_not_square',
					__( 'Site icon images must be square.' ),
					[
						'status' => 400,
						'level'  => 'notice',
					]
				);
			}
			$configuration_manager->update( 'site_icon', $settings['site_icon'] );
		}

		if ( isset( $settings['push_notification_server_key'] ) ) {
			$configuration_manager->update( 'firebase-serverkey', $settings['push_notification_server_key'] );
		}
		if ( isset( $settings['push_notification_sender_id'] ) ) {
			$configuration_manager->update( 'firebase-senderid', $settings['push_notification_sender_id'] );
		}
		return rest_ensure_response( $this->get_settings() );
	}

	/**
	 * Get all settings
	 */
	public function get_settings() {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'progressive-wp' );
		if ( is_wp_error( $configuration_manager ) ) {
			return $configuration_manager;
		}
		return [
			'add_to_homescreen'            => $configuration_manager->is_module_enabled( 'add_to_homescreen' ),
			'site_icon'                    => $configuration_manager->get( 'site_icon' ),
			'offline_usage'                => true,
			'push_notifications'           => $configuration_manager->is_module_enabled( 'push_notifications' ),
			'push_notification_server_key' => $configuration_manager->get( 'firebase-serverkey' ),
			'push_notification_sender_id'  => $configuration_manager->get( 'firebase-senderid' ),
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

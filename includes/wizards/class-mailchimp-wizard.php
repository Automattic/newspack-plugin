<?php
/**
 * Mailchimp Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up Mailchimp.
 */
class Mailchimp_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-mailchimp-wizard';

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
		return esc_html__( 'Set up Mailchimp', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Connect your newsroom to Mailchimp.', 'newspack' );
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
			'newspack/v1/wizard/' . $this->slug,
			'jetpack',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_jetpack_mailchimp_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Get the Jetpack-Mailchimp connection settings.
	 * 
	 * @see jetpack/_inc/lib/core-api/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-mailchimp.php
	 * @return WP_REST_Response with the info.
	 */
	public function api_get_jetpack_mailchimp_settings() {
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			return new WP_Error(
				'newspack_missing_required_plugin',
				esc_html__( 'The Jetpack plugin is not installed and activated. Install and/or activate it to access this feature.', 'newspack' ),
				[
					'status' => 400,
					'level'  => 'fatal',
				]
			);
		}

		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : \Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'newspack' ),
				[
					'status' => 403,
					'level'  => 'fatal',
				]			
			);
		}

		$connect_url = sprintf( 'https://wordpress.com/marketing/connections/%s', rawurlencode( $site_id ) );
		
		$option = get_option( 'jetpack_mailchimp', false );
		if ( $option ) {
			$data = json_decode( $option, true );
			$mailchimp_connected = $data ? isset( $data['follower_list_id'], $data['keyring_id'] ) : false;
		} else {
			$mailchimp_connected = false;
		}

		return array(
			'connected'  => $mailchimp_connected,
			'connectURL' => $connect_url,
		);
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-mailchimp-wizard',
			Newspack::plugin_url() . '/assets/dist/mailchimp.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/mailchimp.js' ),
			true
		);

		wp_register_style(
			'newspack-mailchimp-wizard',
			Newspack::plugin_url() . '/assets/dist/mailchimp.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/mailchimp.css' )
		);
		wp_style_add_data( 'newspack-mailchimp-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-mailchimp-wizard' );
	}
}

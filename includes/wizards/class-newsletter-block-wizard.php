<?php
/**
 * Mailchimp Block Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up a newsletter subscriptions block.
 */
class Newsletter_Block_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-newsletter-block-wizard';

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
		return esc_html__( 'Set up newsletter subscriptions block', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Create an effective lead capture to place throughout your site.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '2 minutes', 'newspack' );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'connection-status',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_connection_status_settings' ],
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
	public function api_get_connection_status_settings() {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'jetpack' );
		return rest_ensure_response( $configuration_manager->get_mailchimp_connection_status() );
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
			'newspack-newsletter-block-wizard',
			Newspack::plugin_url() . '/assets/dist/newsletterBlock.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/newsletterBlock.js' ),
			true
		);

		wp_register_style(
			'newspack-newsletter-block-wizard',
			Newspack::plugin_url() . '/assets/dist/newsletterBlock.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/newsletterBlock.css' )
		);
		wp_style_add_data( 'newspack-newsletter-block-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-newsletter-block-wizard' );
	}
}

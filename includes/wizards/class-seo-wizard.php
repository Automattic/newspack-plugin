<?php
/**
 * Newspack's SEO Wizard
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
class SEO_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-seo-wizard';

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
		return \esc_html__( 'SEO', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Search engine and social optimization.', 'newspack' );
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
			'newspack/v1/wizard/' . $this->slug,
			'settings',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_seo_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'settings',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_seo_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'under_construction' => [
						'sanitize_callback' => 'absint',
					],
					'title_separator'    => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'verification'       => [],
					'urls'               => [],
				],
			]
		);
	}

	/**
	 * API endpoint to retrieve all settings necessary to render the SEO wizard.
	 *
	 * @return WP_REST_Response with the info.
	 */
	public function api_get_seo_settings() {
		$response = $this->get_seo_settings();
		return rest_ensure_response( $response );
	}

	/**
	 * Update SEO wizard settings.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response with the info.
	 */
	public function api_update_seo_settings( $request ) {
		$response = $this->get_seo_settings();
		return rest_ensure_response( $response );
	}

	/**
	 * Retrieve all settings necessary to render the SEO wizard.
	 *
	 * @return Array with the info.
	 */
	public function get_seo_settings() {
		$response = [
			'under_construction' => false,
			'title_separator'    => '-',
			'verification'       => [
				'bing'   => '123456789',
				'google' => '123456789',
			],
			'urls'               => [
				'facebook'  => 'https://facebook.com',
				'twitter'   => 'https://twitter.com',
				'instagram' => 'https://instagram.com',
				'linkedin'  => 'https://linkedin.com',
				'youtube'   => 'https://youtube.com',
			],
		];
		return $response;
	}

	/**
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		\wp_enqueue_script(
			'newspack-seo-wizard',
			Newspack::plugin_url() . '/assets/dist/seo.js',
			$this->get_script_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/seo.js' ),
			true
		);

		\wp_register_style(
			'newspack-seo-wizard',
			Newspack::plugin_url() . '/assets/dist/seo.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/seo.css' )
		);
		\wp_style_add_data( 'newspack-seo-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-seo-wizard' );
	}
}

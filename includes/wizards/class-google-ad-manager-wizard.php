<?php
/**
 * Newspack's Google Ad Manager setup.
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
class Google_Ad_Manager_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-google-ad-manager-wizard';

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
		\add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return \esc_html__( 'Google Ad Manager', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'An advanced ad inventory creation and management platform, allowing you to be specific about ad placements.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return \esc_html__( '10 minutes', 'newspack' );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {

		// Get all Newspack ad units.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adunits/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_adunits' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Get one ad unit.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adunits/(?P<id>\d+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_adunits' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Save a ad unit.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adunits/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_save_adunit' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id'   => [
						'sanitize_callback' => 'absint',
					],
					'name' => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'code' => [
						// 'sanitize_callback' => 'esc_js', @todo If a `script` tag goes here, esc_js is the wrong function to use.
					],
				],
			]
		);

		// Delete a ad unit.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adunits/(?P<id>\d+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'api_delete_adunit' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * Get the Ad Manager ad units.
	 *
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_get_adunits() {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );
		return \rest_ensure_response( $configuration_manager->get_ad_units() );
	}

	/**
	 * Get one ad unit.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response containing ad unit info.
	 */
	public function api_get_adunit( $request ) {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$params = $request->get_params();
		$id     = $params['id'];

		return \rest_ensure_response( $configuration_manager->get_ad_unit( $id ) );
	}

	/**
	 * Save an ad unit.
	 *
	 * @param WP_REST_Request $request Ad unit info.
	 * @return WP_REST_Response Updated ad unit info.
	 */
	public function api_save_adunit( $request ) {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$params = $request->get_params();
		$adunit = [
			'id'   => 0,
			'name' => '',
			'code' => '',
		];
		$args   = \wp_parse_args( $params, $adunit );

		// Update and existing or add a new ad unit.
		$adunit = ( 0 === $args['id'] )
			? $configuration_manager->add_ad_unit( $args )
			: $configuration_manager->update_ad_unit( $args );

		return \rest_ensure_response( $adunit );
	}

	/**
	 * Delete an ad unit.
	 *
	 * @param WP_REST_Request $request Request with ID of ad unit to delete.
	 * @return WP_REST_Response Boolean Delete success.
	 */
	public function api_delete_adunit( $request ) {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$params = $request->get_params();
		$id     = $params['id'];

		return \rest_ensure_response( $configuration_manager->delete_ad_unit( $id ) );
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
			'newspack-google-ad-manager-wizard',
			Newspack::plugin_url() . '/assets/dist/googleAdManager.js',
			[ 'wp-components', 'wp-api-fetch' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/googleAdManager.js' ),
			true
		);

		\wp_register_style(
			'newspack-google-ad-manager-wizard',
			Newspack::plugin_url() . '/assets/dist/googleAdManager.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/googleAdManager.css' )
		);
		\wp_style_add_data( 'newspack-google-ad-manager-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-google-ad-manager-wizard' );
	}
}

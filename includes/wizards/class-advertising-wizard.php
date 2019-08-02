<?php
/**
 * Newspack's Advertising Wizard
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
class Advertising_Wizard extends Wizard {

	const NEWSPACK_ADVERTISING_SERVICE_PREFIX   = '_newspack_advertising_service_';
	const NEWSPACK_ADVERTISING_PLACEMENT_PREFIX = '_newspack_advertising_placement_';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-advertising-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Supported services.
	 *
	 * @var array
	 */
	protected $services = array(
		'wordads'           => array(
			'label' => 'WordAds',
		),
		'google_ad_manager' => array(
			'label' => 'Google Ad Manager',
		),
		'google_adsense'    => array(
			'label' => 'Ad Sense',
		),
	);

	/**
	 * Placements.
	 *
	 * @var array
	 */
	protected $placements = array( 'global_above_header', 'global_below_header', 'global_above_footer', 'archives', 'search_results' );

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
		return \esc_html__( 'Advertising', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Monetize your content through advertising.', 'newspack' );
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

		// Get all Newspack advertising data.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_advertising' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Update header code.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/service/(?P<service>[\a-z]+)/header_code',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_header_code' ],
				'permission_callback' => [ $this, 'api_permissions_check_unfiltered_html' ],
				'args'                => [
					'service'     => [
						'sanitize_callback' => [ $this, 'sanitize_service' ],
					],
					'header_code' => [
						// 'sanitize_callback' => 'esc_js', @todo If a `script` tag goes here, esc_js is the wrong function to use.
					],
				],
			]
		);

		// Enable one service.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/service/(?P<service>[\a-z]+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_enable_service' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'service' => [
						'sanitize_callback' => [ $this, 'sanitize_service' ],
					],
				],
			]
		);

		// Disable one service.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/service/(?P<service>[\a-z]+)',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'api_disable_service' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'service' => [
						'sanitize_callback' => [ $this, 'sanitize_service' ],
					],
				],
			]
		);

		// Update header code.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/service/(?P<service>[\a-z]+)/header_code',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_header_code' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'service'     => [
						'sanitize_callback' => [ $this, 'sanitize_service' ],
					],
					'header_code' => [
						// 'sanitize_callback' => 'esc_js', @todo If a `script` tag goes here, esc_js is the wrong function to use.
					],
				],
			]
		);

		// Update placement.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/placement/(?P<placement>[\a-z]+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_placement' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'placement' => [
						'sanitize_callback' => [ $this, 'sanitize_placement' ],
					],
				],
			]
		);

		// Disable placement.
		register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/placement/(?P<placement>[\a-z]+)',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'api_disable_placement' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'placement' => [
						'sanitize_callback' => [ $this, 'sanitize_placement' ],
					],
				],
			]
		);

		// Save a ad unit.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/ad_unit/(?P<id>\d+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_adunit' ],
				'permission_callback' => [ $this, 'api_permissions_check_unfiltered_html' ],
				'args'                => [
					'id'          => [
						'sanitize_callback' => 'absint',
					],
					'name'        => [
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => [ $this, 'api_validate_not_empty' ],
					],
					'ad_code'     => [
						// 'sanitize_callback' => 'esc_js', @todo If a `script` tag goes here, esc_js is the wrong function to use.
					],
					'amp_ad_code' => [
						// 'sanitize_callback' => 'esc_js', @todo If a `script` tag goes here, esc_js is the wrong function to use.
					],
					'ad_service'  => [],
				],
			]
		);

		// Delete a ad unit.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/advertising/ad_unit/(?P<id>\d+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'api_delete_adunit' ],
				'permission_callback' => [ $this, 'api_permissions_check_unfiltered_html' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * Get advertising data.
	 *
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_get_advertising() {
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Enable one service
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_enable_service( $request ) {
		$service = $request['service'];
		if ( 'wordads' === $service ) {
			$jetpack_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'jetpack' );
			$jetpack_manager->activate_wordads();
		} else {
			update_option( self::NEWSPACK_ADVERTISING_SERVICE_PREFIX . $service, true );
		}
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Disable one service
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_disable_service( $request ) {
		$service = $request['service'];
		if ( 'wordads' === $service ) {
			$jetpack_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'jetpack' );
			$jetpack_manager->deactivate_wordads();
		} else {
			update_option( self::NEWSPACK_ADVERTISING_SERVICE_PREFIX . $service, false );
		}
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Create/update a placement
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_update_placement( $request ) {
		$placement      = $request['placement'];
		$ad_unit        = $request['ad_unit'];
		$service        = $request['service'];
		$placement_data = self::get_placement_data( $placement );

		$placement_data['enabled'] = true;
		$placement_data['ad_unit'] = $ad_unit;
		$placement_data['service'] = $service;

		update_option( self::NEWSPACK_ADVERTISING_PLACEMENT_PREFIX . $placement, wp_json_encode( $placement_data ) );
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Disable one placement
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_disable_placement( $request ) {
		$placement = $request['placement'];
		update_option( self::NEWSPACK_ADVERTISING_PLACEMENT_PREFIX . $placement, null );
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Update or create an ad unit.
	 *
	 * @param WP_REST_Request $request Ad unit info.
	 * @return WP_REST_Response Updated ad unit info.
	 */
	public function api_update_adunit( $request ) {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$params = $request->get_params();
		$adunit = [
			'id'          => 0,
			'name'        => '',
			'ad_code'     => '',
			'amp_ad_code' => '',
			'ad_service'  => '',
		];
		$args   = \wp_parse_args( $params, $adunit );
		// Update and existing or add a new ad unit.
		$adunit = ( 0 === $args['id'] )
			? $configuration_manager->add_ad_unit( $args )
			: $configuration_manager->update_ad_unit( $args );

		return \rest_ensure_response( $this->retrieve_data() );
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

		$configuration_manager->delete_ad_unit( $id );

		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Update/create the header code for a service.
	 *
	 * @param WP_REST_Request $request Request with ID of ad unit to delete.
	 * @return WP_REST_Response Boolean Delete success.
	 */
	public function api_update_header_code( $request ) {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$service     = $request['service'];
		$header_code = $request['header_code'];
		$configuration_manager->set_header_code( $service, $header_code );

		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Retrieve all advertising data.
	 *
	 * @return array Advertising data.
	 */
	private function retrieve_data() {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		return array(
			'services'   => $this->get_services(),
			'placements' => $this->get_placements(),
			'ad_units'   => $configuration_manager->get_ad_units(),
		);
	}

	/**
	 * Retrieve state and information for each service.
	 *
	 * @return array Information about services.
	 */
	private function get_services() {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$services = array();
		foreach ( $this->services as $service => $data ) {
			$services[ $service ] = array(
				'label'       => $data['label'],
				'enabled'     => get_option( self::NEWSPACK_ADVERTISING_SERVICE_PREFIX . $service, '' ),
				'header_code' => $configuration_manager->get_header_code( $service ),
			);
		}
		/* Check availability of WordAds based on current Jetpack plan */
		$jetpack_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'jetpack' );

		$services['wordads']['enabled'] = $jetpack_manager->is_wordads_enabled();
		if ( ! $jetpack_manager->is_wordads_available_at_plan_level() ) {
			$services['wordads']['upgrade_required'] = true;
		}
		return $services;
	}

	/**
	 * Retrieve state and ad unit for each placement.
	 *
	 * @return array Information about placements.
	 */
	private function get_placements() {
		$placements = array();
		foreach ( $this->placements as $placement ) {
			$placements[ $placement ] = self::get_placement_data( $placement );
		}
		return $placements;
	}

	/**
	 * Retrieve and decode data for one placement.
	 *
	 * @param string $placement Placement id.
	 * @return array adUnit, service, and enabled for the placement.
	 */
	private function get_placement_data( $placement ) {
		$option_value = json_decode( get_option( self::NEWSPACK_ADVERTISING_PLACEMENT_PREFIX . $placement, '' ) );

		$defaults = array(
			'adUnit'  => '',
			'enabled' => false,
			'service' => '',
		);

		return wp_parse_args( $option_value, $defaults );
	}

	/**
	 * Sanitize the service name.
	 *
	 * @param string $service The service name.
	 * @return string
	 */
	public function sanitize_service( $service ) {
		return sanitize_title( $service );
	}

	/**
	 * Sanitize placement.
	 *
	 * @param string $placement The placement name.
	 * @return string
	 */
	public function sanitize_placement( $placement ) {
		return sanitize_title( $placement );
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
			'newspack-advertising-wizard',
			Newspack::plugin_url() . '/assets/dist/advertising.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/advertising.js' ),
			true
		);

		\wp_register_style(
			'newspack-advertising-wizard',
			Newspack::plugin_url() . '/assets/dist/advertising.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/advertising.css' )
		);
		\wp_style_add_data( 'newspack-advertising-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-advertising-wizard' );
	}
}

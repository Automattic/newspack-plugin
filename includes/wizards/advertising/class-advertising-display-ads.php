<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;

use Newspack_Ads\Providers\GAM_Model;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up general store info.
 */
class Advertising_Display_Ads extends Wizard {

	const NEWSPACK_ADVERTISING_SERVICE_PREFIX = '_newspack_advertising_service_';

	const SERVICE_ACCOUNT_CREDENTIALS_OPTION_NAME = '_newspack_ads_gam_credentials';

	// Legacy network code manually inserted.
	const OPTION_NAME_LEGACY_NETWORK_CODE = '_newspack_ads_service_google_ad_manager_network_code';

	// GAM network code pulled from user credentials.
	const OPTION_NAME_GAM_NETWORK_CODE = '_newspack_ads_gam_network_code';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'advertising-display-ads';

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
		'google_ad_manager' => array(
			'label' => 'Google Ad Manager',
		),
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		add_action( 'rest_api_init', array( $this, 'register_api_endpoints' ) );
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
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {

		// Get all Newspack advertising data.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'api_get_advertising' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
			)
		);

		// Enable one service.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/service/(?P<service>[\a-z]+)',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'api_enable_service' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
				'args'                => array(
					'service' => array(
						'sanitize_callback' => array( $this, 'sanitize_service' ),
					),
				),
			)
		);

		// Disable one service.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/service/(?P<service>[\a-z]+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'api_disable_service' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
				'args'                => array(
					'service' => array(
						'sanitize_callback' => array( $this, 'sanitize_service' ),
					),
				),
			)
		);

		// Update GAM credentials.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/credentials',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'api_update_gam_credentials' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
				'args'                => array(
					'onboarding'  => array(
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
						'default'           => false,
					),
					'credentials' => array(
						'type'       => 'object',
						'properties' => array(
							'type'                        => array(
								'required' => true,
								'type'     => 'string',
							),
							'project_id'                  => array(
								'required' => true,
								'type'     => 'string',
							),
							'private_key_id'              => array(
								'required' => true,
								'type'     => 'string',
							),
							'private_key'                 => array(
								'required' => true,
								'type'     => 'string',
							),
							'client_email'                => array(
								'required' => true,
								'type'     => 'string',
							),
							'client_id'                   => array(
								'required' => true,
								'type'     => 'string',
							),
							'auth_uri'                    => array(
								'required' => true,
								'type'     => 'string',
							),
							'token_uri'                   => array(
								'required' => true,
								'type'     => 'string',
							),
							'auth_provider_x509_cert_url' => array(
								'required' => true,
								'type'     => 'string',
							),
							'client_x509_cert_url'        => array(
								'required' => true,
								'type'     => 'string',
							),
						),
					),
				),
			)
		);

		// Remove GAM credentials.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/credentials',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'api_remove_gam_credentials' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
			)
		);

		// Save a ad unit.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/ad_unit/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'api_update_adunit' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
				'args'                => array(
					'id'         => array(
						'sanitize_callback' => 'absint',
					),
					'name'       => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'sizes'      => array(
						'sanitize_callback' => array( $this, 'sanitize_sizes' ),
					),
					'fluid'      => array(
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'ad_service' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Delete a ad unit.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/ad_unit/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'api_delete_adunit' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
				'args'                => array(
					'id' => array(
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// Update network code.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/billboard/network_code',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'api_update_network_code' ),
				'permission_callback' => array( $this, 'api_permissions_check' ),
				'args'                => array(
					'network_code' => array(
						'sanitize_callback' => function ( $value ) {
							$raw_codes       = explode( ',', $value );
							$sanitized_codes = array_reduce(
								$raw_codes,
								function ( $acc, $code ) {
									$sanitized_code = absint( trim( $code ) );
									if ( ! empty( $sanitized_code ) ) {
										$acc[] = $sanitized_code;
									}
									return $acc;
								},
								array()
							);

							return implode( ',', $sanitized_codes );
						},
					),
					'is_gam'       => array(
						'sanitize_callback' => 'rest_sanitize_boolean',
						'default'           => false,
					),
				),
			)
		);
	}

	/**
	 * Update network code.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_update_network_code( $request ) {
		// Update GAM or legacy network code.
		$option_name = $request['is_gam'] ? GAM_Model::OPTION_NAME_GAM_NETWORK_CODE : GAM_Model::OPTION_NAME_LEGACY_NETWORK_CODE;
		update_option( $option_name, $request['network_code'] );
		return \rest_ensure_response( array() );
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
		update_option( self::NEWSPACK_ADVERTISING_SERVICE_PREFIX . $service, true );
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
		update_option( self::NEWSPACK_ADVERTISING_SERVICE_PREFIX . $service, false );
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Update GAM credentials.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing current GAM status.
	 */
	public function api_update_gam_credentials( $request ) {
		$params = $request->get_params();
		update_option( self::SERVICE_ACCOUNT_CREDENTIALS_OPTION_NAME, $params['credentials'] );
		if ( isset( $params['onboarding'] ) && $params['onboarding'] ) {
			return \rest_ensure_response( true );
		}
		return \rest_ensure_response( $this->retrieve_data() );
	}

	/**
	 * Remove GAM credentials.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response containing current GAM status.
	 */
	public function api_remove_gam_credentials( $request ) {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );
		$response              = $configuration_manager->remove_gam_credentials();

		if ( \is_wp_error( $response ) ) {
			return \rest_ensure_response( $response );
		}
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
		$adunit = array(
			'id'         => 0,
			'name'       => '',
			'sizes'      => array(),
			'ad_service' => '',
		);
		$args   = \wp_parse_args( $params, $adunit );
		// Update and existing or add a new ad unit.
		$adunit = ( 0 === $args['id'] )
			? $configuration_manager->add_ad_unit( $args )
			: $configuration_manager->update_ad_unit( $args );

		if ( \is_wp_error( $adunit ) ) {
			return \rest_ensure_response( $adunit );
		}

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
	 * Retrieve all advertising data.
	 *
	 * @return array Advertising data.
	 */
	private function retrieve_data() {
		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-ads' );

		$services = $this->get_services();
		$error    = false;
		try {
			$ad_units = $configuration_manager->get_ad_units();
		} catch ( \Exception $error ) {
			$message = $error->getMessage();
			$error   = new WP_Error( 'newspack_ad_units', $message ? $message : __( 'Ad Units failed to fetch.', 'newspack' ) );
		}

		if ( \is_wp_error( $ad_units ) ) {
			$error = $ad_units;
		}

		return array(
			'services' => $services,
			'ad_units' => \is_wp_error( $ad_units ) ? array() : $ad_units,
			'error'    => $error,
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
				'label'     => $data['label'],
				'enabled'   => $configuration_manager->is_service_enabled( $service ),
				'available' => true,
			);
		}

		// Verify GAM connection and run initial setup.
		$gam_connection_status = $configuration_manager->get_gam_connection_status();
		if ( \is_wp_error( $gam_connection_status ) ) {
			$error_type = $gam_connection_status->get_error_code();
			if ( 'newspack_ads_gam_api_fatal_error' === $error_type ) {
				$services['google_ad_manager']['available'] = false;
			}
			$services['google_ad_manager']['status']['error'] = $gam_connection_status->get_error_message();
		} else {
			$services['google_ad_manager']['status']             = $gam_connection_status;
			$services['google_ad_manager']['available_networks'] = $configuration_manager->get_gam_available_networks();
			if ( true === $gam_connection_status['connected'] && ! isset( $gam_connection_status['error'] ) ) {
				$services['google_ad_manager']['network_code'] = $gam_connection_status['network_code'];
				$gam_setup_results                             = $configuration_manager->setup_gam();
				if ( ! \is_wp_error( $gam_setup_results ) ) {
					$services['google_ad_manager']['created_targeting_keys'] = $gam_setup_results['created_targeting_keys'];
				} else {
					$services['google_ad_manager']['status']['error'] = $gam_setup_results->get_error_message();
				}
			}
		}

		return $services;
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
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		\wp_enqueue_script(
			'advertising-display-ads',
			Newspack::plugin_url() . '/dist/billboard.js',
			$this->get_script_dependencies(),
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		\wp_register_style(
			'advertising-display-ads',
			Newspack::plugin_url() . '/dist/billboard.css',
			$this->get_style_dependencies(),
			NEWSPACK_PLUGIN_VERSION
		);
		\wp_style_add_data( 'advertising-display-ads', 'rtl', 'replace' );
		\wp_enqueue_style( 'advertising-display-ads' );

		\wp_localize_script(
			'advertising-display-ads',
			'newspack_ads_wizard',
			array(
				'iab_sizes'          => function_exists( '\Newspack_Ads\get_iab_sizes' ) ? \Newspack_Ads\get_iab_sizes() : array(),
				'mediakit_edit_url'  => get_option( 'pmk-page' ) ? get_edit_post_link( get_option( 'pmk-page' ) ) : '',
				'can_connect_google' => OAuth::is_proxy_configured( 'google' ),
			)
		);
	}

	/**
	 * Sanitize array of ad unit sizes.
	 *
	 * @param array $sizes Array of sizes to sanitize.
	 * @return array Sanitized array.
	 */
	public static function sanitize_sizes( $sizes ) {
		$sizes     = is_array( $sizes ) ? $sizes : array();
		$sanitized = array();
		foreach ( $sizes as $size ) {
			$size    = is_array( $size ) && 2 === count( $size ) ? $size : array( 0, 0 );
			$size[0] = absint( $size[0] );
			$size[1] = absint( $size[1] );

			$sanitized[] = $size;
		}
		return $sanitized;
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		global $submenu;
		// SVG generated via https://boxy-svg.com/ with path width/height 20px.
		$icon = 'data:image/svg+xml;base64,' . base64_encode( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="none" stroke="none" d="M 2 12 C 2 4.313 10.333 -0.491 17 3.352 C 20.094 5.136 22 8.433 22 12 C 22 19.686 13.667 24.49 7 20.647 C 3.906 18.863 2 15.567 2 12 Z M 12 3.727 C 5.622 3.727 1.635 10.621 4.824 16.136 C 6.304 18.696 9.04 20.273 12 20.273 C 18.378 20.273 22.365 13.378 19.176 7.863 C 17.696 5.304 14.96 3.727 12 3.727 Z M 10.471 9.292 C 10.112 9.543 10 9.808 10 10.003 C 10 10.198 10.112 10.463 10.471 10.714 C 10.827 10.962 11.366 11.144 12 11.144 C 12.943 11.144 13.834 11.41 14.512 11.883 C 15.186 12.356 15.714 13.089 15.714 13.997 C 15.714 14.904 15.187 15.637 14.512 16.11 C 14.043 16.436 13.475 16.664 12.857 16.774 L 12.857 17.135 C 12.857 17.793 12.143 18.205 11.571 17.876 C 11.306 17.723 11.143 17.44 11.143 17.135 L 11.143 16.774 C 10.55 16.675 9.985 16.448 9.488 16.11 C 8.814 15.637 8.286 14.904 8.286 13.997 C 8.286 13.338 9 12.926 9.571 13.255 C 9.837 13.408 10 13.691 10 13.997 C 10 14.192 10.112 14.456 10.471 14.707 C 10.827 14.956 11.366 15.138 12 15.138 C 12.634 15.138 13.173 14.956 13.529 14.707 C 13.888 14.456 14 14.192 14 13.997 C 14 13.801 13.888 13.537 13.529 13.286 C 13.173 13.037 12.634 12.855 12 12.855 C 11.057 12.855 10.166 12.59 9.488 12.116 C 8.814 11.644 8.286 10.91 8.286 10.003 C 8.286 9.095 8.813 8.362 9.488 7.889 C 9.985 7.552 10.55 7.324 11.143 7.225 L 11.143 6.865 C 11.143 6.206 11.857 5.794 12.429 6.123 C 12.694 6.276 12.857 6.559 12.857 6.865 L 12.857 7.225 C 13.474 7.335 14.045 7.563 14.512 7.889 C 15.186 8.362 15.714 9.095 15.714 10.003 C 15.714 10.661 15 11.073 14.429 10.744 C 14.163 10.591 14 10.308 14 10.003 C 14 9.808 13.888 9.543 13.529 9.292 C 13.173 9.043 12.634 8.862 12 8.862 C 11.366 8.862 10.827 9.043 10.471 9.292 Z"></path></svg>' );
		add_menu_page(
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			array( $this, 'render_wizard' ),
			$icon,
			3.5
		);
		add_submenu_page(
			$this->slug,
			__( 'Advertising / Display Ads', 'newspack-plugin' ),
			__( 'Display Ads', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			array( $this, 'render_wizard' )
		);
		$thing = true;
	}
}

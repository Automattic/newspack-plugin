<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use WP_REST_Request, WP_REST_Response, WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Configuration Wizard.
 */
class Audience_Configuration extends Wizard {

	const SKIP_CAMPAIGN_SETUP_OPTION = '_newspack_ras_skip_campaign_setup';

	/**
	 * Admin page slug.
	 * 
	 * @var string
	 */
	protected $slug = 'newspack-audience-configuration';

	/**
	 * Audience Configuration Constructor.
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
		return esc_html__( 'Audience Development / Configuration', 'newspack-plugin' );
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}
		parent::enqueue_scripts_and_styles();
		$data = [
			'has_memberships'       => class_exists( 'WC_Memberships' ),
			'reader_activation_url' => admin_url( 'admin.php?page=newspack-engagement-wizard#/reader-activation' ),
			'esp_metadata_fields'   => Reader_Activation\Sync\Metadata::get_default_fields(),
		];

		if ( method_exists( 'Newspack\Newsletters\Subscription_Lists', 'get_add_new_url' ) ) {
			$data['new_subscription_lists_url'] = \Newspack\Newsletters\Subscription_Lists::get_add_new_url();
		}

		if ( method_exists( 'Newspack_Newsletters_Subscription', 'get_lists' ) ) {
			$data['available_newsletter_lists'] = \Newspack_Newsletters_Subscription::get_lists();
		}

		$newspack_popups = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );

		if ( $newspack_popups->is_configured() ) {
			$data['preview_query_keys'] = $newspack_popups->preview_query_keys();
			$data['preview_post']       = $newspack_popups->preview_post();
			$data['preview_archive']    = $newspack_popups->preview_archive();
		}

		$data['is_skipped_campaign_setup'] = get_option( static::SKIP_CAMPAIGN_SETUP_OPTION, '' );

		wp_enqueue_script(
			$this->slug,
			Newspack::plugin_url() . '/dist/audience-configuration.js',
			$this->get_script_dependencies(),
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		
		wp_localize_script(
			$this->slug,
			'newspackAudienceConfiguration',
			$data
		);
	}

	/**
	 * Add Audience top-level and Configuration subpage to the /wp-admin menu.
	 */
	public function add_page() {
		// svg source - https://wphelpers.dev/icons/people
		// SVG generated via https://boxy-svg.com/ with path width/height 20px.
		$icon = 'data:image/svg+xml;base64,' . base64_encode(
			'<svg viewBox="20 20 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="none" stroke="none" d="M 36.242 29.578 C 37.176 29.578 37.759 28.568 37.292 27.76 C 37.075 27.385 36.675 27.154 36.242 27.154 C 35.309 27.154 34.726 28.164 35.193 28.972 C 35.41 29.347 35.81 29.578 36.242 29.578 Z M 36.242 31.396 C 38.576 31.396 40.033 28.872 38.867 26.851 C 38.325 25.913 37.325 25.336 36.242 25.336 C 33.909 25.336 32.452 27.861 33.618 29.881 C 34.16 30.819 35.16 31.396 36.242 31.396 Z M 33.515 38.669 L 33.515 36.245 C 33.515 34.404 32.023 32.912 30.182 32.912 L 25.333 32.912 C 23.492 32.912 22 34.404 22 36.245 L 22 38.669 L 23.818 38.669 L 23.818 36.245 C 23.818 35.409 24.497 34.73 25.333 34.73 L 30.182 34.73 C 31.018 34.73 31.697 35.409 31.697 36.245 L 31.697 38.669 L 33.515 38.669 Z M 42 36.245 L 42 38.669 L 40.182 38.669 L 40.182 36.245 C 40.182 35.409 39.503 34.73 38.667 34.73 L 35.636 34.73 L 35.636 32.912 L 38.667 32.912 C 40.508 32.912 42 34.404 42 36.245 Z M 28.97 28.366 C 28.97 29.299 27.96 29.882 27.152 29.416 C 26.777 29.199 26.545 28.799 26.545 28.366 C 26.545 27.433 27.555 26.85 28.364 27.316 C 28.738 27.533 28.97 27.933 28.97 28.366 Z M 30.788 28.366 C 30.788 30.699 28.263 32.156 26.242 30.99 C 25.304 30.448 24.727 29.448 24.727 28.366 C 24.727 26.033 27.252 24.576 29.273 25.742 C 30.211 26.284 30.788 27.284 30.788 28.366 Z"/>
</svg>' 
		);
		add_menu_page(
			$this->get_name(),
			__( 'Audience', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ],
			$icon,
			3.6
		);
		add_submenu_page(
			$this->slug,
			$this->get_name(),
			__( 'Configuration', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/reader-activation',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_reader_activation_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/reader-activation',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_reader_activation_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/reader-activation/activate',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_activate_reader_activation' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/reader-activation/skip-campaign-setup',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => function( $request ) {
					$skip = $request->get_param( 'skip' );
					$skip_campaign_setup = update_option( static::SKIP_CAMPAIGN_SETUP_OPTION, $skip );
					return rest_ensure_response(
						[
							'skipped' => $skip,
							'updated' => $skip_campaign_setup,
						]
					);
				},
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Get reader activation settings.
	 *
	 * @return WP_REST_Response
	 */
	public function api_get_reader_activation_settings() {
		return rest_ensure_response(
			[
				'config'               => Reader_Activation::get_settings(),
				'prerequisites_status' => Reader_Activation::get_prerequisites_status(),
				'memberships'          => self::get_memberships_settings(),
				'can_esp_sync'         => Reader_Activation\ESP_Sync::can_esp_sync( true ),
			]
		);
	}

	/**
	 * Update reader activation settings.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function api_update_reader_activation_settings( $request ) {
		$args = $request->get_params();
		foreach ( $args as $key => $value ) {
			Reader_Activation::update_setting( $key, $value );
		}

		// Update Memberships options.
		if ( isset( $args['memberships_require_all_plans'] ) ) {
			Memberships::set_require_all_plans_setting( (bool) $args['memberships_require_all_plans'] );
		}

		// Update Memberships options.
		if ( isset( $args['memberships_show_on_subscription_tab'] ) ) {
			Memberships::set_show_on_subscription_tab_setting( (bool) $args['memberships_show_on_subscription_tab'] );
		}

		return rest_ensure_response(
			[
				'config'               => Reader_Activation::get_settings(),
				'prerequisites_status' => Reader_Activation::get_prerequisites_status(),
				'memberships'          => self::get_memberships_settings(),
				'can_esp_sync'         => Reader_Activation\ESP_Sync::can_esp_sync( true ),
			]
		);
	}

	/**
	 * Activate reader activation and publish RAS prompts/segments.
	 *
	 * @param WP_REST_Request $request WP Rest Request object.
	 * @return WP_REST_Response
	 */
	public function api_activate_reader_activation( WP_REST_Request $request ) {
		$skip_activation = $request->get_param( 'skip_activation' ) ?? false;
		$response = $skip_activation ? true : Reader_Activation::activate();

		if ( is_wp_error( $response ) ) {
			return new WP_REST_Response( [ 'message' => $response->get_error_message() ], 400 );
		}

		if ( true === $response ) {
			Reader_Activation::update_setting( 'enabled', true );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Get memberships settings.
	 *
	 * @return array
	 */
	private static function get_memberships_settings() {
		return [
			'edit_gate_url'            => Memberships::get_edit_gate_url(),
			'gate_status'              => get_post_status( Memberships::get_gate_post_id() ),
			'plans'                    => Memberships::get_plans(),
			'require_all_plans'        => Memberships::get_require_all_plans_setting(),
			'show_on_subscription_tab' => Memberships::get_show_on_subscription_tab_setting(),
		];
	}
}

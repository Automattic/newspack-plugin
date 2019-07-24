<?php
/**
 * Newspack donations setup and management.
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for managing donations.
 */
class Donations_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-donations-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'edit_products';

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
		return esc_html__( 'Donations', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( "Set up and manage reader donations for consistent, predictable revenue", 'newspack' );
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
		// Get all Newspack subscriptions.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/donation/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_donation_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Save a subscription.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/donation/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_set_donation_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'image'     => [
						'sanitize_callback' => 'absint',
					],
					'name'      => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'suggestedAmount'     => [
						'sanitize_callback' => 'wc_format_decimal',
					]
				],
			]
		);
	}

	/**
	 * Check whether required plugins are installed and active.
	 *
	 * @return bool | WP_Error True on success, WP_Error on failure.
	 */
	protected function check_required_plugins_installed() {
		if ( ! function_exists( 'WC' ) || ! class_exists( 'WC_Subscriptions_Product' ) || ! class_exists( 'WC_Name_Your_Price_Helpers' ) ) {
			return new WP_Error(
				'newspack_missing_required_plugin',
				esc_html__( 'The required plugins are not installed and activated. Install and/or activate them to access this feature.', 'newspack' ),
				[
					'status' => 400,
					'level'  => 'fatal',
				]
			);
		}
		return true;
	}

	/**
	 * API endpoint for getting donation settings.
	 *
	 * @return WP_REST_Response containing info.
	 */
	public function api_get_donation_settings() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'woocommerce' );
		return rest_ensure_response( $configuration_manager->get_donation_settings() );
	}

	/**
	 * API endpoint for setting the donation settings.
	 *
	 * @param WP_REST_Request $request Request containing settings.
	 * @return WP_REST_Response with the latest settings.
	 */
	public function api_set_donation_settings( $request ) {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		$configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'woocommerce' );
		return rest_ensure_response( $configuration_manager->set_donation_settings( $request->get_params() ) );
	}

	/**
	 * Enqueue Donations Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}
		wp_enqueue_script(
			'newspack-donations-wizard',
			Newspack::plugin_url() . '/assets/dist/donations.js',
			[ 'wp-components', 'wp-api-fetch' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/donations.js' ),
			true
		);
		wp_register_style(
			'newspack-donations-wizard',
			Newspack::plugin_url() . '/assets/dist/donations.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/donations.css' )
		);
		wp_style_add_data( 'newspack-donations-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-donations-wizard' );
	}
}

<?php
/**
 * Newspack Memberships landing page setup.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Guided setup of a memberships landing page.
 */
class Memberships_Page_Wizard extends Wizard {
	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-memberships-page-wizard';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'edit_posts';

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
		return esc_html__( 'Customize your memberships page', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return esc_html__( 'Create a memberships page that converts.', 'newspack' );
	}

	/**
	 * Get the expected duration of this wizard.
	 *
	 * @return string The wizard length.
	 */
	public function get_length() {
		return esc_html__( '20 minutes', 'newspack' );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		/*
		// Get whether adsense is configured or not.
		register_rest_route(
			'newspack/v1/wizard/' . $this->slug,
			'/adsense-setup-complete',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_adsense_setup_complete' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);*/
	}

	/**
	 * Get whether AdSense setup is complete.
	 *
	 * @return WP_REST_Response containing info (bool).
	 */
	public function api_get_adsense_setup_complete() {
		$required_plugins_installed = $this->check_required_plugins_installed();
		if ( is_wp_error( $required_plugins_installed ) ) {
			return rest_ensure_response( $required_plugins_installed );
		}

		$configuration = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'google-site-kit' );
		if ( is_wp_error( $configuration ) ) {
			return rest_ensure_response( $configuration );
		}

		return rest_ensure_response( $configuration->is_module_configured( 'adsense' ) );
	}

	/**
	 * Check whether the WC plugins are installed and active.
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
	 * Enqueue Subscriptions Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();
		wp_enqueue_media();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		wp_enqueue_script(
			'newspack-memberships-page-wizard',
			Newspack::plugin_url() . '/assets/dist/membershipsPage.js',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/membershipsPage.js' ),
			true
		);

		wp_register_style(
			'newspack-memberships-page-wizard',
			Newspack::plugin_url() . '/assets/dist/membershipsPage.css',
			[ 'wp-components' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/assets/dist/membershipsPage.css' )
		);
		wp_style_add_data( 'newspack-memberships-page-wizard', 'rtl', 'replace' );
		wp_enqueue_style( 'newspack-memberships-page-wizard' );
	}
}

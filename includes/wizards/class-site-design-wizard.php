<?php
/**
 * Newspack's Site Design Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error, WP_Query, WP_REST_Server;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';
require_once NEWSPACK_ABSPATH . '/includes/wizards/class-setup-wizard.php';

/**
 * Site Design
 */
class Site_Design_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	public $slug = 'newspack-site-design-wizard';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/theme',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_retrieve_theme_and_set_defaults' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/theme',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_theme_with_mods' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Retrieve the theme and set defaults.
	 */
	public function api_retrieve_theme_and_set_defaults() {
		$setup_wizard = new Setup_Wizard();
		return $setup_wizard->api_retrieve_theme_and_set_defaults();
	}

	/**
	 * Update the theme with mods.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function api_update_theme_with_mods( $request ) {
		$setup_wizard = new Setup_Wizard();
		return $setup_wizard->api_update_theme_with_mods( $request );
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return \esc_html__( 'Site Design', 'newspack' );
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
			'newspack-site-design-wizard',
			Newspack::plugin_url() . '/dist/site-design.js',
			$this->get_script_dependencies(),
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		\wp_register_style(
			'newspack-site-design-wizard',
			Newspack::plugin_url() . '/dist/site-design.css',
			$this->get_style_dependencies(),
			NEWSPACK_PLUGIN_VERSION
		);
		\wp_style_add_data( 'newspack-site-design-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-site-design-wizard' );
	}
}

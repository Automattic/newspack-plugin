<?php
/**
 * Newspack Pop-ups Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use \WP_Error, \WP_Query;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Interface for managing Pop-ups.
 */
class Popups_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-popups-wizard';

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
		return \esc_html__( 'Pop-ups', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Reach your readers with configurable calls-to-action.', 'newspack' );
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
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug,
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Enqueue Wizard scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_STRING ) !== $this->slug ) {
			return;
		}

		\wp_enqueue_script(
			'newspack-popups-wizard',
			Newspack::plugin_url() . '/dist/popups.js',
			$this->get_script_dependencies( [ 'wp-html-entities' ] ),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/popups.js' ),
			true
		);

		\wp_register_style(
			'newspack-popups-wizard',
			Newspack::plugin_url() . '/dist/popups.css',
			$this->get_style_dependencies(),
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/popups.css' )
		);
		\wp_style_add_data( 'newspack-popups-wizard', 'rtl', 'replace' );
		\wp_enqueue_style( 'newspack-popups-wizard' );
	}

	/**
	 * API endpoint callbacks
	 */

	/**
	 * Get data to render Wizard.
	 *
	 * @return WP_REST_Response
	 */
	public function api_get_settings() {
		$newspack_popups_configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );

		$response = [
			'popups' => [],
		];

		if ( $newspack_popups_configuration_manager->is_configured() ) {
			$response['popups'] = array_map(
				function( $popup ) {
					$popup['edit_link'] = get_edit_post_link( $popup['id'] );
					return $popup;
				},
				$newspack_popups_configuration_manager->get_popups()
			);
		}
		return rest_ensure_response( $response );
	}
}

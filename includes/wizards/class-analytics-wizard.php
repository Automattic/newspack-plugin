<?php
/**
 * Newspack's Analytics Wizard
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
class Analytics_Wizard extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-analytics-wizard';

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
		return \esc_html__( 'Analytics', 'newspack' );
	}

	/**
	 * Get the description of this wizard.
	 *
	 * @return string The wizard description.
	 */
	public function get_description() {
		return \esc_html__( 'Track traffic and activity.', 'newspack' );
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
		// Get info.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug,
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_fetch' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Save info.
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug,
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'eventsEnabled'         => [
						'sanitize_callback' => 'Newspack\newspack_string_to_bool',
					],
					'activeEventCategories' => [
						'validate_callback' => [ $this, 'api_validate_not_empty' ],
					],
				],
			]
		);
	}

	/**
	 * Get wizard info.
	 */
	public function api_fetch() {
		return \rest_ensure_response( 
			[
				'eventsEnabled'   => Analytics::events_enabled(),
				'eventCategories' => array_values( Analytics::get_event_categories() ),
			] 
		);
	}

	/**
	 * Update wizard info.
	 *
	 * @param WP_REST_Request $request Request object.
	 */
	public function api_update( $request ) {
		$enabled = $request['eventsEnabled'];
		if ( $enabled ) {
			Analytics::enable_events();
		} else {
			Analytics::disable_events();
		}

		foreach ( $request['eventCategories'] as $event_category ) {
			if ( $event_category['active'] ) {
				Analytics::enable_event_category( $event_category['name'] );
			} else {
				Analytics::disable_event_category( $event_category['name'] );
			}
		}

		return $this->api_fetch();
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
			'newspack-analytics-wizard',
			Newspack::plugin_url() . '/dist/analytics.js',
			[ 'wp-components', 'wp-api-fetch' ],
			filemtime( dirname( NEWSPACK_PLUGIN_FILE ) . '/dist/analytics.js' ),
			true
		);
	}
}

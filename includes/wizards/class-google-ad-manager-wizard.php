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
		\add_action( 'amp_post_template_head', [ $this, 'amp_post_template_head' ] );
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
					'id'        => [
						'sanitize_callback' => 'absint',
					],
					'name'      => [
						'sanitize_callback' => 'sanitize_text_field',
					],
					'code'     => [
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
	 * Insert the AMP Ad component JS if there are ads configured.
	 */
	public function amp_post_template_head() {
		if ( empty( $this->_get_ad_units() ) ) {
			return;
		}

		echo '<script async custom-element="amp-ad" src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"></script>';
	}

	/**
	 * Get the Ad Manager ad units.
	 *
	 * @return WP_REST_Response containing ad units info.
	 */
	public function api_get_adunits() {
		$ad_units = $this->_get_ad_units();
		return \rest_ensure_response( $ad_units );
	}

	/**
	 * Get one ad unit.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response containing ad unit info.
	 */
	public function api_get_adunit( $request ) {

		$params  = $request->get_params();
		$id      = $params['id'];

		$ad_units = $this->_get_ad_units();
		if ( ! empty( $ad_units ) && isset( $ad_units[ $id ] ) ) {
			return \rest_ensure_response( $ad_units[ $id ] );
		} else {
			return new WP_Error(
				'newspack_rest_invalid_adunit',
				\esc_html__( 'Ad unit does not exist.', 'newspack' ),
				[
					'status' => 404,
				]
			);
		}

	}

	/**
	 * Save an ad unit.
	 *
	 * @param WP_REST_Request $request Ad unit info.
	 * @return WP_REST_Response Updated ad unit info.
	 */
	public function api_save_adunit( $request ) {
		$params   = $request->get_params();
		$defaults = $adunit = [
			'id'   => 0,
			'name' => '',
			'code' => '',
		];
		$args     = \wp_parse_args( $params, $defaults );

		// Update and existing or add a new ad unit.
		$adunit = ( 0 === $args['id'] )
			? $this->_add_ad_unit( $args )
			: $this->_update_ad_unit( $args );

		return \rest_ensure_response( $adunit );
	}

	/**
	 * Delete an ad unit.
	 *
	 * @param WP_REST_Request $request Request with ID of ad unit to delete.
	 * @return WP_REST_Response Boolean Delete success.
	 */
	public function api_delete_adunit( $request ) {

		$params  = $request->get_params();
		$id      = $params['id'];

		$ad_unit = $this->_get_ad_unit( $id );
		if ( \is_wp_error( $ad_unit ) ) {
			$response = $ad_unit;
		} else {
			$response = $this->_delete_ad_unit( $id );
		}

		return \rest_ensure_response( $response );
	}

	/**
	 * Get the ad units from our saved option.
	 */
	private function _get_ad_units(){
		$ad_units = [];
		$args = [
			'post_type' => \Newspack\Model\GoogleAdManager\POST_TYPE,
			'posts_per_page' => -1,
		];

		$query = new \WP_Query( $args );
		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$ad_units[] = [
					'id'   => \get_the_ID(),
					'name' => html_entity_decode( \get_the_title() ),
					'code' => \get_post_meta( get_the_ID(), 'newspack_ad_code', true ),
				];
			}
		}

		return $ad_units;
	}

	/**
	 * Get a single ad unit.
	 */
	private function _get_ad_unit( $id ) {
		$ad_unit = \get_post( $id );
		if ( is_a( $ad_unit, 'WP_Post' ) ) {
			return [
				'id' => $ad_unit->ID,
				'name' => $ad_unit->post_title,
				'code' => \get_post_meta( $ad_unit->ID, 'newspack_ad_code', true ),
			];
		} else {
			return new WP_Error(
				'newspack_no_adspot_found',
				\esc_html__( 'No such ad spot.', 'newspack' ),
				[
					'status' => '400',
				]
			);
		}
	}

	/**
	 * Add a new ad unit.
	 * @param array $ad_unit {
	 * 		The new ad unit info to add.
	 *
	 * 		@type string $name A descriptive name for the ad unit.
	 * 		@type string $code The actual pasted ad code.
	 * }
	 */
	private function _add_ad_unit( $ad_unit ) {

		// Sanitise the values.
		$ad_unit = $this->_sanitise_ad_unit( $ad_unit );
		if ( \is_wp_error( $ad_unit ) ) {
			return $ad_unit;
		}

		// Save the ad unit.
		$ad_unit_post = \wp_insert_post(
			[
				'post_author' => \get_current_user_id(),
				'post_title' => $ad_unit['name'],
				'post_type' => \Newspack\Model\GoogleAdManager\POST_TYPE,
				'post_status' => 'publish',
			]
		);
		if ( \is_wp_error( $ad_unit_post ) ) {
			return new WP_Error(
				'newspack_ad_unit_exists',
				\esc_html__( 'An ad unit with that name already exists', 'newspack' ),
				[
					'status' => '400',
				]
			);
		}

		// Add the code to our new post.
		\add_post_meta( $ad_unit_post, 'newspack_ad_code', $ad_unit['code'] );

		return [
			'id' => $ad_unit_post,
			'name' => $ad_unit['name'],
			'code' => $ad_unit['code'],
		];

	}

	private function _update_ad_unit( $ad_unit ) {

		// Sanitise the values.
		$ad_unit = $this->_sanitise_ad_unit( $ad_unit );
		if ( \is_wp_error( $ad_unit ) ) {
			return $ad_unit;
		}

		$ad_unit_post = \get_post( $ad_unit['id'] );
		if ( ! is_a( $ad_unit_post, 'WP_Post' ) ) {
			return new WP_Error(
				'newspack_ad_unit_not_exists',
				\esc_html__( "Can't update an ad unit that doesn't already exist", 'newspack' ),
				[
					'status' => '400',
				]
			);
		}

		\wp_update_post( [
			'ID' => $ad_unit['id'],
			'post_title' => $ad_unit['name'],
		] );
		\update_post_meta( $ad_unit['id'], 'newspack_ad_code', $ad_unit['code'] );

		return [
			'id' => $ad_unit['id'],
			'name' => $ad_unit['name'],
			'code' => $ad_unit['code'],
		];

	}

	private function _delete_ad_unit( $id ) {

		$ad_unit_post = \get_post( $id );
		if ( ! is_a( $ad_unit_post, 'WP_Post' ) ) {
			return new WP_Error(
				'newspack_ad_unit_not_exists',
				\esc_html__( "Can't update an ad unit that doesn't already exist", 'newspack' ),
				[
					'status' => '400',
				]
			);
		} else {
			\wp_delete_post( $id );
			return true;
		}

	}

	private function _sanitise_ad_unit( $ad_unit ) {

		if (
			! array_key_exists( 'name', $ad_unit ) ||
			! array_key_exists( 'code', $ad_unit )
		) {
			return new WP_Error(
				'newspack_invalid_ad_unit_data',
				\esc_html__( 'Ad spot data is invalid - name or code is missing!' ),
				[
					'status' => '400',
				]
			);
		}

		$sanitised_ad_unit = [
			'name' => \esc_html( $ad_unit['name'] ),
			'code' => $ad_unit['code'], // esc_js( $ad_unit['code'] ), @todo If a `script` tag goes here, esc_js is the wrong function to use.

		];

		if ( isset( $ad_unit['id'] ) ) {
			$sanitised_ad_unit['id'] = (int) $ad_unit['id'];
		}

		return $sanitised_ad_unit;

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
			[ 'wp-components' ],
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

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
	 * The name for the option where we store ad codes.
	 */
	protected $option = 'newspack_admanager_adslots';

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

		// Get all Newspack ad slots.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adslots/',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_adslots' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		// Get one ad slot.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adslots/(?P<id>\d+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'api_get_adslots' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Save a ad slot.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adslots/',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'api_save_adslot' ],
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

		// Delete a ad slot.
		\register_rest_route(
			'newspack/v1/wizard/',
			'/adslots/(?P<id>\d+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'api_delete_adslot' ],
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
	 * Get the Ad Manager ad slots.
	 *
	 * @return WP_REST_Response containing ad slots info.
	 */
	public function api_get_adslots() {
		$ad_slots = $this->get_ad_slots();
		return \rest_ensure_response( $ad_slots );
	}

	/**
	 * Get one ad slot.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response containing ad slot info.
	 */
	public function api_get_adslot( $request ) {

		$params  = $request->get_params();
		$id      = $params['id'];

		$ad_slots = $this->get_ad_slots();
		if ( ! empty( $ad_slots ) && isset( $ad_slots[ $id ] ) ) {
			return \rest_ensure_response( $ad_slots[ $id ] );
		} else {
			return new WP_Error(
				'newspack_rest_invalid_adslot',
				\esc_html__( 'Advert does not exist.', 'newspack' ),
				[
					'status' => 404,
				]
			);
		}

	}

	/**
	 * Save an ad slot.
	 *
	 * @param WP_REST_Request $request Ad slot info.
	 * @return WP_REST_Response Updated ad slot info.
	 */
	public function api_save_adslot( $request ) {
		$params   = $request->get_params();
		$defaults = $adslot = [
			'id'   => 0,
			'name' => '',
			'code' => '',
		];
		$args     = \wp_parse_args( $params, $defaults );

		// Update and existing or add a new ad slot.
		$adslot = ( 0 === $args['id'] )
			? $this->add_ad_slot( $args )
			: $this->update_ad_slot( $args );

		return \rest_ensure_response( $adslot );
	}

	/**
	 * Delete an ad slot.
	 *
	 * @param WP_REST_Request $request Request with ID of ad slot to delete.
	 * @return WP_REST_Response Boolean Delete success.
	 */
	public function api_delete_adslot( $request ) {

		$params  = $request->get_params();
		$id      = $params['id'];

		$ad_slot = $this->get_ad_slot( $id );
		if ( \is_wp_error( $ad_slot ) ) {
			$response = $ad_slot;
		} else {
			$response = $this->delete_ad_slot( $id );
		}

		return \rest_ensure_response( $response );
	}

	/**
	 * Get the ad slots from our saved option.
	 */
	public function get_ad_slots(){
		$ad_slots = [];
		$args = [
			'post_type' => \Newspack\Model\GoogleAdManager\POST_TYPE,
			'posts_per_page' => -1,
		];

		$slots = \get_posts( $args );
		foreach ( $slots as $slot ) {
			$ad_slots[] = [
				'id' => $slot->ID,
				'name' => $slot->post_title,
				'code' => \get_post_meta( $slot->ID, 'newspack_ad_code', true ),
			];
		}

		return $ad_slots;
	}

	/**
	 * Get a single ad slot.
	 */
	public function get_ad_slot( $id ) {
		$ad_slot = \get_post( $id );
		if ( is_a( $ad_slot, 'WP_Post' ) ) {
			return [
				'id' => $ad_slot->ID,
				'name' => $ad_slot->post_title,
				'code' => \get_post_meta( $ad_slot->ID, 'newspack_ad_code', true ),
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
	 * Add a new ad slot.
	 * @param array $ad_slot {
	 * 		The new ad slot info to add.
	 *
	 * 		@type string $name A descriptive name for the ad slot.
	 * 		@type string $code The actual pasted ad code.
	 * }
	 */
	public function add_ad_slot( $ad_slot ) {

		// Sanitise the values.
		$ad_slot = $this->sanitise_ad_slot( $ad_slot );
		if ( \is_wp_error( $ad_slot ) ) {
			return $ad_slot;
		}

		// Save the ad slot.
		$ad_slot_post = \wp_insert_post(
			[
				'post_author' => \get_current_user_id(),
				'post_title' => $ad_slot['name'],
				'post_type' => \Newspack\Model\GoogleAdManager\POST_TYPE,
				'post_status' => 'publish',
			]
		);
		if ( \is_wp_error( $ad_slot_post ) ) {
			return new WP_Error(
				'newspack_ad_slot_exists',
				\esc_html__( 'An advert with that name already exists', 'newspack' ),
				[
					'status' => '400',
				]
			);
		}

		// Add the code to our new post.
		\add_post_meta( $ad_slot_post, 'newspack_ad_code', $ad_slot['code'] );

		return [
			'id' => $ad_slot_post,
			'name' => $ad_slot['name'],
			'code' => $ad_slot['code'],
		];

	}

	public function update_ad_slot( $ad_slot ) {

		// Sanitise the values.
		$ad_slot = $this->sanitise_ad_slot( $ad_slot );
		if ( \is_wp_error( $ad_slot ) ) {
			return $ad_slot;
		}

		$ad_slot_post = \get_post( $ad_slot['id'] );
		if ( ! is_a( $ad_slot_post, 'WP_Post' ) ) {
			return new WP_Error(
				'newspack_ad_slot_not_exists',
				\esc_html__( "Can't update an advert that doesn't already exist", 'newspack' ),
				[
					'status' => '400',
				]
			);
		}

		\wp_update_post( [
			'ID' => $ad_slot['id'],
			'post_title' => $ad_slot['name'],
		] );
		\update_post_meta( $ad_slot['id'], 'newspack_ad_code', $ad_slot['code'] );

		return [
			'id' => $ad_slot['id'],
			'name' => $ad_slot['name'],
			'code' => $ad_slot['code'],
		];

	}

	public function delete_ad_slot( $id ) {

		$ad_slot_post = \get_post( $id );
		if ( ! is_a( $ad_slot_post, 'WP_Post' ) ) {
			return new WP_Error(
				'newspack_ad_slot_not_exists',
				\esc_html__( "Can't update an advert that doesn't already exist", 'newspack' ),
				[
					'status' => '400',
				]
			);
		} else {
			\wp_delete_post( $id );
			return true;
		}

	}

	public function sanitise_ad_slot( $ad_slot ) {

		if (
			! array_key_exists( 'name', $ad_slot ) ||
			! array_key_exists( 'code', $ad_slot )
		) {
			return new WP_Error(
				'newspack_invalid_ad_slot_data',
				\esc_html__( 'Ad spot data is invalid - name or code is missing!' ),
				[
					'status' => '400',
				]
			);
		}

		$sanitised_ad_slot = [
			'name' => \esc_html( $ad_slot['name'] ),
			'code' => $ad_slot['code'], // esc_js( $ad_slot['code'] ), @todo If a `script` tag goes here, esc_js is the wrong function to use.

		];

		if ( isset( $ad_slot['id'] ) ) {
			$sanitised_ad_slot['id'] = (int) $ad_slot['id'];
		}

		return $sanitised_ad_slot;

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

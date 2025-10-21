<?php
/**
 * Audience Content Gates Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Campaigns Wizard.
 */
class Audience_Content_Gates extends Wizard {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-audience-content-gates';

	/**
	 * Parent slug.
	 *
	 * @var string
	 */
	protected $parent_slug = 'newspack-audience';

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
		return esc_html__( 'Audience Management / Content Gates', 'newspack-plugin' );
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() || ! $this->is_feature_enabled() ) {
			return;
		}

		parent::enqueue_scripts_and_styles();

		wp_enqueue_script( 'newspack-wizards' );
		$content_rules = [
			'post_types' => [
				'label'   => __( 'Post Types', 'newspack-plugin' ),
				'options' => Content_Restriction_Control::get_available_post_types(),
			],
		];
		$available_taxonomies = Content_Restriction_Control::get_available_taxonomies();
		foreach ( $available_taxonomies as $taxonomy ) {
			$content_rules[ $taxonomy['name'] ] = [
				'label' => $taxonomy['label'],
			];
		}

		\wp_localize_script(
			'newspack-wizards',
			'newspackAudienceContentGates',
			[
				'api'             => '/' . NEWSPACK_API_NAMESPACE . '/wizard/' . $this->slug,
				'available_rules' => Access_Rules::get_access_rules(),
				'content_rules'   => $content_rules,
			]
		);
	}

	/**
	 * Add Audience top-level and Content Gate subpage to the /wp-admin menu.
	 */
	public function add_page() {
		if ( ! $this->is_feature_enabled() ) {
			return;
		}

		add_submenu_page(
			$this->parent_slug,
			$this->get_name(),
			esc_html__( 'Content Gates', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		if ( ! $this->is_feature_enabled() ) {
			return;
		}

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/content-gate',
			[
				'methods'  => 'GET',
				'callback' => [ $this, 'get_gates' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/content-gate',
			[
				'methods'  => 'POST',
				'callback' => [ $this, 'create_gate' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/content-gate/(?P<id>\d+)',
			[
				'methods'  => 'DELETE',
				'callback' => [ $this, 'delete_gate' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/content-gate/(?P<id>\d+)',
			[
				'methods'  => 'PUT',
				'callback' => [ $this, 'update_gate' ],
			]
		);
	}

	/**
	 * Check feature flag status.
	 *
	 * @return bool
	 */
	public function is_feature_enabled() {
		return defined( 'NEWSPACK_CONTENT_GATES' ) && NEWSPACK_CONTENT_GATES;
	}

	/**
	 * Get the gates.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_gates() {
		return rest_ensure_response( Content_Gate::get_gates() );
	}

	/**
	 * Create a gate.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response
	 */
	public function create_gate( $request ) {
		return rest_ensure_response( Content_Gate::create_gate( $request->get_param( 'title' ) ) );
	}

	/**
	 * Delete a gate.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_gate( $request ) {
		$id = $request->get_param( 'id' );
		$gate = get_post( $id );
		if ( ! $gate ) {
			return new \WP_Error( 'invalid_gate_id', __( 'Invalid gate ID.', 'newspack-plugin' ), [ 'status' => 400 ] );
		}
		if ( Content_Gate::GATE_CPT !== $gate->post_type ) {
			return new \WP_Error( 'invalid_gate_type', __( 'Invalid gate type.', 'newspack-plugin' ), [ 'status' => 400 ] );
		}
		wp_delete_post( $id, true );
		return rest_ensure_response( true );
	}
}

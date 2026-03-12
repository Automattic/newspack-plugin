<?php
/**
 * Newspack Status page.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Status page for viewing Newspack ActionScheduler actions.
 */
class Newspack_Status extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-status';

	/**
	 * The capability required to access this.
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
		return esc_html__( 'Status', 'newspack-plugin' );
	}

	/**
	 * Add a submenu page under the Newspack menu.
	 */
	public function add_page() {
		add_submenu_page(
			'newspack-dashboard',
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Register REST API endpoints.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'wizard/' . $this->slug . '/actions',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_actions' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'per_page' => [
						'type'              => 'integer',
						'default'           => 20,
						'sanitize_callback' => 'absint',
					],
					'page'     => [
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
					],
					'status'   => [
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'group'    => [
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'orderby'  => [
						'type'              => 'string',
						'default'           => 'scheduled_date_gmt',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'order'    => [
						'type'              => 'string',
						'default'           => 'DESC',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'hook'     => [
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'search'   => [
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'wizard/' . $this->slug . '/groups',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_groups' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'wizard/' . $this->slug . '/hooks',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_hooks' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'wizard/' . $this->slug . '/actions/(?P<id>\d+)/run',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_run_action' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'id' => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * Get ActionScheduler actions.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function api_get_actions( $request ) {
		if ( ! Action_Scheduler::is_available() ) {
			return new \WP_REST_Response(
				[
					'actions'     => [],
					'total'       => 0,
					'page'        => 1,
					'total_pages' => 0,
				]
			);
		}

		$per_page = $request->get_param( 'per_page' );
		$page     = $request->get_param( 'page' );
		$status   = $request->get_param( 'status' );
		$group    = $request->get_param( 'group' );
		$hook     = $request->get_param( 'hook' );
		$search   = $request->get_param( 'search' );

		$query_args = [
			'per_page' => $per_page,
			'offset'   => ( $page - 1 ) * $per_page,
			'orderby'  => $request->get_param( 'orderby' ),
			'order'    => $request->get_param( 'order' ),
		];

		if ( ! empty( $status ) ) {
			$query_args['status'] = $status;
		}

		if ( ! empty( $group ) ) {
			$query_args['groups'] = [ $group ];
		}

		if ( ! empty( $hook ) ) {
			$query_args['hook'] = $hook;
		}

		if ( ! empty( $search ) ) {
			$query_args['search'] = $search;
		}

		$actions = Action_Scheduler::get_scheduled_actions( $query_args );
		$total   = Action_Scheduler::count_scheduled_actions( $query_args );

		// Resolve group slugs for display.
		$group_map = Action_Scheduler::get_group_map();

		$formatted = array_map(
			function ( $action ) use ( $group_map ) {
				return [
					'id'            => (int) $action->action_id,
					'hook'          => $action->hook,
					'status'        => $action->status,
					'group'         => $group_map[ $action->group_id ] ?? __( 'Unknown', 'newspack-plugin' ),
					'scheduled'     => $action->scheduled_date_gmt,
					'last_attempt'  => $action->last_attempt_gmt ?? null,
					'claim_id'      => (int) ( $action->claim_id ?? 0 ),
					'extended_args' => $action->extended_args ?? '',
					'args'          => $action->args,
				];
			},
			$actions
		);

		return new \WP_REST_Response(
			[
				'actions'     => $formatted,
				'total'       => $total,
				'page'        => $page,
				'total_pages' => (int) ceil( $total / $per_page ),
			]
		);
	}

	/**
	 * Run a scheduled action immediately.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function api_run_action( $request ) {
		if ( ! Action_Scheduler::is_available() ) {
			return new \WP_Error( 'action_scheduler_unavailable', __( 'ActionScheduler is not available.', 'newspack-plugin' ), [ 'status' => 500 ] );
		}

		$action_id = $request->get_param( 'id' );
		$store     = \ActionScheduler_Store::instance();
		$status    = $store->get_status( $action_id );

		if ( false === $status ) {
			return new \WP_Error( 'action_not_found', __( 'Action not found.', 'newspack-plugin' ), [ 'status' => 404 ] );
		}

		if ( \ActionScheduler_Store::STATUS_COMPLETE === $status ) {
			return new \WP_Error( 'action_already_complete', __( 'This action has already completed.', 'newspack-plugin' ), [ 'status' => 400 ] );
		}

		try {
			$runner = new \ActionScheduler_QueueRunner( $store );
			$runner->process_action( $action_id, 'Newspack Status' );
		} catch ( \Exception $e ) {
			return new \WP_Error( 'action_execution_failed', $e->getMessage(), [ 'status' => 500 ] );
		}

		$new_status = $store->get_status( $action_id );

		return new \WP_REST_Response(
			[
				'success' => true,
				'status'  => $new_status,
			]
		);
	}

	/**
	 * Get all Newspack ActionScheduler groups.
	 *
	 * @return \WP_REST_Response
	 */
	public function api_get_groups() {
		return new \WP_REST_Response( Action_Scheduler::get_all_groups() );
	}

	/**
	 * Get distinct hook names for Newspack ActionScheduler actions.
	 *
	 * @return \WP_REST_Response
	 */
	public function api_get_hooks() {
		return new \WP_REST_Response( Action_Scheduler::get_hooks() );
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		wp_enqueue_style(
			'wp-dataviews',
			Newspack::plugin_url() . '/dist/dataviews-style.css',
			[ 'wp-components' ],
			NEWSPACK_PLUGIN_VERSION
		);
		wp_enqueue_script( 'newspack-wizards' );
	}
}

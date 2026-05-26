<?php
/**
 * Audience Integrations Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Integrations;
use WP_Error, WP_REST_Request, WP_REST_Response, WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Integrations Wizard.
 */
class Audience_Integrations extends Wizard {
	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-audience-integrations';

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
		if ( ! self::is_enabled() ) {
			return;
		}
		parent::__construct();
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Check if the integrations settings feature is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return defined( 'NEWSPACK_INTEGRATIONS_SETTINGS_ENABLED' ) && NEWSPACK_INTEGRATIONS_SETTINGS_ENABLED;
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Audience Management / Integrations', 'newspack-plugin' );
	}

	/**
	 * Add Integrations page.
	 */
	public function add_page() {
		add_submenu_page(
			$this->parent_slug,
			$this->get_name(),
			esc_html__( 'Integrations', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		parent::enqueue_scripts_and_styles();

		wp_enqueue_script( 'newspack-wizards' );

		$localized_data = [
			'integrations_settings_enabled' => self::is_enabled(),
		];

		if ( class_exists( 'Newspack_Newsletters' ) ) {
			$localized_data['esp_provider'] = \Newspack_Newsletters::service_provider();
		}

		\wp_localize_script(
			'newspack-wizards',
			'newspackAudienceIntegrations',
			$localized_data
		);
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/settings',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_integration_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/settings/(?P<integration_id>[a-zA-Z0-9_-]+)',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_integration_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/settings/(?P<integration_id>[a-zA-Z0-9_-]+)/enabled',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_integration_enabled' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/settings/(?P<integration_id>[a-zA-Z0-9_-]+)/logs',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_integration_logs' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'per_page' => [
						'type'              => 'integer',
						'default'           => 25,
						'minimum'           => 1,
						'maximum'           => 100,
						'sanitize_callback' => 'absint',
					],
					'page'     => [
						'type'              => 'integer',
						'default'           => 1,
						'minimum'           => 1,
						'sanitize_callback' => 'absint',
					],
					'orderby'  => [
						'type'    => 'string',
						'default' => 'scheduled_date_gmt',
						'enum'    => [ 'scheduled_date_gmt', 'action_id', 'hook', 'status' ],
					],
					'order'    => [
						'type'    => 'string',
						'default' => 'DESC',
						'enum'    => [ 'ASC', 'DESC' ],
					],
					'search'   => [
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'status'   => [
						'type'    => 'string',
						'default' => '',
						'enum'    => [ '', 'pending', 'complete', 'failed', 'canceled' ],
					],
				],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/settings/(?P<integration_id>[a-zA-Z0-9_-]+)/logs/(?P<action_id>[0-9]+)',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_integration_log_detail' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'integration_id' => [
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_key',
					],
					'action_id'      => [
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->slug . '/settings/(?P<integration_id>[a-zA-Z0-9_-]+)/logs/(?P<action_id>[0-9]+)/run',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_run_integration_action' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'integration_id' => [
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_key',
					],
					'action_id'      => [
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * Get all integration settings.
	 *
	 * @return WP_REST_Response
	 */
	public function api_get_integration_settings() {
		return rest_ensure_response( Integrations::get_all_integration_settings() );
	}

	/**
	 * Update settings for a specific integration.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function api_update_integration_settings( WP_REST_Request $request ) {
		$integration_id = $request->get_param( 'integration_id' );
		$settings       = $request->get_param( 'settings' );

		if ( ! is_array( $settings ) ) {
			return new WP_Error(
				'newspack_invalid_param',
				esc_html__( 'Settings must be an object of key-value pairs.', 'newspack-plugin' ),
				[ 'status' => 400 ]
			);
		}

		$result = Integrations::update_integration_settings( $integration_id, $settings );
		if ( null === $result ) {
			return new WP_Error(
				'newspack_integration_not_found',
				esc_html__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		return rest_ensure_response( Integrations::get_all_integration_settings() );
	}

	/**
	 * Update the enabled state of a specific integration.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function api_update_integration_enabled( WP_REST_Request $request ) {
		$integration_id = $request->get_param( 'integration_id' );
		$enabled        = $request->get_param( 'enabled' );

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration ) {
			return new WP_Error(
				'newspack_integration_not_found',
				esc_html__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		if ( $enabled ) {
			Integrations::enable( $integration_id );
		} else {
			Integrations::disable( $integration_id );
		}

		return rest_ensure_response( Integrations::get_all_integration_settings() );
	}

	/**
	 * Get activity logs for a specific integration.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function api_get_integration_logs( WP_REST_Request $request ) {
		$integration_id = $request->get_param( 'integration_id' );
		$integration    = Integrations::get_integration( $integration_id );

		if ( ! $integration ) {
			return new WP_Error(
				'newspack_integration_not_found',
				esc_html__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$per_page = max( 1, (int) $request->get_param( 'per_page' ) );
		$page     = max( 1, (int) $request->get_param( 'page' ) );

		$query_args = [
			'integration_id' => $integration_id,
			'per_page'       => $per_page,
			'offset'         => ( $page - 1 ) * $per_page,
			'orderby'        => $request->get_param( 'orderby' ),
			'order'          => $request->get_param( 'order' ),
		];

		$search = $request->get_param( 'search' );
		if ( ! empty( $search ) ) {
			$query_args['search'] = $search;
		}

		$status = $request->get_param( 'status' );
		if ( ! empty( $status ) ) {
			$query_args['status'] = $status;
		}

		$actions = Integrations::get_scheduled_actions( $query_args );

		$count_args = [
			'integration_id' => $integration_id,
		];
		if ( ! empty( $search ) ) {
			$count_args['search'] = $search;
		}
		if ( ! empty( $status ) ) {
			$count_args['status'] = $status;
		}
		$total = Integrations::count_scheduled_actions( $count_args );
		$hook_labels = Action_Scheduler::get_hook_labels();

		$items = array_map(
			function ( $action ) use ( $hook_labels ) {
				return [
					'id'        => $action->action_id,
					'timestamp' => $action->scheduled_date_gmt,
					'event'     => $hook_labels[ $action->hook ] ?? $action->hook,
					'status'    => $action->status,
				];
			},
			$actions
		);

		return rest_ensure_response(
			[
				'items'    => array_values( $items ),
				'total'    => $total,
				'page'     => $page,
				'per_page' => $per_page,
			]
		);
	}

	/**
	 * Get the full detail (payload + per-action logs) for a single scheduled action.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function api_get_integration_log_detail( WP_REST_Request $request ) {
		$integration_id = $request->get_param( 'integration_id' );
		$action_id      = (int) $request->get_param( 'action_id' );

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration ) {
			return new WP_Error(
				'newspack_integration_not_found',
				esc_html__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		if ( ! Integrations::action_belongs_to_integration( $action_id, $integration_id ) ) {
			return new WP_Error(
				'newspack_action_not_found',
				esc_html__( 'Action not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$action = Action_Scheduler::get_action( $action_id );
		if ( ! $action ) {
			return new WP_Error(
				'newspack_action_not_found',
				esc_html__( 'Action not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$store  = \ActionScheduler_Store::instance();
		$status = $store->get_status( $action_id );

		$schedule         = $action->get_schedule();
		$scheduled_at     = $schedule && method_exists( $schedule, 'get_date' ) ? $schedule->get_date() : null;
		$scheduled_at_gmt = $scheduled_at ? $scheduled_at->format( 'Y-m-d\TH:i:s' ) : '';

		// Resolve payload: prefer extended_args (full JSON) when present, else args.
		// We read from the AS DB directly because the ActionScheduler_Action object
		// only exposes the parsed args, with no signal as to whether they were
		// truncated. Reading the row tells us whether extended_args carries the
		// full JSON.
		global $wpdb;
		$row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT args, extended_args, attempts, last_attempt_gmt FROM {$wpdb->prefix}actionscheduler_actions WHERE action_id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$action_id
			)
		);

		$payload_raw = '';
		if ( $row ) {
			$payload_raw = ! empty( $row->extended_args ) ? $row->extended_args : (string) $row->args;
		}
		$decoded = json_decode( $payload_raw, true );
		$args    = ( null === $decoded && JSON_ERROR_NONE !== json_last_error() ) ? $payload_raw : $decoded;

		$hook_labels = Action_Scheduler::get_hook_labels();
		$hook        = $action->get_hook();
		$event       = $hook_labels[ $hook ] ?? $hook;

		return rest_ensure_response(
			[
				'action' => [
					'id'                 => $action_id,
					'hook'               => $hook,
					'event'              => $event,
					'status'             => $status,
					'scheduled_date_gmt' => $scheduled_at_gmt,
					'attempts'           => $row ? (int) $row->attempts : 0,
					'last_attempt_gmt'   => $row && ! empty( $row->last_attempt_gmt ) && '0000-00-00 00:00:00' !== $row->last_attempt_gmt ? gmdate( 'Y-m-d\TH:i:s', strtotime( $row->last_attempt_gmt . ' UTC' ) ) : '',
					'group'              => method_exists( $action, 'get_group' ) ? $action->get_group() : '',
					'priority'           => method_exists( $action, 'get_priority' ) ? (int) $action->get_priority() : 10,
					'args'               => $args,
				],
				'logs'   => Action_Scheduler::get_action_logs( $action_id ),
			]
		);
	}

	/**
	 * Run a pending scheduled action immediately.
	 *
	 * Mirrors the WooCommerce Action Scheduler admin "Run" behavior: the action is
	 * processed synchronously and the post-run status is returned. Errors thrown by
	 * the action's callback are not surfaced as HTTP errors — AS already marks the
	 * action `failed` and writes a log entry, so we report `status: 'failed'` in a
	 * 200 response and let the UI surface the last log message.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function api_run_integration_action( WP_REST_Request $request ) {
		$integration_id = $request->get_param( 'integration_id' );
		$action_id      = (int) $request->get_param( 'action_id' );

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration ) {
			return new WP_Error(
				'newspack_integration_not_found',
				esc_html__( 'Integration not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		if ( ! Integrations::action_belongs_to_integration( $action_id, $integration_id ) ) {
			return new WP_Error(
				'newspack_action_not_found',
				esc_html__( 'Action not found.', 'newspack-plugin' ),
				[ 'status' => 404 ]
			);
		}

		$store  = \ActionScheduler_Store::instance();
		$status = $store->get_status( $action_id );

		if ( 'pending' !== $status ) {
			return new WP_Error(
				'newspack_action_not_pending',
				esc_html__( 'This action is no longer pending.', 'newspack-plugin' ),
				[ 'status' => 409 ]
			);
		}

		try {
			\ActionScheduler::runner()->process_action( $action_id, 'Newspack' );
		} catch ( \Throwable $e ) {
			// Swallow: AS will have marked the action failed and recorded a log entry.
			unset( $e );
		}

		$new_status = $store->get_status( $action_id );
		$logs       = Action_Scheduler::get_action_logs( $action_id );
		$last_log   = ! empty( $logs ) ? end( $logs )['message'] : '';

		return rest_ensure_response(
			[
				'status'  => $new_status,
				'message' => $last_log,
			]
		);
	}
}

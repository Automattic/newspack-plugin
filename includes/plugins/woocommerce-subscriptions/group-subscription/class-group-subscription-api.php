<?php
/**
 * REST API class for Newspack Group Subscriptions.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Settings class.
 */
class Group_Subscription_API {
	const NAMESPACE = 'newspack-group-subscription/v1';
	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_routes() {
		\register_rest_route(
			self::NAMESPACE,
			'/settings/(?P<subscription_id>\d+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_settings' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => [
					'subscription_id' => [
						'type'        => 'integer',
						'required'    => true,
						'description' => __( 'Subscription ID.', 'newspack-plugin' ),
					],
					'enabled'         => [
						'type'              => 'boolean',
						'required'          => false,
						'description'       => __( 'Whether group subscriptions are enabled for this subscription.', 'newspack-plugin' ),
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
					'limit'           => [
						'type'              => 'integer',
						'required'          => false,
						'description'       => __( 'Maximum number of members allowed. Set to 0 for unlimited.', 'newspack-plugin' ),
						'sanitize_callback' => 'absint',
						'validate_callback' => static function( $value ) {
							return is_numeric( $value ) && (int) $value >= 0;
						},
					],
				],
			]
		);
		\register_rest_route(
			self::NAMESPACE,
			'/search-users',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_search_users' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => [
					'search'          => [
						'type'     => 'string',
						'required' => true,
					],
					'subscription_id' => [
						'type'     => 'integer',
						'required' => true,
					],
				],
			]
		);
		\register_rest_route(
			self::NAMESPACE,
			'/members',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ __CLASS__, 'api_update_members' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => [
					'subscription_id'   => [
						'type'     => 'integer',
						'required' => true,
					],
					'members_to_add'    => [
						'type'     => 'array',
						'items'    => [
							'type' => 'integer',
						],
						'required' => false,
					],
					'members_to_remove' => [
						'type'     => 'array',
						'items'    => [
							'type' => 'integer',
						],
						'required' => false,
					],
				],
			]
		);
	}

	/**
	 * Permission callback for the add_members route.
	 */
	public static function permission_callback() {
		return current_user_can( 'manage_woocommerce' );
	}

	/**
	 * User search for group subscription.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response The response object.
	 */
	public static function api_search_users( $request ) {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return \rest_ensure_response( new \WP_Error( 'newspack_group_subscription_api', __( 'WooCommerce Subscriptions is not available.', 'newspack-plugin' ) ) );
		}
		$search          = $request->get_param( 'search' );
		$subscription_id = $request->get_param( 'subscription_id' );
		$subscription    = wcs_get_subscription( $subscription_id );
		if ( ! $subscription ) {
			return \rest_ensure_response( new \WP_Error( 'newspack_group_subscription_api_search_users', __( 'Subscription not found.', 'newspack-plugin' ) ) );
		}
		$exclude   = Group_Subscription::get_members( $subscription );
		$exclude[] = $subscription->get_user_id();
		$query1 = get_users(
			/**
			 * Filter the user query args for searching for group subscription users.
			 *
			 * @param array $query_args Query args.
			 * @param string $query_type Query type: main_query or meta_query.
			 */
			apply_filters(
				'newspack_group_subscription_user_query_args',
				[
					'fields'         => [ 'ID', 'user_email' ],
					'exclude'        => $exclude,
					'search'         => $search,
					'search_columns' => [ 'ID', 'user_login', 'user_url', 'user_email', 'user_nicename', 'display_name' ],
					'role__in'       => Reader_Activation::get_reader_roles(),
				],
				'main_query'
			)
		);
		$query2 = get_users(
			/**
			 * Filter the user query args for searching for group subscription users.
			 *
			 * @param array $query_args Query args.
			 * @param string $query_type Query type: main_query or meta_query.
			 */
			apply_filters(
				'newspack_group_subscription_user_query_args',
				[
					'fields'     => [ 'ID', 'user_email' ],
					'exclude'    => $exclude,
					'role__in'   => Reader_Activation::get_reader_roles(),
					'meta_query' => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
						'relation' => 'OR',
						[
							'key'     => 'first_name',
							'value'   => $search,
							'compare' => 'LIKE',
						],
						[
							'key'     => 'last_name',
							'value'   => $search,
							'compare' => 'LIKE',
						],
					],
				],
				'meta_query'
			)
		);
		$users = array_map(
			function( $user ) {
				return [
					'id'   => $user->ID,
					'text' => $user->user_email . ' (#' . $user->ID . ')',
				];
			},
			array_merge( $query1, $query2 )
		);
		return \rest_ensure_response( $users );
	}

	/**
	 * Update members for a group subscription.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response The response object.
	 */
	public static function api_update_members( $request ) {
		$subscription_id   = $request->get_param( 'subscription_id' );
		$members_to_add    = $request->get_param( 'members_to_add' );
		$members_to_remove = $request->get_param( 'members_to_remove' );
		$results           = Group_Subscription::update_members( $subscription_id, $members_to_add ?? [], $members_to_remove ?? [] );
		return \rest_ensure_response( $results );
	}

	/**
	 * Update group subscription settings for a subscription.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response or error.
	 */
	public static function api_update_settings( $request ) {
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return \rest_ensure_response( new \WP_Error( 'newspack_group_subscription_api', __( 'WooCommerce Subscriptions is not available.', 'newspack-plugin' ) ) );
		}

		$subscription_id = $request->get_param( 'subscription_id' );
		$subscription    = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription ) {
			return \rest_ensure_response( new \WP_Error( 'newspack_group_subscription_api_update_settings', __( 'Subscription not found.', 'newspack-plugin' ) ) );
		}

		// Extra hardening: ensure current user can edit this specific subscription post.
		if ( ! \current_user_can( 'edit_post', $subscription_id ) ) {
			return \rest_ensure_response( new \WP_Error( 'newspack_group_subscription_api_update_settings_forbidden', __( 'You do not have permission to edit this subscription.', 'newspack-plugin' ), [ 'status' => 403 ] ) );
		}

		$should_save = false;

		if ( $request->has_param( 'enabled' ) ) {
			$enabled = (bool) $request->get_param( 'enabled' );
			$subscription->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_ENABLED_META_KEY, \wc_bool_to_string( $enabled ) );
			$should_save = true;
		}

		if ( $request->has_param( 'limit' ) ) {
			$limit = absint( $request->get_param( 'limit' ) );
			$subscription->update_meta_data( Group_Subscription_Settings::GROUP_SUBSCRIPTION_LIMIT_META_KEY, $limit );
			$should_save = true;
		}

		if ( $should_save ) {
			$subscription->save();
		}

		return \rest_ensure_response(
			[
				'subscription_id' => (int) $subscription_id,
				'settings'        => Group_Subscription_Settings::get_subscription_settings( $subscription ),
			]
		);
	}
}
Group_Subscription_API::init();

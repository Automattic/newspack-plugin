<?php
/**
 * Newspack Data Events Api.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

use Newspack\Data_Events;
use Newspack\Data_Events\Webhooks;

/**
 * Main Class.
 */
final class Api {
	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	/**
	 * Register the routes.
	 */
	public static function register_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/data-events/actions',
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'get_actions' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
			]
		);
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/webhooks/endpoints',
			[
				'methods'             => 'GET',
				'callback'            => [ __CLASS__, 'get_endpoints' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
			]
		);
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/webhooks/endpoints',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'upsert_endpoint' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => self::get_endpoint_args(),
			]
		);
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/webhooks/endpoints/(?P<id>\d+)',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'upsert_endpoint' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => self::get_endpoint_args(),
			]
		);
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/webhooks/endpoints/(?P<id>\d+)',
			[
				'methods'             => 'DELETE',
				'callback'            => [ __CLASS__, 'delete_endpoint' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
			]
		);
	}

	/**
	 * Check capabilities for using API.
	 *
	 * @return bool|WP_Error
	 */
	public static function permission_callback() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'newspack_rest_forbidden',
				esc_html__( 'You cannot use this resource.', 'newspack' ),
				[
					'status' => 403,
				]
			);
		}
		return true;
	}

	/**
	 * Get endpoint args.
	 *
	 * @return array
	 */
	private static function get_endpoint_args() {
		return [
			'url'      => [
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
			'actions'  => [
				'type'  => 'array',
				'items' => [
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
			],
			'global'   => [
				'type' => 'boolean',
			],
			'disabled' => [
				'type' => 'boolean',
			],
		];
	}

	/**
	 * Get data events actions
	 *
	 * @param WP_REST_Request $request Request object.
	 */
	public static function get_actions( $request ) {
		return \rest_ensure_response( Data_Events::get_actions() );
	}

	/**
	 * Get webhooks endpoints
	 */
	public static function get_endpoints() {
		$endpoints = Webhooks::get_endpoints();
		foreach ( $endpoints as &$endpoint ) {
			$endpoint['requests'] = Webhooks::get_endpoint_requests( $endpoint['id'], 10 );
		}
		return \rest_ensure_response( $endpoints );
	}

	/**
	 * Get endpoint arguments values from rest request.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	private static function get_endpoint_args_from_request( $request ) {
		$args   = array_keys( self::get_endpoint_args() );
		$params = $request->get_params();
		$values = [];
		if ( ! empty( $params['id'] ) ) {
			$args     = array_merge( [ 'id' ], $args );
			$endpoint = Webhooks::get_endpoint( (int) $params['id'] );
			$values   = array_intersect_key( $endpoint, array_flip( $args ) );
		}
		foreach ( $args as $arg ) {
			if ( isset( $params[ $arg ] ) ) {
				$values[ $arg ] = $params[ $arg ];
			}
		}
		return $values;
	}

	/**
	 * Update a webhook endpoint
	 *
	 * @param WP_REST_Request $request Request object.
	 */
	public static function upsert_endpoint( $request ) {
		$args = self::get_endpoint_args_from_request( $request );
		if ( empty( $args['url'] ) || \esc_url_raw( $args['url'], [ 'https' ] ) !== $args['url'] ) {
			return new \WP_Error(
				'newspack_webhooks_invalid_url',
				esc_html__( 'Invalid URL.', 'newspack' ),
				[
					'status' => 400,
				]
			);
		}
		if ( ! $args['global'] && empty( $args['actions'] ) ) {
			return new \WP_Error(
				'newspack_webhooks_invalid_actions',
				esc_html__( 'You must select actions to trigger this endpoint. Set it to "global" if this endpoint is meant for all actions.', 'newspack' ),
				[
					'status' => 400,
				]
			);
		}
		if ( empty( $args['id'] ) ) {
			$endpoint = Webhooks::create_endpoint( ...$args );
		} else {
			$endpoint = Webhooks::update_endpoint( ...$args );
		}
		if ( \is_wp_error( $endpoint ) ) {
			return $endpoint;
		}
		return self::get_endpoints();
	}

	/**
	 * Delete a webhook endpoint
	 *
	 * @param WP_REST_Request $request Request object.
	 */
	public static function delete_endpoint( $request ) {
		$params   = $request->get_params();
		$endpoint = Webhooks::delete_endpoint( $params['id'] );
		if ( \is_wp_error( $endpoint ) ) {
			return $endpoint;
		}
		return self::get_endpoints();
	}
}
Api::init();

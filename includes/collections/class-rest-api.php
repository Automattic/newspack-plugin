<?php
/**
 * Collections REST API controller.
 *
 * @package Newspack\Collections
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

use WP_REST_Controller;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * REST API controller for Collections.
 */
class REST_API extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'newspack/v1';
		$this->rest_base = 'collections';
	}

	/**
	 * Initialize the REST API controller.
	 */
	public static function init() {
		$controller = new self();
		add_action( 'rest_api_init', [ $controller, 'register_routes' ] );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_items' ],
					'permission_callback' => [ $this, 'get_items_permissions_check' ],
					'args'                => $this->get_collection_params(),
				],
			]
		);
	}

	/**
	 * Check if a given request has access to get items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Get a collection of items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$search = $request->get_param( 'search' );
		$per_page = $request->get_param( 'per_page' );
		$include = $request->get_param( 'include' );
		$posts_per_page = $per_page ? $per_page : 20;
		$args = [
			'post_type'      => Post_Type::get_post_type(),
			'post_status'    => 'publish',
			'posts_per_page' => $posts_per_page,
			'orderby'        => 'title',
			'order'          => 'ASC',
		];

		if ( $search ) {
			$args['s'] = $search;
		}

		if ( $include ) {
			$args['post__in'] = $include;
			$args['orderby']  = 'post__in';
		}

		$query = new \WP_Query( $args );
		$collections = [];

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$post = get_post();

				$collections[] = [
					'id'    => $post->ID,
					'title' => get_the_title( $post->ID ),
				];
			}
		}

		wp_reset_postdata();

		return rest_ensure_response( $collections );
	}

	/**
	 * Get the query params for collections.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return [
			'search'   => [
				'description' => __( 'Limit results to those matching a string.', 'newspack-plugin' ),
				'type'        => 'string',
			],
			'per_page' => [
				'description' => __( 'Maximum number of items to be returned in result set.', 'newspack-plugin' ),
				'type'        => 'integer',
				'default'     => 20,
				'minimum'     => 1,
				'maximum'     => 100,
			],
			'include'  => [
				'description' => __( 'Limit result set to specific IDs.', 'newspack-plugin' ),
				'type'        => 'array',
				'items'       => [
					'type' => 'integer',
				],
				'default'     => [],
			],
		];
	}
}

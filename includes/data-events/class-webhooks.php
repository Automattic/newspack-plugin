<?php
/**
 * Newspack Data Events Webhooks.
 *
 * @package Newspack
 */

namespace Newspack\Data_Events;

use Newspack\Logger;
use WP_Error;

/**
 * Main class.
 */
final class Webhooks {

	/**
	 * Webhook request post type.
	 */
	const REQUEST_POST_TYPE = 'np_webhook_request';

	/**
	 * Webhook endpoint taxonomy.
	 */
	const ENDPOINT_TAXONOMY = 'np_webhook_endpoint';

	/**
	 * Maximum number of request retries before disabling the endpoint.
	 */
	const MAX_RETRIES = 12;

	/**
	 * Time to retain finished requests.
	 */
	const DELETE_REQUESTS_BEFORE = '7 days ago';

	/**
	 * Header to be used while logging.
	 */
	const LOGGER_HEADER = 'NEWSPACK-WEBHOOKS';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'init', [ __CLASS__, 'register_request_post_type' ] );
		\add_action( 'init', [ __CLASS__, 'register_endpoint_taxonomy' ] );
		\add_action( 'init', [ __CLASS__, 'register_cron_events' ] );
		\add_action( 'newspack_data_event_dispatch', [ __CLASS__, 'handle_dispatch' ], 10, 4 );
		\add_action( 'transition_post_status', [ __CLASS__, 'transition_post_status' ], 10, 3 );
	}

	/**
	 * Register custom post type for webhook requests
	 */
	public static function register_request_post_type() {
		\register_post_type(
			self::REQUEST_POST_TYPE,
			[
				'labels'       => [
					'name'          => __( 'Webhook Requests', 'newspack' ),
					'singular_name' => __( 'Webhook Request', 'newspack' ),
				],
				'public'       => false,
				'show_ui'      => false,
				'show_in_menu' => false,
				'show_in_rest' => false,
				'supports'     => [
					'title',
					'custom-fields',
				],
				'taxonomies'   => [
					self::ENDPOINT_TAXONOMY,
				],
			]
		);
	}

	/**
	 * Register taxonomy for webhook endpoints
	 */
	public static function register_endpoint_taxonomy() {
		\register_taxonomy(
			self::ENDPOINT_TAXONOMY,
			self::REQUEST_POST_TYPE,
			[
				'labels'       => [
					'name'          => __( 'Webhook Endpoints', 'newspack' ),
					'singular_name' => __( 'Webhook Endpoint', 'newspack' ),
				],
				'public'       => false,
				'show_ui'      => false,
				'show_in_menu' => false,
				'show_in_rest' => false,
			]
		);
	}

	/**
	 * Register webhook cron events.
	 *
	 * "clear_finished": Twice a day will permanently delete finished webhook
	 * requests older than 7 days.
	 */
	public static function register_cron_events() {
		\register_deactivation_hook( __FILE__, [ __CLASS__, 'clear_cron_events' ] );
		\add_action( 'newspack_data_events_webhooks_clear_finished', [ __CLASS__, 'clear_finished' ] );
		if ( ! \wp_next_scheduled( 'newspack_data_events_webhooks_clear_finished' ) ) {
			\wp_schedule_event( time(), 'twicedaily', 'newspack_data_events_webhooks_clear_finished' );
		}
	}

	/**
	 * Clear cron events.
	 */
	public static function clear_cron_events() {
		$timestamp = \wp_next_scheduled( 'newspack_data_events_webhooks_clear_finished' );
		\wp_unschedule_event( $timestamp, 'newspack_data_events_webhooks_clear_finished' );
	}

	/**
	 * Permanently delete finished webhook requests older than
	 * "DELETE_REQUESTS_BEFORE".
	 */
	public static function clear_finished() {
		$requests = \get_posts(
			[
				'post_type'      => self::REQUEST_POST_TYPE,
				'post_status'    => 'publish',
				'posts_per_page' => 100,
				'fields'         => 'ids',
				'date_query'     => [
					[
						'column' => 'post_date_gmt',
						'before' => self::DELETE_REQUESTS_BEFORE,
					],
				],
			]
		);
		foreach ( $requests as $request_id ) {
			if ( 'finished' === \get_post_meta( $request_id, 'status', true ) ) {
				\wp_delete_post( $request_id, true );
			}
		}
	}

	/**
	 * Create a webhook endpoint.
	 *
	 * @param string $url     Endpoint URL.
	 * @param array  $actions Array of action names.
	 * @param bool   $global  Whether the endpoint should be triggered for all actions.
	 *
	 * @return int|WP_Error Endpoint ID or error.
	 */
	public static function create_endpoint( $url, $actions = [], $global = false ) {
		$endpoint = \wp_insert_term(
			$url,
			self::ENDPOINT_TAXONOMY,
			[
				'description' => $url,
			]
		);
		if ( is_wp_error( $endpoint ) ) {
			return $endpoint;
		}
		\update_term_meta( $endpoint['term_id'], 'actions', $actions );
		\update_term_meta( $endpoint['term_id'], 'global', $global );
		return $endpoint['term_id'];
	}

	/**
	 * Update a webhook endpoint.
	 *
	 * @param int    $id       Endpoint ID.
	 * @param string $url      Endpoint URL.
	 * @param array  $actions  Array of action names.
	 * @param bool   $global   Whether the endpoint should be triggered for all actions.
	 * @param bool   $disabled Whether the endpoint is disabled.
	 *
	 * @return array|WP_Error
	 */
	public static function update_endpoint( $id, $url, $actions = [], $global = false, $disabled = false ) {
		$endpoint = \get_term( $id, self::ENDPOINT_TAXONOMY, ARRAY_A );
		if ( ! $endpoint ) {
			return new WP_Error( 'newspack_webhook_endpoint_not_found', __( 'Webhook endpoint not found.', 'newspack' ) );
		}
		$endpoint = \wp_update_term(
			$id,
			self::ENDPOINT_TAXONOMY,
			[
				'name'        => $url,
				'description' => $url,
			]
		);
		\update_term_meta( $endpoint['term_id'], 'actions', $actions );
		\update_term_meta( $endpoint['term_id'], 'global', $global );
		\update_term_meta( $endpoint['term_id'], 'disabled', $disabled );
		return $endpoint;
	}

	/**
	 * Delete a webhook endpoint.
	 *
	 * @param int $id Endpoint ID.
	 *
	 * @return void|WP_Error Error if endpoint not found.
	 */
	public static function delete_endpoint( $id ) {
		$endpoint = get_term( $id, self::ENDPOINT_TAXONOMY );
		if ( ! $endpoint ) {
			return new WP_Error( 'newspack_webhook_endpoint_not_found', __( 'Webhook endpoint not found.', 'newspack' ) );
		}
		\wp_delete_term( $id, self::ENDPOINT_TAXONOMY );
	}

	/**
	 * Disable a webhook endpoint.
	 *
	 * @param int $id Endpoint ID.
	 */
	public static function disable_endpoint( $id ) {
		$endpoint = \get_term( $id, self::ENDPOINT_TAXONOMY );
		if ( ! $endpoint ) {
			return;
		}
		\update_term_meta( $id, 'disabled', true );
	}

	/**
	 * Whether an endpoint is disabled.
	 *
	 * @param string $url Endpoint URL.
	 *
	 * @return bool
	 */
	public static function is_endpoint_disabled( $url ) {
		$endpoint = \get_term_by( 'name', $url, self::ENDPOINT_TAXONOMY );
		if ( ! $endpoint ) {
			return false;
		}
		$endpoint_id = $endpoint->term_id;
		return (bool) \get_term_meta( $endpoint_id, 'disabled', true );
	}

	/**
	 * Get all webhook endpoints.
	 *
	 * @return array Array of endpoints.
	 */
	public static function get_endpoints() {
		$endpoints = \get_terms( self::ENDPOINT_TAXONOMY, [ 'hide_empty' => false ] );
		return array_map(
			function( $endpoint ) {
				return [
					'id'       => $endpoint->term_id,
					'url'      => $endpoint->name,
					'actions'  => \get_term_meta( $endpoint->term_id, 'actions', true ),
					'global'   => (bool) \get_term_meta( $endpoint->term_id, 'global', true ),
					'disabled' => (bool) \get_term_meta( $endpoint->term_id, 'disabled', true ),
				];
			},
			$endpoints
		);
	}

	/**
	 * Get endpoints for actions.
	 *
	 * @param string $action_name Action name.
	 *
	 * @return array Array of endpoints.
	 */
	private static function get_endpoints_for_action( $action_name ) {
		$endpoints = self::get_endpoints();
		return array_values(
			array_filter(
				$endpoints,
				function( $endpoint ) use ( $action_name ) {
					return ! $endpoint['disabled'] && ( $endpoint['global'] || in_array( $action_name, $endpoint['actions'], true ) );
				}
			)
		);
	}

	/**
	 * Create webhook request.
	 *
	 * @param int    $endpoint_id Endpoint ID.
	 * @param string $action_name Action name.
	 * @param int    $timestamp   Timestamp.
	 * @param array  $data        Data.
	 * @param string $client_id   Client ID.
	 *
	 * @return int|WP_Error.
	 */
	private static function create_request( $endpoint_id, $action_name, $timestamp, $data, $client_id ) {
		$request_id = \wp_insert_post(
			[
				'post_type'  => self::REQUEST_POST_TYPE,
				'post_title' => $action_name,
			],
			true
		);

		if ( \is_wp_error( $request_id ) ) {
			Logger::error( 'Error creating webhook request: ' . $request_id->get_error_message(), self::LOGGER_HEADER );
			return $request_id;
		}

		\wp_set_object_terms( $request_id, $endpoint_id, self::ENDPOINT_TAXONOMY );

		$body = [
			'request_id' => $request_id,
			'timestamp'  => $timestamp,
			'action'     => $action_name,
			'data'       => $data,
			'client_id'  => $client_id,
		];
		\update_post_meta( $request_id, 'body', \wp_json_encode( $body ) );
		\update_post_meta( $request_id, 'action_name', $action_name );
		\update_post_meta( $request_id, 'client_id', $action_name );

		\update_post_meta( $request_id, 'status', 'pending' );

		self::schedule_request( $request_id );

		return $request_id;
	}

	/**
	 * Get webhook request errors.
	 *
	 * @param int $request_id Request ID.
	 */
	private static function get_request_errors( $request_id ) {
		$errors = \get_post_meta( $request_id, 'errors', true );
		return $errors ? $errors : [];
	}

	/**
	 * Get webhook request endpoint.
	 *
	 * @param int $request_id Request ID.
	 *
	 * @return array|null
	 */
	private static function get_request_endpoint( $request_id ) {
		$endpoint_id = \wp_get_object_terms( $request_id, self::ENDPOINT_TAXONOMY, [ 'fields' => 'ids' ] );
		$endpoint_id = $endpoint_id ? $endpoint_id[0] : null;
		if ( ! $endpoint_id ) {
			return null;
		}
		$endpoints = self::get_endpoints();
		$endpoint  = array_filter(
			$endpoints,
			function( $endpoint ) use ( $endpoint_id ) {
				return $endpoint['id'] === $endpoint_id;
			}
		);
		return $endpoint ? array_values( $endpoint )[0] : null;
	}

	/**
	 * Add webhook request error.
	 *
	 * @param int    $request_id Request ID.
	 * @param string $error      Error message.
	 */
	private static function add_request_error( $request_id, $error ) {
		Logger::error( $error, self::LOGGER_HEADER );
		$errors = self::get_request_errors( $request_id );
		$errors = array_merge( $errors, [ $error ] );
		\update_post_meta( $request_id, 'errors', $errors );
	}

	/**
	 * Handle webhook request status transition for processing scheduled requests.
	 *
	 * @param string  $new_status New post status.
	 * @param string  $old_status Old post status.
	 * @param WP_Post $post       Post object.
	 */
	public static function transition_post_status( $new_status, $old_status, $post ) {
		if (
			self::REQUEST_POST_TYPE === $post->post_type &&
			'publish' === $new_status &&
			'publish' !== $old_status
		) {
			self::process_request( $post->ID );
		}
	}

	/**
	 * Kill and trash a webhook request.
	 *
	 * @param int $request_id Request ID.
	 */
	private static function kill_request( $request_id ) {
		\wp_update_post(
			[
				'ID'          => $request_id,
				'post_status' => 'trash',
			]
		);
	}

	/**
	 * Schedule a webhook request.
	 *
	 * @param int $request_id Request ID.
	 * @param int $delay      Delay in minutes. Default is 1 minute.
	 */
	private static function schedule_request( $request_id, $delay = 1 ) {
		$time     = strtotime( sprintf( '+%d minutes', \absint( $delay ) ) );
		$date     = date( 'Y-m-d H:i:s', $time ); // phpcs:ignore WordPress.DateTime.RestrictedFunctions.date_date
		$date_gmt = gmdate( 'Y-m-d H:i:s', strtotime( $date ) );
		Logger::log( "Scheduling request {$request_id} for {$date_gmt}.", self::LOGGER_HEADER );
		\wp_update_post(
			[
				'ID'            => $request_id,
				'post_status'   => 'future',
				'post_date'     => $date,
				'post_date_gmt' => $date_gmt,
				'edit_date'     => true,
			]
		);
	}

	/**
	 * Finish a webhook request.
	 *
	 * @param int $request_id Request ID.
	 */
	public static function finish_request( $request_id ) {
		Logger::log( "Finishing request {$request_id}.", self::LOGGER_HEADER );
		\update_post_meta( $request_id, 'status', 'finished' );
	}

	/**
	 * Process a webhook request
	 *
	 * @param int $request_id Request ID.
	 */
	private static function process_request( $request_id ) {
		$endpoint = self::get_request_endpoint( $request_id );
		if ( ! $endpoint ) {
			self::add_request_error( $request_id, __( 'Endpoint not found.', 'newspack' ) );
			self::kill_request( $request_id );
		}

		$errors = self::get_request_errors( $request_id );

		$response = self::send_request( $request_id );

		if ( is_wp_error( $response ) ) {

			if ( count( $errors ) >= self::MAX_RETRIES ) {
				self::kill_request( $request_id );
				self::disable_endpoint( $endpoint['id'] );
				return;
			}

			self::add_request_error( $request_id, $response->get_error_message() );

			$delay = pow( 2, count( $errors ) );
			self::schedule_request( $request_id, $delay );
		} else {
			self::finish_request( $request_id );
		}
	}

	/**
	 * Send a webhook request.
	 *
	 * @param int $request_id Request ID.
	 *
	 * @return true|WP_Error True if successful, WP_Error if not.
	 */
	private static function send_request( $request_id ) {
		Logger::log( "Sending request {$request_id}", self::LOGGER_HEADER );
		$endpoint = self::get_request_endpoint( $request_id );
		if ( ! $endpoint ) {
			return new WP_Error( 'endpoint_not_found', __( 'Endpoint not registered', 'newspack' ) );
		}

		$url  = $endpoint['url'];
		$body = \get_post_meta( $request_id, 'body', true );

		/**
		 * Filters the timeout for webhook requests.
		 *
		 * @param int $request_timeout Timeout in seconds. Default is 10.
		 */
		$timeout = apply_filters( 'newspack_webhook_request_timeout', 10 );

		$args = [
			'method'  => 'POST',
			'headers' => [
				'Content-Type' => 'application/json',
			],
			'timeout' => $timeout,
			'body'    => $body,
		];

		$response = \wp_safe_remote_request( $url, $args );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( ! $response['response']['code'] || $response['response']['code'] < 200 || $response['response']['code'] >= 300 ) {
			return new WP_Error( 'request_failed', __( 'Client did not respond with 2xx code.', 'newspack' ) );
		}

		return true;
	}

	/**
	 * Create a webhook request on data event dispatch.
	 *
	 * @param string $action_name Action name.
	 * @param int    $timestamp   Event timestamp.
	 * @param array  $data        Event data.
	 * @param string $client_id   Optional user session's client ID.
	 */
	public static function handle_dispatch( $action_name, $timestamp, $data, $client_id ) {
		$endpoints = self::get_endpoints_for_action( $action_name );
		if ( empty( $endpoints ) ) {
			return;
		}

		$requests = [];
		foreach ( $endpoints as $endpoint ) {
			$requests[] = self::create_request( $endpoint['id'], $action_name, $timestamp, $data, $client_id );
		}

		/**
		 * Fires after webhook requests are created for a data event dispatch.
		 *
		 * @param int|WP_Error[] $requests Array of request IDs.
		 */
		\do_action( 'newspack_data_events_webhook_requests_created', $requests );
	}
}
Webhooks::init();

<?php
/**
 * Contact Pull orchestration class
 *
 * Handles synchronous and asynchronous pulling of contact data
 * from active integrations.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Integrations;

use Newspack\Reader_Activation\Integrations;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Contact Pull Class.
 *
 * Manages the pull orchestration: sync/async decision, time-limited
 * sync loop, Action Scheduler scheduling, and async handler.
 */
class Contact_Pull {
	/**
	 * Pull interval in seconds (5 minutes).
	 *
	 * @var int
	 */
	const PULL_INTERVAL = 300;

	/**
	 * Threshold in seconds (24 hours) for synchronous vs async pull.
	 *
	 * If the last pull is older than this, the pull runs synchronously.
	 * Otherwise it is scheduled via Action Scheduler.
	 *
	 * @var int
	 */
	const PULL_SYNC_THRESHOLD = 86400;

	/**
	 * AJAX action name for the loopback pull endpoint.
	 *
	 * @var string
	 */
	const AJAX_ACTION = 'newspack_pull_integration';

	/**
	 * Nonce action name for the loopback pull endpoint.
	 *
	 * @var string
	 */
	const NONCE_ACTION = 'newspack_pull_integration_nonce';

	/**
	 * User meta key for last pull timestamp.
	 *
	 * @var string
	 */
	const LAST_PULL_META = 'newspack_integrations_last_pull';

	/**
	 * Action Scheduler hook for async pull of a single integration.
	 *
	 * @var string
	 */
	const ASYNC_PULL_HOOK = 'newspack_pull_integration_contact_data';

	/**
	 * Initialize pull hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'maybe_pull_contact_data' ], 20 );
		add_action( self::ASYNC_PULL_HOOK, [ __CLASS__, 'handle_async_pull' ] );
		add_action( 'wp_ajax_' . self::AJAX_ACTION, [ __CLASS__, 'handle_ajax_pull' ] );
	}

	/**
	 * Get the timeout for loopback pull requests.
	 *
	 * This allows integrations with longer pull times to extend the timeout
	 * before the request is considered failed and falls back to async scheduling.
	 *
	 * @return int Timeout in seconds.
	 */
	private static function get_pull_request_timeout() {
		/**
		 * Newspack Integrations: Filter the max amount of time (in seconds) to allow for a synchronous contact metadata pull request before falling back to async scheduling.
		 */
		return apply_filters( 'newspack_pull_integration_request_timeout', 1 );
	}

	/**
	 * Pull contact data from active integrations for the current logged-in user.
	 *
	 * If the last pull is older than PULL_SYNC_THRESHOLD (24 h), the pull runs
	 * synchronously with a time limit. Any integrations that don't finish in time
	 * are scheduled via Action Scheduler.
	 *
	 * If the last pull is newer than 24 h (but older than PULL_INTERVAL) every
	 * integration is scheduled asynchronously so the page load is not blocked.
	 */
	public static function maybe_pull_contact_data() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user      = wp_get_current_user();
		$last_pull = (int) get_user_meta( $user->ID, self::LAST_PULL_META, true );
		$age       = time() - $last_pull;

		if ( $age < self::PULL_INTERVAL ) {
			return;
		}

		// Set immediately to prevent concurrent pulls from overlapping page loads.
		update_user_meta( $user->ID, self::LAST_PULL_META, time() );

		$active_integrations = Integrations::get_active_integrations();

		// Data is stale (> 24 h) — pull synchronously, schedule leftovers.
		if ( $age >= self::PULL_SYNC_THRESHOLD ) {
			self::pull_sync( $user->ID, $active_integrations );
			return;
		}

		// Data is relatively fresh — schedule all integrations async.
		self::schedule_async_pulls( $user->ID, $active_integrations );
	}

	/**
	 * Run synchronous pull via per-integration loopback requests.
	 *
	 * Each integration is pulled via a blocking wp_remote_post to the AJAX
	 * endpoint with get_pull_request_timeout. If the request completes, the handler
	 * has already stored the data. If it times out or fails, the integration is
	 * scheduled via Action Scheduler as a fallback.
	 *
	 * @param int                                       $user_id      WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration[] $integrations Active integrations to pull from.
	 */
	private static function pull_sync( $user_id, $integrations ) {
		$failed = [];

		foreach ( $integrations as $id => $integration ) {
			$selected_fields = $integration->get_enabled_incoming_fields();
			if ( empty( $selected_fields ) ) {
				continue;
			}

			$response = self::fire_pull_request( $id );

			if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
				$error_message = is_wp_error( $response ) ? $response->get_error_message() : 'Unexpected response code: ' . wp_remote_retrieve_response_code( $response );
				Logger::log( 'Loopback pull failed for ' . $id . '. Scheduling async. Error: ' . $error_message );
				$failed[ $id ] = $integration;
			} else {
				Logger::log( 'Loopback pull succeeded for ' . $id . '.' );
			}
		}

		if ( ! empty( $failed ) ) {
			self::schedule_async_pulls( $user_id, $failed );
		}
	}

	/**
	 * Fire a blocking loopback request to pull data for a single integration.
	 *
	 * @param string $integration_id The integration identifier.
	 * @return array|\WP_Error The response or WP_Error on failure.
	 */
	private static function fire_pull_request( $integration_id ) {
		$url = add_query_arg(
			[
				'action' => self::AJAX_ACTION,
				'nonce'  => wp_create_nonce( self::NONCE_ACTION ),
			],
			admin_url( 'admin-ajax.php' )
		);

		return wp_remote_post(
			$url,
			[
				'timeout'   => self::get_pull_request_timeout(),
				'blocking'  => true,
				'body'      => [ 'integration_id' => $integration_id ],
				'cookies'   => $_COOKIE, // phpcs:ignore
				'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
			]
		);
	}

	/**
	 * Handle the AJAX loopback request for pulling a single integration.
	 *
	 * Verifies the nonce, looks up the integration, pulls and stores data,
	 * then returns a JSON response.
	 */
	public static function handle_ajax_pull() {
		if ( ! isset( $_REQUEST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( $_REQUEST['nonce'] ), self::NONCE_ACTION ) ) { // phpcs:ignore
			wp_send_json_error( 'Invalid nonce.', 403 );
		}

		$integration_id = isset( $_POST['integration_id'] ) ? sanitize_text_field( $_POST['integration_id'] ) : ''; // phpcs:ignore
		if ( empty( $integration_id ) ) {
			wp_send_json_error( 'Missing integration_id.', 400 );
		}

		$integration = Integrations::get_integration( $integration_id );
		if ( ! $integration || ! Integrations::is_enabled( $integration_id ) ) {
			wp_send_json_error( 'Integration not found or not enabled.', 404 );
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			wp_send_json_error( 'No user context.', 403 );
		}

		$result = self::pull_single_integration( $user_id, $integration );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message(), 500 );
		}

		wp_send_json_success();
	}

	/**
	 * Pull data from a single integration and store selected fields.
	 *
	 * @param int                                     $user_id     WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration $integration The integration instance.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public static function pull_single_integration( $user_id, $integration ) {
		$selected_fields = $integration->get_enabled_incoming_fields();
		if ( empty( $selected_fields ) ) {
			return new \WP_Error( 'no_selected_incoming_fields', 'No selected incoming fields for ' . $integration->get_id() );
		}

		try {
			$data = $integration->pull_contact_data( $user_id );

			if ( is_wp_error( $data ) ) {
				Logger::log( 'Pull error from ' . $integration->get_id() . ': ' . $data->get_error_message() );
				return $data;
			}

			$selected_keys = array_flip( $selected_fields );
			$data          = array_intersect_key( $data, $selected_keys );
			Logger::log( 'Pulled data from ' . $integration->get_id() . ': ' . wp_json_encode( $data ) );

			foreach ( $data as $key => $value ) {
				\Newspack\Reader_Data::update_item( $user_id, $key, wp_json_encode( $value ) );
			}

			return true;
		} catch ( \Throwable $e ) {
			Logger::log( 'Pull exception from ' . $integration->get_id() . ': ' . $e->getMessage() );
			return new \WP_Error( 'pull_exception', $e->getMessage() );
		}
	}

	/**
	 * Schedule async Action Scheduler events for pulling integration data.
	 *
	 * @param int                                       $user_id      WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration[] $integrations Integrations to schedule.
	 */
	private static function schedule_async_pulls( $user_id, $integrations ) {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			return;
		}

		foreach ( $integrations as $integration ) {
			$selected_fields = $integration->get_enabled_incoming_fields();
			if ( empty( $selected_fields ) ) {
				continue;
			}

			$args = [
				[
					'user_id'        => $user_id,
					'integration_id' => $integration->get_id(),
				],
			];

			if ( function_exists( 'as_has_scheduled_action' ) && \as_has_scheduled_action( self::ASYNC_PULL_HOOK, $args, 'newspack' ) ) {
				continue;
			}

			\as_enqueue_async_action(
				self::ASYNC_PULL_HOOK,
				$args,
				'newspack'
			);
		}
	}

	/**
	 * Handle an async pull Action Scheduler event.
	 *
	 * @param array $args { user_id, integration_id }.
	 */
	public static function handle_async_pull( $args ) {
		$user_id        = $args['user_id'] ?? 0;
		$integration_id = $args['integration_id'] ?? '';

		if ( ! $user_id || ! $integration_id ) {
			return;
		}

		$integration = Integrations::get_integration( $integration_id );

		if ( ! $integration || ! Integrations::is_enabled( $integration_id ) ) {
			return;
		}

		self::pull_single_integration( $user_id, $integration );
	}
}

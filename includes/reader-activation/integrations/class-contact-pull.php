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
	 * Max seconds for the entire synchronous pull routine.
	 *
	 * @var int
	 */
	const PULL_TIME_LIMIT = 5;

	/**
	 * User meta key for last pull timestamp.
	 *
	 * @var string
	 */
	const LAST_PULL_META = 'np_integrations_last_pull';

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
	 * Run synchronous pull with a time limit. Any integrations that could not be
	 * processed before the time limit are scheduled asynchronously.
	 *
	 * @param int                                       $user_id      WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration[] $integrations Active integrations to pull from.
	 */
	private static function pull_sync( $user_id, $integrations ) {
		$start      = microtime( true );
		$remaining_integrations = $integrations;

		foreach ( $integrations as $id => $integration ) {
			unset( $remaining_integrations[ $id ] );

			$elapsed = microtime( true ) - $start;
			if ( $elapsed >= self::PULL_TIME_LIMIT ) {
				Logger::log( 'Pull routine time limit reached. Scheduling remaining integrations async.' );
				// Re-add the current integration that didn't get a chance to run.
				$remaining_integrations = [ $id => $integration ] + $remaining_integrations;
				break;
			}

			$selected_fields = $integration->get_selected_fields();
			if ( empty( $selected_fields ) ) {
				continue;
			}

			$remaining = self::PULL_TIME_LIMIT - ( microtime( true ) - $start );
			$timeout   = max( 1, (int) $remaining );

			self::pull_single_integration( $user_id, $integration, $timeout );
		}

		// Schedule any integrations that didn't run in time.
		if ( ! empty( $remaining_integrations ) ) {
			self::schedule_async_pulls( $user_id, $remaining_integrations );
		}
	}

	/**
	 * Pull data from a single integration and store selected fields.
	 *
	 * @param int                                     $user_id     WordPress user ID.
	 * @param \Newspack\Reader_Activation\Integration $integration The integration instance.
	 * @param int                                     $timeout     Max seconds for this call.
	 */
	public static function pull_single_integration( $user_id, $integration, $timeout = 30 ) {
		$selected_fields = $integration->get_selected_fields();
		if ( empty( $selected_fields ) ) {
			return;
		}

		try {
			$data = $integration->pull_contact_data( $user_id, $timeout );

			if ( is_wp_error( $data ) ) {
				// TODO: Surface these errors.
				Logger::log( 'Pull error from ' . $integration->get_id() . ': ' . $data->get_error_message() );
				return;
			}

			$selected_keys = array_flip( $selected_fields );
			$data          = array_intersect_key( $data, $selected_keys );
			Logger::log( 'Pulled data from ' . $integration->get_id() . ': ' . wp_json_encode( $data ) );

			foreach ( $data as $key => $value ) {
				\Newspack\Reader_Data::update_item( $user_id, $key, $value );
			}
		} catch ( \Throwable $e ) {
			// TODO: Surface these errors.
			Logger::log( 'Pull exception from ' . $integration->get_id() . ': ' . $e->getMessage() );
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
			$selected_fields = $integration->get_selected_fields();
			if ( empty( $selected_fields ) ) {
				continue;
			}

			\as_enqueue_async_action(
				self::ASYNC_PULL_HOOK,
				[
					[
						'user_id'        => $user_id,
						'integration_id' => $integration->get_id(),
					],
				],
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

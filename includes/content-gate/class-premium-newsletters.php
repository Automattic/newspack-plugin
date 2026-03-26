<?php
/**
 * Premium Newsletters.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack_Newsletters_Contacts;
use Newspack_Newsletters_Subscription;
use Newspack\Newsletters\Subscription_List;

defined( 'ABSPATH' ) || exit;

/**
 * Premium Newsletters Wizard.
 */
class Premium_Newsletters {
	/**
	 * Cache of restricted lists.
	 *
	 * @var string[]
	 */
	private static $restricted_lists = [];

	/**
	 * Hook name for the scheduled access check action.
	 */
	const SCHEDULED_HOOK = 'newspack_premium_newsletters_access_check';

	/**
	 * WP option key for the pending user ID queue.
	 * Stores: [ 'user_ids' => int[], 'created_at' => int ]
	 */
	const QUEUE_OPTION = 'newspack_premium_newsletters_access_check_queue';

	/**
	 * Default scheduling delay in seconds.
	 */
	const DEFAULT_DELAY = MINUTE_IN_SECONDS;

	/**
	 * A pending event must be scheduled at least this many seconds in the future
	 * to be considered "far enough" to piggyback on rather than scheduling a new one.
	 */
	const FUTURE_EVENT_THRESHOLD = 10;

	/**
	 * Log a warning once the queue exceeds this many unique user IDs.
	 */
	const MAX_QUEUE_SIZE = 500;

	/**
	 * If the queue was created more than this many seconds ago and no event has
	 * fired yet, override the delay to 0 so the next event is scheduled for the
	 * earliest available cron/AS tick rather than waiting another full delay.
	 */
	const MAX_QUEUE_AGE = DAY_IN_SECONDS;

	/**
	 * Initialize.
	 */
	public static function init() {
		// Filter the subscription lists.
		add_filter( 'newspack_newsletters_subscription_lists', [ __CLASS__, 'filter_subscription_lists' ] );

		// Register Data Events handlers.
		add_action( 'init', [ __CLASS__, 'register_handlers' ] );

		// Register the scheduled-event callback (works for both WP cron and ActionScheduler).
		add_action( self::SCHEDULED_HOOK, [ __CLASS__, 'process_access_check_queue' ] );

		// Clean up the queue option on plugin deactivation.
		add_action( 'newspack_deactivation', [ __CLASS__, 'clear_queue' ] );
	}

	/**
	 * Register Data Events handlers.
	 */
	public static function register_handlers() {
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'subscription_payment_complete' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'subscription_renewal_payment_failed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'product_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'donation_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'reader_verified' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_add_or_remove_lists' ], 'reader_data_updated' );
	}

	/**
	 * Filter the subscription lists to prevent premium newsletters from being shown when restricted.
	 *
	 * @param array $lists The lists.
	 *
	 * @return array The filtered lists.
	 */
	public static function filter_subscription_lists( $lists ) {
		$lists = array_values(
			array_filter(
				$lists,
				function( $list ) {
					return ! Content_Restriction_Control::is_post_restricted( false, $list->get_id() );
				}
			)
		);
		return $lists;
	}

	/**
	 * Given a local list ID, return the public list ID.
	 *
	 * @param string $list_id The local list ID.
	 *
	 * @return string The public list ID.
	 */
	private static function get_public_id( $list_id ) {
		if ( ! class_exists( 'Newspack\Newsletters\Subscription_List' ) ) {
			return null;
		}
		$list = new Subscription_List( $list_id );
		if ( ! $list ) {
			return null;
		}
		return $list->get_public_id();
	}

	/**
	 * Add a user to the given lists.
	 *
	 * @param string   $email The email address of the user.
	 * @param string[] $lists_to_add The list IDs to add the user to.
	 * @param string[] $lists_to_remove The list IDs to remove the user from.
	 * @param string   $context The context of the action.
	 *
	 * @return void
	 */
	private static function add_and_remove_lists( $email, $lists_to_add, $lists_to_remove, $context = 'Updating premium newsletter lists' ) {
		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) || ! class_exists( 'Newspack_Newsletters_Subscription' ) ) {
			return;
		}
		if ( empty( $lists_to_add ) && empty( $lists_to_remove ) ) {
			return;
		}
		$lists_to_add    = array_map( [ __CLASS__, 'get_public_id' ], $lists_to_add );
		$lists_to_remove = array_map( [ __CLASS__, 'get_public_id' ], $lists_to_remove );
		$current_lists   = Newspack_Newsletters_Subscription::get_contact_lists( $email );
		if ( ! is_array( $current_lists ) ) {
			$current_lists = [];
		}

		// No need to add the user to lists they are already subscribed to.
		$lists_to_add = array_values( array_diff( array_filter( $lists_to_add ), $current_lists ) );

		// No need to remove the user from lists they're not subscribed to.
		$lists_to_remove = array_values( array_intersect( array_filter( $lists_to_remove ), $current_lists ) );

		if ( empty( $lists_to_add ) && empty( $lists_to_remove ) ) {
			return;
		}

		Newspack_Newsletters_Contacts::add_and_remove_lists( $email, $lists_to_add, $lists_to_remove, $context );
	}

	/**
	 * Get all lists restricted by content gates.
	 *
	 * @return string[] The restricted list IDs.
	 */
	public static function get_restricted_lists() {
		if ( ! empty( self::$restricted_lists ) ) {
			return self::$restricted_lists;
		}
		$gates = Content_Gate::get_gates( Content_Gate::GATE_CPT, 'publish', true );
		if ( empty( $gates ) ) {
			return;
		}
		$restricted_lists = [];
		foreach ( $gates as $gate ) {
			$content_rules = array_values(
				array_filter(
					Content_Rules::get_gate_content_rules( $gate['id'] ),
					function ( $content_rule ) {
						return $content_rule['slug'] === 'newsletters';
					}
				)
			);
			if ( empty( $content_rules ) ) {
				continue;
			}
			$restricted_lists = array_values(
				array_unique(
					array_merge(
						$restricted_lists,
						array_merge(
							...array_column( $content_rules, 'value' )
						)
					)
				)
			);
		}
		$restricted_lists = array_map( 'intval', $restricted_lists );
		self::$restricted_lists = $restricted_lists;
		return self::$restricted_lists;
	}

	/**
	 * Check list access for the user.
	 *
	 * @param int $user_id The ID of the user to check access for.
	 *
	 * @return void
	 */
	private static function check_access( $user_id ) {
		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return;
		}
		$email            = $user->user_email;
		$restricted_lists = self::get_restricted_lists() ?? [];
		if ( empty( $restricted_lists ) ) {
			return;
		}
		$lists_to_add    = [];
		$lists_to_remove = [];
		foreach ( $restricted_lists as $list_id ) {
			if ( Content_Restriction_Control::is_post_restricted( false, $list_id, $user_id ) ) {
				$lists_to_remove[] = $list_id;
			} elseif ( (bool) get_option( 'newspack_premium_newsletters_auto_signup', 1 ) ) {
				$lists_to_add[] = $list_id;
			}
		}

		self::add_and_remove_lists( $email, $lists_to_add, $lists_to_remove );
	}

	/**
	 * Return the Unix timestamp of the next pending access-check event, or false.
	 *
	 * Checks ActionScheduler first when available, otherwise falls back to WP cron.
	 *
	 * @return int|false
	 */
	private static function get_next_scheduled_event_time() {
		if ( function_exists( 'as_next_scheduled_action' ) ) {
			$next = as_next_scheduled_action( self::SCHEDULED_HOOK, [], 'newspack' );
			return $next ? (int) $next : false;
		}
		$next = wp_next_scheduled( self::SCHEDULED_HOOK );
		return $next ? (int) $next : false;
	}

	/**
	 * Add the user to the access-check queue and schedule a future processing event
	 * if one is not already pending far enough in the future.
	 *
	 * Scheduling is debounced: if a pending event already exists more than
	 * FUTURE_EVENT_THRESHOLD seconds in the future, the user ID simply rides along
	 * with that event and no new event is created. If the queue is stale (older than
	 * MAX_QUEUE_AGE), the delay is overridden to 0 so the event fires on the earliest
	 * available cron/AS tick.
	 *
	 * @param int $user_id The ID of the user to schedule the access check for.
	 *
	 * @return void
	 */
	private static function schedule_access_check( $user_id ) {
		// 1. Read current queue state.
		$queue      = get_option( self::QUEUE_OPTION, [] );
		$user_ids   = isset( $queue['user_ids'] ) ? (array) $queue['user_ids'] : [];
		$created_at = isset( $queue['created_at'] ) ? (int) $queue['created_at'] : 0;
		$is_new_batch = empty( $user_ids );

		// 2. Append user ID (deduplicated).
		$user_ids   = array_values( array_unique( array_merge( $user_ids, [ (int) $user_id ] ) ) );
		$created_at = $is_new_batch ? time() : $created_at;

		// 3. Warn if the queue is growing unusually large — likely indicates a cron outage.
		if ( count( $user_ids ) > self::MAX_QUEUE_SIZE ) {
			Logger::log(
				sprintf(
					'Access-check queue has grown to %d entries — WP-Cron or ActionScheduler may not be running.',
					count( $user_ids )
				),
				'PREMIUM-NEWSLETTERS'
			);
		}

		// 4. Persist updated queue (autoload = false to avoid loading on every request).
		update_option(
			self::QUEUE_OPTION,
			[
				'user_ids'   => $user_ids,
				'created_at' => $created_at,
			],
			false
		);

		// 5. Resolve scheduling delay (filterable for production/testing environments).
		$delay = (int) apply_filters(
			'newspack_premium_newsletters_access_check_delay',
			self::DEFAULT_DELAY
		);

		// 6. Stale-queue safeguard: if the queue is older than MAX_QUEUE_AGE, override
		// the delay to 0 so the event fires on the next available cron/AS tick.
		if ( ! $is_new_batch && ( time() - $created_at ) > self::MAX_QUEUE_AGE ) {
			$delay = 0;
		}

		// 7. If a pending event is already far enough in the future, piggyback on it.
		$next_event_time = self::get_next_scheduled_event_time();
		if ( $next_event_time && $next_event_time > time() + self::FUTURE_EVENT_THRESHOLD ) {
			return;
		}

		// 8. Determine the base time for the new event.
		// If an imminent event exists (within the threshold), schedule after it so
		// the two events do not race. Otherwise schedule relative to now.
		$base_time      = $next_event_time ? $next_event_time : time();
		$scheduled_time = $base_time + $delay;

		// 9. Schedule via ActionScheduler when available, otherwise WP cron.
		if ( function_exists( 'as_schedule_single_action' ) ) {
			as_schedule_single_action( $scheduled_time, self::SCHEDULED_HOOK, [], 'newspack' );
		} else {
			wp_schedule_single_event( $scheduled_time, self::SCHEDULED_HOOK );
		}
	}

	/**
	 * Process all pending access checks from the queue.
	 *
	 * Registered as the callback for SCHEDULED_HOOK, fired by either WP cron or
	 * ActionScheduler. The queue is cleared before the loop begins so that any user
	 * IDs enqueued while processing are written to the now-empty option and will be
	 * picked up by the next scheduled event rather than being lost.
	 *
	 * @return void
	 */
	public static function process_access_check_queue() {
		$queue    = get_option( self::QUEUE_OPTION, [] );
		$user_ids = isset( $queue['user_ids'] ) ? (array) $queue['user_ids'] : [];
		if ( empty( $user_ids ) ) {
			return;
		}
		self::clear_queue();
		foreach ( $user_ids as $user_id ) {
			self::check_access( (int) $user_id );
		}
	}

	/**
	 * Delete the queue option entirely.
	 *
	 * Called before each queue processing run and on plugin deactivation
	 * (via the newspack_deactivation hook registered in init()).
	 *
	 * @return void
	 */
	public static function clear_queue() {
		delete_option( self::QUEUE_OPTION );
	}

	/**
	 * Maybe add or remove the user from restricted lists based on their access status.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function maybe_add_or_remove_lists( $timestamp, $data, $client_id ) {
		if ( empty( $data['user_id'] ) ) {
			return;
		}
		self::schedule_access_check( $data['user_id'] );
	}
}

Premium_Newsletters::init();

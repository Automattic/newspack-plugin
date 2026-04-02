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
 * Premium Newsletters integration and access control.
 *
 * Registers filters, data-event handlers, and scheduled hooks for premium newsletters.
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
	 * Stores: int[]
	 */
	const QUEUE_OPTION = 'newspack_premium_newsletters_access_check_queue';

	/**
	 * Log a warning once the queue exceeds this many unique user IDs.
	 */
	const MAX_QUEUE_SIZE = 500;

	/**
	 * Initialize.
	 */
	public static function init() {
		// Filter the subscription lists.
		add_filter( 'newspack_newsletters_subscription_lists', [ __CLASS__, 'filter_subscription_lists' ] );

		// Register Data Events handlers.
		add_action( 'init', [ __CLASS__, 'register_handlers' ] );

		// Register the scheduled-event callback (works for both WP cron and ActionScheduler).
		add_action( 'init', [ __CLASS__, 'register_access_check_event' ] );
		add_action( self::SCHEDULED_HOOK, [ __CLASS__, 'process_access_check_queue' ] );

		// Clean up the queue option on plugin deactivation.
		add_action( 'newspack_deactivation', [ __CLASS__, 'unschedule_access_check_event' ] );
	}

	/**
	 * Register Data Events handlers.
	 * To trigger an access check, add a handler for a Data Event that includes `user_id` in the data payload.
	 */
	public static function register_handlers() {
		Data_Events::register_handler( [ __CLASS__, 'maybe_enqueue_access_check' ], 'product_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_enqueue_access_check' ], 'donation_subscription_changed' );
		Data_Events::register_handler( [ __CLASS__, 'maybe_enqueue_access_check' ], 'reader_verified' );
	}

	/**
	 * Filter the subscription lists to prevent premium newsletters from being shown when restricted.
	 *
	 * @param array $lists The lists.
	 *
	 * @return array The filtered lists.
	 */
	public static function filter_subscription_lists( $lists ) {
		if ( is_admin() ) {
			return $lists;
		}
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
	 * @return string|null The public list ID, or null if $list_id is not a valid local list ID.
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
			return [];
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
		$restricted_lists = self::get_restricted_lists() ?? [];
		if ( empty( $restricted_lists ) ) {
			return;
		}
		$auto_signup     = (bool) get_option( 'newspack_premium_newsletters_auto_signup', 1 );
		$lists_to_add    = [];
		$lists_to_remove = [];
		foreach ( $restricted_lists as $list_id ) {
			if ( Content_Restriction_Control::is_post_restricted( false, $list_id, $user_id ) ) {
				$lists_to_remove[] = $list_id;
			} elseif ( $auto_signup ) {
				$lists_to_add[] = $list_id;
			}
		}

		$email = $user->user_email;
		self::add_and_remove_lists( $email, $lists_to_add, $lists_to_remove );
	}

	/**
	 * Add the user to the access-check queue.
	 *
	 * @param int $user_id The ID of the user to schedule the access check for.
	 *
	 * @return void
	 */
	private static function add_user_to_queue( $user_id ) {
		// 1. Read current queue.
		$queue = get_option( self::QUEUE_OPTION, [] );

		// 2. Append user ID (deduplicated).
		$queue = array_values( array_unique( array_merge( $queue, [ (int) $user_id ] ) ) );

		// 3. Warn if the queue is growing unusually large — likely indicates a cron outage.
		if ( count( $queue ) > self::MAX_QUEUE_SIZE ) {
			Logger::log(
				sprintf(
					'Access-check queue has grown to %d entries — WP-Cron or ActionScheduler may not be running.',
					count( $queue )
				),
				'PREMIUM-NEWSLETTERS'
			);
		}

		// 4. Persist updated queue (autoload = false to avoid loading on every request).
		update_option(
			self::QUEUE_OPTION,
			$queue,
			false
		);
	}

	/**
	 * Schedule a recurring event to check access for the users in the queue.
	 *
	 * @return void
	 */
	public static function register_access_check_event() {
		if ( ! wp_next_scheduled( self::SCHEDULED_HOOK ) ) {
			self::process_access_check_queue();
			wp_schedule_event( time(), 'hourly', self::SCHEDULED_HOOK );
		}
	}

	/**
	 * Process all pending access checks from the queue.
	 *
	 * Registered as the callback for the SCHEDULED_HOOK cron event.
	 * Clear the queue after processing so that if any errors occur the
	 * unprocessed queue will be processed by the next scheduled event.
	 *
	 * @return void
	 */
	public static function process_access_check_queue() {
		$queue = get_option( self::QUEUE_OPTION, [] );
		if ( empty( $queue ) ) {
			return;
		}
		foreach ( $queue as $user_id ) {
			self::check_access( (int) $user_id );
		}
		self::clear_queue();
	}

	/**
	 * Delete the queue option entirely.
	 *
	 * Called after each queue processing run and on plugin deactivation
	 * (via the newspack_deactivation hook registered in init()).
	 *
	 * @return void
	 */
	public static function clear_queue() {
		delete_option( self::QUEUE_OPTION );
	}

	/**
	 * Unschedule the recurring event.
	 *
	 * @return void
	 */
	public static function unschedule_access_check_event() {
		// Remove any existing WP Cron events.
		wp_clear_scheduled_hook( self::SCHEDULED_HOOK );

		// Delete the queue option.
		self::clear_queue();
	}

	/**
	 * Maybe add or remove the user from restricted lists based on their access status.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function maybe_enqueue_access_check( $timestamp, $data, $client_id ) {
		if ( empty( $data['user_id'] ) ) {
			return;
		}
		self::add_user_to_queue( (int) $data['user_id'] );
	}
}

Premium_Newsletters::init();

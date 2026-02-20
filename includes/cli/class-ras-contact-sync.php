<?php
/**
 * CLI tools for the RAS Contact Sync.
 *
 * @package Newspack
 */

namespace Newspack\CLI;

use WP_CLI;
use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Contact_Sync;
use Newspack\Reader_Activation\Contact_Sync_Batch;
use Newspack_Subscription_Migrations\CSV_Importers\CSV_Importer;
use Newspack_Subscription_Migrations\Stripe_Sync;

defined( 'ABSPATH' ) || exit;

/**
 * RAS Contact Sync CLI Class.
 */
class RAS_Contact_Sync {

	/**
	 * Context of the sync.
	 *
	 * @var string
	 */
	protected static $context = 'Contact sync manually triggered via CLI';

	/**
	 * Log to WP CLI.
	 *
	 * @param string $message The message to log.
	 * @param array  $data    Optional. Additional data to log.
	 */
	protected static function log( $message, $data = [] ) {
		WP_CLI::log( $message );
		if ( ! empty( $data ) ) {
			WP_CLI::log(
				wp_json_encode( $data )
			);
		}
	}

	/**
	 * Sync reader contact data to the connected integrations.
	 *
	 * Collects user IDs based on config, enqueues them via Contact_Sync_Batch,
	 * and polls progress until complete.
	 *
	 * @param array $config {
	 *   Configuration options.
	 *
	 *   @type bool        $config['is_dry_run'] True if a dry run.
	 *   @type bool        $config['active_only'] True if only active subscriptions should be synced.
	 *   @type string|bool $config['migrated_only'] If set, only sync subscriptions migrated from the given source.
	 *   @type array|bool  $config['subscription_ids'] If set, only sync the given subscription IDs.
	 *   @type array|bool  $config['user_ids'] If set, only sync the given user IDs.
	 *   @type array|bool  $config['order_ids'] If set, only sync the given order IDs.
	 *   @type int         $config['batch_size'] Number of contacts to sync per batch chunk.
	 *   @type int         $config['offset'] Number of contacts to skip.
	 *   @type int         $config['max_batches'] Maximum number of batches to process.
	 *   @type bool        $config['is_dry_run'] True if a dry run.
	 *   @type string      $config['context'] Context of the sync.
	 * }
	 *
	 * @return int|\WP_Error Number of synced contacts or WP_Error.
	 */
	private static function sync_contacts( $config ) {
		$default_config = [
			'active_only'      => false,
			'migrated_only'    => false,
			'subscription_ids' => false,
			'user_ids'         => false,
			'order_ids'        => false,
			'batch_size'       => 10,
			'offset'           => 0,
			'max_batches'      => 0,
			'is_dry_run'       => false,
			'context'          => static::$context,
		];
		$config = \wp_parse_args( $config, $default_config );

		static::$context = $config['context'];

		static::log( __( 'Running ESP contact sync...', 'newspack-plugin' ) );

		$can_sync = Contact_Sync::has_one_syncable_integration( true );
		if ( ! $config['is_dry_run'] && $can_sync->has_errors() ) {
			return $can_sync;
		}

		$user_ids = self::collect_user_ids( $config );
		if ( \is_wp_error( $user_ids ) ) {
			return $user_ids;
		}

		if ( empty( $user_ids ) ) {
			static::log( __( 'No contacts found to sync.', 'newspack-plugin' ) );
			return 0;
		}

		static::log(
			sprintf(
				// Translators: %d is the number of contacts collected.
				__( 'Collected %d contacts for syncing.', 'newspack-plugin' ),
				count( $user_ids )
			)
		);

		if ( $config['is_dry_run'] ) {
			return count( $user_ids );
		}

		$batch_id = Contact_Sync_Batch::enqueue(
			$user_ids,
			[
				'batch_size' => $config['batch_size'],
				'context'    => $config['context'],
			]
		);

		return self::poll_progress( $batch_id );
	}

	/**
	 * Collect user IDs to sync based on the provided configuration.
	 *
	 * @param array $config Configuration options (see sync_contacts).
	 *
	 * @return array|\WP_Error Array of user IDs or WP_Error.
	 */
	private static function collect_user_ids( $config ) {
		// If user-ids flag is passed, use those directly.
		if ( ! empty( $config['user_ids'] ) ) {
			static::log( __( 'Collecting user IDs from --user-ids...', 'newspack-plugin' ) );
			if ( $config['active_only'] ) {
				return array_values(
					array_filter(
						$config['user_ids'],
						[ __CLASS__, 'user_has_active_subscriptions' ]
					)
				);
			}
			return $config['user_ids'];
		}

		// If order-ids flag is passed, convert orders to user IDs.
		if ( ! empty( $config['order_ids'] ) ) {
			static::log( __( 'Collecting user IDs from --order-ids...', 'newspack-plugin' ) );
			$user_ids = [];
			foreach ( $config['order_ids'] as $order_id ) {
				$order = \wc_get_order( $order_id );
				if ( ! $order ) {
					static::log(
						sprintf(
							// Translators: %d is the order ID.
							__( 'No order with ID %d. Skipping.', 'newspack-plugin' ),
							$order_id
						)
					);
					continue;
				}
				$user_id = $order->get_customer_id();
				if ( $user_id ) {
					$user_ids[] = $user_id;
				}
			}
			return array_values( array_unique( $user_ids ) );
		}

		// If migrated-only or subscription-ids flag is passed, convert subscriptions to user IDs.
		if ( $config['migrated_only'] || ! empty( $config['subscription_ids'] ) ) {
			$subscription_ids = ! empty( $config['subscription_ids'] )
				? $config['subscription_ids']
				: self::get_all_migrated_subscriptions( $config );

			if ( \is_wp_error( $subscription_ids ) ) {
				return $subscription_ids;
			}

			static::log(
				sprintf(
					// Translators: %d is the number of subscriptions found.
					__( 'Collecting user IDs from %d subscriptions...', 'newspack-plugin' ),
					count( $subscription_ids )
				)
			);

			$user_ids = [];
			foreach ( $subscription_ids as $subscription_id ) {
				$subscription = \wcs_get_subscription( $subscription_id );
				if ( \is_wp_error( $subscription ) || ! $subscription ) {
					static::log(
						sprintf(
							// Translators: %d is the subscription ID.
							__( 'No subscription with ID %d. Skipping.', 'newspack-plugin' ),
							$subscription_id
						)
					);
					continue;
				}
				$user_id = $subscription->get_customer_id();
				if ( $user_id ) {
					$user_ids[] = $user_id;
				}
			}
			return array_values( array_unique( $user_ids ) );
		}

		// Default: collect all readers.
		if ( $config['active_only'] ) {
			static::log( __( 'Collecting all readers with active subscriptions...', 'newspack-plugin' ) );
		} else {
			static::log( __( 'Collecting all reader IDs...', 'newspack-plugin' ) );
		}

		$all_user_ids = [];
		$batch_ids    = self::get_batch_of_readers( $config['batch_size'], $config['offset'] );
		$batches      = 0;

		while ( $batch_ids ) {
			foreach ( $batch_ids as $user_id ) {
				if ( ! $config['active_only'] || self::user_has_active_subscriptions( $user_id ) ) {
					$all_user_ids[] = $user_id;
				}
			}

			$batches++;
			if ( $config['max_batches'] && $batches >= $config['max_batches'] ) {
				break;
			}

			$batch_ids = self::get_batch_of_readers( $config['batch_size'], $config['offset'] + ( $batches * $config['batch_size'] ) );
		}

		return $all_user_ids;
	}

	/**
	 * Collect all migrated subscription IDs across batches.
	 *
	 * @param array $config Configuration options (see sync_contacts).
	 *
	 * @return array|\WP_Error Array of subscription IDs or WP_Error.
	 */
	private static function get_all_migrated_subscriptions( $config ) {
		static::log( __( 'Collecting migrated subscription IDs...', 'newspack-plugin' ) );

		$all_subscription_ids = [];
		$batches              = 0;
		$offset               = $config['offset'];

		while ( true ) {
			$batch = self::get_migrated_subscriptions( $config['migrated_only'], $config['batch_size'], $offset, $config['active_only'] );
			if ( \is_wp_error( $batch ) ) {
				return $batch;
			}

			if ( empty( $batch ) ) {
				break;
			}

			$all_subscription_ids = array_merge( $all_subscription_ids, $batch );
			$batches++;

			if ( $config['max_batches'] && $batches >= $config['max_batches'] ) {
				break;
			}

			$offset = $config['offset'] + ( $batches * $config['batch_size'] );
		}

		return $all_subscription_ids;
	}

	/**
	 * Poll the progress of a Contact_Sync_Batch until complete.
	 *
	 * @param string $batch_id The batch ID to poll.
	 *
	 * @return int The number of completed contacts.
	 */
	private static function poll_progress( $batch_id ) {
		$progress = Contact_Sync_Batch::get_progress( $batch_id );
		if ( ! $progress ) {
			return 0;
		}

		$progress_bar  = \WP_CLI\Utils\make_progress_bar( __( 'Syncing contacts', 'newspack-plugin' ), $progress['total'] );
		$last_finished = 0;

		while ( true ) {
			// Clear the object cache so we get fresh progress from the database.
			wp_cache_delete( Contact_Sync_Batch::PROGRESS_OPTION_PREFIX . $batch_id, 'options' );
			$progress = Contact_Sync_Batch::get_progress( $batch_id );
			if ( ! $progress ) {
				break;
			}

			$finished = $progress['completed'] + $progress['failed'];
			$new      = $finished - $last_finished;
			for ( $i = 0; $i < $new; $i++ ) {
				$progress_bar->tick();
			}
			$last_finished = $finished;

			if ( 'running' !== $progress['status'] ) {
				break;
			}

			sleep( 2 );
		}

		$progress_bar->finish();

		if ( $progress && $progress['failed'] > 0 ) {
			WP_CLI::warning(
				sprintf(
					// Translators: %d is the number of failed contacts.
					__( '%d contacts failed to sync.', 'newspack-plugin' ),
					$progress['failed']
				)
			);
		}

		return $progress ? $progress['completed'] : 0;
	}

	/**
	 * Does the given user have any subscriptions with an active status?
	 *
	 * @param int $user_id User ID.
	 *
	 * @return bool
	 */
	private static function user_has_active_subscriptions( $user_id ) {
		if ( ! function_exists( 'wcs_get_users_subscriptions' ) ) {
			return false;
		}
		$subcriptions = array_reduce(
			array_keys( \wcs_get_users_subscriptions( $user_id ) ),
			function( $acc, $subscription_id ) {
				$subscription = \wcs_get_subscription( $subscription_id );
				if ( $subscription->has_status( [ 'active', 'pending', 'pending-cancel' ] ) ) {
					$acc[] = $subscription_id;
				}
				return $acc;
			},
			[]
		);

		return ! empty( $subcriptions );
	}

	/**
	 * Get a batch of migrated subscriptions.
	 *
	 * This method requires the Newspack_Subscription_Migrations plugin to be
	 * installed and active, otherwise it will return a WP_Error.
	 *
	 * @param string $source The source of the subscriptions. One of 'stripe', 'piano-csv', 'stripe-csv'.
	 * @param int    $batch_size Number of subscriptions to get.
	 * @param int    $offset Number to skip.
	 * @param bool   $active_only Whether to get only active subscriptions.
	 *
	 * @return array|\WP_Error Array of subscription IDs or WP_Error.
	 */
	private static function get_migrated_subscriptions( $source, $batch_size, $offset, $active_only ) {
		if (
			! class_exists( '\Newspack_Subscription_Migrations\Stripe_Sync' ) ||
			! class_exists( '\Newspack_Subscription_Migrations\CSV_Importers\CSV_Importer' )
		) {
			return new \WP_Error(
				'newspack_esp_sync_contact',
				__( 'The migrated-subscriptions flag requires the Newspack_Subscription_Migrations plugin to be installed and active.', 'newspack-plugin' )
			);
		}
		$subscription_ids = [];
		switch ( $source ) {
			case 'stripe':
				$subscription_ids = Stripe_Sync::get_migrated_subscriptions( $batch_size, $offset, $active_only );
				break;
			case 'piano-csv':
				$subscription_ids = CSV_Importer::get_migrated_subscriptions( 'piano', $batch_size, $offset, $active_only );
				break;
			case 'stripe-csv':
				$subscription_ids = CSV_Importer::get_migrated_subscriptions( 'stripe', $batch_size, $offset, $active_only );
				break;
			default:
				return new \WP_Error(
					'newspack_esp_sync_contact',
					sprintf(
						// Translators: %s is the source of the subscriptions.
						__( 'Invalid subscription migration type: %s', 'newspack-plugin' ),
						$source
					)
				);
		}
		return $subscription_ids;
	}

	/**
	 * Get a batch of readers' IDs.
	 *
	 * @param int $batch_size Number of readers to get.
	 * @param int $offset     Number to skip.
	 *
	 * @return array|false Array of user IDs, or false if no more to fetch.
	 */
	private static function get_batch_of_readers( $batch_size, $offset = 0 ) {
		$roles = Reader_Activation::get_reader_roles();
		$query = new \WP_User_Query(
			[
				'fields'   => 'ID',
				'number'   => $batch_size,
				'offset'   => $offset,
				'order'    => 'DESC',
				'orderby'  => 'registered',
				'role__in' => $roles,
			]
		);
		$results = $query->get_results();
		return ! empty( $results ) ? $results : false;
	}

	/**
	 * Sync Reader Activation contact data to the connected ESP for all customers, migrated subscriptions, or specific customers/subscriptions/orders.
	 *
	 * ## OPTIONS
	 *
	 * [--dry-run]
	 * : If passed, output results but do not execute the sync.
	 *
	 * [--active-only]
	 * : If passed, only sync users who have active subscriptions, otherwise resync all users.
	 *
	 * [--migrated-subscriptions=<stripe|piano-csv|stripe-csv>]
	 * : If passed, will only query for subscriptions that were migrated via the Newspack Subscription Migrations plugin using the Stripe/Piano CSV importers, or the legacy Stripe migrator. The Newspack Subscription Migrations plugin must be active to use this flag.
	 *
	 * [--subscription-ids=<id1,id2,etc>]
	 * : Comma-delimited list of subscription IDs. If passed, will only process those specific subscriptions.
	 *
	 * [--user-ids=<id1,id2,etc>]
	 * : Comma-delimited list of user IDs. If passed, will only process subscriptions associated with those specific users.
	 *
	 * [--order-ids=<id1,id2,etc>]
	 * : Comma-delimited list of order IDs. If passed, will only process subscriptions associated with those specific orders.
	 *
	 * [--batch-size=<number>]
	 * : Number of subscriptions to query/process at once.
	 *
	 * [--max-batches=<number>]
	 * : Maximum number of batches to process.
	 *
	 * [--offset=<number>]
	 * : Offset value passed to the subscription query. Use with `--batch-size` and `--max-batches` to run multiple processes in parallel.
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Associative args.
	 */
	public static function cli_sync_contacts( $args, $assoc_args ) {
		$config = [];
		$config['is_dry_run']       = ! empty( $assoc_args['dry-run'] );
		$config['active_only']      = ! empty( $assoc_args['active-only'] );
		$config['migrated_only']    = ! empty( $assoc_args['migrated-subscriptions'] ) ? $assoc_args['migrated-subscriptions'] : false;
		$config['subscription_ids'] = ! empty( $assoc_args['subscription-ids'] ) ? explode( ',', $assoc_args['subscription-ids'] ) : false;
		$config['user_ids']         = ! empty( $assoc_args['user-ids'] ) ? explode( ',', $assoc_args['user-ids'] ) : false;
		$config['order_ids']        = ! empty( $assoc_args['order-ids'] ) ? explode( ',', $assoc_args['order-ids'] ) : false;
		$config['batch_size']       = ! empty( $assoc_args['batch-size'] ) ? intval( $assoc_args['batch-size'] ) : 10;
		$config['offset']           = ! empty( $assoc_args['offset'] ) ? intval( $assoc_args['offset'] ) : 0;
		$config['max_batches']      = ! empty( $assoc_args['max-batches'] ) ? intval( $assoc_args['max-batches'] ) : 0;
		$config['context']          = ! empty( $assoc_args['sync-context'] ) ? $assoc_args['sync-context'] : static::$context;

		$processed = self::sync_contacts( $config );

		if ( \is_wp_error( $processed ) ) {
			WP_CLI::error( $processed->get_error_message() );
			return;
		}
		WP_CLI::line( "\n" );
		WP_CLI::success(
			sprintf(
				// Translators: total number of synced contacts.
				__(
					'Synced %d contacts.',
					'newspack-plugin'
				),
				$processed
			)
		);
	}
}

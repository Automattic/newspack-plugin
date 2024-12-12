<?php
/**
 * CLI tools for the RAS ESP Sync.
 *
 * @package Newspack
 */

namespace Newspack\CLI;

use WP_CLI;
use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Sync\Metadata;
use Newspack\Mailchimp_API;

use Newspack_Subscription_Migrations\CSV_Importers\CSV_Importer;
use Newspack_Subscription_Migrations\Stripe_Sync;

defined( 'ABSPATH' ) || exit;

/**
 * RAS ESP Sync CLI Class.
 */
class RAS_ESP_Sync extends Reader_Activation\ESP_Sync {

	/**
	 * Context of the sync.
	 *
	 * @var string
	 */
	protected static $context = 'Contact sync manually triggered via CLI';

	/**
	 * The final results object.
	 *
	 * @var array
	 */
	protected static $results = [
		'processed' => 0,
	];

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
	 * Sync reader contact data to the connected ESP.
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
	 *   @type int         $config['batch_size'] Number of contacts to sync per batch.
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

		$can_sync = self::can_esp_sync( true );
		if ( ! $config['is_dry_run'] && $can_sync->has_errors() ) {
			return $can_sync;
		}

		// If syncing only migrated subscriptions.
		if ( $config['migrated_only'] ) {
			$config['subscription_ids'] = self::get_migrated_subscriptions( $config['migrated_only'], $config['batch_size'], $config['offset'], $config['active_only'] );
			if ( \is_wp_error( $config['subscription_ids'] ) ) {
				return $config['subscription_ids'];
			}
			$batches = 0;
		}

		if ( ! empty( $config['subscription_ids'] ) ) {
			static::log( __( 'Syncing by subscription ID...', 'newspack-plugin' ) );

			while ( ! empty( $config['subscription_ids'] ) ) {
				$subscription_id = array_shift( $config['subscription_ids'] );
				$subscription    = \wcs_get_subscription( $subscription_id );

				if ( \is_wp_error( $subscription ) ) {
					static::log(
						sprintf(
							// Translators: %d is the subscription ID arg passed to the script.
							__( 'No subscription with ID %d. Skipping.', 'newspack-plugin' ),
							$subscription_id
						)
					);

					continue;
				}

				$result = self::sync_contact( $subscription, $config['is_dry_run'] );
				if ( \is_wp_error( $result ) ) {
					static::log(
						sprintf(
							// Translators: %1$d is the subscription ID arg passed to the script. %2$s is the error message.
							__( 'Error syncing contact info for subscription ID %1$d. %2$s', 'newspack-plugin' ),
							$subscription_id,
							$result->get_error_message()
						)
					);
				}

				// Get the next batch.
				if ( $config['migrated_only'] && empty( $config['subscription_ids'] ) ) {
					$batches++;

					if ( $config['max_batches'] && $batches >= $config['max_batches'] ) {
						break;
					}

					$next_batch_offset = $config['offset'] + ( $batches * $config['batch_size'] );
					$config['subscription_ids'] = self::get_migrated_subscriptions( $config['migrated_only'], $config['batch_size'], $next_batch_offset, $config['active_only'] );
				}
			}
		}

		// If order-ids flag is passed, sync contacts for those orders.
		if ( ! empty( $config['order_ids'] ) ) {
			static::log( __( 'Syncing by order ID...', 'newspack-plugin' ) );
			foreach ( $config['order_ids'] as $order_id ) {
				$order = new \WC_Order( $order_id );

				if ( \is_wp_error( $order ) ) {
					static::log(
						sprintf(
							// Translators: %d is the order ID.
							__( 'No order with ID %d. Skipping.', 'newspack-plugin' ),
							$order_id
						)
					);

					continue;
				}

				$result = self::sync_contact( $order, $config['is_dry_run'] );
				if ( \is_wp_error( $result ) ) {
					static::log(
						sprintf(
							// Translators: %1$d is the order ID arg passed to the script. %2$s is the error message.
							__( 'Error syncing contact info for order ID %1$d. %2$s', 'newspack-plugin' ),
							$order_id,
							$result->get_error_message()
						)
					);
				}
			}
		}

		// If user-ids flag is passed, sync those users.
		if ( ! empty( $config['user_ids'] ) ) {
			static::log( __( 'Syncing by customer user ID...', 'newspack-plugin' ) );
			foreach ( $config['user_ids'] as $user_id ) {
				if ( ! $config['active_only'] || self::user_has_active_subscriptions( $user_id ) ) {
					$result = self::sync_contact( $user_id, $config['is_dry_run'] );
					if ( \is_wp_error( $result ) ) {
						static::log(
							sprintf(
								// Translators: %1$d is the user ID arg passed to the script. %2$s is the error message.
								__( 'Error syncing contact info for user ID %1$d. %2$s', 'newspack-plugin' ),
								$user_id,
								$result->get_error_message()
							)
						);
					}
				}
			}
		}

		// Default behavior: sync all readers.
		if (
			false === $config['user_ids'] &&
			false === $config['order_ids'] &&
			false === $config['subscription_ids'] &&
			false === $config['migrated_only']
		) {
			if ( $config['active_only'] ) {
				static::log( __( 'Syncing all readers with active subscriptions...', 'newspack-plugin' ) );
			} else {
				static::log( __( 'Syncing all readers...', 'newspack-plugin' ) );
			}
			$user_ids = self::get_batch_of_readers( $config['batch_size'], $config['offset'] );
			$batches  = 0;

			while ( $user_ids ) {
				$user_id = array_shift( $user_ids );
				if ( ! $config['active_only'] || self::user_has_active_subscriptions( $user_id ) ) {
					$result = self::sync_contact( $user_id, $config['is_dry_run'] );
					if ( \is_wp_error( $result ) ) {
						static::log(
							sprintf(
								// Translators: $1$s is the contact's user ID. %2$s is the error message.
								__( 'Error syncing contact info for user ID %1$d. %2$s' ),
								$user_id,
								$result->get_error_message()
							)
						);
					}
				}

				// Get the next batch.
				if ( empty( $user_ids ) ) {
					$batches++;

					if ( $config['max_batches'] && $batches >= $config['max_batches'] ) {
						break;
					}

					$user_ids = self::get_batch_of_readers( $config['batch_size'], $config['offset'] + ( $batches * $config['batch_size'] ) );
				}
			}
		}

		return static::$results['processed'];
	}

	/**
	 * Does the given user have any subscriptions with an active status?
	 *
	 * @param int $user_id User ID.
	 *
	 * @return bool
	 */
	private static function user_has_active_subscriptions( $user_id ) {
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

	/**
	 * List all or matching merge fields in the connected Mailchimp audience.
	 *
	 * ## OPTIONS
	 *
	 * [--fields=<field1,field2,etc>]
	 * : Field slugs to match. These should match raw field slugs as defined in Newspack\Reader_Activation\Sync\Metadata. If specified, only merge fields matching these slugs will be shown.
	 *
	 * [--prefix=<prefix>]
	 * : If specified, only fields with a matching prefix will be shown.
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Associative args.
	 */
	public static function cli_mailchimp_list_merge_fields( $args, $assoc_args ) {
		$is_dry_run    = ! empty( $assoc_args['dry-run'] );
		$fields_to_show = ! empty( $assoc_args['fields'] ) ? explode( ',', $assoc_args['fields'] ) : false;
		$prefix         = $assoc_args['prefix'] ?? '';

		$all_fields = Metadata::get_all_fields();
		if ( $fields_to_show ) {
			$fields_to_show = array_reduce(
				$fields_to_show,
				function( $acc, $field_slug ) use ( $prefix, $all_fields ) {
					if ( ! empty( $all_fields[ $field_slug ] ) ) {
						$acc[] = trim( $prefix . $all_fields[ $field_slug ] );
					} elseif ( ! empty( Metadata::get_utm_key( $field_slug ) ) && ( ! $prefix || 0 === strpos( Metadata::get_utm_key( $field_slug ), $prefix ) ) ) {
						$acc[] = trim( $prefix . str_replace( Metadata::PREFIX, '', Metadata::get_utm_key( $field_slug ) ) );
					} else {
						\WP_CLI::warning( sprintf( 'Field %s not recognized.', $field_slug ) );
					}
					return $acc;
				},
				[]
			);
		}

		$audience_id = Reader_Activation::get_setting( 'mailchimp_audience_id' );
		if ( empty( $audience_id ) ) {
			\WP_CLI::error( __( 'Mailchimp audience ID not set.', 'newspack-plugin' ) );
		}

		$result = Mailchimp_API::get( "lists/$audience_id/merge-fields?count=1000" );
		if ( is_wp_error( $result ) || empty( $result['merge_fields'] || ! is_array( $result['merge_fields'] ) ) ) {
			\WP_CLI::error( __( 'Could not connect to Mailchimp API. Is the site connected to Mailchimp?', 'newspack-subscription-migrations' ) );
		}
		$fields = $result['merge_fields'];

		$matching = 0;
		$results  = [];
		foreach ( $fields as $field ) {
			$name_parts = explode( '_', $field['name'] );
			$field_name = $prefix ? $field['name'] : end( $name_parts );
			if ( ( ! $fields_to_show || in_array( $field_name, $fields_to_show, true ) ) && ( ! $prefix || 0 === strpos( $field['name'], $prefix ) ) ) {
				$results[] = [
					'id'   => $field['merge_id'],
					'tag'  => $field['tag'],
					'name' => $field['name'],
					'type' => $field['type'],
				];
				$matching++;
			}
		}

		\WP_CLI\Utils\format_items(
			'table',
			$results,
			[
				'id',
				'tag',
				'name',
				'type',
			]
		);
		\WP_CLI::success(
			sprintf(
				'Found %d merge fields.',
				$matching
			)
		);
	}

	/**
	 * Delete the specified merge fields in the connected Mailchimp audience. WARNING: Any data in the deleted fields will be lost.
	 *
	 * ## OPTIONS
	 *
	 * [--dry-run]
	 * : If passed, output results but do not modify any fields.
	 *
	 * [--fields=<field1,field2,etc>]
	 * : (required) Field slugs to delete, comma-separated. These should match raw field slugs as defined in Newspack\Reader_Activation\Sync\Metadata.
	 *
	 * [--prefix=<prefix>]
	 * : If specified, only fields with a matching prefix will be deleted.
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Associative args.
	 */
	public static function cli_mailchimp_delete_merge_fields( $args, $assoc_args ) {
		$is_dry_run       = ! empty( $assoc_args['dry-run'] );
		$fields_to_delete = ! empty( $assoc_args['fields'] ) ? explode( ',', $assoc_args['fields'] ) : false;
		$prefix           = $assoc_args['prefix'] ?? '';

		if ( empty( $fields_to_delete ) ) {
			\WP_CLI::error( __( 'Please specify at least one field to delete.', 'newspack-subscription-migrations' ) );
		}

		$all_fields       = Metadata::get_all_fields();
		$fields_to_delete = array_reduce(
			$fields_to_delete,
			function( $acc, $field_slug ) use ( $prefix, $all_fields ) {
				if ( ! empty( $all_fields[ $field_slug ] ) ) {
					$acc[] = trim( $prefix . $all_fields[ $field_slug ] );
				} elseif ( ! empty( Metadata::get_utm_key( $field_slug ) ) && ( ! $prefix || 0 === strpos( Metadata::get_utm_key( $field_slug ), $prefix ) ) ) {
					$acc[] = trim( $prefix . str_replace( Metadata::PREFIX, '', Metadata::get_utm_key( $field_slug ) ) );
				} else {
					\WP_CLI::warning( sprintf( 'Field %s not recognized.', $field_slug ) );
				}
				return $acc;
			},
			[]
		);

		$audience_id = Reader_Activation::get_setting( 'mailchimp_audience_id' );
		if ( empty( $audience_id ) ) {
			\WP_CLI::error( __( 'Mailchimp audience ID not set.', 'newspack-plugin' ) );
		}

		$result = Mailchimp_API::get( "lists/$audience_id/merge-fields?count=1000" );
		if ( is_wp_error( $result ) || empty( $result['merge_fields'] || ! is_array( $result['merge_fields'] ) ) ) {
			\WP_CLI::error( __( 'Could not connect to Mailchimp API. Is the site connected to Mailchimp?', 'newspack-subscription-migrations' ) );
		}
		$fields = $result['merge_fields'];

		$deleted = 0;
		foreach ( $fields as $field ) {
			$name_parts = explode( '_', $field['name'] );
			$field_name = $prefix ? $field['name'] : end( $name_parts );

			if ( in_array( $field_name, $fields_to_delete, true ) ) {
				if ( ! $is_dry_run ) {
					Mailchimp_API::delete( "lists/$audience_id/merge-fields/" . $field['merge_id'] );
				}
				\WP_CLI::log(
					sprintf(
						'%s merge field %s.',
						$is_dry_run ? 'Would delete' : 'Deleted',
						$field['name']
					)
				);
				$deleted++;
			}
		}

		\WP_CLI::success(
			sprintf(
				'%s %d merge fields.',
				$is_dry_run ? 'Would delete' : 'Deleted',
				$deleted
			)
		);
	}

	/**
	 * Identifies duplicate merge fields with the same name in the connected Mailchimp account and consolidates all data into a single instance of the field.
	 *
	 * ## OPTIONS
	 *
	 * [--dry-run]
	 * : If passed, output results but do not modify any data.
	 *
	 * @param array $args Positional args.
	 * @param array $assoc_args Associative args.
	 */
	public static function cli_mailchimp_fix_duplicate_merge_fields( $args, $assoc_args ) {
		$is_dry_run = ! empty( $assoc_args['dry-run'] );

		// Filter request timeout.
		add_filter( // phpcs:ignore WordPressVIPMinimum.Hooks.RestrictedHooks.http_request_timeout
			'http_request_timeout',
			function() {
				return 60;
			}
		);

		$lists = Mailchimp_API::get( 'lists?count=1000' );
		if ( \is_wp_error( $lists ) ) {
			WP_CLI::error( 'Error fetching audiences: ' . $lists->get_error_message() );
			return;
		}

		foreach ( $lists['lists'] as $list ) {
			WP_CLI::log(
				sprintf(
					'Fixing duplicate merge fields in audience %s... %s',
					$list['id'],
					$is_dry_run ? '(DRY RUN MODE)' : ''
				)
			);
			WP_CLI::line( '' );
			$list_id = $list['id'];

			// First, consolidate data in duplicate fields into one instance.
			$fixed = self::fix_duplicate_fields_for_list( $list_id, $is_dry_run );
			if ( \is_wp_error( $fixed ) ) {
				WP_CLI::error( 'Error fixing audience ' . $list_id . ': ' . $fixed->get_error_message() );
			}
		}
	}

	/**
	 * Fix duplicate merge fields for a list given its ID.
	 *
	 * @param string $list_id List ID.
	 * @param bool   $is_dry_run Whether to run in dry-run mode.
	 *
	 * @return \WP_Error|void
	 */
	private static function fix_duplicate_fields_for_list( $list_id, $is_dry_run = true ) {
		$config = self::get_duplicate_merge_fields_config( $list_id );
		if ( \is_wp_error( $config ) ) {
			return $config;
		}
		if ( empty( $config['duplicate'] ) ) {
			WP_CLI::log( 'Skipping: no duplicate merge fields found.' );
			return;
		}

		// Create segment for each duplicate.
		$segment_groups = [];
		foreach ( $config['duplicate'] as $merge_field_name => $merge_fields ) {
			WP_CLI::log( 'Found ' . count( $merge_fields ) . " duplicate merge field(s) for $merge_field_name" );

			if ( ! $is_dry_run ) {
				$conditions = array_map(
					function( $merge_field ) {
						return [
							'condition_type' => 'TextMerge',
							'field'          => $merge_field['tag'],
							'op'             => 'blank_not',
						];
					},
					$merge_fields
				);
				// Split conditions in groups of 5. (Mailchimp limit).
				$conditions_groups = array_chunk( $conditions, 5 );

				// Create temporary segments to migrate date between fields.
				foreach ( $conditions_groups as $i => $conditions_group ) {
					$segment = Mailchimp_API::post(
						"lists/$list_id/segments",
						[
							'name'    => "Merge field: $merge_field_name #$i",
							'options' => [
								'match'      => 'any',
								'conditions' => $conditions_group,
							],
						]
					);
					if ( \is_wp_error( $segment ) ) {
						return new \WP_Error( 'newspack_cli_mailchimp_error', "Error creating temporary segment #$i for $merge_field_name: " . $segment->get_error_message() );
					} else {
						WP_CLI::log( "Created segment {$segment['id']} for $merge_field_name" );
					}
					$segment_groups[ $merge_field_name ][] = $segment;
				}
			}
		}

		// Fix for each merge field using the temporary segments.
		if ( ! $is_dry_run ) {
			foreach ( $segment_groups as $merge_field_name => $segments ) {
				foreach ( $segments as $i => $segment ) {
					// Fetch segment members.
					$members = Mailchimp_API::get(
						"lists/$list_id/segments/{$segment['id']}/members?include_cleaned=1&include_transactional=1&include_unsubscribed=1&count=1000"
					);
					if ( \is_wp_error( $members ) ) {
						return new \WP_Error( 'newspack_cli_mailchimp_error', "Error fetching members for temporary segment #$i for $merge_field_name: " . $members->get_error_message() );
					}
					WP_CLI::log( "$merge_field_name {$segment['id']}: Found " . count( $members['members'] ) . ' members' );
					if ( empty( $members ) ) {
						continue;
					}

					// Update members.
					$merge_field = $config['unique'][ $merge_field_name ];
					$duplicates = $config['duplicate'][ $merge_field_name ];
					foreach ( $members['members'] as $member ) {
						// If member already has a value for the merge field, skip.
						if ( ! empty( $member[ $merge_field['tag'] ] ) ) {
							continue;
						}
						// Get value from first duplicate that has a value.
						$value = null;
						$found_duplicate = null;
						foreach ( $duplicates as $duplicate ) {
							if ( ! empty( $member['merge_fields'][ $duplicate['tag'] ] ) ) {
								$found_duplicate = $duplicate;
								$value = $member['merge_fields'][ $duplicate['tag'] ];
								break;
							}
						}
						// Skip if no value found.
						if ( empty( $value ) ) {
							continue;
						}
						// Update member.
						WP_CLI::log( "$merge_field_name #$i: Updating member \"{$member['email_address']}\" with value \"$value\" from tag \"{$found_duplicate['tag']}\"" );
						Mailchimp_API::put(
							"lists/$list_id/members/" . $member['id'],
							[
								'merge_fields' => [
									$merge_field['tag'] => $value,
									$found_duplicate['tag'] => '',
								],
							]
						);
					}
					self::delete_segment( $list_id, $segment['id'] );
				}
			}
		}

		WP_CLI::line( '' );
		WP_CLI::success(
			sprintf(
				'%s in duplicate fields for audience %s',
				$is_dry_run ? 'Would consolidate data' : 'Consolidated data',
				$list_id
			)
		);

		// Next, delete the duplicate fields.
		$deleted = self::delete_duplicate_fields_for_list( $list_id, $is_dry_run );
		if ( \is_wp_error( $deleted ) ) {
			WP_CLI::error( 'Error deleting duplicate fields for audience ' . $list_id . ': ' . $deleted->get_error_message() );
		} elseif ( is_array( $deleted ) ) {
			WP_CLI::line( '' );
			WP_CLI::success(
				sprintf(
					'%s duplicate fields for audience %s: %s',
					$is_dry_run ? 'Would delete' : 'Deleted',
					$list_id,
					implode( ', ', $deleted )
				)
			);
		}
	}

	/**
	 * Delete a segment.
	 *
	 * @param string $list_id List ID.
	 * @param string $segment_id Segment ID.
	 */
	private static function delete_segment( $list_id, $segment_id ) {
		try {
			$res = Mailchimp_API::request( 'DELETE', "lists/$list_id/segments/$segment_id" );
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// This will always throw an error, even on success.
			return true;
		}
		if ( \is_wp_error( $res ) ) {
			return $res;
		}
	}

	/**
	 * Delete duplicate merge fields for a list given its ID.
	 *
	 * @param string  $list_id List ID.
	 * @param boolean $is_dry_run If true, log but don't execute the deletion.
	 *
	 * @return \WP_Error|void
	 */
	private static function delete_duplicate_fields_for_list( $list_id, $is_dry_run = true ) {
		$config = self::get_duplicate_merge_fields_config( $list_id );
		if ( \is_wp_error( $config ) ) {
			return $config;
		}
		if ( empty( $config['duplicate'] ) ) {
			WP_CLI::log( '		Skipping: no duplicate merge fields found.' );
			return;
		}

		$deleted_merge_fields = [];

		foreach ( $config['duplicate'] as $merge_field_name => $merge_fields ) {
			foreach ( $merge_fields as $merge_field ) {
				WP_CLI::log( "		Deleting merge field {$merge_field['tag']} ({$merge_field['merge_id']}) for $merge_field_name" );
				try {
					$res = true;
					if ( $is_dry_run ) {
						WP_CLI::log(
							sprintf(
								'		DRY RUN: would have deleted merge field %s (%s) in audience %s.',
								$merge_field['tag'],
								$merge_field_name,
								$list_id
							)
						);
					} else {
						$res = Mailchimp_API::request( 'DELETE', "lists/$list_id/merge-fields/{$merge_field['merge_id']}" );
						WP_CLI::success(
							sprintf(
								'		Deleted merge field %s in audience %s.',
								$merge_field['tag'],
								$list_id
							)
						);
					}
				} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
					// This will always throw an error, even on success.
				}
				if ( \is_wp_error( $res ) ) {
					return new \WP_Error( 'newspack_cli_mailchimp_error', "Error deleting merge field {$merge_field['merge_id']} for $merge_field_name: " . $res->get_error_message() );
				}

				$deleted_merge_fields[] = $merge_field_name;
			}
		}
		return $deleted_merge_fields;
	}

	/**
	 * Determine which fields to check for duplicates.
	 *
	 * @return array
	 */
	private static function get_fields_to_check_for_duplicates() {
		$all_fields = Metadata::get_all_fields();
		$fields     = array_map(
			function( $key ) {
				return Metadata::get_key( $key );
			},
			array_keys( Metadata::get_all_fields() )
		);

		// Additional fields.
		$fields = array_merge(
			$fields,
			[
				'origin_newspack',
				'newsletters_subscription_method',
				'current_page_url',
				'newspack_popup_id',
				'registration_method',
			]
		);
		return $fields;
	}

	/**
	 * Get duplicate merge fields config for a list given its ID.
	 *
	 * @param string $list_id List ID.
	 *
	 * @return array|\WP_Error
	 */
	private static function get_duplicate_merge_fields_config( $list_id ) {
		// Get all merge fields and sort by display order.
		$merge_fields = Mailchimp_API::get( "lists/$list_id/merge-fields?count=1000" );
		if ( \is_wp_error( $merge_fields ) ) {
			return new \WP_Error( 'newspack_cli_mailchimp_error', 'Error fetching merge fields: ' . $merge_fields->get_error_message() );
		}
		usort(
			$merge_fields['merge_fields'],
			function( $a, $b ) {
				return $a['display_order'] - $b['display_order'];
			}
		);

		// Which field names to check for duplicates.
		$fields = self::get_fields_to_check_for_duplicates();
		if ( \is_wp_error( $fields ) ) {
			return $fields;
		}

		// Group merge fields by name.
		$unique = [];
		$duplicate = [];
		foreach ( $merge_fields['merge_fields'] as $merge_field ) {
			if ( ! in_array( $merge_field['name'], $fields ) ) {
				continue;
			}
			if ( ! isset( $unique[ $merge_field['name'] ] ) ) {
				$unique[ $merge_field['name'] ] = $merge_field;
			} else {
				if ( ! isset( $duplicate[ $merge_field['name'] ] ) ) {
					$duplicate[ $merge_field['name'] ] = [];
				}
				$duplicate[ $merge_field['name'] ][] = $merge_field;
			}
		}

		return [
			'unique'    => $unique,
			'duplicate' => $duplicate,
		];
	}
}

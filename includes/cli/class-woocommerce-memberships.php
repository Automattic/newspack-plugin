<?php
/**
 * WooCommerce Memberships CLI commands.
 *
 * @package Newspack
 */

namespace Newspack\CLI;

use PHP_CodeSniffer\Standards\Generic\Sniffs\Commenting\TodoSniff;
use WP_CLI;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Memberships CLI commands.
 */
class WooCommerce_Memberships {
	private static $live = false; // phpcs:ignore Squiz.Commenting.VariableComment.Missing
	private static $verbose = true; // phpcs:ignore Squiz.Commenting.VariableComment.Missing
	private static $command_results = [ // phpcs:ignore Squiz.Commenting.VariableComment.Missing
		'skipped'   => [],
		'processed' => [],
	];

	/**
	 * Migrate WooCommerce Memberships guest authors to regular users.
	 *
	 * ## OPTIONS
	 *
	 * [--live]
	 * : Run the command in live mode, updating the subscriptions.
	 *
	 * [--verbose]
	 * : Produce more output.
	 *
	 * [--limit]
	 * : Limit processed customers.
	 *
	 * @param array $args Positional arguments.
	 * @param array $assoc_args Assoc arguments.
	 * @return void
	 */
	public function fix_memberships( $args, $assoc_args ) {
		WP_CLI::line( '' );

		// Disable membership activation emails.
		add_filter( 'woocommerce_email_enabled_WC_Memberships_User_Membership_Activated_Email', '__return_false' );

		self::$live = isset( $assoc_args['live'] ) ? true : false;
		self::$verbose = isset( $assoc_args['verbose'] ) ? true : false;

		$limit = isset( $assoc_args['limit'] ) ? $assoc_args['limit'] : false;

		if ( self::$live ) {
			WP_CLI::line( 'Live mode - data will be changed.' );
		} else {
			WP_CLI::line( 'Dry run. Use --live flag to run in live mode.' );
		}
		WP_CLI::line( '' );

		if ( ! function_exists( 'wc_memberships_get_membership_plan' ) ) {
			WP_CLI::line( '' );
			WP_CLI::error( 'WooCommerce Memberships plugin is not active.' );
		}
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			WP_CLI::line( '' );
			WP_CLI::error( 'WooCommerce Subscriptions plugin is not active.' );
		}

		$plan_product_ids = implode(
			',',
			array_reduce(
				get_posts( [ 'post_type' => 'wc_membership_plan' ] ),
				function( $acc, $post ) {
					$maybe_product_ids = get_post_meta( $post->ID, '_product_ids', true );
					$plan_product_ids = is_array( $maybe_product_ids ) ? $maybe_product_ids : [];
					return array_merge( $plan_product_ids, $acc );
				},
				[]
			)
		);

		global $wpdb;
		$sql_query = "
		WITH ActiveSubscriptions AS (
			SELECT pm.meta_value AS customer_user_id,
				GROUP_CONCAT(subscriptions.ID) AS subscription_ids
			FROM {$wpdb->prefix}posts subscriptions
			LEFT JOIN {$wpdb->prefix}postmeta pm ON subscriptions.ID = pm.post_id AND pm.meta_key = '_customer_user'
			LEFT JOIN {$wpdb->prefix}woocommerce_order_items oi ON oi.order_id = subscriptions.ID
			LEFT JOIN {$wpdb->prefix}woocommerce_order_itemmeta oim ON oi.order_item_id = oim.order_item_id AND oim.meta_key = '_product_id'
			WHERE subscriptions.post_type = 'shop_subscription'
			AND subscriptions.post_status = 'wc-active'
			AND oim.meta_value IN ({$plan_product_ids})
			GROUP BY pm.meta_value
		),
		ActiveMemberships AS (
			SELECT memberships.post_author AS customer_user_id,
				COUNT(DISTINCT memberships.ID) AS active_memberships_count
			FROM {$wpdb->prefix}posts memberships
			LEFT JOIN {$wpdb->prefix}postmeta mp ON memberships.ID = mp.post_id AND mp.meta_key = '_product_id'
			WHERE memberships.post_type = 'wc_user_membership'
			AND memberships.post_status IN ('wcm-active', 'wcm-free_trial')
			AND mp.meta_value IN ({$plan_product_ids})
			GROUP BY memberships.post_author
		),
		InactiveMemberships AS (
			SELECT memberships.post_author AS customer_user_id,
				GROUP_CONCAT(memberships.ID) AS membership_ids,
				GROUP_CONCAT(memberships.post_status) AS membership_statuses
			FROM {$wpdb->prefix}posts memberships
			LEFT JOIN {$wpdb->prefix}postmeta mp ON memberships.ID = mp.post_id AND mp.meta_key = '_product_id'
			WHERE memberships.post_type = 'wc_user_membership'
			AND memberships.post_status NOT IN ('wcm-active', 'wcm-free_trial')
			AND mp.meta_value IN ({$plan_product_ids})
			GROUP BY memberships.post_author
		)
		SELECT s.customer_user_id,
			s.subscription_ids,
			im.membership_ids,
			im.membership_statuses
		FROM ActiveSubscriptions s
		LEFT JOIN ActiveMemberships m ON s.customer_user_id = m.customer_user_id
		LEFT JOIN InactiveMemberships im ON s.customer_user_id = im.customer_user_id
		WHERE COALESCE(m.active_memberships_count, 0) = 0;
		";


		$affected_users_query_result = $wpdb->get_results( $sql_query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		$site_url = get_option( 'siteurl' );

		if ( $limit !== false ) {
			WP_CLI::warning( sprintf( 'Results limited to %d.', $limit ) );
			$affected_users_query_result = array_slice( $affected_users_query_result, 0, $limit );
		}

		WP_CLI::line( sprintf( 'Will process %d customers.', count( $affected_users_query_result ) ) );
		WP_CLI::line( '' );

		foreach ( $affected_users_query_result as $result ) {
			$subscription_ids = array_filter( explode( ',', $result['subscription_ids'] ?? '' ) );
			$membership_ids = array_filter( explode( ',', $result['membership_ids'] ?? '' ) );

			$user_id = $result['customer_user_id'];
			$user = get_userdata( $user_id );

			if ( empty( $subscription_ids ) ) {
				$log_line = 'No subscription IDs, skipping.';
				WP_CLI::warning( $log_line );
				self::$command_results['skipped'][] = $log_line;
				continue;
			}

			if ( self::$verbose ) {
				WP_CLI::line( sprintf( 'User: %s', $user->user_email ) );
				WP_CLI::line( sprintf( '    - memberships: %s/wp-admin/edit.php?s=%s&post_type=wc_user_membership', $site_url, $user->user_email ) );
				WP_CLI::line( sprintf( '    - subscriptions: %s/wp-admin/edit.php?s=%s&post_type=shop_subscription', $site_url, $user->user_email ) );
			}

			$latest_active_subscription_id = max( $subscription_ids );
			$latest_active_subscription = \wcs_get_subscription( $latest_active_subscription_id );

			if ( empty( $membership_ids ) ) {
				/**
				 * Determine the membership plan from the subscrption product.
				 */
				$subscription_product_ids = array_reduce(
					$latest_active_subscription->get_items(),
					function( $acc, $item ) {
						return array_merge( [ $item->get_product_id() ], $acc );
					},
					[]
				);
				$subscription_product_ids_meta_value_sql = implode(
					' OR ',
					array_map(
						function( $id ) {
							return "pm.meta_value LIKE '%i:{$id};%'";
						},
						$subscription_product_ids
					)
				);
				$sql_query = "
					SELECT p.ID AS membership_plan_id, p.post_title AS membership_plan_name
					FROM {$wpdb->prefix}posts p
					LEFT JOIN {$wpdb->prefix}postmeta pm ON p.ID = pm.post_id
					WHERE p.post_type = 'wc_membership_plan'
					AND pm.meta_key = '_product_ids'
					AND {$subscription_product_ids_meta_value_sql}
				";
				$membership_plans_query_result = $wpdb->get_results( $sql_query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$plan_id = isset( $membership_plans_query_result[0]['membership_plan_id'] ) ? $membership_plans_query_result[0]['membership_plan_id'] : false;
				if ( $plan_id === false ) {
					$log_line = sprintf( 'Could not determine plan id for subscription (#%d) items, skipping.', $latest_active_subscription_id );
					WP_CLI::warning( $log_line );
					self::$command_results['skipped'][] = $log_line;
					continue;
				}
				$plan = \wc_memberships_get_membership_plan( $plan_id );
				$plan_product_ids = $plan->get_product_ids();
				$product_ids = array_intersect( $subscription_product_ids, $plan_product_ids );
				if ( empty( $product_ids ) ) {
					$log_line = sprintf( 'Could not determine product id for subscription (#%d) and plan (#%d), skipping.', $latest_active_subscription_id, $plan_id );
					WP_CLI::warning( $log_line );
					self::$command_results['skipped'][] = $log_line;
					continue;
				}

				$product_id = $product_ids[0];

				/**
				 * Check if the subscription is linked to any membership. Sometimes the membership
				 * is missing the _product_id meta, which results in a false-positive.
				 */
				$linked_membership_sql_query = "
				SELECT p.ID AS membership_id, p.post_title AS membership_name
				FROM {$wpdb->prefix}posts p
				LEFT JOIN {$wpdb->prefix}postmeta pm ON p.ID = pm.post_id
				WHERE p.post_type = 'wc_user_membership'
				  AND pm.meta_key = '_subscription_id'
				  AND pm.meta_value = '{$latest_active_subscription_id}';
				";
				$linked_membership_sql_query_result = $wpdb->get_results( $linked_membership_sql_query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				if ( count( $linked_membership_sql_query_result ) ) {
					$found_membership_id = $linked_membership_sql_query_result[0]['membership_id'];

					$log_line = sprintf( 'Latest subscription (#%d) is linked to a membership (#%d), possibly the membership is missing the product ID, setting product ID to %d.', $latest_active_subscription_id, $found_membership_id, $product_id );
					$membership = new \WC_Memberships_Integration_Subscriptions_User_Membership( $found_membership_id );
					if ( self::$live ) {
						$membership->set_product_id( $product_id );
						WP_CLI::success( $log_line );
					} else {
						WP_CLI::line( $log_line );
					}
					WP_CLI::line( '' );
					self::$command_results['processed'][] = $log_line;
					continue;
				}

				self::flag_zero_value_subscription( $latest_active_subscription, $user );

				if ( self::$live ) {
					try {
						$membership = \wc_memberships_create_user_membership(
							[
								'user_id'    => $user_id,
								'plan_id'    => $plan_id,
								'product_id' => $product_id,
								'order_id'   => $latest_active_subscription->get_parent_id(),
							]
						);
						$membership = new \WC_Memberships_Integration_Subscriptions_User_Membership( $membership->get_id() );
						$membership->set_start_date( $latest_active_subscription->get_date( 'start' ) );
						$membership->set_subscription_id( $latest_active_subscription_id );
						WP_CLI::success( sprintf( 'Created a membership (#%d) for user %s.', $membership->get_id(), $user->user_email ) );
					} catch ( \Throwable $th ) {
						WP_CLI::warning( sprintf( 'Could not create a membership for user %s.', $user->user_email ) );
					}
				} else {
					WP_CLI::line( sprintf( 'In live mode, would create a membership for user %s.', $user->user_email ) );
				}
				self::$command_results['processed'][] = sprintf( 'Created a membership for user %s.', $user->user_email );
			} else {
				self::flag_zero_value_subscription( $latest_active_subscription, $user );

				$membership = new \WC_Memberships_Integration_Subscriptions_User_Membership( $membership_ids[0] );
				$log_line = sprintf( 'Activated membership (#%d) and relinked to subscription (#%d) for user %s.', $membership->get_id(), $latest_active_subscription_id, $user->user_email );
				if ( self::$live ) {
					$membership->unschedule_expiration_events();
					$membership->set_order_id( $latest_active_subscription->get_parent_id() );
					$membership->set_subscription_id( $latest_active_subscription_id );
					$membership->set_end_date();
					$membership->update_status( 'active' );
					WP_CLI::success( $log_line );
				} else {
					WP_CLI::line( sprintf( 'In live mode, would activate membership (#%d) and relink to subscription (#%d) for user %s.', $membership->get_id(), $latest_active_subscription_id, $user->user_email ) );
				}
				self::$command_results['processed'][] = $log_line;
			}
			WP_CLI::line( '' );
		}

		WP_CLI::line( '' );
		WP_CLI::line( 'Done, here are the results:' );
		if ( ! empty( self::$command_results['skipped'] ) ) {
			WP_CLI::line( sprintf( 'Skipped %d:', count( self::$command_results['skipped'] ) ) );
			foreach ( self::$command_results['skipped'] as $line ) {
				WP_CLI::line( '    ' . $line );
			}
		}
		if ( ! empty( self::$command_results['processed'] ) ) {
			if ( self::$live ) {
				WP_CLI::line( sprintf( 'Processed %d:', count( self::$command_results['processed'] ) ) );
			} else {
				WP_CLI::line( sprintf( 'Would process %d:', count( self::$command_results['processed'] ) ) );
			}
			foreach ( self::$command_results['processed'] as $line ) {
				WP_CLI::line( '    ' . $line );
			}
		}
		WP_CLI::line( '' );
	}

	/**
	 * Check for 0 value subscriptions.
	 *
	 * @param WC_Subscription $subscription WC Subscription.
	 * @param WP_User         $user WP User.
	 */
	public static function flag_zero_value_subscription( $subscription, $user ) {
		if ( (float) $subscription->get_total() === 0.0 ) {
			WP_CLI::warning( sprintf( 'Latest subscription (#%d) total for user %s is 0.', $subscription->get_id(), $user->user_email ) );
			WP_CLI::line( '' );
		}
	}
}

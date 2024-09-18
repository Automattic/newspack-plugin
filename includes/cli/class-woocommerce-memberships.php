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
	 * @param array $args Positional arguments.
	 * @param array $assoc_args Assoc arguments.
	 * @return void
	 */
	public function fix_memberships( $args, $assoc_args ) {
		WP_CLI::line( '' );

		self::$live = isset( $assoc_args['live'] ) ? true : false;
		self::$verbose = isset( $assoc_args['verbose'] ) ? true : false;

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


		$results = $wpdb->get_results( $sql_query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		$site_url = get_option( 'siteurl' );

		foreach ( $results as $result ) {
			$subscription_ids = array_filter( explode( ',', $result['subscription_ids'] ?? '' ) );
			$membership_ids = array_filter( explode( ',', $result['membership_ids'] ?? '' ) );

			if ( empty( $subscription_ids ) ) {
				WP_CLI::warning( 'No subscription IDs, skipping.' );
				continue;
			}

			if ( count( $membership_ids ) > 1 ) {
				WP_CLI::warning( 'More than one membership ID, skipping.' );
				continue;
			}

			$user_id = $result['customer_user_id'];
			$user = get_userdata( $user_id );
			if ( self::$verbose ) {
				WP_CLI::line( sprintf( 'User: %s', $user->user_email ) );
				WP_CLI::line( sprintf( '    - memberships: %s/wp-admin/edit.php?s=%s&post_type=wc_user_membership', $site_url, $user->user_email ) );
				WP_CLI::line( sprintf( '    - subscriptions: %s/wp-admin/edit.php?s=%s&post_type=shop_subscription', $site_url, $user->user_email ) );
			}
			$latest_active_subscription_id = max( $subscription_ids );

			if ( empty( $membership_ids ) ) {
				// Determine the membership plan from the subscrption product.
				$latest_active_subscription = \wcs_get_subscription( $latest_active_subscription_id );
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
				$result = $wpdb->get_results( $sql_query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$plan_id = isset( $result[0]['membership_plan_id'] ) ? $result[0]['membership_plan_id'] : false;
				if ( $plan_id === false ) {
					WP_CLI::warning( sprintf( 'Could not determine plan id for subscription %d items, skipping.', $latest_active_subscription_id ) );
					continue;
				}
				$plan = \wc_memberships_get_membership_plan( $plan_id );
				$plan_product_ids = $plan->get_product_ids();
				$product_ids = array_intersect( $subscription_product_ids, $plan_product_ids );
				if ( empty( $product_ids ) ) {
					WP_CLI::warning( sprintf( 'Could not determine product id for subscription %d and plan %d, skipping.', $latest_active_subscription_id, $plan_id ) );
					continue;
				}
				if ( self::$live ) {
					try {
						$membership = \wc_memberships_create_user_membership(
							[
								'user_id'    => $user_id,
								'plan_id'    => $plan_id,
								'product_id' => $product_ids[0],
								'order_id'   => $latest_active_subscription_id,
							]
						);
						WP_CLI::success( sprintf( 'Created a membership (#%d) for user %s.', $membership->get_id(), $user->user_email ) );
					} catch ( \Throwable $th ) {
						WP_CLI::warning( sprintf( 'Could not create a membership for user %s.', $user->user_email ) );
					}
				} else {
					WP_CLI::line( sprintf( 'In live mode, would create a membership for user %s.', $user->user_email ) );
				}
			} else {
				$membership = \wc_memberships_get_user_membership( $membership_ids[0] );
				if ( self::$live ) {
					$membership->unschedule_expiration_events();
					$membership->set_subscription_id( $latest_active_subscription_id );
					$membership->set_end_date();
					$membership->update_status( 'active' );
					WP_CLI::success( sprintf( 'Activated membership (#%d) and relinked to subscription (#%d) for user %s.', $membership->get_id(), $latest_active_subscription_id, $user->user_email ) );
				} else {
					WP_CLI::line( sprintf( 'In live mode, would activate membership (#%d) and relink to subscription (#%d) for user %s.', $membership->get_id(), $latest_active_subscription_id, $user->user_email ) );
				}
			}
			WP_CLI::line( '' );
		}
	}
}

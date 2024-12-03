<?php
/**
 * WooCommerce Subscriptions Integration CLI commands.
 *
 * @package Newspack
 */

namespace Newspack\CLI;

use WP_CLI;
use Newspack\Woocommerce_Subscriptions as WooCommerce_Subscriptions_Integration;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Subscriptions Integration CLI commands.
 */
class WooCommerce_Subscriptions {
	/**
	 * Flag for live mode.
	 *
	 * @var bool
	 */
	private static $live = false;

	/**
	 * Flag for verbose output.
	 *
	 * @var bool
	 */
	private static $verbose = false;

	/**
	 * Migrate on-hold WooCommerce subscriptions with failed renewal orders to expired status.
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
	public function migrate_expired_subscriptions( $args, $assoc_args ) {
		WP_CLI::line( '' );
		if ( ! WooCommerce_Subscriptions_Integration::is_enabled() ) {
			WP_CLI::error( 'WooCommerce Subscriptions Integration is not enabled.' );
			WP_CLI::line( '' );
			return;
		}
		self::$live    = isset( $assoc_args['live'] ) ? true : false;
		self::$verbose = isset( $assoc_args['verbose'] ) ? true : false;
		if ( self::$live ) {
			WP_CLI::line( 'Live mode - subscription statuses will be updated.' );
		} else {
			WP_CLI::line( 'Dry run. Use --live flag to run in live mode.' );
		}
		$updated       = 0;
		$page          = 1;
		$per_page      = 25;
		$subscriptions = wcs_get_subscriptions(
			[
				'paged'                  => $page,
				'subscriptions_per_page' => $per_page,
				'subscrition_status'     => 'on-hold',
			]
		);
		if ( empty( $subscriptions ) ) {
			WP_CLI::success( 'No on-hold subscriptions to process.' );
			WP_CLI::line( '' );
			return;
		}
		WP_CLI::line( 'Processing subscriptions...' );
		WP_CLI::line( '' );
		while ( ! empty( $subscriptions ) ) {
			foreach ( $subscriptions as $subscription ) {
				$id = $subscription->get_id();
				if ( self::$verbose ) {
					WP_CLI::line( 'Processing subscription ' . $id . '...' );
				}
				$renewal_orders = $subscription->get_related_orders( 'all', 'renewal' );
				if ( empty( $renewal_orders ) ) {
					if ( self::$verbose ) {
						WP_CLI::line( 'Subscription ' . $id . ' has no renewal orders. Moving to next subscription...' );
						WP_CLI::line( '' );
					}
					continue;
				}
				foreach ( $renewal_orders as $renewal_order ) {
					if ( 'failed' === $renewal_order->get_status() ) {
						if ( self::$verbose ) {
							WP_CLI::line( 'Updating status for subscription ' . $id );
						}
						// Update the subscription status to expired.
						if ( self::$live ) {
							$subscription->update_status( 'expired', __( 'Subscription status updated by Newspack CLI command.', 'newspack-plugin' ) );
						}
						++$updated;
						break;
					}
				}
				if ( self::$verbose ) {
					WP_CLI::line( 'Finished processing subscription ' . $id );
					WP_CLI::line( '' );
				}
			}
			$subscriptions = wcs_get_subscriptions(
				[
					'paged'                  => ++$page,
					'subscriptions_per_page' => $per_page,
					'subscription_status'    => 'on-hold',
				]
			);
		}
		WP_CLI::success( 'Finished processing subscriptions. ' . $updated . ' subscriptions updated.' );
		WP_CLI::line( '' );
	}
}

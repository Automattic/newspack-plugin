<?php
/**
 * ActionScheduler utilities.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * General-purpose ActionScheduler helpers for Newspack.
 */
class Action_Scheduler {
	/**
	 * Default ActionScheduler group for Newspack actions.
	 */
	const DEFAULT_GROUP = 'newspack';

	/**
	 * Prefix for Newspack ActionScheduler groups.
	 */
	const GROUP_PREFIX = 'newspack-';

	/**
	 * Get ActionScheduler group slugs matching a prefix.
	 *
	 * @param string $prefix The prefix to match (e.g. 'newspack-').
	 *
	 * @return string[] Array of group slug strings.
	 */
	public static function get_groups_by_prefix( $prefix ) {
		global $wpdb;
		$table = $wpdb->prefix . 'actionscheduler_groups';
		return $wpdb->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT slug FROM {$table} WHERE slug LIKE %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->esc_like( $prefix ) . '%'
			)
		);
	}

	/**
	 * Query ActionScheduler actions by group slugs.
	 *
	 * @param array $args {
	 *     Query arguments.
	 *
	 *     @type string[] $groups   Array of group slugs to query.
	 *     @type string   $status   ActionScheduler status (pending, complete, failed, canceled).
	 *     @type int      $per_page Number of actions to return. Default 20.
	 *     @type int      $offset   Offset for pagination. Default 0.
	 *     @type string   $orderby  Column to order by. Default 'scheduled_date_gmt'.
	 *     @type string   $order    ASC or DESC. Default 'DESC'.
	 * }
	 *
	 * @return array Array of action row objects.
	 */
	public static function get_scheduled_actions( $args = [] ) {
		global $wpdb;

		$defaults = [
			'groups'   => [],
			'status'   => '',
			'per_page' => 20,
			'offset'   => 0,
			'orderby'  => 'scheduled_date_gmt',
			'order'    => 'DESC',
		];
		$args = wp_parse_args( $args, $defaults );

		$slugs = $args['groups'];
		if ( empty( $slugs ) ) {
			$slugs = array_merge(
				[ self::DEFAULT_GROUP ],
				self::get_groups_by_prefix( self::GROUP_PREFIX )
			);
		}
		if ( empty( $slugs ) ) {
			return [];
		}

		$allowed_orderby = [ 'scheduled_date_gmt', 'action_id', 'hook', 'status' ];
		$orderby         = in_array( $args['orderby'], $allowed_orderby, true ) ? $args['orderby'] : 'scheduled_date_gmt';
		$order           = 'ASC' === strtoupper( $args['order'] ) ? 'ASC' : 'DESC';

		$actions_table     = $wpdb->prefix . 'actionscheduler_actions';
		$groups_table      = $wpdb->prefix . 'actionscheduler_groups';
		$slug_placeholders = implode( ',', array_fill( 0, count( $slugs ), '%s' ) );
		$prepare_args      = $slugs;

		// Build optional status filter.
		$status_clause = '';
		if ( ! empty( $args['status'] ) ) {
			$status_clause  = 'AND a.status = %s ';
			$prepare_args[] = $args['status'];
		}

		$prepare_args[] = absint( $args['per_page'] );
		$prepare_args[] = absint( $args['offset'] );

		// Table names are built from $wpdb->prefix + hardcoded strings, safe for interpolation.
		// $orderby and $order are validated via allowlist/ternary above.
		$query = $wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
			"SELECT a.* FROM {$actions_table} a " . // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"INNER JOIN {$groups_table} g ON a.group_id = g.group_id " . // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"WHERE g.slug IN ({$slug_placeholders}) " . // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
			"{$status_clause}" . // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"ORDER BY a.{$orderby} {$order} " . // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			'LIMIT %d OFFSET %d',
			...$prepare_args
		);

		return $wpdb->get_results( $query ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
	}
}

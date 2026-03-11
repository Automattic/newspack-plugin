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

		// Get group IDs from slugs.
		$groups_table      = $wpdb->prefix . 'actionscheduler_groups';
		$slug_placeholders = implode( ',', array_fill( 0, count( $slugs ), '%s' ) );
		$group_ids         = $wpdb->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT group_id FROM {$groups_table} WHERE slug IN ({$slug_placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
				...$slugs
			)
		);

		if ( empty( $group_ids ) ) {
			return [];
		}

		// Query actions.
		$actions_table   = $wpdb->prefix . 'actionscheduler_actions';
		$id_placeholders = implode( ',', array_fill( 0, count( $group_ids ), '%d' ) );

		$where = $wpdb->prepare(
			"WHERE group_id IN ({$id_placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
			...array_map( 'absint', $group_ids )
		);

		if ( ! empty( $args['status'] ) ) {
			$where .= $wpdb->prepare( ' AND status = %s', $args['status'] );
		}

		$allowed_orderby = [ 'scheduled_date_gmt', 'action_id', 'hook', 'status' ];
		$orderby         = in_array( $args['orderby'], $allowed_orderby, true ) ? $args['orderby'] : 'scheduled_date_gmt';
		$order           = 'ASC' === strtoupper( $args['order'] ) ? 'ASC' : 'DESC';

		$limit  = absint( $args['per_page'] );
		$offset = absint( $args['offset'] );

		return $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			"SELECT * FROM {$actions_table} {$where} ORDER BY {$orderby} {$order} LIMIT {$limit} OFFSET {$offset}" // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		);
	}
}

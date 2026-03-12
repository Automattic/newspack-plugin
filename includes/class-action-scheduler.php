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
	 * Whether ActionScheduler is available.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return class_exists( 'ActionScheduler' );
	}

	/**
	 * Get ActionScheduler group slugs matching a prefix.
	 *
	 * @param string $prefix The prefix to match (e.g. 'newspack-').
	 *
	 * @return string[] Array of group slug strings.
	 */
	public static function get_groups_by_prefix( $prefix ) {
		if ( ! self::is_available() ) {
			return [];
		}
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
	 *     @type string   $hook     Hook name to filter by.
	 *     @type int      $per_page Number of actions to return. Default 20.
	 *     @type int      $offset   Offset for pagination. Default 0.
	 *     @type string   $orderby  Column to order by. Default 'scheduled_date_gmt'.
	 *     @type string   $order    ASC or DESC. Default 'DESC'.
	 * }
	 *
	 * @return array Array of action row objects.
	 */
	public static function get_scheduled_actions( $args = [] ) {
		if ( ! self::is_available() ) {
			return [];
		}
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

		// Build optional filters.
		$where_clauses = '';
		if ( ! empty( $args['status'] ) ) {
			$where_clauses .= 'AND a.status = %s ';
			$prepare_args[] = $args['status'];
		}
		if ( ! empty( $args['hook'] ) ) {
			$where_clauses .= 'AND a.hook = %s ';
			$prepare_args[] = $args['hook'];
		}

		$prepare_args[] = absint( $args['per_page'] );
		$prepare_args[] = absint( $args['offset'] );

		// Table names: $wpdb->prefix + hardcoded strings. $orderby/$order: allowlist/ternary validated.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT a.* FROM {$actions_table} a INNER JOIN {$groups_table} g ON a.group_id = g.group_id WHERE g.slug IN ({$slug_placeholders}) {$where_clauses}ORDER BY a.{$orderby} {$order} LIMIT %d OFFSET %d";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		$query = $wpdb->prepare( $sql, ...$prepare_args );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
		return $wpdb->get_results( $query );
	}

	/**
	 * Count ActionScheduler actions matching the given query args.
	 *
	 * @param array $args Same as get_scheduled_actions() but per_page/offset/orderby/order are ignored.
	 *
	 * @return int Total count.
	 */
	public static function count_scheduled_actions( $args = [] ) {
		if ( ! self::is_available() ) {
			return 0;
		}
		global $wpdb;

		$args  = wp_parse_args(
			$args,
			[
				'groups' => [],
				'status' => '',
			] 
		);
		$slugs = $args['groups'];
		if ( empty( $slugs ) ) {
			$slugs = array_merge(
				[ self::DEFAULT_GROUP ],
				self::get_groups_by_prefix( self::GROUP_PREFIX )
			);
		}
		if ( empty( $slugs ) ) {
			return 0;
		}

		$actions_table     = $wpdb->prefix . 'actionscheduler_actions';
		$groups_table      = $wpdb->prefix . 'actionscheduler_groups';
		$slug_placeholders = implode( ',', array_fill( 0, count( $slugs ), '%s' ) );
		$prepare_args      = $slugs;

		$where_clauses = '';
		if ( ! empty( $args['status'] ) ) {
			$where_clauses .= 'AND a.status = %s ';
			$prepare_args[] = $args['status'];
		}
		if ( ! empty( $args['hook'] ) ) {
			$where_clauses .= 'AND a.hook = %s ';
			$prepare_args[] = $args['hook'];
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT COUNT(*) FROM {$actions_table} a INNER JOIN {$groups_table} g ON a.group_id = g.group_id WHERE g.slug IN ({$slug_placeholders}) {$where_clauses}";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
		$query = $wpdb->prepare( $sql, ...$prepare_args );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
		return (int) $wpdb->get_var( $query );
	}

	/**
	 * Get all known Newspack group slugs.
	 *
	 * @return string[] Array of group slug strings.
	 */
	public static function get_all_groups() {
		return array_merge(
			[ self::DEFAULT_GROUP ],
			self::get_groups_by_prefix( self::GROUP_PREFIX )
		);
	}

	/**
	 * Get distinct hook names for Newspack ActionScheduler actions.
	 *
	 * @return string[] Array of hook name strings.
	 */
	public static function get_hooks() {
		if ( ! self::is_available() ) {
			return [];
		}

		$cache_key = 'newspack_as_hooks';
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		global $wpdb;

		$slugs = self::get_all_groups();
		if ( empty( $slugs ) ) {
			return [];
		}

		$actions_table     = $wpdb->prefix . 'actionscheduler_actions';
		$groups_table      = $wpdb->prefix . 'actionscheduler_groups';
		$slug_placeholders = implode( ',', array_fill( 0, count( $slugs ), '%s' ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT DISTINCT a.hook FROM {$actions_table} a INNER JOIN {$groups_table} g ON a.group_id = g.group_id WHERE g.slug IN ({$slug_placeholders}) ORDER BY a.hook ASC";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$hooks = $wpdb->get_col( $wpdb->prepare( $sql, ...$slugs ) );

		set_transient( $cache_key, $hooks, 5 * MINUTE_IN_SECONDS );

		return $hooks;
	}

	/**
	 * Get a map of group_id => slug for all ActionScheduler groups.
	 *
	 * @return array<int,string>
	 */
	public static function get_group_map() {
		if ( ! self::is_available() ) {
			return [];
		}
		global $wpdb;
		$table = $wpdb->prefix . 'actionscheduler_groups';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results( "SELECT group_id, slug FROM {$table}" );
		$map  = [];
		foreach ( $rows as $row ) {
			$map[ $row->group_id ] = $row->slug;
		}
		return $map;
	}
}

<?php
/**
 * Custom table for temporary data required by OAuth flows.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class OAuth_Transients {
	/**
	 * Name of the custom table. To be prefixed with WPDB prefix.
	 */
	const TABLE_NAME = 'newspack_oauth_transients';

	/**
	 * Installed version number of the custom table.
	 */
	const TABLE_VERSION = '1.0';

	/**
	 * Option name for the installed version number of the custom table.
	 */
	const TABLE_VERSION_OPTION = '_newspack_oauth_transients_version';

	/**
	 * How long to keep the data in the table. Any data older than this will be purged.
	 *
	 * @var int
	 */
	private $expiration = 30 * MINUTE_IN_SECONDS;

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		register_activation_hook( NEWSPACK_LISTINGS_FILE, [ __CLASS__, 'create_custom_table' ] );
		add_action( 'init', [ __CLASS__, 'check_update_version' ] );
	}

	/**
	 * Get custom table name.
	 */
	public static function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . self::TABLE_NAME;
	}

	/**
	 * Checks if the custom table has been created and is up-to-date.
	 * If not, run the create_custom_table method.
	 * See: https://codex.wordpress.org/Creating_Tables_with_Plugins
	 */
	public static function check_update_version() {
		$current_version = \get_option( self::TABLE_VERSION_OPTION, false );

		if ( self::TABLE_VERSION !== $current_version ) {
			self::create_custom_table();
			\update_option( self::TABLE_VERSION_OPTION, self::TABLE_VERSION );
		}
	}

	/**
	 * Create a custom DB table to store transient data needed for OAuth.
	 * Avoids the use of slow post meta for query sorting purposes.
	 * Only create the table if it doesn't already exist.
	 */
	public static function create_custom_table() {
		global $wpdb;
		$table_name = self::get_table_name();

		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) ) != $table_name ) { // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$charset_collate = $wpdb->get_charset_collate();
			$sql             = "CREATE TABLE $table_name (
				-- Reader's unique ID.
				id varchar(100) NOT NULL,
				-- Scope of the data.
				scope varchar(30) NOT NULL,
				-- Value of the data.
				value varchar(100) NOT NULL,
				-- Timestamp when data was created.
				created_at datetime NOT NULL,
				PRIMARY KEY (id, scope),
				KEY (scope)
			) $charset_collate;";

			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			dbDelta( $sql );
		}
	}

	/**
	 * Get a value from the database.
	 *
	 * @param string $id The reader's unique ID.
	 * @param string $scope The scope of the data to get.
	 * @param string $field_to_get The column to get. Defaults to 'value'.
	 *
	 * @return mixed The value of the data, or false if not found.
	 */
	public static function get( $id, $scope, $field_to_get = 'value' ) {
		global $wpdb;

		$table_name = self::get_table_name();
		$value      = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				'SELECT %1$s FROM %2$s WHERE id = %3$d AND scope = %4$s', // phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnquotedComplexPlaceholder
				$field_to_get,
				$table_name,
				$id,
				$scope
			)
		);

		return $value ?? false;
	}

	/**
	 * Set a value in the database.
	 *
	 * @param string $id The reader's unique ID.
	 * @param string $scope The scope of the data to set.
	 * @param string $value The value of the data to set.
	 *
	 * @return bool True if the value was set, false otherwise.
	 */
	public static function set( $id, $scope, $value ) {
		global $wpdb;

		$table_name = self::get_table_name();
		$result     = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$table_name,
			[
				'id'         => $id,
				'scope'      => $scope,
				'value'      => $value,
				'created_at' => \current_time( 'mysql' ),
			],
			[
				'%s',
				'%s',
				'%s',
				'%s',
			]
		);

		return $result;
	}
}

OAuth_Transients::init();

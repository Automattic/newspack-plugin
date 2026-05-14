<?php
/**
 * Parse.ly integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Parsely {
	/**
	 * Option to track whether the meta_type migration has run.
	 *
	 * @var string
	 */
	const META_TYPE_MIGRATION_OPTION = 'newspack_parsely_meta_type_migrated';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'admin_init', [ __CLASS__, 'migrate_meta_type' ] );
	}

	/**
	 * Migrate existing Parse.ly installs from the legacy `json_ld` meta_type
	 * default to `repeated_metas`, which avoids conflicts with Yoast SEO's
	 * own JSON-LD output. Runs once per site.
	 */
	public static function migrate_meta_type() {
		if ( get_option( self::META_TYPE_MIGRATION_OPTION ) ) {
			return;
		}

		if ( ! is_plugin_active( 'wp-parsely/wp-parsely.php' ) ) {
			return;
		}

		$parsely_settings = get_option( 'parsely', [] );
		if ( is_array( $parsely_settings ) && isset( $parsely_settings['meta_type'] ) && 'json_ld' === $parsely_settings['meta_type'] ) {
			$parsely_settings['meta_type'] = 'repeated_metas';
			update_option( 'parsely', $parsely_settings );
		}

		update_option( self::META_TYPE_MIGRATION_OPTION, 'v1' );
	}
}
Parsely::init();

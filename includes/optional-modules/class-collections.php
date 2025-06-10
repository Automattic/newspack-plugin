<?php
/**
 * Collections module.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

use Newspack\Collections\Collections_Data;
use Newspack\Collections\Post_Type;
use Newspack\Collections\Collection_Taxonomy;
use Newspack\Collections\Collection_Category_Taxonomy;
use Newspack\Collections\Collection_Section_Taxonomy;
use Newspack\Collections\Post_Meta;

/**
 * Collections module for managing print editions and other collections.
 */
class Collections {
	/**
	 * Module name for the optional modules system.
	 *
	 * @var string
	 */
	const MODULE_NAME = 'collections';

	/**
	 * Initialize the module.
	 */
	public static function init() {
		// Only initialize if the feature is enabled and the module is active.
		if ( ! self::is_feature_enabled() || ! Optional_Modules::is_optional_module_active( self::MODULE_NAME ) ) {
			return;
		}

		// Require classes.
		require_once __DIR__ . '/../collections/traits/trait-hook-management.php';
		require_once __DIR__ . '/../collections/class-collections-data.php';
		require_once __DIR__ . '/../collections/class-post-type.php';
		require_once __DIR__ . '/../collections/class-collection-taxonomy.php';
		require_once __DIR__ . '/../collections/class-collection-category-taxonomy.php';
		require_once __DIR__ . '/../collections/class-collection-section-taxonomy.php';
		require_once __DIR__ . '/../collections/class-sync.php';
		require_once __DIR__ . '/../collections/class-post-meta.php';

		// Enqueue admin scripts and styles.
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_scripts' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_styles' ] );

		// Initialize classes.
		Collections_Data::init();
		Post_Type::init();
		Collection_Taxonomy::init();
		Collection_Category_Taxonomy::init();
		Collection_Section_Taxonomy::init();
		Post_Meta::init();
	}

	/**
	 * Whether the Collections module is enabled.
	 *
	 * @return bool True if Collections is enabled.
	 */
	public static function is_feature_enabled() {
		// Check if the feature is enabled.
		$is_enabled = defined( 'NEWSPACK_COLLECTIONS_ENABLED' ) ? constant( 'NEWSPACK_COLLECTIONS_ENABLED' ) : false;

		/**
		 * Filters whether the Collections feature is enabled.
		 *
		 * @param bool $is_enabled Whether the Collections module is enabled.
		 */
		return apply_filters( 'newspack_collections_enabled', $is_enabled );
	}

	/**
	 * Enqueue admin scripts.
	 */
	public static function enqueue_admin_scripts() {
		\Newspack\Newspack::load_common_assets();
		wp_enqueue_script(
			Collections_Data::SCRIPT_NAME_ADMIN,
			\Newspack\Newspack::plugin_url() . '/dist/collections-admin.js',
			[ 'jquery', 'wp-i18n', 'wp-plugins', 'wp-edit-post', 'wp-components', 'wp-element', 'wp-data', 'wp-editor', 'wp-api-fetch' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
	}

	/**
	 * Enqueue admin styles.
	 */
	public static function enqueue_admin_styles() {
		wp_enqueue_style(
			Collections_Data::SCRIPT_NAME_ADMIN,
			\Newspack\Newspack::plugin_url() . '/dist/collections-admin.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}
}

// Initialize the module.
Collections::init();

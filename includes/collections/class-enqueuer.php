<?php
/**
 * Collections Enqueuer.
 *
 * @package Newspack\Collections
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the enqueuing of collections scripts and styles.
 */
class Enqueuer {
	/**
	 * The name of the script to enqueue and localize the data to.
	 *
	 * @var string
	 */
	public const SCRIPT_NAME_ADMIN = 'newspack-collections-admin';

	/**
	 * The name of the global JavaScript object.
	 *
	 * @var string
	 */
	public const JS_OBJECT_NAME = 'newspackCollections';

	/**
	 * The current data structure.
	 *
	 * @var array
	 */
	private static $data = [];

	/**
	 * Initialize the data manager.
	 */
	public static function init() {
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'localize_data' ] );
	}

	/**
	 * Add data to the collections object.
	 *
	 * @param string $key   The key to store the data under.
	 * @param array  $data  The data to store.
	 */
	public static function add_data( $key, $data ) {
		self::$data[ $key ] = $data;
	}

	/**
	 * Get the current data structure.
	 *
	 * @return array The current data.
	 */
	public static function get_data() {
		return self::$data;
	}

	/**
	 * Enqueue admin scripts.
	 */
	public static function enqueue_admin_scripts() {
		\Newspack\Newspack::load_common_assets();
		wp_enqueue_script(
			self::SCRIPT_NAME_ADMIN,
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
			self::SCRIPT_NAME_ADMIN,
			\Newspack\Newspack::plugin_url() . '/dist/collections-admin.css',
			[],
			NEWSPACK_PLUGIN_VERSION
		);
	}

	/**
	 * Localize the data to JavaScript.
	 */
	public static function localize_data() {
		if ( empty( self::$data ) ) {
			return;
		}

		// Enqueue admin scripts and styles.
		self::enqueue_admin_scripts();
		self::enqueue_admin_styles();

		// Localize to multiple scripts if they exist.
		$scripts = [ self::SCRIPT_NAME_ADMIN ];
		foreach ( $scripts as $script ) {
			if ( wp_script_is( $script, 'registered' ) ) {
				wp_localize_script(
					$script,
					self::JS_OBJECT_NAME,
					self::$data
				);
			}
		}
	}
}

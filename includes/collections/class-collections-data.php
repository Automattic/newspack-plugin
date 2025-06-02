<?php
/**
 * Collections Data Manager.
 *
 * @package Newspack\Collections
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the data structure for collections JavaScript.
 */
class Collections_Data {
	/**
	 * The name of the script to localize the data to.
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
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'localize_data' ], 100 );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'localize_data' ], 100 );
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
	 * Localize the data to JavaScript.
	 */
	public static function localize_data() {
		if ( empty( self::$data ) ) {
			return;
		}

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

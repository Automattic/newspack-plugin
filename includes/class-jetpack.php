<?php
/**
 * Jetpack integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Jetpack {

	/**
	 * Modules scripts handles.
	 *
	 * @var string[]
	 */
	private static $scripts_handles = [
		'jp-tracks',              // Tracks analytics library.
		'jetpack-instant-search', // Jetpack Instant Search.
		'jetpack-search-widget',  // Jetpack Search widget.
	];

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'jetpack_async_scripts' ], 20 );
		add_filter( 'newspack_amp_plus_sanitized', [ __CLASS__, 'jetpack_modules_amp_plus' ], 10, 2 );
	}


	/**
	 * Make Jetpack scripts async.
	 */
	public static function jetpack_async_scripts() {
		foreach ( self::$scripts_handles as $handle ) {
			wp_script_add_data( $handle, 'async', true );
		}
	}

	/**
	 * Allow Jetpack modules scripts to be loaded in AMP Plus mode.
	 *
	 * @param bool|null $is_sanitized If null, the error will be handled. If false, rejected.
	 * @param object    $error        The AMP sanitisation error.
	 *
	 * @return bool Whether the error should be rejected.
	 */
	public static function jetpack_modules_amp_plus( $is_sanitized, $error ) {
		$texts = [
			'jetpackSearchModuleSorting',  // Jetpack Search module sorting.
			'JetpackInstantSearchOptions', // Jetpack Instant Search options.
		];
		if ( isset( $error, $error['node_attributes'], $error['node_attributes']['id'] ) ) {
			$has_any_id = array_reduce(
				self::$scripts_handles,
				function( $carry, $id ) use ( $error ) {
					return $carry || 0 === strpos( $error['node_attributes']['id'], $id ); // Match starting position so it includes `-js`, `-after` and `-before` scripts.
				},
				false
			);
			if ( $has_any_id ) {
				$is_sanitized = false;
			}
		}
		if ( isset( $error, $error['text'] ) ) {
			$has_any_text = array_reduce(
				$texts,
				function( $carry, $text ) use ( $error ) {
					return $carry || false !== strpos( $error['text'], $text );
				},
				false
			);
			if ( $has_any_text ) {
				$is_sanitized = false;
			}
		}
		return $is_sanitized;
	}
}
Jetpack::init();

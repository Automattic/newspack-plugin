<?php
/**
 * Newspack Custom Bylines.
 *
 * @package Newspack
 */

namespace Newspack;

/**
 * Class to handle custom bylines.
 */
class Bylines {
	/**
	 * Initializes the class.
	 */
	public static function init() {
		if ( ! self::is_enabled() ) {
			return;
		}
		add_action( 'init', [ __CLASS__, 'register_post_meta' ] );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );
	}

	/**
	 * Checks if the feature is enabled.
	 *
	 * True when:
	 * - NEWSPACK_BYLINES_ENABLED is defined and true.
	 *
	 * @return bool True if the feature is enabled, false otherwise.
	 */
	public static function is_enabled() {
		return defined( 'NEWSPACK_BYLINES_ENABLED' ) && NEWSPACK_CORRECTIONS_ENABLED;
	}


	/**
	 * Enqueue block editor scripts and styles.
	 */
	public static function enqueue_block_editor_assets() {
		if ( ! is_admin() || \get_current_screen()->id !== 'post' ) {
			return;
		}

		\wp_enqueue_script(
			'newspack-bylines',
			Newspack::plugin_url() . '/dist/bylines.js',
			[ 'wp-plugins', 'wp-editor', 'react' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);
	}

	/**
	 * Registers custom byline meta fields.
	 */
	public static function register_post_meta() {
		\register_post_meta(
			'post',
			'newspack_byline_enabled',
			[
				'description'  => 'Whether a custom byline is enabled for the post.',
				'single'       => true,
				'show_in_rest' => true,
				'type'         => 'boolean',
			]
		);
	}
}
Bylines::init();

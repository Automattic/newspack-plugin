<?php
/**
 * Complianz integration class.
 * https://complianz.io/
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Complianz {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		add_filter( 'cmplz_cookie_blocker_output', [ __CLASS__, 'extra_third_party_script_blocking' ] );
		add_filter( 'newspack_pixel_script_markup', [ __CLASS__, 'pixel_handling_for_complianz' ] );
	}

	/**
	 * In Cookie Blocker mode, make sure some third-party scripts are blocked too.
	 *
	 * @param string $output HTML output after Complianz has done an initial pass for cookie/script blocking.
	 * @return string Modified $output.
	 */
	public static function extra_third_party_script_blocking( $output ) {
		// Format is 'domain' => 'category'.
		// Category is one of 'statistics', 'marketing', or 'functional'.
		// 'functional' doesn't make sense here though because those shouldn't be blocked.
		$scripts_to_block = [
			'googletagmanager.com' => 'statistics',
			'doubleclick.net'      => 'marketing',
			'parsely.com'          => 'statistics',
		];

		// The regex matches <script src=""> tags.
		$script_pattern = '/<script[^>]*?\s+src\s*=\s*([\'"])([^\'"]*?)\1[^>]*?>/is';
		if ( preg_match_all( $script_pattern, $output, $matches, PREG_PATTERN_ORDER ) ) {
			foreach ( $matches[0] as $index => $full_markup ) {

				// Skip any scripts that have already been set up to be deferred until consent.
				if ( false !== stripos( $full_markup, 'data-cmplz-src' ) ) {
					continue;
				}

				$src = $matches[2][ $index ];
				foreach ( $scripts_to_block as $domain => $category ) {
					if ( false === stripos( $src, $domain ) ) {
						continue;
					}

					$extra_markup = 'type="text/plain" data-category="' . $category . '" data-cmplz-src="' . $src . '" ';
					$new_full_markup = str_ireplace( '<script', '<script ' . $extra_markup, $full_markup );
					$output = str_replace( $full_markup, $new_full_markup, $output );
					break;
				}
			}
		}

		return $output;
	}

	/**
	 * In Cookie Blocker mode, also block pixels until consent is given.
	 *
	 * @param string $markup Pixel markup.
	 * @return string Modified $markup.
	 */
	public static function pixel_handling_for_complianz( $markup ) {
		if ( self::should_block_third_party_scripts() ) {
			$markup = str_ireplace( '<script', '<script type="text/plain" data-category="marketing"', $markup );
		}
		return $markup;
	}

	/**
	 * Determine whether Complianz is running in Cookie Blocker mode.
	 *
	 * @return bool Whether Cookie Blocker is running.
	 */
	private static function should_block_third_party_scripts() {
		return function_exists( 'cmplz_can_run_cookie_blocker' ) && cmplz_can_run_cookie_blocker();
	}
}
Complianz::init();

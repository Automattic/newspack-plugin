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
		add_action( 'wp_head', [ __CLASS__, 'fix_instant_search_sidebar_display' ], 10 );
		add_filter( 'jetpack_lazy_images_skip_image_with_attributes', [ __CLASS__, 'skip_lazy_loading_on_feeds' ], 10 );
		add_filter( 'wp_calculate_image_srcset', [ __CLASS__, 'filter_srcset_array' ], 100, 5 );

		// Disables Google Analytics.
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'remove_google_analytics_from_active' ), 10, 2 );
		add_filter( 'jetpack_get_available_modules', array( __CLASS__, 'remove_google_analytics_from_available' ) );
	}

	/**
	 * Filters an array of image `srcset` values, adding Photon urls for additional sizes.
	 *
	 * @param array $sources       An array of image urls and widths.
	 * @param array $size_array    The size array for srcset.
	 * @param array $image_src     The image srcs.
	 * @param array $image_meta    The image meta.
	 * @param int   $attachment_id Attachment ID.
	 *
	 * @return array An array of Photon image urls and widths.
	 */
	public static function filter_srcset_array( $sources = array(), $size_array = array(), $image_src = array(), $image_meta = array(), $attachment_id = 0 ) {
		if ( ! class_exists( 'Jetpack' ) || ! \Jetpack::is_module_active( 'photon' ) ) {
			return $sources;
		}
		if ( ! function_exists( 'jetpack_photon_url' ) ) {
			return $sources;
		}

		/**
		 * Filter the additional sizes to add to the srcset.
		 *
		 * @param array $additional_sizes An array of additional sizes to add to the srcset.
		 */
		$additional_sizes = apply_filters( 'newspack_photon_srcset_additional_sizes', [ 370, 400 ] );

		foreach ( $additional_sizes as $w ) {
			if ( isset( $sources[ $w ] ) ) {
				continue;
			}
			if ( ! empty( $attachment_id ) ) {
				$url = \wp_get_attachment_url( $attachment_id );
			}
			$sources[ $w ] = [
				'url'        => \jetpack_photon_url( $url, [ 'w' => $w ] ),
				'descriptor' => 'w',
				'value'      => $w,
			];
		}

		return $sources;
	}

	/**
	 * Skip image lazy-loading on RSS feeds.
	 *
	 * @param bool $skip_lazy_loading Whether to skip lazy-loading.
	 * @return @bool Whether to skip lazy-loading.
	 */
	public static function skip_lazy_loading_on_feeds( $skip_lazy_loading ) {
		if ( is_feed() ) {
			return true;
		}
		return $skip_lazy_loading;
	}

	/**
	 * Whether Jetpack modules scripts should be rendered in AMP Plus.
	 *
	 * @return @bool Whether to render scripts.
	 */
	private static function should_amp_plus_modules() {
		if ( ! AMP_Enhancements::should_use_amp_plus() ) {
			return false;
		}
		if ( ! defined( 'NEWSPACK_AMP_PLUS_JETPACK_MODULES' ) || true !== NEWSPACK_AMP_PLUS_JETPACK_MODULES ) {
			return false;
		}
		return true;
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
		if ( ! self::should_amp_plus_modules() ) {
			return $is_sanitized;
		}
		if ( isset( $error, $error['node_attributes'], $error['node_attributes']['id'] ) ) {
			$script_has_matching_id = array_reduce(
				self::$scripts_handles,
				function( $carry, $id ) use ( $error ) {
					return $carry || 0 === strpos( $error['node_attributes']['id'], $id ); // Match starting position so it includes `-js`, `-after` and `-before` scripts.
				},
				false
			);
			if ( $script_has_matching_id ) {
				$is_sanitized = false;
			}
		}
		// Match inline scripts by script text since they don't have IDs.
		$texts = [
			'jetpackSearchModuleSorting',  // Jetpack Search module sorting.
			'JetpackInstantSearchOptions', // Jetpack Instant Search options.
		];
		if ( isset( $error, $error['text'] ) ) {
			$script_has_matching_text = array_reduce(
				$texts,
				function( $carry, $text ) use ( $error ) {
					return $carry || false !== strpos( $error['text'], $text );
				},
				false
			);
			if ( $script_has_matching_text ) {
				$is_sanitized = false;
			}
		}
		return $is_sanitized;
	}

	/**
	 * Fix Instant Search Sidebar Display for AMP Plus
	 */
	public static function fix_instant_search_sidebar_display() {
		if ( ! self::should_amp_plus_modules() ) {
			return;
		}
		?>
		<style>
			.jetpack-instant-search__widget-area {
				display: block !important;
			}
		</style>
		<?php
	}
}
Jetpack::init();

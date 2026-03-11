<?php
/**
 * Post Date features: time-ago and modified date.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Post Date class.
 */
class Post_Date {

	/**
	 * Theme mod keys to migrate on theme switch.
	 *
	 * @var string[]
	 */
	const THEME_MOD_KEYS = [
		'post_time_ago',
		'post_time_ago_cut_off',
		'post_updated_date',
		'post_updated_date_threshold',
	];

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
		add_action( 'after_switch_theme', [ __CLASS__, 'migrate_date_settings' ], 10, 2 );
		add_filter( 'render_block_core/post-date', [ __CLASS__, 'filter_post_date_block' ], 10, 2 );
		add_filter( 'get_the_date', [ __CLASS__, 'filter_get_the_date' ], 10, 3 );
		add_filter( 'newspack_blocks_formatted_displayed_post_date', [ __CLASS__, 'filter_blocks_formatted_date' ], 10, 2 );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ] );
		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_editor_assets' ] );
	}

	/**
	 * Convert a date string to "X ago" format if within cutoff.
	 *
	 * @param string $date_string Date in 'Y-m-d H:i:s' format (GMT).
	 * @param int    $cutoff_days Number of days for cutoff.
	 * @return string|null Relative date string or null if beyond cutoff.
	 */
	public static function convert_to_time_ago( $date_string, $cutoff_days ) {
		$timestamp = strtotime( $date_string );
		if ( false === $timestamp ) {
			return null;
		}
		$now  = time();
		$diff = $now - $timestamp;
		$cutoff    = $cutoff_days * DAY_IN_SECONDS;

		if ( $diff >= $cutoff ) {
			return null;
		}

		/* translators: %s: Human-readable time difference. */
		return sprintf( __( '%s ago', 'newspack-plugin' ), human_time_diff( $timestamp, $now ) );
	}

	/**
	 * Determine whether the updated date should be displayed for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	public static function should_display_updated_date( $post_id = 0 ) {
		if ( ! $post_id ) {
			$post_id = get_the_ID();
		}
		$post = get_post( $post_id );
		if ( ! $post ) {
			return false;
		}

		$post_types = apply_filters( 'newspack_updated_date_supported_post_types', [ 'post' ] );
		if ( ! in_array( $post->post_type, $post_types, true ) ) {
			return false;
		}

		$sitewide  = get_theme_mod( 'post_updated_date', false );
		$show_meta = get_post_meta( $post_id, 'newspack_show_updated_date', true );
		$hide_meta = get_post_meta( $post_id, 'newspack_hide_updated_date', true );

		if ( $sitewide ) {
			if ( $hide_meta ) {
				return false;
			}
		} elseif ( ! $show_meta ) {
			return false;
		}

		// Apply threshold.
		$threshold = (int) get_theme_mod( 'post_updated_date_threshold', 24 );
		$published = strtotime( $post->post_date );
		$modified  = strtotime( $post->post_modified );

		if ( ( $modified - $published ) < $threshold * HOUR_IN_SECONDS ) {
			return false;
		}

		return true;
	}

	/**
	 * Filter the render output of core/post-date blocks.
	 * Handles both time-ago conversion (publish dates) and modified date visibility.
	 *
	 * @param string $block_content Rendered block content.
	 * @param array  $block         Block data.
	 * @return string
	 */
	public static function filter_post_date_block( $block_content, $block ) {
		$is_modified = str_contains( $block_content, 'wp-block-post-date__modified-date' );

		// Handle modified date visibility.
		if ( $is_modified ) {
			$post_id = get_the_ID();
			if ( ! self::should_display_updated_date( $post_id ) ) {
				return '';
			}
			return $block_content;
		}

		// Handle time-ago for publish dates.
		if ( ! get_theme_mod( 'post_time_ago', false ) ) {
			return $block_content;
		}

		$cutoff_days = (int) get_theme_mod( 'post_time_ago_cut_off', 14 );

		// Extract datetime attribute from <time datetime="...">.
		if ( ! preg_match( '/datetime="([^"]+)"/', $block_content, $matches ) ) {
			return $block_content;
		}

		$datetime  = $matches[1];
		$timestamp = strtotime( $datetime );
		$gmt_date  = gmdate( 'Y-m-d H:i:s', $timestamp );
		$time_ago  = self::convert_to_time_ago( $gmt_date, $cutoff_days );

		if ( null === $time_ago ) {
			return $block_content;
		}

		// Replace visible text between <time> tags while preserving the datetime attribute.
		return preg_replace( '/(<time[^>]*>)(.*?)(<\/time>)/s', '${1}' . esc_html( $time_ago ) . '${3}', $block_content );
	}

	/**
	 * Filter get_the_date() for classic theme support.
	 *
	 * @param string   $the_date Formatted date.
	 * @param string   $format   Date format.
	 * @param \WP_Post $post     Post object.
	 * @return string
	 */
	public static function filter_get_the_date( $the_date, $format, $post ) {
		if ( ! get_theme_mod( 'post_time_ago', false ) ) {
			return $the_date;
		}

		// Skip machine-readable formats.
		if ( 'Y-m-d\TH:i:sP' === $format || 'c' === $format ) {
			return $the_date;
		}

		$cutoff_days = (int) get_theme_mod( 'post_time_ago_cut_off', 14 );
		$time_ago    = self::convert_to_time_ago( $post->post_date_gmt, $cutoff_days );

		return null !== $time_ago ? $time_ago : $the_date;
	}

	/**
	 * Filter formatted date for Newspack Blocks Homepage Posts.
	 *
	 * @param string   $date Formatted date.
	 * @param \WP_Post $post Post object.
	 * @return string
	 */
	public static function filter_blocks_formatted_date( $date, $post ) {
		if ( ! get_theme_mod( 'post_time_ago', false ) ) {
			return $date;
		}

		$cutoff_days = (int) get_theme_mod( 'post_time_ago_cut_off', 14 );
		$time_ago    = self::convert_to_time_ago( $post->post_date_gmt, $cutoff_days );

		return null !== $time_ago ? $time_ago : $date;
	}

	/**
	 * Register per-post meta for updated date toggles.
	 */
	public static function register_meta() {
		$post_types = apply_filters( 'newspack_updated_date_supported_post_types', [ 'post' ] );
		foreach ( $post_types as $post_type ) {
			register_post_meta(
				$post_type,
				'newspack_hide_updated_date',
				[
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => 'boolean',
					'default'       => false,
					'auth_callback' => [ __CLASS__, 'auth_callback' ],
				]
			);
			register_post_meta(
				$post_type,
				'newspack_show_updated_date',
				[
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => 'boolean',
					'default'       => false,
					'auth_callback' => [ __CLASS__, 'auth_callback' ],
				]
			);
		}
	}

	/**
	 * Auth callback for post meta.
	 *
	 * @return bool
	 */
	public static function auth_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Migrate date settings from old theme to new theme on theme switch.
	 *
	 * @param string    $old_name  Old theme name.
	 * @param \WP_Theme $old_theme Old theme object.
	 */
	public static function migrate_date_settings( $old_name, $old_theme ) {
		$old_stylesheet = $old_theme->get_stylesheet();
		$old_mods       = get_option( "theme_mods_$old_stylesheet", [] );

		foreach ( self::THEME_MOD_KEYS as $key ) {
			if ( isset( $old_mods[ $key ] ) ) {
				set_theme_mod( $key, $old_mods[ $key ] );
			}
		}
	}

	/**
	 * Enqueue relative-time script on frontend.
	 */
	public static function enqueue_scripts() {
		if ( ! get_theme_mod( 'post_time_ago', false ) ) {
			return;
		}

		$handle = 'newspack-relative-time';
		$path   = NEWSPACK_ABSPATH . 'dist/other-scripts/relative-time.js';
		$url    = plugins_url( 'dist/other-scripts/relative-time.js', NEWSPACK_PLUGIN_FILE );

		if ( ! file_exists( $path ) ) {
			return;
		}

		$asset = include NEWSPACK_ABSPATH . 'dist/other-scripts/relative-time.asset.php';

		wp_enqueue_script( $handle, $url, $asset['dependencies'] ?? [], $asset['version'] ?? false, true );
		wp_localize_script(
			$handle,
			'newspackRelativeTime',
			[
				'cutoff' => (int) get_theme_mod( 'post_time_ago_cut_off', 14 ) * DAY_IN_SECONDS,
				'locale' => get_locale(),
			]
		);
	}

	/**
	 * Enqueue editor sidebar script for per-post toggles.
	 */
	public static function enqueue_editor_assets() {
		if ( ! get_theme_mod( 'post_updated_date', false ) ) {
			$mode = 'show';
		} else {
			$mode = 'hide';
		}

		$post_types = apply_filters( 'newspack_updated_date_supported_post_types', [ 'post' ] );

		$handle = 'newspack-post-date-editor';
		$path   = NEWSPACK_ABSPATH . 'dist/other-scripts/post-date-editor.js';
		$url    = plugins_url( 'dist/other-scripts/post-date-editor.js', NEWSPACK_PLUGIN_FILE );

		if ( ! file_exists( $path ) ) {
			return;
		}

		$asset = include NEWSPACK_ABSPATH . 'dist/other-scripts/post-date-editor.asset.php';

		wp_enqueue_script( $handle, $url, $asset['dependencies'] ?? [], $asset['version'] ?? false, true );
		wp_localize_script(
			$handle,
			'newspackPostDate',
			[
				'mode'      => $mode,
				'postTypes' => $post_types,
			]
		);
	}
}
Post_Date::init();

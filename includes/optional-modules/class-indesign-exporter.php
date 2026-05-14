<?php
/**
 * InDesign Export module.
 *
 * @package Newspack
 */

namespace Newspack\Optional_Modules;

defined( 'ABSPATH' ) || exit;

use Newspack\Optional_Modules;
use Newspack\Optional_Modules\InDesign_Export\InDesign_Converter;

/**
 * InDesign Export module class.
 */
class InDesign_Exporter {
	/**
	 * Module name for the optional modules system.
	 *
	 * @var string
	 */
	public const MODULE_NAME = 'indesign-export';

	/**
	 * Option name storing the platform header preference.
	 *
	 * Accepts 'auto', 'mac', or 'win'. 'auto' resolves the header at export
	 * time from the requesting browser's User-Agent.
	 *
	 * @var string
	 */
	public const PLATFORM_OPTION = 'newspack_indesign_export_platform';

	/**
	 * Default value for the platform option.
	 *
	 * @var string
	 */
	public const PLATFORM_DEFAULT = 'auto';

	/**
	 * Allowed values for the platform option.
	 *
	 * @var string[]
	 */
	public const ALLOWED_PLATFORMS = [ 'auto', 'mac', 'win' ];

	/**
	 * Option name storing the list of post types whose admin screens get the export action.
	 *
	 * @var string
	 */
	public const POST_TYPES_OPTION = 'newspack_indesign_export_post_types';

	/**
	 * Default value for the post types option.
	 *
	 * @var string[]
	 */
	public const POST_TYPES_DEFAULT = [ 'post' ];

	/**
	 * Initialize the module.
	 */
	public static function init() {
		if ( ! self::is_feature_enabled() ) {
			return;
		}

		if ( ! Optional_Modules::is_optional_module_active( self::MODULE_NAME ) ) {
			return;
		}

		require_once NEWSPACK_ABSPATH . 'includes/optional-modules/indesign-export/class-indesign-converter.php';

		add_action( 'enqueue_block_editor_assets', [ __CLASS__, 'enqueue_block_editor_assets' ] );

		$supported_post_types = self::get_supported_post_types();
		foreach ( $supported_post_types as $post_type ) {
			add_filter( "bulk_actions-edit-{$post_type}", [ __CLASS__, 'add_bulk_action' ] );
			add_filter( "handle_bulk_actions-edit-{$post_type}", [ __CLASS__, 'handle_bulk_action' ], 100, 3 );
		}

		add_filter( 'post_row_actions', [ __CLASS__, 'add_row_action' ], 10, 2 );
		add_action( 'admin_post_export_indesign_single', [ __CLASS__, 'handle_single_export' ] );
		add_action( 'admin_notices', [ __CLASS__, 'admin_notices' ] );
	}

	/**
	 * Whether the InDesign module is enabled.
	 *
	 * @return bool True if InDesign Exporter is enabled.
	 */
	public static function is_feature_enabled() {
		/**
		 * Filters whether the InDesign Export feature is enabled.
		 *
		 * @param bool $is_enabled Whether the InDesign Export module is enabled.
		 */
		return apply_filters( 'newspack_indesign_export_enabled', true );
	}

	/**
	 * Get supported post types for InDesign export.
	 *
	 * Reads from the site setting (defaulting to the built-in post type) and
	 * then runs the `newspack_indesign_export_supported_post_types` filter so
	 * code-level extension points still work alongside the admin setting.
	 *
	 * @return array Array of supported post type slugs.
	 */
	public static function get_supported_post_types() {
		$supported_post_types = self::get_post_types_setting();

		/**
		 * Filters the post types that support InDesign export.
		 *
		 * @param array $supported_post_types Array of post type names that support InDesign export.
		 */
		return apply_filters( 'newspack_indesign_export_supported_post_types', $supported_post_types );
	}

	/**
	 * Get the stored post types setting, sanitized.
	 *
	 * Returns the default when the option is unset or contains a non-array
	 * value. Strips non-string entries but does NOT validate against
	 * post_type_exists() because this method runs during plugin file-load
	 * (before WP's `init` action), at which point even built-in post types
	 * like 'post' and 'page' are not yet registered. The REST endpoint
	 * validates incoming values via post_type_exists() at save time.
	 *
	 * @return string[] Sanitized array of post type slugs.
	 */
	public static function get_post_types_setting() {
		$value = get_option( self::POST_TYPES_OPTION, self::POST_TYPES_DEFAULT );
		if ( ! is_array( $value ) ) {
			return self::POST_TYPES_DEFAULT;
		}

		return array_values(
			array_filter(
				$value,
				static function ( $slug ) {
					return is_string( $slug ) && '' !== $slug;
				}
			)
		);
	}

	/**
	 * Get the list of post types eligible to appear in the admin picker.
	 *
	 * Returns post types registered as public and with an admin UI, excluding
	 * attachments (no edit screen) and anything not visible in the menu.
	 *
	 * @return array<int, array{value:string, label:string}> Picker options.
	 */
	public static function get_available_post_types() {
		$post_types = get_post_types(
			[
				'public'  => true,
				'show_ui' => true,
			],
			'objects'
		);

		$options = [];
		foreach ( $post_types as $post_type ) {
			if ( 'attachment' === $post_type->name ) {
				continue;
			}
			$options[] = [
				'value' => $post_type->name,
				'label' => $post_type->labels->name ?? $post_type->name,
			];
		}

		return $options;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		$screen = get_current_screen();
		if ( ! in_array( $screen->post_type, self::get_supported_post_types(), true ) ) {
			return;
		}

		$asset = require NEWSPACK_ABSPATH . 'dist/indesign-export.asset.php';
		wp_enqueue_script(
			'newspack-indesign-export',
			\Newspack\Newspack::plugin_url() . '/dist/indesign-export.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);
	}

	/**
	 * Add bulk action to posts list table.
	 *
	 * @param array $bulk_actions Existing bulk actions.
	 * @return array Modified bulk actions.
	 */
	public static function add_bulk_action( $bulk_actions ) {
		$bulk_actions['export_indesign'] = __( 'Export as Adobe InDesign', 'newspack' );
		return $bulk_actions;
	}

	/**
	 * Handle bulk export action.
	 *
	 * @param string $redirect_to Redirect URL.
	 * @param string $doaction    Action being performed.
	 * @param array  $post_ids    Array of post IDs.
	 * @return string Modified redirect URL.
	 */
	public static function handle_bulk_action( $redirect_to, $doaction, $post_ids ) { // phpcs:ignore WordPressVIPMinimum.Hooks.AlwaysReturnInFilter.MissingReturnStatement
		if ( 'export_indesign' !== $doaction ) {
			return $redirect_to;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return add_query_arg( 'indesign_export_error', 'capability', $redirect_to );
		}

		if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], 'bulk-posts' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			return add_query_arg( 'indesign_export_error', 'nonce', $redirect_to );
		}

		if ( empty( $post_ids ) ) {
			return add_query_arg( 'indesign_export_error', 'no_posts', $redirect_to );
		}

		self::export_posts( $post_ids );
		exit;
	}

	/**
	 * Add row action to individual posts.
	 *
	 * @param array    $actions Array of row actions.
	 * @param \WP_Post $post    Post object.
	 * @return array Modified row actions.
	 */
	public static function add_row_action( $actions, $post ) {
		if ( in_array( $post->post_type, self::get_supported_post_types(), true ) && current_user_can( 'edit_post', $post->ID ) ) {
			$export_url = wp_nonce_url(
				add_query_arg(
					[
						'action'  => 'export_indesign_single',
						'post_id' => $post->ID,
					],
					admin_url( 'admin-post.php' )
				),
				'export_indesign_single_' . $post->ID
			);
			$actions    = array_merge(
				$actions,
				[
					'export_indesign' => sprintf(
						'<a href="%s">%s</a>',
						esc_url( $export_url ),
						__( 'Export as Adobe InDesign', 'newspack' )
					),
				]
			);
		}
		return $actions;
	}

	/**
	 * Handle single post export.
	 */
	public static function handle_single_export() {
		$post_id = isset( $_GET['post_id'] ) ? intval( $_GET['post_id'] ) : 0;

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_safe_redirect(
				add_query_arg( 'indesign_export_error', 'capability', admin_url( 'edit.php' ) )
			);
			exit;
		}

		if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( $_GET['_wpnonce'], 'export_indesign_single_' . $post_id ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			wp_safe_redirect(
				add_query_arg( 'indesign_export_error', 'nonce', admin_url( 'edit.php' ) )
			);
			exit;
		}

		$post = get_post( $post_id );
		if ( ! $post ) {
			wp_safe_redirect(
				add_query_arg( 'indesign_export_error', 'no_posts', admin_url( 'edit.php' ) )
			);
			exit;
		}

		self::export_posts( [ $post_id ] );
		exit;
	}

	/**
	 * Export posts as InDesign Tagged Text files.
	 *
	 * @param array $post_ids Array of post IDs to export.
	 */
	private static function export_posts( $post_ids ) {
		$converter      = new InDesign_Converter();
		$platform       = self::resolve_platform();
		$exported_files = [];

		foreach ( $post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post ) {
				continue;
			}

			$content          = $converter->convert_post( $post, [ 'platform' => $platform ] );
			$filename         = self::generate_filename( $post );
			$exported_files[] = [
				'filename' => $filename,
				'content'  => $content,
				'post'     => $post,
			];
		}

		// Single file export.
		if ( 1 === count( $exported_files ) ) {
			self::download_single_file( $exported_files[0] );
		} else {
			// Multiple files export as zip.
			self::download_zip_file( $exported_files );
		}
	}

	/**
	 * Get the configured platform setting.
	 *
	 * @return string One of 'auto', 'mac', 'win'.
	 */
	public static function get_platform_setting() {
		$value = get_option( self::PLATFORM_OPTION, self::PLATFORM_DEFAULT );
		return in_array( $value, self::ALLOWED_PLATFORMS, true ) ? $value : self::PLATFORM_DEFAULT;
	}

	/**
	 * Map a User-Agent string to a platform.
	 *
	 * Pure helper extracted so the auto-detect branch of resolve_platform()
	 * is testable without spoofing $_SERVER globals.
	 *
	 * @param string $user_agent User-Agent string to inspect.
	 * @return string Either 'mac' or 'win'. Empty/non-Mac strings yield 'win'.
	 */
	public static function sniff_user_agent_platform( $user_agent ) {
		return ( false !== stripos( $user_agent, 'Mac' ) || false !== stripos( $user_agent, 'iPad' ) || false !== stripos( $user_agent, 'iPhone' ) ) ? 'mac' : 'win';
	}

	/**
	 * Resolve the InDesign Tagged Text header platform for the current export.
	 *
	 * Honors the site setting first. When the setting is 'auto', the platform
	 * is sniffed from the requesting browser's User-Agent — InDesign requires
	 * the header to match the host OS or markup is rendered literally.
	 *
	 * @return string Either 'mac' or 'win'.
	 */
	private static function resolve_platform() {
		$setting    = self::get_platform_setting();
		$user_agent = '';

		if ( 'mac' === $setting || 'win' === $setting ) {
			$platform = $setting;
		} else {
			// The export runs from an authenticated admin-post.php request that is never cached.
			// phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___SERVER__HTTP_USER_AGENT__
			$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
			$platform   = self::sniff_user_agent_platform( $user_agent );
		}

		/**
		 * Filters the resolved platform for an InDesign export.
		 *
		 * @param string $platform   'mac' or 'win'.
		 * @param string $setting    The stored platform setting ('auto', 'mac', or 'win').
		 * @param string $user_agent The User-Agent header from the request after
		 *                           sanitize_text_field() + wp_unslash(), or '' when
		 *                           not consulted (i.e. setting is not 'auto').
		 */
		return apply_filters( 'newspack_indesign_export_platform', $platform, $setting, $user_agent );
	}

	/**
	 * Generate filename for exported post.
	 *
	 * @param \WP_Post $post Post object.
	 * @return string Generated filename.
	 */
	private static function generate_filename( $post ) {
		$title = sanitize_title( $post->post_title );
		$title = substr( $title, 0, 50 );
		$date  = get_the_date( 'Y-m-d', $post );
		return sprintf( '%d_%s_%s.txt', $post->ID, $title, $date );
	}

	/**
	 * Download single InDesign file.
	 *
	 * @param array $file File data array.
	 */
	private static function download_single_file( $file ) {
		header( 'Content-Type: text/plain; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . $file['filename'] . '"' );
		header( 'Content-Length: ' . strlen( $file['content'] ) );
		header( 'Cache-Control: no-cache, must-revalidate' );
		header( 'Expires: 0' );

		echo $file['content']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Download multiple files as ZIP.
	 *
	 * @param array $files Array of file data.
	 */
	private static function download_zip_file( $files ) {
		$zip          = new \ZipArchive();
		$zip_filename = 'indesign-export-' . gmdate( 'Y-m-d-H-i-s' ) . '.zip';

		$upload_dir = wp_upload_dir();
		$temp_file  = $upload_dir['basedir'] . '/indesign_export_' . uniqid() . '.zip';

		if ( true !== $zip->open( $temp_file, \ZipArchive::CREATE | \ZipArchive::OVERWRITE ) ) {
			wp_safe_redirect(
				add_query_arg( 'indesign_export_error', 'zip_error', admin_url( 'edit.php' ) )
			);
			exit;
		}

		foreach ( $files as $file ) {
			$zip->addFromString( $file['filename'], $file['content'] );
		}

		$zip->close();

		header( 'Content-Type: application/zip' );
		header( 'Content-Disposition: attachment; filename="' . $zip_filename . '"' );
		header( 'Content-Length: ' . filesize( $temp_file ) );
		header( 'Cache-Control: no-cache, must-revalidate' );
		header( 'Expires: 0' );

		readfile( $temp_file );

		if ( file_exists( $temp_file ) ) {
			wp_delete_file( $temp_file );
		}
	}

	/**
	 * Display admin notices for export results.
	 */
	public static function admin_notices() {
		if ( isset( $_GET['indesign_export_error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$error   = sanitize_text_field( $_GET['indesign_export_error'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$message = '';

			switch ( $error ) {
				case 'capability':
					$message = __( 'You do not have permission to export posts.', 'newspack' );
					break;
				case 'nonce':
					$message = __( 'Security check failed. Please try again.', 'newspack' );
					break;
				case 'no_posts':
					$message = __( 'No posts were selected for export.', 'newspack' );
					break;
				case 'zip_error':
					$message = __( 'Could not create ZIP file for export.', 'newspack' );
					break;
				default:
					$message = __( 'An error occurred during export.', 'newspack' );
			}

			printf(
				'<div class="notice notice-error is-dismissible"><p>%s</p></div>',
				esc_html( $message )
			);
		}
	}
}

InDesign_Exporter::init();

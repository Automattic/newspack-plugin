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
	 * Initialize the module.
	 */
	public static function init() {
		if ( ! self::is_feature_enabled() || ! Optional_Modules::is_optional_module_active( self::MODULE_NAME ) ) {
			return;
		}

		require_once NEWSPACK_ABSPATH . 'includes/optional-modules/indesign-export/class-indesign-converter.php';

		/**
		 * Currently, functionality works using a query parameter[export_indesign].
		 * TODO: This will be replaced with a proper and robust UI.
		 */
		add_action( 'init', [ __CLASS__, 'newspack_indesign_export' ], 100 );
	}

	/**
	 * Whether the InDesign Export module is enabled.
	 *
	 * @return bool True if InDesign Export is enabled.
	 */
	public static function is_feature_enabled() {
		$is_enabled = defined( 'NEWSPACK_INDESIGN_EXPORT_ENABLED' ) ? constant( 'NEWSPACK_INDESIGN_EXPORT_ENABLED' ) : false;

		/**
		 * Filters whether the InDesign Export feature is enabled.
		 *
		 * @param bool $is_enabled Whether the InDesign Export module is enabled.
		 */
		return apply_filters( 'newspack_indesign_export_enabled', $is_enabled );
	}

	/**
	 * Export a post to InDesign Tagged Text file.
	 *
	 * Note: function for testing purposes only. Will be removed when UI is introduced.
	 */
	public static function newspack_indesign_export() {
		$test_post = isset( $_GET['export_indesign'] ) ? get_post( intval( $_GET['export_indesign'] ) ) : null; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$converter = new InDesign_Converter();
		$content = $converter->convert_post( $test_post );

		if ( $content ) {
			header( 'Content-Type: text/plain' );
			header( 'Content-Disposition: attachment; filename="indesign-export-' . absint( $test_post->ID ) . '.txt"' );
			echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			exit;
		}
	}
}

InDesign_Exporter::init();

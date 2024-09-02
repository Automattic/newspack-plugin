<?php
/**
 * Reader Activation Data Syncing.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;
use Newspack\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Sync Class.
 */
class Sync {

	/**
	 * Log a message to the Newspack Logger.
	 *
	 * @param string $message The message to log.
	 */
	protected static function log( $message ) {
		Logger::log( $message, 'NEWSPACK-SYNC' );
	}

	/**
	 * Whether reader data can be synced.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if reader data can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	public static function can_sync( $return_errors = false ) {
		$errors = new \WP_Error();

		if ( ! Reader_Activation::is_enabled() ) {
			$errors->add(
				'ras_not_enabled',
				__( 'Reader Activation is not enabled.', 'newspack-plugin' )
			);
		}

		if ( class_exists( 'WCS_Staging' ) && \WCS_Staging::is_duplicate_site() ) {
			$errors->add(
				'wcs_duplicate_site',
				__( 'Reader Activation sync is disabled for cloned sites.', 'newspack-plugin' )
			);
		}

		$site_url = strtolower( \untrailingslashit( \get_site_url() ) );
		if ( false !== stripos( $site_url, '.newspackstaging.com' ) ) {
			$errors->add(
				'esp_sync_staging_site',
				__( 'Sync is disabled for Newspack staging sites.', 'newspack-plugin' )
			);
		}

		// If not a production site, only sync if the NEWSPACK_ALLOW_READER_SYNC constant is set.
		if (
			( ! method_exists( 'Newspack_Manager', 'is_connected_to_production_manager' ) || ! \Newspack_Manager::is_connected_to_production_manager() ) &&
			( ! defined( 'NEWSPACK_ALLOW_READER_SYNC' ) || ! NEWSPACK_ALLOW_READER_SYNC )
		) {
			$errors->add(
				'esp_sync_not_allowed',
				__( 'Sync is disabled for non-production sites. Set NEWSPACK_ALLOW_READER_SYNC to allow sync.', 'newspack-plugin' )
			);
		}

		if ( $return_errors ) {
			return $errors;
		}

		if ( $errors->has_errors() ) {
			return false;
		}

		return true;
	}
}

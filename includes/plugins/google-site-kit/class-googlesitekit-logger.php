<?php
/**
 * Google Site Kit Logger class.
 *
 * @package Newspack
 */

namespace Newspack;

use Google\Site_Kit\Core\Authentication\Has_Connected_Admins;
use Google\Site_Kit\Core\Authentication\Disconnected_Reason;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class GoogleSiteKit_Logger {
	/**
	 * The hook name for site kit disconnection logger cron job.
	 */
	const CRON_HOOK = 'newspack_googlesitekit_disconnection_logger';

	/**
	 * The log code for disconnections.
	 */
	const LOG_CODE_DISCONNECTED = 'newspack_googlesitekit_disconnected';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if (
			method_exists( 'Newspack_Manager', 'is_connected_to_production_manager' )
			&& ! \Newspack_Manager::is_connected_to_production_manager()
		) {
			return false;
		}
		if ( GoogleSiteKit::is_active() ) {
			add_action( 'admin_init', [ __CLASS__, 'cron_init' ] );
			add_action( self::CRON_HOOK, [ __CLASS__, 'handle_cron_event' ] );
		}
	}

	/**
	 * Schedule cron job to check for site kit connection. If the connection is lost we log it.
	 */
	public static function cron_init() {
		register_deactivation_hook( NEWSPACK_PLUGIN_FILE, [ __CLASS__, 'cron_deactivate' ] );

		if ( defined( 'NEWSPACK_CRON_DISABLE' ) && is_array( NEWSPACK_CRON_DISABLE ) && in_array( self::CRON_HOOK, NEWSPACK_CRON_DISABLE, true ) ) {
			self::cron_deactivate();
		} elseif ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time(), 'hourly', self::CRON_HOOK );
		}
	}

	/**
	 * Deactivate the cron job.
	 */
	public static function cron_deactivate() {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/**
	 * Logs when cron event runs and all admins are disconnected.
	 */
	public static function handle_cron_event() {
		$connection_info = self::get_connection_status();

		if ( 'connected' !== $connection_info['status'] ) {
			$message = 'Google Site Kit disconnection detected: ' . $connection_info['reason'];
			if ( isset( $connection_info['details'] ) ) {
				$message .= ' (' . $connection_info['details'] . ')';
			}
			self::log( self::LOG_CODE_DISCONNECTED, $message, false, 3 );
		}
	}

	/**
	 * Get comprehensive connection status information.
	 *
	 * @return array Connection status details with 'status', 'reason', and optional 'details'.
	 */
	public static function get_connection_status() {
		// Check if Site Kit is active.
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return [
				'status'  => 'disconnected',
				'reason'  => 'plugin_inactive',
				'details' => 'GOOGLESITEKIT_PLUGIN_MAIN_FILE not defined',
			];
		}

		// Check if required classes exist..
		if ( ! class_exists( 'Google\Site_Kit\Context' ) ||
			! class_exists( 'Google\Site_Kit\Core\Authentication\Authentication' ) ) {
			return [
				'status'  => 'disconnected',
				'reason'  => 'classes_missing',
				'details' => 'Required Site Kit classes not found',
			];
		}

		try {
			// Create the context.
			$context = new \Google\Site_Kit\Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );

			// Create the authentication instance.
			$authentication = new \Google\Site_Kit\Core\Authentication\Authentication( $context );

			// Check credentials first.
			if ( ! $authentication->credentials()->has() ) {
				return [
					'status'  => 'disconnected',
					'reason'  => 'no_credentials',
					'details' => 'OAuth credentials not configured',
				];
			}

			// Check if setup is completed.
			if ( ! $authentication->is_setup_completed() ) {
				return [
					'status'  => 'disconnected',
					'reason'  => 'setup_incomplete',
					'details' => 'Site Kit setup not completed',
				];
			}

			// Check if site has connected admins.
			$has_connected_admins_option = class_exists( 'Google\Site_Kit\Core\Authentication\Has_Connected_Admins' )
				? Has_Connected_Admins::OPTION
				: 'googlesitekit_has_connected_admins';
			$has_connected_admins = get_option( $has_connected_admins_option, false );
			if ( empty( $has_connected_admins ) ) {
				return [
					'status'  => 'disconnected',
					'reason'  => 'no_connected_admins',
					'details' => 'No administrators with active Google connections',
				];
			}

			// Check for disconnected reason in user meta.
			$disconnected_reason = self::get_disconnected_reason();
			if ( ! empty( $disconnected_reason ) ) {
				return [
					'status'  => 'disconnected',
					'reason'  => 'user_disconnected',
					'details' => 'Disconnected with reason: ' . $disconnected_reason,
				];
			}

			return [
				'status' => 'connected',
				'reason' => 'fully_connected',
			];

		} catch ( \Exception $e ) {
			return [
				'status'  => 'disconnected',
				'reason'  => 'exception',
				'details' => $e->getMessage(),
			];
		}
	}

	/**
	 * Get the disconnected reason from user meta for any administrator.
	 *
	 * @return string|null The disconnected reason or null if none found.
	 */
	private static function get_disconnected_reason() {
		$admins = get_users( [ 'role' => 'administrator' ] );
		$disconnected_reason_option = class_exists( 'Google\Site_Kit\Core\Authentication\Disconnected_Reason' )
			? Disconnected_Reason::OPTION
			: 'googlesitekit_disconnected_reason';

		foreach ( $admins as $admin ) {
			$reason = get_user_meta( $admin->ID, $disconnected_reason_option, true );
			if ( ! empty( $reason ) ) {
				return $reason;
			}
		}

		return null;
	}

	/**
	 * Main site kit logger.
	 *
	 * @param string $code      The code for the log.
	 * @param string $message   The message to log. Optional.
	 * @param bool   $backtrace Whether to include a backtrace.
	 * @param int    $log_level The log level.
	 */
	private static function log( $code, $message, $backtrace = true, $log_level = 2 ) {
		$data = [
			'file'       => $code,
			'user_email' => wp_get_current_user()->user_email,
		];
		if ( $backtrace ) {
			$e                 = new \Exception();
			$data['backtrace'] = $e->getTraceAsString();
		}
		Logger::newspack_log( $code, $message, $data, 'error', $log_level );
	}
}
GoogleSiteKit_Logger::init();

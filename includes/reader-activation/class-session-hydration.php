<?php
/**
 * Session Hydration.
 *
 * Bridges the gap between authentication and the next page load by providing
 * a fresh wp_rest nonce via a short-lived CID-to-user binding.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation;

use Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Session Hydration class.
 */
final class Session_Hydration {

	/**
	 * Transient TTL in seconds (30 minutes).
	 */
	const TRANSIENT_TTL = 30 * MINUTE_IN_SECONDS;

	/**
	 * Transient key prefix.
	 */
	const TRANSIENT_PREFIX = 'newspack_cid_';

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	/**
	 * Bind a CID cookie to a user ID via a short-lived transient.
	 *
	 * Call this after a user authenticates or an account is created.
	 *
	 * @param int $user_id The authenticated user's ID.
	 */
	public static function bind_cid( $user_id ) {
		// phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		$cid = isset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ) ? sanitize_text_field( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ) : '';
		if ( empty( $cid ) ) {
			return;
		}
		set_transient( self::TRANSIENT_PREFIX . $cid, (int) $user_id, self::TRANSIENT_TTL );
	}

	/**
	 * Register REST routes.
	 */
	public static function register_routes() {
		// Will be added in Task 2.
	}
}
Session_Hydration::init();

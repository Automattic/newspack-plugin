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
		add_action( 'wp_login', [ __CLASS__, 'on_wp_login' ], 10, 2 );
		add_action( 'newspack_registered_reader_via_woo', [ __CLASS__, 'on_woo_customer_created' ], 10, 2 );
	}

	/**
	 * Bind CID on login.
	 *
	 * @param string   $user_login Username.
	 * @param \WP_User $user       Authenticated user object.
	 */
	public static function on_wp_login( $user_login, $user ) {
		self::bind_cid( $user->ID );
	}

	/**
	 * Bind CID on WooCommerce customer creation.
	 *
	 * @param string $email   Email address.
	 * @param int    $user_id The created user id.
	 */
	public static function on_woo_customer_created( $email, $user_id ) {
		self::bind_cid( $user_id );
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
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/reader/session',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'handle_hydration' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
			]
		);
	}

	/**
	 * Permission callback for the hydration endpoint.
	 *
	 * @return true|\WP_Error
	 */
	public static function permission_callback() {
		if ( ! \is_user_logged_in() ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Authentication required.', 'newspack-plugin' ),
				[ 'status' => 401 ]
			);
		}
		return true;
	}

	/**
	 * Handle session hydration request.
	 *
	 * Validates the CID-to-user binding and returns a fresh wp_rest nonce.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function handle_hydration() {
		// phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		$cid = isset( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ) ? sanitize_text_field( $_COOKIE[ NEWSPACK_CLIENT_ID_COOKIE_NAME ] ) : '';
		if ( empty( $cid ) ) {
			return new \WP_Error(
				'newspack_session_invalid',
				__( 'Invalid session.', 'newspack-plugin' ),
				[ 'status' => 403 ]
			);
		}

		$transient_key  = self::TRANSIENT_PREFIX . $cid;
		$stored_user_id = get_transient( $transient_key );

		if ( false === $stored_user_id || (int) $stored_user_id !== \get_current_user_id() ) {
			return new \WP_Error(
				'newspack_session_invalid',
				__( 'Invalid session.', 'newspack-plugin' ),
				[ 'status' => 403 ]
			);
		}

		// One-time use: delete the transient.
		delete_transient( $transient_key );

		return new \WP_REST_Response( [ 'nonce' => \wp_create_nonce( 'wp_rest' ) ] );
	}
}
Session_Hydration::init();

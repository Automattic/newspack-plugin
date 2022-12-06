<?php
/**
 * Newspack Data Events.
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Error;

/**
 * Main class.
 */
final class Data_Events {
	/**
	 * Asynchronous action name.
	 */
	const ACTION = 'newspack_data_event';

	/**
	 * Registered callable handlers, keyed by their action name.
	 *
	 * @var callable[]
	 */
	private static $actions = [];

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		\add_action( 'wp_ajax_' . self::ACTION, [ __CLASS__, 'maybe_handle' ] );
		\add_action( 'wp_ajax_nopriv_' . self::ACTION, [ __CLASS__, 'maybe_handle' ] );
	}

	/**
	 * Maybe handle an event.
	 */
	public static function maybe_handle() {
		// Don't lock up other requests while processing.
		session_write_close(); // phpcs:ignore

		if ( ! isset( $_REQUEST['nonce'] ) || ! \wp_verify_nonce( \sanitize_text_field( $_REQUEST['nonce'] ), self::ACTION ) ) {
			wp_die();
		}

		$action_name = isset( $_POST['action_name'] ) ? \sanitize_text_field( \wp_unslash( $_POST['action_name'] ) ) : null;
		if ( ! $action_name || ! isset( self::$actions[ $action_name ] ) ) {
			wp_die();
		}

		$timestamp = isset( $_POST['timestamp'] ) ? \sanitize_text_field( \wp_unslash( $_POST['timestamp'] ) ) : null;
		$data      = isset( $_POST['data'] ) ? $_POST['data'] : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$client_id = isset( $_POST['client_id'] ) ? \sanitize_text_field( \wp_unslash( $_POST['client_id'] ) ) : null;

		self::handle( $action_name, $timestamp, $data, $client_id );

		wp_die();
	}

	/**
	 * Handle an event.
	 *
	 * @param string $action_name Action name.
	 * @param int    $timestamp   Timestamp.
	 * @param mixed  $data        Data.
	 * @param string $client_id   Client ID.
	 */
	public static function handle( $action_name, $timestamp, $data, $client_id ) {

		// Execute registered handlers.
		Logger::log( 'Executing action handler: ' . $action_name );
		$handlers = self::get_action_handlers( $action_name );
		foreach ( $handlers as $handler ) {
			try {
				call_user_func( $handler, $timestamp, $data, $client_id );
			} catch ( \Throwable $e ) {
				// Catch fatal errors so it doesn't disrupt other handlers.
				Logger::error( $e->getMessage() );
			}
		}

		// Execute WP hooks.
		do_action( self::ACTION, $action_name, $timestamp, $data, $client_id );
		do_action( self::ACTION . '_' . $action_name, $timestamp, $data, $client_id );
	}

	/**
	 * Register a triggerable action.
	 *
	 * @param string $action_name Action name.
	 *
	 * @return void|WP_Error Error if action already registered.
	 */
	public static function register_action( $action_name ) {
		if ( ! isset( self::$actions[ $action_name ] ) ) {
			self::$actions[ $action_name ] = [];
		}
	}

	/**
	 * Register a handler for a triggerable action.
	 *
	 * @param string   $action_name Action name.
	 * @param callable $handler     Action handler.
	 *
	 * @return void|WP_Error Error if action not registered.
	 */
	public static function register_action_handler( $action_name, $handler ) {
		if ( ! isset( self::$actions[ $action_name ] ) ) {
			return new WP_Error( 'action_not_registered', __( 'Action not registered.', 'newspack' ) );
		}
		self::$actions[ $action_name ][] = $handler;
	}

	/**
	 * Get a list of all registered actions.
	 *
	 * @return string[] Registered actions.
	 */
	public static function get_actions() {
		return array_keys( self::$actions );
	}

	/**
	 * Get a list of all registered action handlers.
	 *
	 * @param string $action_name Action name.
	 *
	 * @return callable[] Registered action handlers.
	 */
	public static function get_action_handlers( $action_name ) {
		if ( ! isset( self::$actions[ $action_name ] ) ) {
			return [];
		}
		return self::$actions[ $action_name ];
	}

	/**
	 * Whether an action is registered.
	 *
	 * @param string $action_name The action name.
	 *
	 * @return bool
	 */
	public static function is_action_registered( $action_name ) {
		return isset( self::$actions[ $action_name ] );
	}

	/**
	 * Get dispatch request url.
	 */
	private static function get_dispatch_url() {
		$url  = \admin_url( 'admin-ajax.php' );
		$args = [
			'action' => self::ACTION,
			'nonce'  => \wp_create_nonce( self::ACTION ),
		];
		return \add_query_arg( $args, $url );
	}

	/**
	 * Dispatch an action event.
	 *
	 * @param string  $action_name   Action name.
	 * @param array   $data          Data to pass to the action.
	 * @param boolean $use_client_id Whether to use the session's client ID. Default is true.
	 *
	 * @return void|WP_Error Error if action not registered.
	 */
	public static function dispatch( $action_name, $data, $use_client_id = true ) {
		if ( ! self::is_action_registered( $action_name ) ) {
			return new WP_Error( 'newspack_data_events_action_not_registered', __( 'Action not registered.', 'newspack' ) );
		}

		$timestamp = time();
		$client_id = null;
		if ( $use_client_id ) {
			$client_id = Reader_Activation::get_client_id();
		}

		do_action( 'newspack_data_event_dispatch', $action_name, $timestamp, $data, $client_id );

		do_action( "newspack_data_event_dispatch_{$action_name}", $timestamp, $data, $client_id );

		$url = self::get_dispatch_url();

		$body = [
			'action_name' => $action_name,
			'timestamp'   => $timestamp,
			'data'        => $data,
			'client_id'   => $client_id,
		];

		return \wp_remote_post(
			$url,
			[
				'timeout'   => 0.01,
				'blocking'  => false,
				'body'      => $body,
				'cookies'   => $_COOKIE, // phpcs:ignore
				'sslverify' => false,
			]
		);
	}
}
Data_Events::init();

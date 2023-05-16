<?php
/**
 * Reader Activation Data Library Class.
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Recaptcha;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Data Class.
 */
final class Reader_Data {

	// Maximum number of keys a user can have.
	const MAX_KEYS = 100;

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'config_script' ] );
	}

	/**
	 * Add config to the data script.
	 */
	public static function config_script() {
		if ( ! \is_user_logged_in() ) {
			return;
		}
		wp_localize_script(
			Reader_Activation::SCRIPT_HANDLE,
			'newspack_reader_data',
			[
				'api_url' => \get_rest_url( null, NEWSPACK_API_NAMESPACE . '/reader-data' ),
				'nonce'   => \is_user_logged_in() ? \wp_create_nonce( 'wp_rest' ) : '',
				'items'   => self::get_data( \get_current_user_id() ),
			]
		);
	}

	/**
	 * Register routes.
	 */
	public static function register_routes() {
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/reader-data',
			[
				'methods'             => 'POST',
				'callback'            => [ __CLASS__, 'update_data' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => [
					'key'   => [
						'type' => 'string',
					],
					'value' => [
						'type' => 'string',
					],
				],
			]
		);
		\register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/reader-data',
			[
				'methods'             => 'DELETE',
				'callback'            => [ __CLASS__, 'delete_data' ],
				'permission_callback' => [ __CLASS__, 'permission_callback' ],
				'args'                => [
					'key' => [
						'type' => 'string',
					],
				],
			]
		);
	}

	/**
	 * Whether the current user can access the API.
	 */
	public static function permission_callback() {
		return \is_user_logged_in();
	}

	/**
	 * Get the user meta key.
	 *
	 * @param string $key Key.
	 */
	private static function get_meta_key_name( $key ) {
		return 'newspack_reader_data_item_' . $key;
	}

	/**
	 * Get reader data.
	 *
	 * @param string $user_id User ID.
	 * @param string $key     Optional key to return.
	 *
	 * @return array|false Array of data, false if key not found.
	 */
	public static function get_data( $user_id, $key = '' ) {
		$user_keys = \get_user_meta( $user_id, 'newspack_reader_data_keys', true );
		if ( ! $user_keys && ! $key ) {
			return [];
		}

		if ( $key ) {
			if ( ! in_array( $key, $user_keys, true ) ) {
				return false;
			}
			return \get_user_meta( $user_id, self::get_meta_key_name( $key ), true );
		}

		$data = [];
		foreach ( $user_keys as $key ) {
			$data[ $key ] = \get_user_meta( $user_id, self::get_meta_key_name( $key ), true );
		}

		return $data;
	}

	/**
	 * Update user key.
	 *
	 * @param string $user_id User ID.
	 * @param string $key     Key.
	 * @param string $value   Value.
	 *
	 * @return true|WP_Error True on success, error object on failure.
	 */
	private static function update_reader_data_key( $user_id, $key, $value ) {
		$user_keys = \get_user_meta( $user_id, 'newspack_reader_data_keys', true );
		if ( ! $user_keys ) {
			$user_keys = [];
		}

		/**
		 * Filter the maximum number of keys a user can have.
		 *
		 * @param int    $max_keys Maximum number of keys.
		 * @param int    $user_id  User ID.
		 * @param string $key      Key.
		 * @param string $value    Value.
		 */
		$max_keys = apply_filters( 'newspack_reader_data_max_keys', self::MAX_KEYS, $user_id, $key, $value );
		if ( count( $user_keys ) >= self::MAX_KEYS ) {
			return new \WP_Error( 'too_many_keys', __( 'Too many keys.', 'newspack' ), [ 'status' => 400 ] );
		}

		if ( ! in_array( $key, $user_keys, true ) ) {
			$user_keys[] = $key;
			\update_user_meta( $user_id, 'newspack_reader_data_keys', $user_keys );
		}

		\update_user_meta( $user_id, self::get_meta_key_name( $key ), $value );
		return true;
	}

	/**
	 * Delete user key.
	 *
	 * @param string $user_id User ID.
	 * @param string $key     Key.
	 */
	private static function delete_reader_data_key( $user_id, $key ) {
		$user_keys = \get_user_meta( $user_id, 'newspack_reader_data_keys', true );
		if ( ! $user_keys ) {
			$user_keys = [];
		}
		if ( in_array( $key, $user_keys, true ) ) {
			$user_keys = array_diff( $user_keys, [ $key ] );
			\update_user_meta( $user_id, 'newspack_reader_data_keys', $user_keys );
		}
		\delete_user_meta( $user_id, self::get_meta_key_name( $key ) );
		return true;
	}

	/**
	 * Update data.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function update_data( $request ) {
		$key   = $request->get_param( 'key' );
		$value = $request->get_param( 'value' );
		if ( ! $key || ! $value ) {
			return new \WP_Error( 'invalid_params', __( 'Invalid parameters.', 'newspack' ), [ 'status' => 400 ] );
		}
		$res = self::update_reader_data_key( \get_current_user_id(), $key, $value );
		if ( \is_wp_error( $res ) ) {
			return $res;
		}
		return new \WP_REST_Response( [ 'success' => true ] );
	}

	/**
	 * Update data.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function delete_data( $request ) {
		$key = $request->get_param( 'key' );
		if ( ! $key ) {
			return new \WP_Error( 'invalid_params', __( 'Invalid parameters.', 'newspack' ), [ 'status' => 400 ] );
		}
		self::delete_reader_data_key( \get_current_user_id(), $key );
		return new \WP_REST_Response( [ 'success' => true ] );
	}

}
Reader_Data::init();

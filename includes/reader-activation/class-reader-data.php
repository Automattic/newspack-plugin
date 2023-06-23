<?php
/**
 * Reader Activation Data Library Class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Reader Data Class.
 */
final class Reader_Data {

	// Maximum number of items per user.
	const MAX_ITEMS = 100;

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
		add_action( 'wp_enqueue_scripts', [ __CLASS__, 'config_script' ] );
		add_action( 'wp_head', [ __CLASS__, 'push_reader_activity' ] );
	}

	/**
	 * Add config to the data script.
	 */
	public static function config_script() {
		/**
		 * Filters the localStorage store item prefix.
		 *
		 * @param string $store_prefix Prefix.
		 */
		$store_prefix = apply_filters(
			'newspack_reader_data_store_prefix',
			sprintf( 'np_reader_%d_', \get_current_blog_id() )
		);

		$config = [
			'store_prefix' => $store_prefix,
		];

		if ( \is_user_logged_in() ) {
			$config['api_url'] = \get_rest_url( null, NEWSPACK_API_NAMESPACE . '/reader-data' );
			$config['nonce']   = \wp_create_nonce( 'wp_rest' );
			$config['items']   = self::get_data( \get_current_user_id() );
		}

		wp_localize_script( Reader_Activation::SCRIPT_HANDLE, 'newspack_reader_data', $config );
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
				'callback'            => [ __CLASS__, 'api_update_item' ],
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
				'callback'            => [ __CLASS__, 'api_delete_item' ],
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
	 * @return mixed Key data if provided, array of data or false if key not found.
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
	 * Update reader data item.
	 *
	 * @param string $user_id User ID.
	 * @param string $key     Key.
	 * @param string $value   Value.
	 *
	 * @return true|WP_Error True on success, error object on failure.
	 */
	private static function update_item( $user_id, $key, $value ) {
		$user_keys = \get_user_meta( $user_id, 'newspack_reader_data_keys', true );
		if ( ! $user_keys ) {
			$user_keys = [];
		}

		/**
		 * Filter the maximum number of items per user.
		 *
		 * @param int    $max_items Maximum number of items.
		 * @param int    $user_id   User ID.
		 * @param string $key       Key.
		 * @param string $value     Value.
		 */
		$max_items = apply_filters( 'newspack_reader_data_max_items', self::MAX_ITEMS, $user_id, $key, $value );
		if ( count( $user_keys ) >= self::MAX_ITEMS ) {
			return new \WP_Error( 'too_many_items', __( 'Too many items.', 'newspack' ), [ 'status' => 400 ] );
		}

		if ( ! in_array( $key, $user_keys, true ) ) {
			$user_keys[] = $key;
			\update_user_meta( $user_id, 'newspack_reader_data_keys', $user_keys );
		}

		\update_user_meta( $user_id, self::get_meta_key_name( $key ), $value );
		return true;
	}

	/**
	 * Delete user data item.
	 *
	 * @param string $user_id User ID.
	 * @param string $key     Key.
	 */
	private static function delete_item( $user_id, $key ) {
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
	 * API callback to update an item.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_update_item( $request ) {
		$key   = $request->get_param( 'key' );
		$value = $request->get_param( 'value' );
		if ( ! $key || ! $value ) {
			return new \WP_Error( 'invalid_params', __( 'Invalid parameters.', 'newspack' ), [ 'status' => 400 ] );
		}
		// Value must be a valid stringified JSON.
		if ( null === json_decode( $value ) ) {
			return new \WP_Error( 'invalid_value', __( 'Invalid value.', 'newspack' ), [ 'status' => 400 ] );
		}
		$res = self::update_item( \get_current_user_id(), $key, $value );
		if ( \is_wp_error( $res ) ) {
			return $res;
		}
		return new \WP_REST_Response( [ 'success' => true ] );
	}

	/**
	 * API callback to delete an item.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_delete_item( $request ) {
		$key = $request->get_param( 'key' );
		if ( ! $key ) {
			return new \WP_Error( 'invalid_params', __( 'Invalid parameters.', 'newspack' ), [ 'status' => 400 ] );
		}
		self::delete_item( \get_current_user_id(), $key );
		return new \WP_REST_Response( [ 'success' => true ] );
	}

	/**
	 * Push reader activity.
	 */
	public static function push_reader_activity() {
		$reader_activity = [];

		/**
		 * Article view activity.
		 */
		if ( is_singular( 'post' ) ) {
			$activity = [
				'action' => 'article_view',
				'data'   => [
					'post_id'    => get_the_ID(),
					'permalink'  => get_permalink(),
					'categories' => wp_get_post_categories( get_the_ID(), [ 'fields' => 'ids' ] ),
					'tags'       => wp_get_post_tags( get_the_ID(), [ 'fields' => 'ids' ] ),
					'author'     => get_the_author(),
				],
			];

			/**
			 * Filters the 'article_view' reader activity.
			 */
			$activity = apply_filters( 'newspack_reader_activity_article_view', $activity );

			// Allow the filter to short-circuit the activity.
			if ( ! empty( $activity ) ) {
				$reader_activity[] = $activity;
			}
		}

		/**
		 * Filter the reader activity to push to the client.
		 */
		$reader_activity = apply_filters( 'newspack_reader_activity', $reader_activity );
		foreach ( $reader_activity as $i => $activity ) {
			$reader_activity[ $i ] = array_values( $activity );
		}
		?>
		<script>
			( function() {
				var activity = <?php echo wp_json_encode( $reader_activity ); ?>;
				if ( ! activity || ! activity.length ) {
					return;
				}
				window.newspackRAS = window.newspackRAS || [];
				activity.forEach( item => window.newspackRAS.push(item) );
			})();
		</script>
		<?php
	}
}
Reader_Data::init();

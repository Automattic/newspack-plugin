<?php
/**
 * Nextdoor settings management.
 *
 * @package Newspack
 */

namespace Newspack\Nextdoor;

use Newspack\Nextdoor;

defined( 'ABSPATH' ) || exit;

/**
 * Nextdoor settings management class.
 */
class Settings {

	/**
	 * The single instance of the class.
	 *
	 * @var Settings
	 */
	protected static $instance = null;

	/**
	 * Main Settings Instance.
	 *
	 * @return Settings - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Register REST API endpoints.
	 */
	public function register_api_endpoints() {
		// Settings endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/settings',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/settings',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'client_id'     => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'client_secret' => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'allowed_roles' => [
						'required' => false,
						'type'     => 'array',
					],
				],
			]
		);

		// OAuth endpoints.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/oauth/start',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_start_oauth' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'email'   => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_email',
					],
					'country' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
				],
			]
		);

		// Page claim endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/claim-page',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_claim_page' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'publication_url' => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'esc_url_raw',
					],
					'test'            => [
						'required'          => false,
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
				],
			]
		);

		// Post sharing status endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/post-status/(?P<id>\d+)',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_post_sharing_status' ],
				'permission_callback' => [ $this, 'api_post_permissions_check' ],
				'args'                => [
					'id' => [
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Publish post endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/publish-post/(?P<id>\d+)',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'api_publish_post' ],
				'permission_callback' => [ $this, 'api_post_permissions_check' ],
				'args'                => [
					'id' => [
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Update post endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/update-post/(?P<id>\d+)',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_post' ],
				'permission_callback' => [ $this, 'api_post_permissions_check' ],
				'args'                => [
					'id' => [
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Delete post endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/delete-post/(?P<id>\d+)',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'api_delete_post' ],
				'permission_callback' => [ $this, 'api_post_permissions_check' ],
				'args'                => [
					'id' => [
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Disconnect endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/nextdoor/disconnect',
			[
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => [ $this, 'api_disconnect' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Check if user has permission to manage Nextdoor settings.
	 *
	 * @return bool
	 */
	public function api_permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user has permission to publish posts to Nextdoor.
	 *
	 * @return bool
	 */
	public function api_post_permissions_check() {
		return Nextdoor::can_user_publish();
	}

	/**
	 * Get Nextdoor settings via API.
	 *
	 * @return WP_REST_Response
	 */
	public function api_get_settings() {
		$settings = Nextdoor::get_settings();

		// Don't expose sensitive data.
		unset( $settings['access_token'] );

		return rest_ensure_response( $settings );
	}

	/**
	 * Update Nextdoor settings via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_update_settings( $request ) {
		$settings = Nextdoor::get_settings();
		$params   = $request->get_params();

		if ( isset( $params['client_id'] ) ) {
			$settings['client_id'] = $params['client_id'];
		}

		if ( isset( $params['client_secret'] ) ) {
			$settings['client_secret'] = $params['client_secret'];
		}

		if ( isset( $params['allowed_roles'] ) ) {
			$settings['allowed_roles'] = $params['allowed_roles'];
		}

		$updated = Nextdoor::update_settings( $settings );

		if ( ! $updated ) {
			return new \WP_Error(
				'newspack_nextdoor_settings_update_failed',
				__( 'Failed to update Nextdoor settings.', 'newspack-plugin' ),
				[ 'status' => 500 ]
			);
		}

		return $this->api_get_settings();
	}

	/**
	 * Start OAuth flow via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_start_oauth( $request ) {
		$email   = $request->get_param( 'email' );
		$country = $request->get_param( 'country' );

		$api  = API::instance();
		$auth = Auth::instance();

		// First, create/get account.
		$redirect_uri     = Nextdoor::get_redirect_uri();
		$account_response = $api->create_account( $email, $country, $redirect_uri );

		if ( is_wp_error( $account_response ) ) {
			return $account_response;
		}

		$settings = Nextdoor::get_settings();

		if ( empty( $settings['client_id'] ) ) {
			return new \WP_Error(
				'newspack_nextdoor_client_id_missing',
				__( 'Client ID not configured.', 'newspack-plugin' ),
				[ 'status' => 400 ]
			);
		}

		return rest_ensure_response(
			[
				'login_url' => isset( $account_response['login_url'] ) ? $account_response['login_url'] : '',
			]
		);
	}

	/**
	 * Callback for claiming a page via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_claim_page( $request ) {
		$publication_url = $request->get_param( 'publication_url' );
		$test            = $request->get_param( 'test' );

		$settings                    = Nextdoor::get_settings();
		$settings['publication_url'] = $publication_url;
		Nextdoor::update_settings( $settings );

		// Check if page is already claimed.
		if ( $this->check_page_claim( $publication_url ) ) {
			return rest_ensure_response( [ 'success' => true ] );
		}

		$api    = API::instance();
		$result = $api->claim_page( $publication_url, $test );

		if ( is_array( $result ) && isset( $result['page_id'] ) ) {
			$settings['page_id'] = $result['page_id'];

			Nextdoor::update_settings( $settings );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( [ 'success' => true ] );
	}

	/**
	 * Checks if the current publication URL page has been claimed.
	 *
	 * @param string $publication_url The publication URL to check.
	 * @return bool True if the page is claimed, false otherwise.
	 */
	private function check_page_claim( $publication_url ) {
		$api      = API::instance();
		$profiles = $api->get_profiles();

		if ( is_wp_error( $profiles ) || empty( $profiles ) ) {
			return false;
		}

		if ( ! isset( $profiles['profile_list'] ) || ! is_array( $profiles['profile_list'] ) ) {
			return false;
		}

		$input_url = rtrim( $publication_url, '/' );

		foreach ( $profiles['profile_list'] as $profile ) {
			if ( isset( $profile['is_entity_profile'] ) && $profile['is_entity_profile'] === true &&
				isset( $profile['entity_page'] ) && isset( $profile['entity_page']['publication_url'] ) ) {

				$claimed_url = rtrim( $profile['entity_page']['publication_url'], '/' );

				if ( $claimed_url === $input_url ) {
					$settings            = Nextdoor::get_settings();
					$settings['page_id'] = $profile['entity_page']['id'];
					$settings['profile_id'] = $profile['id'];
					$settings['entity_page_name'] = $profile['entity_page']['name'];
					Nextdoor::update_settings( $settings );
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Get post sharing status via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_get_post_sharing_status( $request ) {
		$post_id = $request->get_param( 'id' );
		$status  = self::get_post_sharing_status( $post_id );

		// Add connection status for UI context.
		$status['can_publish'] = Nextdoor::is_connected() && Nextdoor::can_user_publish();

		return rest_ensure_response( $status );
	}

	/**
	 * Publish post to Nextdoor via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_publish_post( $request ) {
		$post_id = $request->get_param( 'id' );
		$result  = self::publish_post( $post_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			[
				'success' => true,
				'message' => __( 'Post successfully published to Nextdoor.', 'newspack-plugin' ),
				'article' => $result,
			]
		);
	}

	/**
	 * Update post on Nextdoor via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_update_post( $request ) {
		$post_id = $request->get_param( 'id' );
		$result  = self::update_post( $post_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			[
				'success' => true,
				'message' => __( 'Post successfully updated on Nextdoor.', 'newspack-plugin' ),
				'article' => $result,
			]
		);
	}

	/**
	 * Delete post from Nextdoor via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_delete_post( $request ) {
		$post_id = $request->get_param( 'id' );
		$result  = self::delete_post( $post_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			[
				'success' => true,
				'message' => __( 'Post successfully removed from Nextdoor.', 'newspack-plugin' ),
			]
		);
	}

	/**
	 * Disconnect Nextdoor account via API.
	 *
	 * @return WP_REST_Response
	 */
	public function api_disconnect() {
		$result = self::disconnect_account();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			[
				'success' => true,
				'message' => __( 'Nextdoor account disconnected successfully.', 'newspack-plugin' ),
			]
		);
	}

	/**
	 * Publish post to Nextdoor.
	 *
	 * @param int $post_id Post ID.
	 * @return array|WP_Error
	 */
	public static function publish_post( $post_id ) {
		if ( ! Nextdoor::is_connected() ) {
			return new \WP_Error(
				'nextdoor_not_connected',
				__( 'Nextdoor is not connected.', 'newspack-plugin' )
			);
		}

		$post = get_post( $post_id );
		if ( ! $post || $post->post_status !== 'publish' ) {
			return new \WP_Error(
				'invalid_post',
				__( 'Post not found or not published.', 'newspack-plugin' )
			);
		}

		// Check if post is already shared.
		$nextdoor_guid = get_post_meta( $post_id, '_nextdoor_guid', true );
		if ( $nextdoor_guid ) {
			return new \WP_Error(
				'already_shared',
				__( 'Post has already been shared to Nextdoor.', 'newspack-plugin' )
			);
		}

		$settings = Nextdoor::get_settings();
		$api      = API::instance();
		$auth     = Auth::instance();

		// Check if the access token is valid.
		$token_valid = $auth->validate_token();
		if ( ! $token_valid ) {
			return new \WP_Error(
				'nextdoor_token_invalid',
				__( 'Nextdoor access token is invalid or expired. Please reconnect your account.', 'newspack-plugin' )
			);
		}

		// Prepare article data.
		$article_data = self::prepare_article_data( $post_id, $settings );

		$response = $api->create_article( $article_data );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// Store the GUID and sharing timestamp for future reference.
		update_post_meta( $post_id, '_nextdoor_guid', $article_data['guid'] );
		update_post_meta( $post_id, '_nextdoor_shared_at', current_time( 'mysql' ) );

		return $response;
	}

	/**
	 * Update post on Nextdoor.
	 *
	 * @param int $post_id Post ID.
	 * @return array|WP_Error
	 */
	public static function update_post( $post_id ) {
		if ( ! Nextdoor::is_connected() ) {
			return new \WP_Error(
				'nextdoor_not_connected',
				__( 'Nextdoor is not connected.', 'newspack-plugin' )
			);
		}

		$post = get_post( $post_id );
		if ( ! $post || $post->post_status !== 'publish' ) {
			return new \WP_Error(
				'invalid_post',
				__( 'Post not found or not published.', 'newspack-plugin' )
			);
		}

		// Check if post has been shared to Nextdoor.
		$guid = get_post_meta( $post_id, '_nextdoor_guid', true );
		if ( ! $guid ) {
			return new \WP_Error(
				'post_not_shared',
				__( 'Post has not been shared to Nextdoor yet.', 'newspack-plugin' )
			);
		}

		$settings = Nextdoor::get_settings();
		$api      = API::instance();

		// Prepare article data.
		$article_data = self::prepare_article_data( $post_id, $settings );

		// Update the modified timestamp.
		$article_data['modified_at'] = get_the_modified_date( 'c', $post_id );

		$response = $api->update_article( $article_data );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// Update the modified timestamp in post meta.
		update_post_meta( $post_id, '_nextdoor_updated_at', current_time( 'mysql' ) );

		return $response;
	}

	/**
	 * Delete post from Nextdoor.
	 *
	 * @param int $post_id Post ID.
	 * @return array|WP_Error
	 */
	public static function delete_post( $post_id ) {
		if ( ! Nextdoor::is_connected() ) {
			return new \WP_Error(
				'nextdoor_not_connected',
				__( 'Nextdoor is not connected.', 'newspack-plugin' )
			);
		}

		// Check if post has been shared to Nextdoor.
		$guid = get_post_meta( $post_id, '_nextdoor_guid', true );
		if ( ! $guid ) {
			return new \WP_Error(
				'post_not_shared',
				__( 'Post has not been shared to Nextdoor.', 'newspack-plugin' )
			);
		}

		$api      = API::instance();
		$response = $api->delete_article( $guid );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// Remove Nextdoor-related metadata.
		delete_post_meta( $post_id, '_nextdoor_guid' );
		delete_post_meta( $post_id, '_nextdoor_shared_at' );
		delete_post_meta( $post_id, '_nextdoor_updated_at' );

		return $response;
	}

	/**
	 * Disconnect Nextdoor account.
	 *
	 * @return array|WP_Error
	 */
	public static function disconnect_account() {
		// Clear all Nextdoor settings.
		$result = delete_option( 'newspack_nextdoor_settings' );

		if ( ! $result ) {
			return new \WP_Error(
				'disconnect_failed',
				__( 'Failed to disconnect Nextdoor account.', 'newspack-plugin' )
			);
		}

		return [ 'success' => true ];
	}

	/**
	 * Prepare article data for Nextdoor API.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $settings Nextdoor settings.
	 * @return array
	 */
	private static function prepare_article_data( $post_id, $settings ) {
		$post = get_post( $post_id );

		// Generate GUID for the article.
		$guid = get_post_meta( $post_id, '_nextdoor_guid', true );
		if ( ! $guid ) {
			$site_name_slug = str_replace( ' ', '_', get_bloginfo( 'name' ) );
			$guid           = $site_name_slug . '_' . $post_id . '_' . time();
		}

		$article_data = [
			'publication_url' => $settings['publication_url'],
			'guid'            => $guid,
			'content_url'     => get_permalink( $post_id ),
			'title'           => get_the_title( $post_id ),
			'description'     => get_the_excerpt( $post_id ),
			'authors'         => [ get_the_author_meta( 'display_name', $post->post_author ) ],
			'published_at'    => get_the_date( 'c', $post_id ),
			'modified_at'     => get_the_modified_date( 'c', $post_id ),
			'content'         => wp_strip_all_tags( get_the_content( null, false, $post_id ), true ),
		];

		// Add featured image if available.
		$featured_image_id = get_post_thumbnail_id( $post_id );
		if ( $featured_image_id ) {
			$image_url = wp_get_attachment_image_url( $featured_image_id, 'large' );
			if ( $image_url ) {
				$article_data['media'] = [
					'type' => 'image',
					'url'  => $image_url,
				];
			}
		}

		// Add categories as tags.
		$categories = get_the_category( $post_id );
		if ( $categories ) {
			$article_data['tags'] = array_map(
				function( $cat ) {
					return $cat->name;
				},
				$categories
			);
		}

		/**
		 * Filter article data before sending to Nextdoor.
		 *
		 * @param array $article_data Article data.
		 * @param int   $post_id      Post ID.
		 */
		return apply_filters( 'newspack_nextdoor_article_data', $article_data, $post_id );
	}

	/**
	 * Check if post is shared to Nextdoor.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	public static function is_post_shared( $post_id ) {
		return ! empty( get_post_meta( $post_id, '_nextdoor_guid', true ) );
	}

	/**
	 * Get post Nextdoor sharing status.
	 *
	 * @param int $post_id Post ID.
	 * @return array
	 */
	public static function get_post_sharing_status( $post_id ) {
		$guid       = get_post_meta( $post_id, '_nextdoor_guid', true );
		$shared_at  = get_post_meta( $post_id, '_nextdoor_shared_at', true );
		$updated_at = get_post_meta( $post_id, '_nextdoor_updated_at', true );

		$post = get_post( $post_id );
		$is_published = $post && $post->post_status === 'publish';

		return [
			'is_shared'     => ! empty( $guid ),
			'guid'          => $guid,
			'shared_at'     => $shared_at,
			'updated_at'    => $updated_at,
			'is_published'  => $is_published,
			'last_modified' => $post ? get_the_modified_date( 'c', $post_id ) : null,
			'needs_update'  => ! empty( $guid ) && ! empty( $shared_at ) && ! empty( $updated_at ) && 
								$post && strtotime( get_the_modified_date( 'Y-m-d H:i:s', $post_id ) ) > strtotime( $updated_at ),
		];
	}
}

Settings::instance();

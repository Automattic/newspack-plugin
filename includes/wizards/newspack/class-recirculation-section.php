<?php
/**
 * Newspack > Settings > Display Settings Section Object.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

/**
 * WordPress dependencies
 */

use Newspack\Configuration_Managers;
use WP_Error, WP_REST_Server;

/**
 * Internal dependencies
 */
use Newspack\Wizards\Wizard_Section;

/**
 * Custom Events Section Object.
 *
 * @package Newspack\Wizards\Newspack
 */
class Recirculation_Section extends Wizard_Section {

	/**
	 * The name of the option for Related Posts max age.
	 *
	 * @var string
	 */
	protected $related_posts_option = 'newspack_related_posts_max_age';
	
	/**
	 * Register Wizard Section specific endpoints.
	 *
	 * @return void 
	 */
	public function register_rest_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/related-content',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_related_content_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/related-posts-max-age',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_related_posts_max_age' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'sanitize_callback'   => 'sanitize_text_field',
			]
		);
	}

	/**
	 * Get the Jetpack connection settings.
	 *
	 * @return WP_REST_Response with the info.
	 */
	public function api_get_related_content_settings() {
		$jetpack_configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'jetpack' );
		return rest_ensure_response(
			[
				'relatedPostsEnabled' => $jetpack_configuration_manager->is_related_posts_enabled(),
				'relatedPostsMaxAge'  => get_option( $this->related_posts_option, 0 ),
			]
		);
	}
}

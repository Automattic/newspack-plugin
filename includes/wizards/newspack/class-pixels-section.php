<?php
/**
 * Custom Events Section Object.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

/**
 * WordPress dependencies
 */

use Newspack\Meta_Pixel;
use Newspack\Twitter_Pixel;
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
class Pixels_Section extends Wizard_Section {

	/**
	 * Register Wizard Section specific endpoints.
	 *
	 * @return void 
	 */
	public function register_rest_routes() {
		$meta_pixel = new Meta_Pixel();
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->parent_tab_slug . '/social/meta_pixel',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $meta_pixel, 'api_get' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
				],
				[
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => [ $meta_pixel, 'api_save' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
					'args'                => [
						'active'   => [
							'type'              => 'boolean',
							'required'          => true,
							'validate_callback' => [ $meta_pixel, 'validate_active' ],
						],
						'pixel_id' => [
							'type'              => [ 'integer', 'string' ],
							'required'          => true,
							'validate_callback' => [ $meta_pixel, 'validate_pixel_id' ],
						],
					],
				],
			]
		);

		$twitter_pixel = new Twitter_Pixel();
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->parent_tab_slug . '/social/twitter_pixel',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $twitter_pixel, 'api_get' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
				],
				[
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => [ $twitter_pixel, 'api_save' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
					'args'                => [
						'active'   => [
							'type'              => 'boolean',
							'required'          => true,
							'validate_callback' => [ $twitter_pixel, 'validate_active' ],
						],
						'pixel_id' => [
							'type'              => [ 'integer', 'string' ],
							'required'          => true,
							'validate_callback' => [ $twitter_pixel, 'validate_pixel_id' ],
						],
					],
				],
			]
		);
	}
}

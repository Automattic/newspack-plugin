<?php
/**
 * Newspack > Settings > Advanced Settings > Primary Category Section.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Primary_Category;
use Newspack\Wizards\Wizard_Section;

defined( 'ABSPATH' ) || exit;

/**
 * Primary Category settings section.
 */
class Primary_Category_Section extends Wizard_Section {

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/primary-category',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/primary-category',
			[
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);
	}

	/**
	 * Get primary category settings.
	 *
	 * @return \WP_REST_Response
	 */
	public function api_get_settings() {
		return rest_ensure_response(
			[
				'enabled'      => Primary_Category::is_enabled(),
				'yoast_active' => Primary_Category::is_yoast_active(),
			]
		);
	}

	/**
	 * Update primary category settings.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function api_update_settings( $request ) {
		$params = $request->get_params();

		if ( isset( $params['enabled'] ) ) {
			update_option( Primary_Category::OPTION_NAME, (bool) $params['enabled'] );
		}

		return rest_ensure_response(
			[
				'enabled'      => Primary_Category::is_enabled(),
				'yoast_active' => Primary_Category::is_yoast_active(),
			]
		);
	}
}

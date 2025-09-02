<?php
/**
 * Nextdoor Section Object.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

/**
 * WordPress dependencies
 */
use WP_REST_Server;
use WP_Error;

/**
 * Internal dependencies
 */
use Newspack\Optional_Modules;
use Newspack\Nextdoor as Nextdoor_Module;
use Newspack\Wizards\Wizard_Section;

/**
 * Nextdoor Section Object.
 *
 * @package Newspack\Wizards\Newspack
 */
class Nextdoor_Section extends Wizard_Section {

	/**
	 * Containing wizard slug.
	 *
	 * @var string
	 */
	protected $wizard_slug = 'newspack-settings';

	/**
	 * Register Wizard Section specific endpoints.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		// Nextdoor module toggle endpoint.
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/social/nextdoor',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ $this, 'api_get_nextdoor_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
			]
		);

		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/social/nextdoor',
			[
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => [ $this, 'api_update_nextdoor_settings' ],
				'permission_callback' => [ $this, 'api_permissions_check' ],
				'args'                => [
					'module_enabled_nextdoor' => [
						'required'          => true,
						'sanitize_callback' => 'rest_sanitize_boolean',
					],
				],
			]
		);
	}

	/**
	 * Get Nextdoor settings via API.
	 *
	 * @return WP_REST_Response
	 */
	public function api_get_nextdoor_settings() {
		$is_enabled        = Optional_Modules::is_optional_module_active( 'nextdoor' );
		$is_connected      = false;
		$connection_status = [];

		if ( $is_enabled ) {
			$is_connected = Nextdoor_Module::is_connected();
			$settings     = Nextdoor_Module::get_settings();

			$connection_status = [
				'is_connected'    => $is_connected,
				'has_credentials' => ! empty( $settings['client_id'] ) && ! empty( $settings['client_secret'] ),
				'has_tokens'      => ! empty( $settings['access_token'] ),
				'has_page'        => ! empty( $settings['page_id'] ),
				'publication_url' => $settings['publication_url'] ?? '',
				'allowed_roles'   => $settings['allowed_roles'] ?? [],
			];
		}

		return rest_ensure_response(
			[
				'module_enabled_nextdoor' => $is_enabled,
				'is_connected'            => $is_connected,
				'connection_status'       => $connection_status,
			]
		);
	}

	/**
	 * Update Nextdoor settings via API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function api_update_nextdoor_settings( $request ) {
		$module_enabled = $request->get_param( 'module_enabled_nextdoor' );

		if ( $module_enabled ) {
			$settings = Optional_Modules::activate_optional_module( 'nextdoor' );
		} else {
			$settings = Optional_Modules::deactivate_optional_module( 'nextdoor' );
		}

		if ( ! $settings ) {
			return new WP_Error(
				'newspack_nextdoor_module_update_failed',
				__( 'Failed to update Nextdoor module settings.', 'newspack-plugin' ),
				[ 'status' => 500 ]
			);
		}

		return $this->api_get_nextdoor_settings();
	}
}

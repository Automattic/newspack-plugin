<?php
/**
 * Collections Section Object.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use Newspack\Optional_Modules;
use Newspack\Optional_Modules\Collections;
use Newspack\Collections\Settings;
use Newspack\Wizards\Wizard_Section;
use WP_REST_Server;

/**
 * Collections Section Object.
 *
 * @package Newspack\Wizards\Newspack
 */
class Collections_Section extends Wizard_Section {
	/**
	 * Containing wizard slug.
	 *
	 * @var string
	 */
	protected $wizard_slug = 'newspack-settings';

	/**
	 * Register Wizard Section specific endpoints.
	 */
	public function register_rest_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/' . Collections::MODULE_NAME,
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ __CLASS__, 'api_get_settings' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ __CLASS__, 'api_update_settings' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
					'args'                => self::get_collection_fields_args(),
				],
			]
		);
	}

	/**
	 * Get REST API args for collection fields (including module enabled).
	 *
	 * @return array REST API args.
	 */
	private static function get_collection_fields_args() {
		$collection_args = Settings::get_rest_args();
		$module_args     = [
			Optional_Modules::MODULE_ENABLED_PREFIX . Collections::MODULE_NAME => [
				'required'          => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			],
		];

		return array_merge( $module_args, $collection_args );
	}

	/**
	 * Get settings.
	 *
	 * @return array Collections settings.
	 */
	public static function api_get_settings() {
		$settings            = Optional_Modules::get_settings();
		$collection_settings = Settings::get_settings();

		return array_merge( $settings, $collection_settings );
	}

	/**
	 * Update collections settings.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array Updated collections settings.
	 */
	public static function api_update_settings( $request ) {
		$settings = Optional_Modules::get_settings();

		// Update the optional module enabled setting.
		if ( $request->has_param( Optional_Modules::MODULE_ENABLED_PREFIX . Collections::MODULE_NAME ) ) {
			$is_enabled = $request->get_param( Optional_Modules::MODULE_ENABLED_PREFIX . Collections::MODULE_NAME );
			if ( $is_enabled ) {
				$settings = Optional_Modules::activate_optional_module( Collections::MODULE_NAME );
			} else {
				$settings = Optional_Modules::deactivate_optional_module( Collections::MODULE_NAME );
			}
		}

		// Update collection settings.
		$collection_settings = Settings::update_from_request( $request );

		return array_merge( $settings, $collection_settings );
	}
}

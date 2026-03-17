<?php
/**
 * Newspack's Privacy Section.
 *
 * @package Newspack
 */

namespace Newspack\Wizards\Newspack;

use WP_REST_Server;
use Newspack\Wizards\Wizard_Section;

defined( 'ABSPATH' ) || exit;

/**
 * Privacy Section Class.
 */
class Privacy_Section extends Wizard_Section {

	/**
	 * Containing wizard slug.
	 *
	 * @var string
	 */
	protected $wizard_slug = 'newspack-settings';

	const OPTION_PREFIX = 'newspack_privacy_';

	/**
	 * Register the endpoints needed for the wizard screens.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			NEWSPACK_API_NAMESPACE,
			'/wizard/' . $this->wizard_slug . '/privacy',
			[
				[
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => [ $this, 'api_get' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
				],
				[
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => [ $this, 'api_update' ],
					'permission_callback' => [ $this, 'api_permissions_check' ],
					'args'                => [
						'block_ads_before_consent'                  => [
							'type'              => 'boolean',
							'sanitize_callback' => 'rest_sanitize_boolean',
						],
						'block_third_party_trackers_before_consent' => [
							'type'              => 'boolean',
							'sanitize_callback' => 'rest_sanitize_boolean',
						],
						'force_cookie_blocker'                      => [
							'type'              => 'boolean',
							'sanitize_callback' => 'rest_sanitize_boolean',
						],
					],
				],
			]
		);
	}

	/**
	 * Get privacy settings.
	 *
	 * @return array
	 */
	public static function get_settings() {
		return [
			'block_ads_before_consent'                  => (bool) get_option( self::OPTION_PREFIX . 'block_ads_before_consent', false ),
			'block_third_party_trackers_before_consent' => (bool) get_option( self::OPTION_PREFIX . 'block_third_party_trackers_before_consent', false ),
			'force_cookie_blocker'                      => (bool) get_option( self::OPTION_PREFIX . 'force_cookie_blocker', false ),
		];
	}

	/**
	 * API: get privacy settings.
	 *
	 * @return \WP_REST_Response
	 */
	public function api_get() {
		return rest_ensure_response( self::get_settings() );
	}

	/**
	 * API: update privacy settings.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response
	 */
	public function api_update( $request ) {
		if ( isset( $request['block_ads_before_consent'] ) ) {
			update_option( self::OPTION_PREFIX . 'block_ads_before_consent', (bool) $request['block_ads_before_consent'] );
		}
		if ( isset( $request['block_third_party_trackers_before_consent'] ) ) {
			update_option( self::OPTION_PREFIX . 'block_third_party_trackers_before_consent', (bool) $request['block_third_party_trackers_before_consent'] );
		}
		if ( isset( $request['force_cookie_blocker'] ) ) {
			update_option( self::OPTION_PREFIX . 'force_cookie_blocker', (bool) $request['force_cookie_blocker'] );
		}
		return rest_ensure_response( self::get_settings() );
	}
}

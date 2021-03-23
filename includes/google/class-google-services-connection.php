<?php
/**
 * Connection to Google services.
 *
 * @package Newspack
 */

namespace Newspack;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Modules\Analytics as SiteKitAnalytics;
use Google\Auth\Credentials\UserRefreshCredentials;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Google_Services_Connection {
	/**
	 * Get Site Kit's authentication.
	 *
	 * @return Authentication Site Kit's authentication.
	 */
	public static function get_authentication() {
		if ( defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
			$authentication = new Authentication( $context, new Options( $context ), new User_Options( $context ) );
			return $authentication;
		} else {
			return new WP_Error( 'newspack_sitekit_disconnectedt', __( 'Connect Site Kit plugin to view Campaign Analytics.', 'newspack' ) );
		}
	}

	/**
	 * Get OAuth2 client.
	 * More at https://googleapis.github.io/google-auth-library-php/master/Google/Auth/OAuth2.html.
	 *
	 * @return object Google OAuth2 client.
	 */
	public static function get_oauth_client() {
		return self::get_authentication()->get_oauth_client();
	}

	/**
	 * Get Site Kit's Analytics module.
	 *
	 * @return object Google OAuth2 client.
	 */
	public static function get_site_kit_analytics_module() {
		if ( defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
			return new SiteKitAnalytics( $context );
		}
	}

	public static function get_oauth2_credentials() {
		$client         = self::get_oauth_client();
		$oauth2_service = $client->get_client()->getOAuth2Service();
		return new UserRefreshCredentials(
			null,
			[
				'client_id'     => $oauth2_service->getClientId(),
				'client_secret' => $oauth2_service->getClientSecret(),
				'refresh_token' => $client->get_refresh_token(),
			]
		);
	}
}

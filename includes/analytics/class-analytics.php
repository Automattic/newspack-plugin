<?php
/**
 * Newspack Analytics features.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Manages Analytics integrations.
 */
class Analytics {
	/**
	 * An integer to indicate the context a block is rendered in, e.g. content|overlay campaign|inline campaign.
	 *
	 * @var integer
	 */
	public static $block_render_context = 3;

	/**
	 * Constructor
	 */
	public function __construct() {
		add_filter( 'googlesitekit_gtag_opt', [ __CLASS__, 'set_extra_analytics_config_options' ] );
	}

	/**
	 * Filter the Google Analytics config options via Site Kit.
	 * Allows us to update or set additional config options for GA.
	 *
	 * @param array $gtag_opt gtag config options.
	 *
	 * @return array Filtered config options.
	 */
	public static function set_extra_analytics_config_options( $gtag_opt ) {
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return $gtag_opt;
		}

		if ( ! self::can_use_site_kits_analytics() ) {
			return $gtag_opt;
		}

		// Set transport type to 'beacon' to allow async requests to complete after a new page is loaded.
		// See: https://developers.google.com/analytics/devguides/collection/gtagjs/sending-data#specify_different_transport_mechanisms.
		$gtag_opt['transport_type'] = 'beacon';

		return $gtag_opt;
	}

	/**
	 * Can we rely on Site Kit's Analytics module?
	 */
	public static function can_use_site_kits_analytics() {
		if ( ! class_exists( '\Google\Site_Kit\Modules\Analytics\Settings' ) ) {
			return false;
		}
		$sitekit_manager     = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'google-site-kit' );
		$sitekit_ga_settings = get_option( \Google\Site_Kit\Modules\Analytics\Settings::OPTION, false );
		return (bool) $sitekit_manager->is_module_active( 'analytics' ) && $sitekit_ga_settings['canUseSnippet'];
	}
}
new Analytics();

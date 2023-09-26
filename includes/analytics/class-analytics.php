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
		// Set transport type to 'beacon' to allow async requests to complete after a new page is loaded.
		// See: https://developers.google.com/analytics/devguides/collection/gtagjs/sending-data#specify_different_transport_mechanisms.
		$gtag_opt['transport_type'] = 'beacon';

		return $gtag_opt;
	}
}
new Analytics();

<?php
/**
 * Enhancements and improvements to third-party plugins for AMP compatibility.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Tweaks third-party plugins for better AMP compatibility.
 * When possible it's preferred to contribute AMP fixes downstream to the actual plugin.
 */
class AMP_Enhancements {
	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		// Use local storage instead of an ajax endpoint with WP GDPR Cookie Notice.
		add_filter( 'wp_gdpr_cookie_notice_amp_use_endpoint', '__return_false' );
		add_filter(
			'googlesitekit_amp_gtag_opt',
			function ( $gtag_opt ) {
				foreach ( $gtag_opt['vars']['config'] as &$config ) {
					unset( $config['linker']['domains'] );
				}
				return $gtag_opt;
			}
		);
		add_filter( 'should_use_amp_plus', [ __CLASS__, 'amp_plus_mode' ] );
		add_filter( 'amp_content_sanitizers', [ __CLASS__, 'amp_content_sanitizers' ] );
	}

	/**
	 * AMP plus mode.
	 *
	 * @param  string $context The context for which AMP plus should be assessed.
	 * @return bool Should AMP plus be applied.
	 */
	public static function amp_plus_mode( $context = null ) {
		if ( ! defined( 'NEWSPACK_AMP_PLUS_CONFIG' ) ) {
			return false;
		}
		$config = (array) NEWSPACK_AMP_PLUS_CONFIG;
		return in_array( $context, $config );
	}

	/**
	 * Allow certain scripts to be included in AMP pages.
	 *
	 * @param array $sanitizers The array of sanitizers, 'MyClassName' => [] // array of constructor params for class.
	 */
	public static function amp_content_sanitizers( $sanitizers ) {
		if ( self::amp_plus_mode( 'gam' ) ) {
			require_once NEWSPACK_ABSPATH . 'includes/amp-sanitizers/class-amp-sanitizer-gam.php';
			$sanitizers['AMP_Sanitizer_GAM'] = [];
		}
		return $sanitizers;
	}
}
AMP_Enhancements::init();

<?php
/**
 * Enhancements and improvements to third-party plugins for AMP compatibility.
 *
 * @package Newspack
 */

namespace Newspack;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Optimize;


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
		add_filter( 'amp_content_sanitizers', [ __CLASS__, 'amp_content_sanitizers' ] );
		if ( self::should_use_amp_plus( 'googleoptimize' ) ) {
			add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_amp_plus_googleoptimize_scripts' ] );
		}
	}

	/**
	 * Enqueue Google Optimize script if needed
	 *
	 * @return void
	 */
	public static function enqueue_amp_plus_googleoptimize_scripts() {
		if ( ! defined( 'GOOGLESITEKIT_PLUGIN_MAIN_FILE' ) ) {
			return;
		}
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$go      = new Optimize( $context );
		if ( $go->is_connected() ) {
			$info   = $go->prepare_info_for_js();
			$id     = $info['settings']['optimizeID'];
			$script = sprintf( 'https://www.googleoptimize.com/optimize.js?id=%s', $id );
			wp_enqueue_script( 'googleoptimize', $script, false, '1', true );
		}
	}

	/**
	 * AMP plus mode.
	 *
	 * @param  string $context The context for which AMP plus should be assessed.
	 * @return bool Should AMP plus be applied.
	 */
	public static function should_use_amp_plus( $context = null ) {
		$should = false;
		if ( isset( $_GET['ampplus'] ) && defined( 'NEWSPACK_AMP_PLUS_CONFIG' ) && is_array( NEWSPACK_AMP_PLUS_CONFIG ) && in_array( $context, NEWSPACK_AMP_PLUS_CONFIG ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$should = true;
		}
		return apply_filters( 'should_use_amp_plus', $should, $context );
	}

	/**
	 * Allow certain scripts to be included in AMP pages.
	 *
	 * @param array $sanitizers The array of sanitizers, 'MyClassName' => [] // array of constructor params for class.
	 */
	public static function amp_content_sanitizers( $sanitizers ) {
		if ( self::should_use_amp_plus( 'gam' ) ) {
			require_once NEWSPACK_ABSPATH . 'includes/amp-sanitizers/class-amp-sanitizer-gam.php';
			$sanitizers['AMP_Sanitizer_GAM'] = [];
		}
		if ( self::should_use_amp_plus( 'googleoptimize' ) ) {
			require_once NEWSPACK_ABSPATH . 'includes/amp-sanitizers/class-amp-sanitizer-google-optimize.php';
			$sanitizers['AMP_Sanitizer_Google_Optimize'] = [];
		}
		return $sanitizers;
	}
}
AMP_Enhancements::init();

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

		// Check if AMP Plugin is in Standard mode.
		// In Transitional/Reader modes, AMP pages with kept invalid markup get redirected to the non-AMP version, which is not desired.
		if ( function_exists( 'amp_is_canonical' ) && amp_is_canonical() ) {
			add_filter( 'amp_validation_error_sanitized', [ __CLASS__, 'amp_validation_error_sanitized' ], 10, 2 );
			add_filter( 'amp_validation_error_default_sanitized', [ __CLASS__, 'amp_validation_error_sanitized' ], 10, 2 );
		}
	}

	/**
	 * AMP plus mode.
	 *
	 * @return bool Should AMP plus be applied.
	 */
	public static function should_use_amp_plus() {
		$should = false;
		if ( self::is_amp_plus_configured() ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$should = true;
		}
		// Check if AMP Plugin is in Standard mode.
		// In Transitional/Reader modes, AMP pages with kept invalid markup get redirected to the non-AMP version, which is not desired.
		if ( function_exists( 'amp_is_canonical' ) && false === amp_is_canonical() ) {
			$should = false;
		}
		return apply_filters( 'should_use_amp_plus', $should );
	}

	/**
	 * Is AMP plus mode configured.
	 *
	 * @return bool Is AMP plus mode configured.
	 */
	public static function is_amp_plus_configured() {
		return defined( 'NEWSPACK_AMP_PLUS_ENABLED' ) && NEWSPACK_AMP_PLUS_ENABLED;
	}

	/**
	 * Sanitize AMP Plugin errors to reject some errors.
	 *
	 * @param bool|null $is_sanitized If null, the error will be handled. If false, rejected.
	 * @param object    $error The AMP sanitisation error.
	 */
	public static function amp_validation_error_sanitized( $is_sanitized, $error ) {
		if ( false === self::should_use_amp_plus() ) {
			return $is_sanitized;
		}
		// Explicitly allowed scripts - with a 'data-amp-plus-allowed' attribute.
		if ( isset( $error, $error['node_attributes'], $error['node_attributes']['data-amp-plus-allowed'] ) ) {
			return false;
		}
		return $is_sanitized;
	}
}
AMP_Enhancements::init();

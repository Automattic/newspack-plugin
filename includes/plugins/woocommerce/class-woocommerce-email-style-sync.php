<?php
/**
 * Sync site brand styles into WooCommerce classic email template options.
 *
 * Writes the site's primary color and logo into WC's classic email options
 * on first run, then keeps them in sync when theme colors change.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Email Style Sync class.
 */
class WooCommerce_Email_Style_Sync {

	/**
	 * Option name to track the sync version.
	 *
	 * @var string
	 */
	const SYNCED_VERSION_OPTION = 'newspack_wc_email_style_sync_version';

	/**
	 * Current sync version. Bump this to re-trigger sync on all sites.
	 *
	 * @var string
	 */
	const CURRENT_VERSION = 'v1';

	/**
	 * Initialize hooks.
	 */
	public static function init(): void {
		// First-run sync on admin_init (after WC is loaded).
		add_action( 'admin_init', [ __CLASS__, 'maybe_sync_on_first_run' ] );

		// Re-sync when Customizer colors change or when themes are switched.
		// Using theme-agnostic hooks (not update_option_theme_mods_{theme})
		// so the hooks survive a theme switch.
		add_action( 'customize_save_after', [ __CLASS__, 'sync_styles' ] );
		add_action( 'after_switch_theme', [ __CLASS__, 'sync_styles' ] );
	}

	/**
	 * Run the sync if this is the first time (or the version has been bumped).
	 */
	public static function maybe_sync_on_first_run(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		if ( self::CURRENT_VERSION === get_option( self::SYNCED_VERSION_OPTION ) ) {
			return;
		}
		self::sync_styles();
		update_option( self::SYNCED_VERSION_OPTION, self::CURRENT_VERSION );
	}

	/**
	 * Write site brand colors and logo into WC classic email options.
	 */
	public static function sync_styles(): void {
		if ( ! class_exists( 'WooCommerce' ) ) {
			return;
		}
		$colors = self::get_site_colors();
		foreach ( $colors as $option_name => $value ) {
			update_option( $option_name, $value );
		}
		$logo_url = self::get_site_logo_url();
		update_option( 'woocommerce_email_header_image', $logo_url );
	}

	/**
	 * Get the site brand colors mapped to WC email options.
	 *
	 * Only syncs woocommerce_email_base_color (header background, links, accents).
	 * We intentionally do NOT sync:
	 * - woocommerce_email_text_color: the theme's primary_text_color is contrast-computed
	 *   against the primary brand color, not against white, so mapping it to body text
	 *   would break readability on sites with dark primaries.
	 * - woocommerce_email_background_color: WC's #f7f7f7 surround works across all palettes.
	 * - woocommerce_email_body_background_color: WC's #ffffff body works across all palettes.
	 *
	 * @return array<string, string> WC option name => color hex value.
	 */
	private static function get_site_colors(): array {
		if ( ! function_exists( 'newspack_get_theme_colors' ) ) {
			return [];
		}
		return [
			'woocommerce_email_base_color' => newspack_get_theme_colors()['primary_color'],
		];
	}

	/**
	 * Get the site logo URL for WC email header image.
	 *
	 * @return string Logo URL, or empty string if no logo is set.
	 */
	private static function get_site_logo_url(): string {
		$custom_logo_id = get_theme_mod( 'custom_logo' );
		if ( $custom_logo_id ) {
			$url = wp_get_attachment_url( $custom_logo_id );
			return $url ? $url : '';
		}
		return '';
	}
}
WooCommerce_Email_Style_Sync::init();

<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Generic.Files.OneObjectStructurePerFile.MultipleFound, Universal.Files.SeparateFunctionsFromOO.Mixed -- Test file defines stubs for CI environments without WooCommerce or Newspack themes.
/**
 * Tests WooCommerce_Email_Style_Sync.
 *
 * @package Newspack\Tests
 */

use Newspack\WooCommerce_Email_Style_Sync;

// Provide a stub for the theme function when a Newspack theme is not active.
if ( ! function_exists( 'newspack_get_theme_colors' ) ) {
	/**
	 * Stub: returns theme colors based on the primary_color_hex theme mod.
	 *
	 * @return array Theme colors array with at least 'primary_color'.
	 */
	function newspack_get_theme_colors() {
		$primary = get_theme_mod( 'primary_color_hex', '#003da5' );
		return [
			'primary_color' => $primary,
		];
	}
}

// Provide a minimal WooCommerce class stub so class_exists() guards pass.
if ( ! class_exists( 'WooCommerce' ) ) {
	/**
	 * Minimal WooCommerce stub for testing.
	 */
	class WooCommerce {}
}

/**
 * Tests WooCommerce_Email_Style_Sync.
 */
class Newspack_Test_WooCommerce_Email_Style_Sync extends WP_UnitTestCase {

	/**
	 * Clean up WC email options and sync version before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( WooCommerce_Email_Style_Sync::SYNCED_VERSION_OPTION );
		delete_option( 'woocommerce_email_base_color' );
		delete_option( 'woocommerce_email_header_image' );
		remove_theme_mod( 'custom_logo' );
		remove_theme_mod( 'primary_color_hex' );
	}

	/**
	 * Test first run syncs the primary color to woocommerce_email_base_color.
	 */
	public function test_first_run_syncs_colors() {
		set_theme_mod( 'primary_color_hex', '#ff5500' );

		WooCommerce_Email_Style_Sync::maybe_sync_on_first_run();

		$this->assertSame( '#ff5500', get_option( 'woocommerce_email_base_color' ) );
	}

	/**
	 * Test first run syncs the site logo to woocommerce_email_header_image.
	 */
	public function test_first_run_syncs_logo() {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/test-image.jpg' );
		set_theme_mod( 'custom_logo', $attachment_id );

		WooCommerce_Email_Style_Sync::maybe_sync_on_first_run();

		$expected_url = wp_get_attachment_url( $attachment_id );
		$this->assertSame( $expected_url, get_option( 'woocommerce_email_header_image' ) );
	}

	/**
	 * Test first run is skipped when the version option is already current.
	 */
	public function test_first_run_skips_when_already_synced() {
		update_option( WooCommerce_Email_Style_Sync::SYNCED_VERSION_OPTION, WooCommerce_Email_Style_Sync::CURRENT_VERSION );
		set_theme_mod( 'primary_color_hex', '#00cc00' );

		WooCommerce_Email_Style_Sync::maybe_sync_on_first_run();

		$this->assertFalse( get_option( 'woocommerce_email_base_color' ), 'woocommerce_email_base_color should not be set when sync is skipped.' );
	}

	/**
	 * Test sync_styles updates color when theme color changes.
	 */
	public function test_sync_updates_colors_on_theme_change() {
		set_theme_mod( 'primary_color_hex', '#aa0000' );
		WooCommerce_Email_Style_Sync::sync_styles();
		$this->assertSame( '#aa0000', get_option( 'woocommerce_email_base_color' ) );

		set_theme_mod( 'primary_color_hex', '#0000bb' );
		WooCommerce_Email_Style_Sync::sync_styles();
		$this->assertSame( '#0000bb', get_option( 'woocommerce_email_base_color' ) );
	}

	/**
	 * Test sync_styles sets empty header image when no logo is configured.
	 */
	public function test_no_logo_sets_empty_header_image() {
		WooCommerce_Email_Style_Sync::sync_styles();

		$this->assertSame( '', get_option( 'woocommerce_email_header_image' ) );
	}
}

<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName, Universal.Files.SeparateFunctionsFromOO.Mixed -- Test file defines a stub for CI environments without Newspack themes.
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

/**
 * Tests WooCommerce_Email_Style_Sync.
 *
 * NOTE: We do NOT stub the WooCommerce class here because it leaks into the
 * global scope and causes other test suites (e.g. Emails_Section) to think WC
 * is available. Instead we test the private helpers via Reflection.
 */
class Newspack_Test_WooCommerce_Email_Style_Sync extends WP_UnitTestCase {

	/**
	 * Hook name for the theme-mods action removed during set_up.
	 *
	 * @var string|null
	 */
	private $theme_mods_hook = null;

	/**
	 * Priority the theme-mods action was registered at, or false if it wasn't.
	 *
	 * @var int|false
	 */
	private $theme_mods_hook_priority = false;

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

		// Emails::maybe_update_email_templates fires on theme-mod changes and
		// calls Newspack_Newsletters::update_color_palette(), which is not
		// available in CI. Remove it so set_theme_mod() doesn't fatal — and
		// remember the priority so tear_down can restore it.
		$theme                          = wp_get_theme()->parent() ? get_stylesheet() : get_template();
		$this->theme_mods_hook          = 'update_option_theme_mods_' . $theme;
		$callback                       = [ \Newspack\Emails::class, 'maybe_update_email_templates' ];
		$this->theme_mods_hook_priority = has_action( $this->theme_mods_hook, $callback );
		if ( false !== $this->theme_mods_hook_priority ) {
			remove_action( $this->theme_mods_hook, $callback, $this->theme_mods_hook_priority );
		}
	}

	/**
	 * Restore the theme-mods action so global hook state doesn't leak to other suites.
	 */
	public function tear_down() {
		if ( $this->theme_mods_hook && false !== $this->theme_mods_hook_priority ) {
			add_action(
				$this->theme_mods_hook,
				[ \Newspack\Emails::class, 'maybe_update_email_templates' ],
				$this->theme_mods_hook_priority,
				2
			);
		}
		$this->theme_mods_hook          = null;
		$this->theme_mods_hook_priority = false;
		parent::tear_down();
	}

	/**
	 * Test get_site_colors returns the primary color mapped to the WC option name.
	 */
	public function test_get_site_colors_returns_primary() {
		set_theme_mod( 'primary_color_hex', '#ff5500' );

		$colors = self::invoke_private( 'get_site_colors' );

		$this->assertSame( '#ff5500', $colors['woocommerce_email_base_color'] );
	}

	/**
	 * Test get_site_logo_url returns the logo URL when custom_logo is set.
	 */
	public function test_get_site_logo_url_with_logo() {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/test-image.jpg' );
		set_theme_mod( 'custom_logo', $attachment_id );

		$url = self::invoke_private( 'get_site_logo_url' );

		$expected_url = wp_get_attachment_url( $attachment_id );
		$this->assertSame( $expected_url, $url );
	}

	/**
	 * Test get_site_colors reflects updated theme colors.
	 */
	public function test_colors_update_on_theme_change() {
		set_theme_mod( 'primary_color_hex', '#aa0000' );
		$colors = self::invoke_private( 'get_site_colors' );
		$this->assertSame( '#aa0000', $colors['woocommerce_email_base_color'] );

		set_theme_mod( 'primary_color_hex', '#0000bb' );
		$colors = self::invoke_private( 'get_site_colors' );
		$this->assertSame( '#0000bb', $colors['woocommerce_email_base_color'] );
	}

	/**
	 * Test get_site_logo_url returns empty string when no logo is configured.
	 */
	public function test_no_logo_returns_empty_string() {
		$url = self::invoke_private( 'get_site_logo_url' );

		$this->assertSame( '', $url );
	}

	/**
	 * Invoke a private static method on WooCommerce_Email_Style_Sync.
	 *
	 * @param string $method_name Method to invoke.
	 * @return mixed Return value of the method.
	 */
	private static function invoke_private( string $method_name ) {
		$method = new ReflectionMethod( WooCommerce_Email_Style_Sync::class, $method_name );
		$method->setAccessible( true );
		return $method->invoke( null );
	}
}

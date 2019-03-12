<?php
/**
 * Tests the plugin management functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Plugin_Manager;

/**
 * Test plugin management functionality.
 */
class Newspack_Test_Plugin_Manager extends WP_UnitTestCase {

	/**
	 * Plugin slug/folder.
	 *
	 * @var string
	 */
	protected $plugin_slug = 'hello-dolly';

	/**
	 * Plugin file path.
	 *
	 * @var string
	 */
	protected $plugin_file = 'hello-dolly/hello.php';

	/**
	 * URL to plugin download.
	 *
	 * @var string
	 */
	protected $plugin_url = 'https://downloads.wordpress.org/plugin/hello-dolly.1.6.zip';

	/**
	 * Compatibility checks and clean up.
	 */
	public function setUp() {
		// These tests can't run on environments where we can't install plugins e.g. VIP Go.
		if ( ! Plugin_Manager::can_install_plugins() ) {
			$this->markTestSkipped( 'Plugin installation is not allowed in the environment' );
		}

		// Clean up any lingering plugin installs that may exist from a previous test.
		Plugin_Manager::uninstall( $this->plugin_file );
	}

	/**
	 * Test the plugin-slug-from-URL parser.
	 */
	public function test_get_plugin_slug_from_url() {
		$this->assertEquals( 'hello-dolly', Plugin_Manager::get_plugin_slug_from_url( 'https://downloads.wordpress.org/plugin/hello-dolly.1.6.zip' ) );
		$this->assertEquals( 'hello-dolly', Plugin_Manager::get_plugin_slug_from_url( 'https://downloads.wordpress.org/plugin/hello-dolly.zip/' ) );
		$this->assertEquals( 'hello-dolly', Plugin_Manager::get_plugin_slug_from_url( 'https://downloads.wordpress.org/plugin/hello-dolly.zip?foo=blah&1' ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( 'https://downloads.wordpress.org/plugin/hello-dolly' ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( 'https://downloads.wordpress.org/plugin/hello-dolly.tar' ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( 'hello-dolly' ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( '' ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( true ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( new WP_Error() ) );
		$this->assertEquals( false, Plugin_Manager::get_plugin_slug_from_url( 20 ) );
	}

	/**
	 * Test that activating an uninstalled plugin from a slug will install and activate the plugin.
	 * Deactivating the plugin will not uninstall the plugin.
	 */
	public function test_activate_deactivate_wporg_uninstalled() {
		$this->assertFalse( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );

		$this->assertTrue( Plugin_Manager::activate( $this->plugin_slug ) );
		$this->assertTrue( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );
		$this->assertTrue( is_plugin_active( $this->plugin_file ) );

		$this->assertTrue( Plugin_manager::deactivate( $this->plugin_file ) );
		$this->assertTrue( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );
		$this->assertFalse( is_plugin_active( $this->plugin_file ) );
	}

	/**
	 * Test that activating an uninstalled plugin from an URL will install and activate the plugin.
	 * Deactivating the plugin will not uninstall the plugin.
	 */
	public function test_activate_deactivate_url_uninstalled() {
		$this->assertFalse( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );

		$this->assertTrue( Plugin_Manager::activate( $this->plugin_url ) );
		$this->assertTrue( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );
		$this->assertTrue( is_plugin_active( $this->plugin_file ) );

		$this->assertTrue( Plugin_manager::deactivate( $this->plugin_file ) );
		$this->assertTrue( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );
		$this->assertFalse( is_plugin_active( $this->plugin_file ) );
	}

	/**
	 * Test that activating/deactivating an installed plugin activates/deactivates the plugin.
	 */
	public function test_activate_deactivate_installed() {
		Plugin_Manager::install( $this->plugin_slug );

		$this->assertTrue( Plugin_Manager::activate( $this->plugin_slug ) );
		$this->assertTrue( is_plugin_active( $this->plugin_file ) );

		$this->assertTrue( Plugin_manager::deactivate( $this->plugin_file ) );
		$this->assertFalse( is_plugin_active( $this->plugin_file ) );

		$this->assertTrue( Plugin_Manager::activate( $this->plugin_url ) );
		$this->assertTrue( is_plugin_active( $this->plugin_file ) );
	}

	/**
	 * Test that plugins install/uninstall from WordPress.org by slug.
	 */
	public function test_plugin_install_uninstall_wporg() {
		$this->assertTrue( Plugin_Manager::install( $this->plugin_slug ) );
		$this->assertTrue( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );

		$this->assertTrue( Plugin_Manager::uninstall( $this->plugin_file ) );
		$this->assertFalse( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );
	}

	/**
	 * Test that plugins install/uninstall from a URL.
	 */
	public function test_plugin_install_uninstall_url() {
		$this->assertTrue( Plugin_Manager::install( $this->plugin_url ) );
		$this->assertTrue( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );

		$this->assertTrue( Plugin_Manager::uninstall( $this->plugin_file ) );
		$this->assertFalse( file_exists( WP_PLUGIN_DIR . '/' . $this->plugin_file ) );
	}
}

<?php
/**
 * Tests theme manager functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Theme_Manager;

/**
 * Test plugin API endpoints functionality.
 */
class Newspack_Test_Theme_Controller extends WP_UnitTestCase {
	/**
	 * Compatibility checks and clean up.
	 */
	public function setUp() {
		// These tests can't run on environments where we can't install themes e.g. VIP Go.
		if ( ! Theme_Manager::can_install_themes() ) {
			$this->markTestSkipped( 'Plugin installation is not allowed in the environment' );
		}
	}

	/**
	 * Test installing Newspack theme.
	 */
	public function test_install_activate_default() {
		$result = Theme_Manager::install_activate_theme();
		$this->assertTrue( $result );
		$this->assertEquals( 'newspack-theme', get_stylesheet() );
	}

	/**
	 * Test installing non-existent child theme.
	 */
	public function test_install_nonexistent_child_theme() {
		$previous_stylesheet = get_stylesheet();

		$result = Theme_Manager::install_activate_theme( 'newspack-fake' );
		$this->assertTrue( is_wp_error( $result ) );
		$this->assertEquals( $previous_stylesheet, get_stylesheet() );
	}

	/**
	 * Test installing Newspack Sacha child theme.
	 */
	public function test_install_activate_sacha() {
		$result = Theme_Manager::install_activate_theme( 'newspack-sacha' );
		$this->assertTrue( $result );
		$this->assertEquals( 'newspack-sacha', get_stylesheet() );
	}

	// TODO: Tests for five other themes after releases have been made.
}

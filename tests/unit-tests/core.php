<?php
/**
 * Tests the base/util Newspack functionality.
 *
 * @package Newspack\Tests
 */

/**
 * Test base/util functionality.
 */
class Newspack_Test_Newspack extends WP_UnitTestCase {

	/**
	 * Test that Newspack has been successfully loaded into the test suite.
	 */
	public function test_newspack_loaded() {
		$this->assertTrue( defined( 'NEWSPACK_VERSION' ) );
	}
}

<?php
/**
 * Tests for IP_Access_Rule utility methods.
 *
 * @package Newspack\Tests\Content_Gate
 */

use Newspack\Content_Gate\IP_Access_Rule;

/**
 * Test IP_Access_Rule functionality.
 *
 * @group Access_Rules
 */
class Newspack_Test_IP_Access_Rule extends WP_UnitTestCase {

	/**
	 * Test exact IP matching.
	 */
	public function test_exact_ip_match() {
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '10.0.0.5', '10.0.0.5' ) );
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '10.0.0.6', '10.0.0.5' ) );
	}

	/**
	 * Test CIDR block matching.
	 */
	public function test_cidr_match() {
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '192.168.1.50', '192.168.1.0/24' ) );
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '192.168.2.1', '192.168.1.0/24' ) );
	}

	/**
	 * Test comma-separated ranges.
	 */
	public function test_comma_separated_ranges() {
		$ranges = '10.0.0.5,192.168.1.0/24';
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '10.0.0.5', $ranges ) );
		$this->assertTrue( IP_Access_Rule::ip_matches_ranges( '192.168.1.100', $ranges ) );
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '172.16.0.1', $ranges ) );
	}

	/**
	 * Test that empty ranges string returns false.
	 */
	public function test_empty_ranges_returns_false() {
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '10.0.0.1', '' ) );
	}

	/**
	 * Test that an invalid CIDR entry is skipped and returns false.
	 */
	public function test_invalid_cidr_is_skipped() {
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( '10.0.0.1', '999.999.999.999/24' ) );
	}

	/**
	 * Test that an invalid IP address returns false.
	 */
	public function test_invalid_ip_returns_false() {
		$this->assertFalse( IP_Access_Rule::ip_matches_ranges( 'not-an-ip', '10.0.0.0/8' ) );
	}
}

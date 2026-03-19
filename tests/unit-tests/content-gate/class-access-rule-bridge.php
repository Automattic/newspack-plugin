<?php
/**
 * Tests the Access Rule Bridge.
 *
 * @package Newspack\Tests
 */

use Newspack\Access_Rule_Bridge;
use Newspack\Access_Rules;
use Newspack\Content_Gate_Abilities;

/**
 * Test Access Rule Bridge.
 *
 * @group Content_Gate_Abilities
 */
class Newspack_Test_Access_Rule_Bridge extends WP_UnitTestCase {

	/**
	 * Test that built-in rules are not duplicated after bridging.
	 */
	public function test_builtin_rules_not_duplicated() {
		if ( ! Content_Gate_Abilities::is_available() ) {
			$this->markTestSkipped( 'Abilities API is not available.' );
		}

		$rules_before = Access_Rules::get_registered_rules();

		Access_Rule_Bridge::bridge_discovered_rules();

		$rules_after = Access_Rules::get_registered_rules();

		// Built-in rules must still be present.
		$this->assertArrayHasKey( 'subscription', $rules_after );
		$this->assertArrayHasKey( 'email_domain', $rules_after );
		$this->assertArrayHasKey( 'reader_data', $rules_after );

		// No new rules should be added for the built-ins (they have meta.rule_id matching existing rules).
		$this->assertSame( count( $rules_before ), count( $rules_after ) );
	}
}

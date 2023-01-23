<?php
/**
 * Tests the GA 4 connector.
 *
 * @package Newspack\Tests
 */

use Newspack\Data_Events\Connectors\GA4\Event;

/**
 * Tests the GA 4 connector.
 */
class Newspack_Test_GA4_Connector extends WP_UnitTestCase {

	/**
	 * Data provider for test_validate_name
	 */
	public function validate_name_data() {
		return [
			[
				'asd123',
				true,
			],
			[
				'asd_123',
				true,
			],
			[
				'123_asd',
				true,
			],
			[
				'_asd123',
				false,
			],
			[
				'asd 123',
				false,
			],
			'40 chars' => [
				'iiiiiiiiiOiiiiiiiiiOiiiiiiiiiOiiiiiiiiiO',
				true,
			],
			'41 chars' => [
				'iiiiiiiiiOiiiiiiiiiOiiiiiiiiiOiiiiiiiiiOi',
				false,
			],
			[
				'asd123#',
				false,
			],
		];
	}

	/**
	 * Tests the validate_name method
	 *
	 * @param string $name The event name.
	 * @param bool   $expected The expected result.
	 * @dataProvider validate_name_data
	 */
	public function test_validate_name( $name, $expected ) {
		$this->assertEquals( $expected, Event::validate_name( $name ) );
	}

	/**
	 * Ensures validate_name dont accept special chars
	 */
	public function test_validate_name_special_chars() {
		$special_chars = [
			'!',
			'@',
			'#',
			'$',
			'%',
			'^',
			'&',
			'*',
			'(',
			')',
			'-',
			'=',
			'+',
			'[',
			']',
			'{',
			'}',
			'\\',
			'|',
			';',
			':',
			'"',
			"'",
			'<',
			'>',
			',',
			'.',
			'/',
			'?',
			'~',
			'`',
		];
		foreach ( $special_chars as $char ) {
			$this->assertFalse( Event::validate_name( 'asd123' . $char ) );
		}
	}
}

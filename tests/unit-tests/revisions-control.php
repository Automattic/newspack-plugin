<?php
/**
 * Tests the Revisions Control Newspack functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Revisions_Control;

/**
 * Test Revisions Control functionality.
 */
class Newspack_Test_Revisions_Control extends WP_UnitTestCase {

	/**
	 * Clean up
	 *
	 * @return void
	 */
	public function tear_down() {
		delete_option( 'newspack_revisions_control' );
	}

	/**
	 * Data provider for test_get_option
	 *
	 * @return array
	 */
	public function get_option_data() {
		$valid_value = [
			'active'  => true,
			'number'  => 3,
			'min_age' => '-1 week',
		];
		return [
			'no option'            => [
				null,
				[],
			],
			'invalid option'       => [
				'asdsad',
				[],
			],
			'invalid array option' => [
				[
					'active'  => 123,
					'invalid' => true,
				],
				[],
			],
			'valid'                => [
				$valid_value,
				$valid_value,
			],
		];
	}
	/**
	 * Tests the get_option method
	 *
	 * @param mixed $option_value The value to be present in the database.
	 * @param array $expected The expected value.
	 * @return void
	 * @dataProvider get_option_data
	 */
	public function test_get_option( $option_value, $expected ) {
		update_option( 'newspack_revisions_control', $option_value );
		$this->assertSame( $expected, Revisions_Control::get_option() );
	}
}

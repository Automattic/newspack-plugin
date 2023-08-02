<?php
/**
 * Tests the GA 4 connector.
 *
 * @package Newspack\Tests
 */

use Newspack\Data_Events\Connectors\GA4\Event;
use Newspack\Data_Events\Connectors\GA4;

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
				false,
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

	/**
	 * Data provider for test_validate_param_name
	 */
	public function validate_param_value_data() {
		return [
			[
				'dsl2390ijd2m, #asd',
				true,
			],
			[
				123123232,
				true,
			],
			[
				'iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0',
				true,
			],
			[
				'iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0i',
				true,
			],
			[
				[ 123 ],
				false,
			],
			[
				(object) [ 'asd' => 123 ],
				false,
			],
			[
				true,
				true,
			],
			[
				null,
				true,
			],
			[
				1.234,
				true,
			],
		];
	}

	/**
	 * Tests the validate_param_value method
	 *
	 * @param string $value The param value.
	 * @param bool   $expected The expected result.
	 * @dataProvider validate_param_value_data
	 */
	public function test_validate_param_value( $value, $expected ) {
		$this->assertEquals( $expected, Event::validate_param_value( $value ) );
	}

	/**
	 * Data provider for test_validate_param_name
	 */
	public function sanitize_value_data() {
		return [
			[
				'dsl2390ijd2m, #asd',
				'dsl2390ijd2m, #asd',
			],
			[
				123123232,
				'123123232',
			],
			[
				'iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0i',
				'iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0iiiiiiiii0',
			],
			[
				[ 123 ],
				[ 123 ],
			],
			[
				(object) [ 'asd' => 123 ],
				(object) [ 'asd' => 123 ],
			],
			[
				true,
				'yes',
			],
			[
				false,
				'no',
			],
			[
				null,
				'',
			],
			[
				1.234,
				'1.234',
			],
		];
	}

	/**
	 * Tests the sanitize_value method
	 *
	 * @param mixed $value The param value.
	 * @param mixed $expected The expected result.
	 * @dataProvider sanitize_value_data
	 */
	public function test_sanitize_value( $value, $expected ) {
		$this->assertEquals( $expected, Event::sanitize_value( $value ) );
	}

	/**
	 * Tests the validate_params method
	 *
	 * @param array $params The parameters array.
	 * @param bool  $expected The expected result.
	 * @dataProvider validate_params_data
	 */
	public function test_validate_params( $params, $expected ) {
		$this->assertEquals( $expected, Event::validate_params( $params ) );
	}

	/**
	 * Data provider for test_validate_params
	 */
	public function validate_params_data() {
		return [
			[
				[
					'param1' => 'value1',
					'param2' => 'value2',
					'param3' => 'value3',
					'param4' => 'value4',
				],
				true,
			],
			[
				[
					'invalid' => [ 123 ],
					'param2'  => 'value2',
					'param3'  => 'value3',
					'param4'  => 'value4',
				],
				false,
			],
			[
				[
					'_invalid' => 'value1',
					'param2'   => 'value2',
					'param3'   => 'value3',
					'param4'   => 'value4',
				],
				false,
			],
			[
				[
					'param1'  => 'value1',
					'param2'  => 'value2',
					'param3'  => 'value3',
					'param4'  => 'value4',
					'param5'  => 'value5',
					'param6'  => 'value6',
					'param7'  => 'value7',
					'param8'  => 'value8',
					'param9'  => 'value9',
					'param10' => 'value10',
					'param11' => 'value11',
					'param12' => 'value12',
					'param13' => 'value13',
					'param14' => 'value14',
					'param15' => 'value15',
					'param16' => 'value16',
					'param17' => 'value17',
					'param18' => 'value18',
					'param19' => 'value19',
					'param20' => 'value20',
					'param21' => 'value21',
					'param22' => 'value22',
					'param23' => 'value23',
					'param24' => 'value24',
					'param25' => 'value25',
					'param26' => 'value26',
				],
				false,
			],
			[
				[
					'param1'  => 'value1',
					'param2'  => 'value2',
					'param3'  => 'value3',
					'param4'  => 'value4',
					'param5'  => 'value5',
					'param6'  => 'value6',
					'param7'  => 'value7',
					'param8'  => 'value8',
					'param9'  => 'value9',
					'param10' => 'value10',
					'param11' => 'value11',
					'param12' => 'value12',
					'param13' => 'value13',
					'param14' => 'value14',
					'param15' => 'value15',
					'param16' => 'value16',
					'param17' => 'value17',
					'param18' => 'value18',
					'param19' => 'value19',
					'param20' => 'value20',
					'param21' => 'value21',
					'param22' => 'value22',
					'param23' => 'value23',
					'param24' => 'value24',
					'param25' => 'value25',
				],
				true,
			],
		];
	}

	/**
	 * Data provider for test_validate_param_name
	 */
	public function get_donation_amount_range_data() {
		return [
			[
				12,
				'under-20',
			],
			[
				'zdxasd',
				'',
			],
			[
				0,
				'',
			],
			[
				'53.12',
				'51-100',
			],
			[
				420,
				'201-500',
			],
			[
				200,
				'101-200',
			],
		];
	}

	/**
	 * Tests the sanitize_value method
	 *
	 * @param mixed $value The param value.
	 * @param mixed $expected The expected result.
	 * @dataProvider get_donation_amount_range_data
	 */
	public function test_get_donation_amount_range( $value, $expected ) {
		$this->assertEquals( $expected, GA4::get_donation_amount_range( $value ) );
	}

	/**
	 * Data provider for test_can_use_ga4
	 *
	 * @return array
	 */
	public function can_use_ga4_data() {
		return [
			'empty'          => [
				[],
				[],
				false,
			],
			'local'          => [
				[
					'secret' => 'local_secret',
					'id'     => 'local_id',
				],
				[],
				true,
			],
			'filter'         => [
				[],
				[
					'measurement_protocol_secret' => 'local_secret',
					'measurement_id'              => 'local_id',
				],
				true,
			],
			'both'           => [
				[
					'secret' => 'local_secret',
					'id'     => 'local_id',
				],
				[
					'measurement_protocol_secret' => 'local_secret',
					'measurement_id'              => 'local_id',
				],
				true,
			],
			'invalid_filter' => [
				[],
				[
					'xxx' => 'local_secret',
					'yyy' => 'local_id',
				],
				true,
			],
		];
	}

	/**
	 * Tests the can_use_ga4 method
	 *
	 * @param array $local_creds The credentials present in the database.
	 * @param array $filter_creds The credentials that will be added via a filter.
	 * @param bool  $expected The expected result.
	 * @return void
	 */
	public function test_can_use_ga4( $local_creds, $filter_creds, $expected ) {

		if ( ! empty( $local_creds ) ) {
			update_option( 'ga4_measurement_protocol_secret', $local_creds['secret'] );
			update_option( 'ga4_measurement_id', $local_creds['id'] );
		}

		if ( ! empty( $filter_creds ) ) {
			add_filter(
				'newspack_data_events_ga4_properties',
				function( $props ) use ( $filter_creds ) {
					$props[] = $filter_creds;
					return $props;
				}
			);
		}

		$this->assertSame( $expected, GA4::can_use_ga4() );
	}
}

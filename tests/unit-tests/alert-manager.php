<?php
/**
 * Tests the Alert_Manager functionality.
 *
 * @package Newspack\Tests
 */

use Newspack\Alert_Manager;

/**
 * Test the Alert_Manager class.
 */
class Newspack_Test_Alert_Manager extends WP_UnitTestCase {

	/**
	 * Test that sync retry exhaustion triggers unified newspack_alert.
	 */
	public function test_sync_exhaustion_triggers_unified_alert() {
		$alert_fired = false;
		$alert_data  = null;
		add_action(
			'newspack_alert',
			function ( $data ) use ( &$alert_fired, &$alert_data ) {
				$alert_fired = true;
				$alert_data  = $data;
			}
		);

		do_action(
			'newspack_sync_retry_exhausted',
			[
				'integration_id' => 'esp',
				'contact'        => [ 'email' => 'test@test.com' ],
				'context'        => 'Reader registered',
				'retry_count'    => 5,
				'reason'         => 'Invalid API key',
			]
		);

		$this->assertTrue( $alert_fired, 'newspack_alert should fire.' );
		$this->assertEquals( 'sync_retry_exhausted', $alert_data['type'] );
		$this->assertEquals( 'error', $alert_data['severity'] );
		$this->assertArrayHasKey( 'message', $alert_data );
		$this->assertArrayHasKey( 'context', $alert_data );
		$this->assertArrayHasKey( 'timestamp', $alert_data );
	}

	/**
	 * Test that data event retry exhaustion triggers unified newspack_alert.
	 */
	public function test_data_event_exhaustion_triggers_unified_alert() {
		$alert_fired = false;
		$alert_data  = null;
		add_action(
			'newspack_alert',
			function ( $data ) use ( &$alert_fired, &$alert_data ) {
				$alert_fired = true;
				$alert_data  = $data;
			}
		);

		do_action(
			'newspack_data_event_retry_exhausted',
			[
				'handler'     => [ 'SomeClass', 'some_method' ],
				'action_name' => 'reader_registered',
				'data'        => [],
				'retry_count' => 5,
				'reason'      => 'Handler threw exception',
			]
		);

		$this->assertTrue( $alert_fired, 'newspack_alert should fire.' );
		$this->assertEquals( 'data_event_retry_exhausted', $alert_data['type'] );
	}
}

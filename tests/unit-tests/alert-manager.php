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

	/**
	 * Test REST endpoint registration and permissions.
	 */
	public function test_rest_endpoint_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/newspack/v1/sync/health', $routes, 'Health endpoint should be registered.' );
	}

	/**
	 * Test REST endpoint returns expected structure.
	 */
	public function test_rest_endpoint_response_structure() {
		wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/sync/health' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'integrations', $data );
		$this->assertArrayHasKey( 'data_events', $data );
		$this->assertArrayHasKey( 'pending_retries', $data['data_events'] );
		$this->assertArrayHasKey( 'exhausted_retries', $data['data_events'] );
	}

	/**
	 * Test REST endpoint requires manage_options capability.
	 */
	public function test_rest_endpoint_requires_permissions() {
		wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );

		$request  = new WP_REST_Request( 'GET', '/newspack/v1/sync/health' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test that get_pattern_rules returns default rules.
	 */
	public function test_get_pattern_rules_returns_defaults() {
		$rules = Alert_Manager::get_pattern_rules();
		$this->assertIsArray( $rules );
		$this->assertCount( 4, $rules );

		$ids = array_column( $rules, 'id' );
		$this->assertContains( 'same_user', $ids );
		$this->assertContains( 'same_event', $ids );
		$this->assertContains( 'same_integration', $ids );
		$this->assertContains( 'same_message', $ids );

		// Each rule has required keys.
		foreach ( $rules as $rule ) {
			$this->assertArrayHasKey( 'id', $rule );
			$this->assertArrayHasKey( 'label', $rule );
			$this->assertArrayHasKey( 'group_by', $rule );
			$this->assertArrayHasKey( 'threshold', $rule );
			$this->assertArrayHasKey( 'interval', $rule );
		}
	}

	/**
	 * Test that pattern rules are filterable.
	 */
	public function test_pattern_rules_are_filterable() {
		$custom_rule = [
			'id'        => 'custom_rule',
			'label'     => 'Custom',
			'group_by'  => 'custom_field',
			'threshold' => 10,
			'interval'  => 7200,
		];
		add_filter(
			'newspack_alert_pattern_rules',
			function ( $rules ) use ( $custom_rule ) {
				$rules[] = $custom_rule;
				return $rules;
			}
		);
		$rules = Alert_Manager::get_pattern_rules();
		$ids   = array_column( $rules, 'id' );
		$this->assertContains( 'custom_rule', $ids );

		// Clean up to avoid polluting other tests.
		remove_all_filters( 'newspack_alert_pattern_rules' );
	}

	/**
	 * Test that sync retry exhaustion records a failure entry.
	 */
	public function test_sync_exhaustion_records_failure() {
		delete_option( Alert_Manager::FAILURE_LOG_OPTION );

		do_action(
			'newspack_sync_retry_exhausted',
			[
				'integration_id' => 'mailchimp',
				'contact'        => [ 'email' => 'user@test.com' ],
				'context'        => 'Reader registered',
				'retry_count'    => 5,
				'reason'         => 'Invalid API key',
			]
		);

		$log = get_option( Alert_Manager::FAILURE_LOG_OPTION, [] );
		$this->assertCount( 1, $log );
		$this->assertEquals( 'mailchimp', $log[0]['integration_id'] );
		$this->assertEquals( 'user@test.com', $log[0]['contact_email'] );
		$this->assertEquals( 'Invalid API key', $log[0]['reason'] );
		$this->assertNull( $log[0]['action_name'] );
	}

	/**
	 * Test that data event retry exhaustion records a failure entry.
	 */
	public function test_data_event_exhaustion_records_failure() {
		delete_option( Alert_Manager::FAILURE_LOG_OPTION );

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

		$log = get_option( Alert_Manager::FAILURE_LOG_OPTION, [] );
		$this->assertCount( 1, $log );
		$this->assertEquals( 'reader_registered', $log[0]['action_name'] );
		$this->assertEquals( 'Handler threw exception', $log[0]['reason'] );
		$this->assertNull( $log[0]['integration_id'] );
		$this->assertNull( $log[0]['contact_email'] );
	}

	/**
	 * Test that the scanner fires a pattern alert when threshold is exceeded.
	 */
	public function test_scanner_fires_pattern_alert_above_threshold() {
		delete_option( Alert_Manager::FAILURE_LOG_OPTION );

		// Record 5 failures for the same integration (threshold is 5).
		$log = [];
		for ( $i = 0; $i < 5; $i++ ) {
			$log[] = [
				'timestamp'      => time() - 60,
				'integration_id' => 'mailchimp',
				'contact_email'  => "user{$i}@test.com",
				'action_name'    => null,
				'reason'         => "API timeout {$i}",
			];
		}
		update_option( Alert_Manager::FAILURE_LOG_OPTION, $log, false );

		$alert_fired = false;
		$alert_data  = null;
		add_action(
			'newspack_alert',
			function ( $data ) use ( &$alert_fired, &$alert_data ) {
				if ( 'failure_pattern' === $data['type'] ) {
					$alert_fired = true;
					$alert_data  = $data;
				}
			}
		);

		Alert_Manager::scan_failure_patterns();

		$this->assertTrue( $alert_fired, 'Pattern alert should fire when threshold is met.' );
		$this->assertEquals( 'failure_pattern', $alert_data['type'] );
		$this->assertEquals( 'error', $alert_data['severity'] );
		$this->assertEquals( 'same_integration', $alert_data['context']['rule_id'] );
		$this->assertEquals( 'mailchimp', $alert_data['context']['group_value'] );
		$this->assertEquals( 5, $alert_data['context']['count'] );
	}

	/**
	 * Test that the scanner does NOT fire when below threshold.
	 */
	public function test_scanner_does_not_fire_below_threshold() {
		delete_option( Alert_Manager::FAILURE_LOG_OPTION );

		// Record 4 failures (below threshold of 5).
		$log = [];
		for ( $i = 0; $i < 4; $i++ ) {
			$log[] = [
				'timestamp'      => time() - 60,
				'integration_id' => 'mailchimp',
				'contact_email'  => "user{$i}@test.com",
				'action_name'    => null,
				'reason'         => "API timeout {$i}",
			];
		}
		update_option( Alert_Manager::FAILURE_LOG_OPTION, $log, false );

		$alert_fired = false;
		add_action(
			'newspack_alert',
			function ( $data ) use ( &$alert_fired ) {
				if ( 'failure_pattern' === $data['type'] ) {
					$alert_fired = true;
				}
			}
		);

		Alert_Manager::scan_failure_patterns();

		$this->assertFalse( $alert_fired, 'Pattern alert should NOT fire below threshold.' );
	}

	/**
	 * Test that the scanner ignores failures outside the interval window.
	 */
	public function test_scanner_ignores_old_failures() {
		delete_option( Alert_Manager::FAILURE_LOG_OPTION );

		// Record 5 failures, but all older than the 1-hour interval.
		$log = [];
		for ( $i = 0; $i < 5; $i++ ) {
			$log[] = [
				'timestamp'      => time() - 7200,
				'integration_id' => 'mailchimp',
				'contact_email'  => "user{$i}@test.com",
				'action_name'    => null,
				'reason'         => "API timeout {$i}",
			];
		}
		update_option( Alert_Manager::FAILURE_LOG_OPTION, $log, false );

		$alert_fired = false;
		add_action(
			'newspack_alert',
			function ( $data ) use ( &$alert_fired ) {
				if ( 'failure_pattern' === $data['type'] ) {
					$alert_fired = true;
				}
			}
		);

		Alert_Manager::scan_failure_patterns();

		$this->assertFalse( $alert_fired, 'Pattern alert should NOT fire for old failures.' );
	}

	/**
	 * Test that the scanner does not re-alert the same pattern within the interval.
	 */
	public function test_scanner_deduplicates_alerts() {
		delete_option( Alert_Manager::FAILURE_LOG_OPTION );

		$log = [];
		for ( $i = 0; $i < 5; $i++ ) {
			$log[] = [
				'timestamp'      => time() - 60,
				'integration_id' => 'mailchimp',
				'contact_email'  => "user{$i}@test.com",
				'action_name'    => null,
				'reason'         => "API timeout {$i}",
			];
		}
		update_option( Alert_Manager::FAILURE_LOG_OPTION, $log, false );

		$fire_count = 0;
		add_action(
			'newspack_alert',
			function ( $data ) use ( &$fire_count ) {
				if ( 'failure_pattern' === $data['type'] ) {
					$fire_count++;
				}
			}
		);

		// First scan should fire.
		Alert_Manager::scan_failure_patterns();
		$this->assertEquals( 1, $fire_count, 'First scan should fire the pattern alert.' );

		// Re-add log entries (scanner cleans up, so repopulate).
		update_option( Alert_Manager::FAILURE_LOG_OPTION, $log, false );

		// Second scan should NOT fire (dedup transient active).
		Alert_Manager::scan_failure_patterns();
		$this->assertEquals( 1, $fire_count, 'Second scan should be deduplicated.' );
	}

	/**
	 * Test that the pattern scan recurring action is scheduled.
	 */
	public function test_pattern_scan_is_scheduled() {
		if ( ! function_exists( 'as_has_scheduled_action' ) ) {
			$this->markTestSkipped( 'Action Scheduler not available.' );
		}

		Alert_Manager::schedule_pattern_scan();

		$this->assertTrue(
			as_has_scheduled_action( Alert_Manager::PATTERN_SCAN_HOOK ),
			'Pattern scan recurring action should be scheduled.'
		);
	}
}

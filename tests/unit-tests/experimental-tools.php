<?php
/**
 * Tests the Experimental Tools framework.
 *
 * @package Newspack\Tests
 */

use Newspack\Experimental_Tools;

/**
 * Tests the Experimental Tools framework.
 */
class Newspack_Test_Experimental_Tools extends WP_UnitTestCase {

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();
		delete_option( Experimental_Tools::OPTION_NAME );
		remove_all_filters( 'newspack_experimental_tools' );
	}

	/**
	 * Register a test tool via the filter.
	 *
	 * @param array $overrides Optional overrides for the tool definition.
	 * @return string The tool slug.
	 */
	private function register_test_tool( $overrides = [] ) {
		$tool_slug = 'test-tool';
		$tool_def  = array_merge(
			[
				'slug'        => $tool_slug,
				'label'       => 'Test Tool',
				'description' => 'A tool for testing.',
				'fields'      => [
					[
						'type'    => 'text',
						'key'     => 'api_key',
						'label'   => 'API Key',
						'default' => 'default-key',
					],
					[
						'type'  => 'display',
						'key'   => 'status',
						'label' => 'Status',
						'value' => 'OK',
					],
				],
			],
			$overrides
		);
		add_filter(
			'newspack_experimental_tools',
			function ( $tools ) use ( $tool_def ) {
				$tools[] = $tool_def;
				return $tools;
			}
		);
		return $tool_slug;
	}

	/**
	 * Tools registered via filter appear in get_tools().
	 */
	public function test_filter_registration() {
		$slug  = $this->register_test_tool();
		$tools = Experimental_Tools::get_tools();

		$this->assertCount( 1, $tools );
		$this->assertEquals( $slug, $tools[0]['slug'] );
		$this->assertEquals( 'Test Tool', $tools[0]['label'] );
	}

	/**
	 * Tools start disabled and can be toggled on.
	 */
	public function test_toggle_on() {
		$slug = $this->register_test_tool();

		$this->assertFalse( Experimental_Tools::is_tool_enabled( $slug ) );

		Experimental_Tools::toggle_tool( $slug, true );

		$this->assertTrue( Experimental_Tools::is_tool_enabled( $slug ) );
	}

	/**
	 * Toggling off a previously enabled tool works.
	 */
	public function test_toggle_off() {
		$slug = $this->register_test_tool();
		Experimental_Tools::toggle_tool( $slug, true );
		Experimental_Tools::toggle_tool( $slug, false );

		$this->assertFalse( Experimental_Tools::is_tool_enabled( $slug ) );
	}

	/**
	 * Toggle records the timestamp and user who enabled.
	 */
	public function test_toggle_records_metadata() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		Experimental_Tools::toggle_tool( $slug, true );
		$settings = Experimental_Tools::get_tool_settings( $slug );

		$this->assertEquals( $user, $settings['enabled_by'] );
		$this->assertIsInt( $settings['enabled_at'] );
		$this->assertGreaterThan( 0, $settings['enabled_at'] );
	}

	/**
	 * Saving fields stores only declared keys and ignores display/unknown keys.
	 */
	public function test_save_fields_filters_keys() {
		$slug = $this->register_test_tool();
		Experimental_Tools::toggle_tool( $slug, true );

		Experimental_Tools::save_tool_fields(
			$slug,
			[
				'api_key' => 'my-secret',
				'status'  => 'should-be-ignored',    // Display field.
				'unknown' => 'also-ignored',          // Not declared.
			]
		);

		$settings = Experimental_Tools::get_tool_settings( $slug );

		$this->assertEquals( 'my-secret', $settings['fields']['api_key'] );
		$this->assertArrayNotHasKey( 'status', $settings['fields'] );
		$this->assertArrayNotHasKey( 'unknown', $settings['fields'] );
	}

	/**
	 * Saved field values are merged into the tool's fields in get_tools().
	 */
	public function test_saved_values_appear_in_get_tools() {
		$slug = $this->register_test_tool();
		Experimental_Tools::toggle_tool( $slug, true );
		Experimental_Tools::save_tool_fields( $slug, [ 'api_key' => 'saved-value' ] );

		$tools     = Experimental_Tools::get_tools();
		$text_field = $tools[0]['fields'][0];

		$this->assertEquals( 'api_key', $text_field['key'] );
		$this->assertEquals( 'saved-value', $text_field['value'] );
	}

	/**
	 * Usage tracking increments per-user counters.
	 */
	public function test_track_usage() {
		$slug    = $this->register_test_tool();
		$user_id = self::factory()->user->create();

		Experimental_Tools::track_usage( $slug, $user_id );
		Experimental_Tools::track_usage( $slug, $user_id );
		Experimental_Tools::track_usage( $slug, $user_id );

		$this->assertEquals( 3, Experimental_Tools::get_usage_count( $slug ) );
	}

	/**
	 * Returns empty when no tools are registered.
	 */
	public function test_empty_when_no_tools_registered() {
		$tools = Experimental_Tools::get_tools();
		$this->assertEmpty( $tools );
	}

	/**
	 * Toggling a non-registered slug still creates an entry (no validation
	 * against registered tools at the storage layer). The REST endpoint
	 * handles validation separately.
	 */
	public function test_toggle_unregistered_slug_creates_entry() {
		Experimental_Tools::toggle_tool( 'unregistered', true );
		$this->assertTrue( Experimental_Tools::is_tool_enabled( 'unregistered' ) );
	}

	/**
	 * The newspack_experimental_tool_fields_saved action fires with correct data.
	 */
	public function test_fields_saved_action_fires() {
		$slug          = $this->register_test_tool();
		$captured_slug = null;
		$captured_fields = null;

		add_action(
			'newspack_experimental_tool_fields_saved',
			function ( $action_slug, $fields ) use ( &$captured_slug, &$captured_fields ) {
				$captured_slug   = $action_slug;
				$captured_fields = $fields;
			},
			10,
			2
		);

		Experimental_Tools::save_tool_fields( $slug, [ 'api_key' => 'hook-test' ] );

		$this->assertEquals( $slug, $captured_slug );
		$this->assertEquals( 'hook-test', $captured_fields['api_key'] );
	}

	// ─── Feedback tests ─────────────────────────────────────────

	/**
	 * Feedback is not shown when thresholds have not been met.
	 */
	public function test_feedback_not_shown_before_threshold() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		// Enable tool (enabled_at = now).
		Experimental_Tools::toggle_tool( $slug, true );

		// Track a few uses (below 50).
		for ( $i = 0; $i < 5; $i++ ) {
			Experimental_Tools::track_usage( $slug, $user );
		}

		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertFalse( $feedback_state['should_show'] );
	}

	/**
	 * Feedback is shown after 30 days since enable.
	 */
	public function test_feedback_shown_after_30_days() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		Experimental_Tools::toggle_tool( $slug, true );

		// Backdate enabled_at to 31 days ago.
		$all_settings = get_option( Experimental_Tools::OPTION_NAME, [] );
		$all_settings[ $slug ]['enabled_at'] = time() - 31 * DAY_IN_SECONDS;
		update_option( Experimental_Tools::OPTION_NAME, $all_settings );

		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertTrue( $feedback_state['should_show'] );
	}

	/**
	 * Feedback is shown after 50 uses by the user.
	 */
	public function test_feedback_shown_after_50_uses() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		Experimental_Tools::toggle_tool( $slug, true );

		for ( $i = 0; $i < 50; $i++ ) {
			Experimental_Tools::track_usage( $slug, $user );
		}

		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertTrue( $feedback_state['should_show'] );
	}

	/**
	 * Feedback is not shown after 2 touches (max touches exhausted).
	 */
	public function test_feedback_not_shown_after_max_touches() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		Experimental_Tools::toggle_tool( $slug, true );

		// Backdate to trigger eligibility.
		$all_settings = get_option( Experimental_Tools::OPTION_NAME, [] );
		$all_settings[ $slug ]['enabled_at'] = time() - 31 * DAY_IN_SECONDS;
		update_option( Experimental_Tools::OPTION_NAME, $all_settings );

		// Record 2 touches.
		Experimental_Tools::record_feedback_touch( $slug, $user );
		Experimental_Tools::record_feedback_touch( $slug, $user );

		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertFalse( $feedback_state['should_show'] );
		$this->assertEquals( 2, $feedback_state['touch_count'] );
	}

	/**
	 * Feedback is not shown after all questions are answered.
	 */
	public function test_feedback_not_shown_after_completion() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		Experimental_Tools::toggle_tool( $slug, true );

		// Backdate to trigger eligibility.
		$all_settings = get_option( Experimental_Tools::OPTION_NAME, [] );
		$all_settings[ $slug ]['enabled_at'] = time() - 31 * DAY_IN_SECONDS;
		update_option( Experimental_Tools::OPTION_NAME, $all_settings );

		// Answer all questions.
		Experimental_Tools::save_feedback_answer( $slug, $user, 'recommend', '5' );
		Experimental_Tools::save_feedback_answer( $slug, $user, 'time_saved', '4' );
		Experimental_Tools::save_feedback_answer( $slug, $user, 'editing_needed', '3' );
		Experimental_Tools::save_feedback_answer( $slug, $user, 'improvement_ideas', 'More templates' );

		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertFalse( $feedback_state['should_show'] );
	}

	/**
	 * Answers are saved incrementally and completion is set after all 4.
	 */
	public function test_feedback_incremental_answers() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );

		// Save one answer.
		Experimental_Tools::save_feedback_answer( $slug, $user, 'recommend', '4' );

		$settings = Experimental_Tools::get_tool_settings( $slug );
		$feedback = $settings['users'][ (string) $user ]['feedback'];
		$this->assertCount( 1, $feedback['answers'] );
		$this->assertEquals( '4', $feedback['answers']['recommend'] );
		$this->assertFalse( $feedback['completed'] );

		// Save remaining answers.
		Experimental_Tools::save_feedback_answer( $slug, $user, 'time_saved', '3' );
		Experimental_Tools::save_feedback_answer( $slug, $user, 'editing_needed', '2' );
		Experimental_Tools::save_feedback_answer( $slug, $user, 'improvement_ideas', 'Better docs' );

		$settings = Experimental_Tools::get_tool_settings( $slug );
		$feedback = $settings['users'][ (string) $user ]['feedback'];
		$this->assertCount( 4, $feedback['answers'] );
		$this->assertTrue( $feedback['completed'] );
	}

	/**
	 * Per-user usage count returns correct values for individual users.
	 */
	public function test_per_user_usage_count() {
		$slug   = $this->register_test_tool();
		$user_a = self::factory()->user->create();
		$user_b = self::factory()->user->create();

		Experimental_Tools::track_usage( $slug, $user_a );
		Experimental_Tools::track_usage( $slug, $user_a );
		Experimental_Tools::track_usage( $slug, $user_b );

		$this->assertEquals( 2, Experimental_Tools::get_user_usage_count( $slug, $user_a ) );
		$this->assertEquals( 1, Experimental_Tools::get_user_usage_count( $slug, $user_b ) );
		// Total across all users.
		$this->assertEquals( 3, Experimental_Tools::get_usage_count( $slug ) );
	}

	/**
	 * Feedback state includes questions in the response.
	 */
	public function test_feedback_state_includes_questions() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );

		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertArrayHasKey( 'questions', $feedback_state );
		$this->assertCount( 4, $feedback_state['questions'] );
		$this->assertEquals( 'recommend', $feedback_state['questions'][0]['key'] );
	}

	/**
	 * Feedback is not shown for disabled tools.
	 */
	public function test_feedback_not_shown_for_disabled_tool() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );

		// Never enabled -- should not trigger.
		$feedback_state = Experimental_Tools::get_feedback_state( $slug, $user );
		$this->assertFalse( $feedback_state['should_show'] );
	}

	/**
	 * Feedback state is included in get_tools() response.
	 */
	public function test_get_tools_includes_feedback() {
		$slug = $this->register_test_tool();
		$user = self::factory()->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $user );

		$tools = Experimental_Tools::get_tools();
		$this->assertArrayHasKey( 'feedback', $tools[0] );
		$this->assertArrayHasKey( 'should_show', $tools[0]['feedback'] );
	}
}

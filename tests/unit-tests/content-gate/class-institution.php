<?php
/**
 * Tests for the Institution class.
 *
 * @package Newspack\Tests\Content_Gate
 */

use Newspack\Institution;

/**
 * Test Institution functionality.
 *
 * @group Access_Rules
 */
class Test_Institution extends WP_UnitTestCase {

	/**
	 * Post IDs for cleanup.
	 *
	 * @var int[]
	 */
	private $post_ids = [];

	/**
	 * User IDs for cleanup.
	 *
	 * @var int[]
	 */
	private $user_ids = [];

	/**
	 * Teardown.
	 */
	public function tear_down() {
		foreach ( $this->post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		$this->post_ids = [];
		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = [];
		delete_transient( Institution::TRANSIENT_KEY );
		parent::tear_down();
	}

	/**
	 * Create an institution post.
	 *
	 * @param string $name Institution name.
	 * @param array  $meta Post meta to set.
	 * @return int Post ID.
	 */
	private function create_institution( $name, $meta = [] ) {
		$post_id = wp_insert_post(
			[
				'post_type'   => Institution::POST_TYPE,
				'post_title'  => $name,
				'post_status' => 'publish',
			]
		);
		foreach ( $meta as $key => $value ) {
			update_post_meta( $post_id, $key, $value );
		}
		$this->post_ids[] = $post_id;
		return $post_id;
	}

	/**
	 * Create a reader user.
	 *
	 * @param string $email Email address.
	 * @return int User ID.
	 */
	private function create_reader( $email ) {
		$user_id = wp_insert_user(
			[
				'user_login' => 'reader-' . wp_generate_password( 6, false ),
				'user_pass'  => wp_generate_password(),
				'user_email' => $email,
				'role'       => 'subscriber',
			]
		);
		if ( ! is_wp_error( $user_id ) ) {
			update_user_meta( $user_id, '_newspack_reader', true );
			$this->user_ids[] = $user_id;
		}
		return $user_id;
	}

	/**
	 * Test CPT is registered.
	 */
	public function test_cpt_registered() {
		$this->assertTrue( post_type_exists( Institution::POST_TYPE ) );
	}

	/**
	 * Test get_options returns published institutions.
	 */
	public function test_get_options_returns_published_institutions() {
		$id      = $this->create_institution( 'Test University' );
		$options = Institution::get_options();
		$this->assertCount( 1, $options );
		$this->assertEquals( 'Test University', $options[0]['label'] );
		$this->assertEquals( $id, $options[0]['value'] );
	}

	/**
	 * Test cache is built and can be invalidated.
	 */
	public function test_cache_built_and_invalidated() {
		$id = $this->create_institution(
			'Cached University',
			[ '_np_institution_email_domain' => 'cached.edu' ]
		);
		delete_transient( Institution::TRANSIENT_KEY );

		$cached = Institution::get_cached_institutions();
		$this->assertArrayHasKey( $id, $cached );
		$this->assertEquals( 'cached.edu', $cached[ $id ]['email_domain'] );

		$this->assertNotFalse( get_transient( Institution::TRANSIENT_KEY ) );

		Institution::invalidate_cache();
		$this->assertFalse( get_transient( Institution::TRANSIENT_KEY ) );
	}

	/**
	 * Test institution with no rules matches nobody.
	 */
	public function test_institution_with_no_rules_matches_nobody() {
		$inst_id   = $this->create_institution( 'Empty Institution' );
		$reader_id = $this->create_reader( 'reader@test.com' );

		delete_transient( Institution::TRANSIENT_KEY );
		$this->assertFalse( Institution::evaluate( $reader_id, [ $inst_id ] ) );
	}

	/**
	 * Test email domain matching.
	 */
	public function test_email_domain_match() {
		$inst_id = $this->create_institution(
			'University of Test',
			[ '_np_institution_email_domain' => 'university.edu' ]
		);
		$match_reader    = $this->create_reader( 'student@university.edu' );
		$no_match_reader = $this->create_reader( 'student@other.com' );

		delete_transient( Institution::TRANSIENT_KEY );
		$this->assertTrue( Institution::evaluate( $match_reader, [ $inst_id ] ) );
		$this->assertFalse( Institution::evaluate( $no_match_reader, [ $inst_id ] ) );
	}

	/**
	 * Test IP range match via cookie.
	 */
	public function test_ip_range_match_via_cookie() {
		$inst_id   = $this->create_institution(
			'IP Institution',
			[ '_np_institution_ip_range' => '10.0.0.0/8' ]
		);
		$reader_id = $this->create_reader( 'reader@test.com' );

		delete_transient( Institution::TRANSIENT_KEY );

		$this->assertFalse( Institution::evaluate( $reader_id, [ $inst_id ] ) );

		$_COOKIE[ \Newspack\Content_Gate\IP_Access_Rule::COOKIE_NAME ] = '1'; // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
		$this->assertTrue( Institution::evaluate( $reader_id, [ $inst_id ] ) );
		unset( $_COOKIE[ \Newspack\Content_Gate\IP_Access_Rule::COOKIE_NAME ] ); // phpcs:ignore WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___COOKIE
	}

	/**
	 * Test OR logic within an institution (any rule match is enough).
	 */
	public function test_or_logic_within_institution() {
		$inst_id = $this->create_institution(
			'OR Logic Institution',
			[
				'_np_institution_email_domain' => 'university.edu',
				'_np_institution_ip_range'     => '10.0.0.0/8',
			]
		);
		$reader_id = $this->create_reader( 'student@university.edu' );

		delete_transient( Institution::TRANSIENT_KEY );
		$this->assertTrue( Institution::evaluate( $reader_id, [ $inst_id ] ) );
	}

	/**
	 * Test multi-institution selection (any institution match is enough).
	 */
	public function test_multi_institution_selection() {
		$inst_a = $this->create_institution(
			'Institution A',
			[ '_np_institution_email_domain' => 'a.edu' ]
		);
		$inst_b = $this->create_institution(
			'Institution B',
			[ '_np_institution_email_domain' => 'b.edu' ]
		);
		$reader_id = $this->create_reader( 'reader@b.edu' );

		delete_transient( Institution::TRANSIENT_KEY );
		$this->assertTrue( Institution::evaluate( $reader_id, [ $inst_a, $inst_b ] ) );
	}

	/**
	 * Test check_ip filter handler.
	 */
	public function test_check_ip_filter() {
		$this->create_institution(
			'IP Filter Institution',
			[ '_np_institution_ip_range' => '192.168.1.0/24' ]
		);
		delete_transient( Institution::TRANSIENT_KEY );

		$_SERVER['REMOTE_ADDR'] = '192.168.1.50'; // phpcs:ignore WordPressVIPMinimum.Variables.ServerVariables.UserControlledHeaders, WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___SERVER__REMOTE_ADDR__
		$this->assertTrue( Institution::check_ip( false ) );

		$_SERVER['REMOTE_ADDR'] = '10.0.0.1'; // phpcs:ignore WordPressVIPMinimum.Variables.ServerVariables.UserControlledHeaders, WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___SERVER__REMOTE_ADDR__
		delete_transient( Institution::TRANSIENT_KEY );
		$this->assertFalse( Institution::check_ip( false ) );

		unset( $_SERVER['REMOTE_ADDR'] ); // phpcs:ignore WordPressVIPMinimum.Variables.ServerVariables.UserControlledHeaders, WordPressVIPMinimum.Variables.RestrictedVariables.cache_constraints___SERVER__REMOTE_ADDR__
	}
}

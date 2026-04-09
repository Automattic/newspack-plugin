<?php
/**
 * Tests the Content Gate metadata class.
 *
 * @package Newspack\Tests
 */

use Newspack\Content_Gate;
use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Sync\Contact_Metadata\Content_Gate as Content_Gate_Metadata;

/**
 * Test Content Gate metadata functionality.
 *
 * @group Content_Gate_Metadata
 */
class Newspack_Test_Content_Gate_Metadata extends WP_UnitTestCase {

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		Content_Gate_Metadata::reset_cache();
		self::$user_id = $this->factory->user->create(
			[
				'role'       => 'subscriber',
				'user_email' => 'reader@example.com',
			]
		);
		Reader_Activation::set_reader_verified( self::$user_id );
	}

	/**
	 * Helper to create a gate with custom access rules.
	 *
	 * @param string $title        Gate title.
	 * @param array  $access_rules Access rules array.
	 *
	 * @return int Gate post ID.
	 */
	private function create_gate_with_rules( $title, $access_rules ) {
		$gate_id = $this->factory->post->create(
			[
				'post_type'   => Content_Gate::GATE_CPT,
				'post_status' => 'publish',
				'post_title'  => $title,
			]
		);
		update_post_meta(
			$gate_id,
			'custom_access',
			[
				'active'       => true,
				'access_rules' => $access_rules,
			]
		);
		return $gate_id;
	}

	/**
	 * Helper to get metadata for a user.
	 *
	 * @param int $user_id User ID.
	 * @return array Metadata array.
	 */
	private function get_metadata_for_user( $user_id ) {
		$metadata = new Content_Gate_Metadata( $user_id );
		return $metadata->get_metadata();
	}

	/**
	 * Test that no gates configured returns empty metadata.
	 */
	public function test_no_gates_returns_empty() {
		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEmpty( $result['Content_Access'], 'No gates means empty Content_Access.' );
		$this->assertEmpty( $result['Content_Access_Source'], 'No gates means no source.' );
	}

	/**
	 * Test that invalid user returns empty array.
	 */
	public function test_no_user_returns_empty() {
		$result = $this->get_metadata_for_user( 0 );

		$this->assertEmpty( $result, 'Invalid user should return empty metadata.' );
	}

	/**
	 * Test user passing email domain rule.
	 */
	public function test_email_domain_pass() {
		$rules = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$this->create_gate_with_rules( 'Domain Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User with matching domain should have access.' );
		$this->assertEquals( 'domain', $result['Content_Access_Source'], 'Source should be "domain" for email domain rule.' );
	}

	/**
	 * Test user failing email domain rule.
	 */
	public function test_email_domain_fail() {
		$rules = [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'other.com',
				],
			],
		];
		$this->create_gate_with_rules( 'Domain Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'No', $result['Content_Access'], 'User with non-matching domain should not have access.' );
		$this->assertEmpty( $result['Content_Access_Source'], 'Source should be empty when access is denied.' );
	}

	/**
	 * Test user passes one gate but fails another — access is granted.
	 */
	public function test_multiple_gates_pass_one() {
		$this->create_gate_with_rules(
			'Failing Gate',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'other.com',
					],
				],
			]
		);
		$this->create_gate_with_rules(
			'Passing Gate',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'example.com',
					],
				],
			]
		);

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User should have access when passing at least one gate.' );
		$this->assertEquals( 'domain', $result['Content_Access_Source'], 'Source should reflect the passing gate.' );
	}

	/**
	 * Test that duplicate sources are deduplicated.
	 */
	public function test_sources_deduplicated() {
		// Two gates with the same email domain rule type.
		$this->create_gate_with_rules(
			'Gate A',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'example.com',
					],
				],
			]
		);
		$this->create_gate_with_rules(
			'Gate B',
			[
				[
					[
						'slug'  => 'email_domain',
						'value' => 'example.com',
					],
				],
			]
		);

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'] );
		$this->assertEquals( 'domain', $result['Content_Access_Source'], 'Duplicate sources should be deduplicated.' );
	}

	/**
	 * Test that an active gate with empty rules grants access with no source.
	 */
	public function test_gate_with_empty_rules_returns_yes() {
		$gate_id = $this->factory->post->create(
			[
				'post_type'   => Content_Gate::GATE_CPT,
				'post_status' => 'publish',
				'post_title'  => 'Empty Rules Gate',
			]
		);
		update_post_meta(
			$gate_id,
			'custom_access',
			[
				'active'       => true,
				'access_rules' => [],
			]
		);

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'Gate with empty rules should grant access.' );
		$this->assertEmpty( $result['Content_Access_Source'], 'Gate with empty rules should have no source.' );
	}

	/**
	 * Test institution rule produces "group" source label.
	 */
	public function test_institution_rule_source() {
		$institution_id = $this->factory->post->create(
			[
				'post_type'   => 'np_institution',
				'post_status' => 'publish',
				'post_title'  => 'Test University',
			]
		);
		update_post_meta( $institution_id, 'np_institution_email_domain', 'example.com' );
		// Invalidate the institution cache so it picks up the new post.
		\Newspack\Institution::invalidate_cache();

		$rules = [
			[
				[
					'slug'  => 'institution',
					'value' => [ $institution_id ],
				],
			],
		];
		$this->create_gate_with_rules( 'Institution Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User matching institution should have access.' );
		$this->assertEquals( 'group', $result['Content_Access_Source'], 'Source should be "group" for institution rule.' );
	}

	/**
	 * Test OR logic between groups — user passes one group but fails another.
	 */
	public function test_or_logic_between_groups() {
		$rules = [
			// Group 1: fails.
			[
				[
					'slug'  => 'email_domain',
					'value' => 'other.com',
				],
			],
			// Group 2: passes.
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
		$this->create_gate_with_rules( 'OR Gate', $rules );

		$result = $this->get_metadata_for_user( self::$user_id );

		$this->assertEquals( 'Yes', $result['Content_Access'], 'User should have access when one group passes (OR logic).' );
		$this->assertEquals( 'domain', $result['Content_Access_Source'] );
	}
}

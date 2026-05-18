<?php // phpcs:disable Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.ClassComment.Missing, Squiz.Commenting.VariableComment.Missing, Squiz.Commenting.FileComment.Missing
/**
 * Tests Content Gate metadata availability in the legacy sync schema.
 *
 * @package Newspack\Tests
 */

use Newspack\Content_Gate;
use Newspack\Reader_Activation;
use Newspack\Reader_Activation\Sync\Metadata;
use Newspack\Reader_Activation\Sync\Contact_Metadata\Content_Gate as Content_Gate_Metadata;

/**
 * Content Gate metadata on the legacy schema.
 *
 * @group Content_Gate_Legacy
 */
class Test_Content_Gate_Legacy extends WP_UnitTestCase {

	/**
	 * Schema version restored in tear_down().
	 *
	 * @var string
	 */
	private static $original_version;

	/**
	 * Verified reader user ID.
	 *
	 * @var int
	 */
	private static $user_id;

	public static function set_up_before_class() {
		parent::set_up_before_class();
		require_once dirname( __DIR__, 2 ) . '/mocks/wc-mocks.php';
		self::$original_version = Metadata::$version;
	}

	public function set_up() {
		parent::set_up();
		Content_Gate_Metadata::reset_cache();
		Metadata::$version = 'legacy';
		self::$user_id     = $this->factory->user->create(
			[
				'role'       => 'subscriber',
				'user_email' => 'reader@example.com',
			]
		);
		Reader_Activation::set_reader_verified( self::$user_id );
	}

	public function tear_down() {
		Metadata::$version = self::$original_version;
		Content_Gate_Metadata::reset_cache();
		parent::tear_down();
	}

	/**
	 * Create a published gate with active custom access rules.
	 *
	 * @param array $access_rules Access rules array.
	 * @return int Gate post ID.
	 */
	private function create_custom_access_gate( $access_rules ) {
		$gate_id = $this->factory->post->create(
			[
				'post_type'   => Content_Gate::GATE_CPT,
				'post_status' => 'publish',
				'post_title'  => 'Legacy Gate',
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
	 * Email-domain rule the seeded reader passes (reader@example.com).
	 *
	 * @return array
	 */
	private function passing_email_domain_rules() {
		return [
			[
				[
					'slug'  => 'email_domain',
					'value' => 'example.com',
				],
			],
		];
	}

	public function test_legacy_schema_exposes_content_access_fields() {
		$fields = Metadata::get_all_fields();
		$this->assertArrayHasKey( 'Content_Access', $fields, 'Legacy schema should expose the Content_Access field.' );
		$this->assertSame( 'Content Access', $fields['Content_Access'] );
		$this->assertArrayHasKey( 'Content_Access_Source', $fields );
		$this->assertArrayHasKey( 'Content_Access_Group', $fields );
	}

	public function test_legacy_schema_exposes_content_access_group_in_field_selector() {
		$groups   = Metadata::get_grouped_default_fields();
		$sections = array_column( $groups, 'section' );
		$this->assertContains( 'Content Access', $sections, 'The field selector should show a Content Access group on legacy sites.' );
	}

	public function test_legacy_normalize_keeps_content_access_when_enabled() {
		$this->create_custom_access_gate( $this->passing_email_domain_rules() );
		Metadata::update_fields( [ 'Content Access' ] );

		$contact    = Metadata::get_contact_with_metadata( self::$user_id );
		$normalized = Metadata::normalize_contact_data( $contact );

		$this->assertArrayHasKey(
			'NP_Content Access',
			$normalized['metadata'],
			'Enabled Content Access field must survive legacy normalization.'
		);
		$this->assertSame( 'Yes', $normalized['metadata']['NP_Content Access'] );
	}

	public function test_legacy_normalize_drops_content_access_when_not_enabled() {
		$this->create_custom_access_gate( $this->passing_email_domain_rules() );
		Metadata::update_fields( [ 'Account' ] );

		$contact    = Metadata::get_contact_with_metadata( self::$user_id );
		$normalized = Metadata::normalize_contact_data( $contact );

		$this->assertArrayNotHasKey(
			'NP_Content Access',
			$normalized['metadata'],
			'Content Access must be dropped when not enabled for the integration.'
		);
	}
}

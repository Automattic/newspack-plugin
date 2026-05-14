<?php
/**
 * Tests Email_Preview.
 *
 * @package Newspack\Tests
 */

use Newspack\Emails;
use Newspack\Wizards\Newspack\Email_Preview;

require_once __DIR__ . '/../mocks/newsletters-mocks.php';

/**
 * Tests Email_Preview.
 */
class Newspack_Test_Email_Preview extends WP_UnitTestCase {

	/**
	 * Test email config name.
	 *
	 * @var string
	 */
	private static $test_config_name = 'test-preview-config';

	/**
	 * Setup.
	 */
	public function set_up() {
		parent::set_up();

		add_filter(
			'newspack_email_configs',
			function ( $types ) {
				$types[ self::$test_config_name ] = [
					'name'        => self::$test_config_name,
					'label'       => __( 'Test preview config', 'newspack' ),
					'description' => __( 'Email for testing preview.', 'newspack' ),
					'template'    => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-revenue-emails/receipt.php',
					'category'    => 'test',
				];
				return $types;
			}
		);
	}

	/**
	 * Helper: create a newspack_rr_email post with the test config type.
	 *
	 * @param string $html Optional stored email HTML.
	 * @return int Post ID.
	 */
	private function create_email_post( string $html = '' ): int {
		$post_id = self::factory()->post->create(
			[
				'post_type'   => Emails::POST_TYPE,
				'post_status' => 'publish',
			]
		);
		update_post_meta( $post_id, Emails::EMAIL_CONFIG_NAME_META, self::$test_config_name );
		if ( ! empty( $html ) ) {
			update_post_meta( $post_id, \Newspack_Newsletters::EMAIL_HTML_META, $html );
		}
		return $post_id;
	}

	/**
	 * The sample-substitutions map contains all expected token keys.
	 */
	public function test_sample_substitutions_map() {
		$subs = Email_Preview::get_sample_substitutions();

		self::assertIsArray( $subs );
		self::assertGreaterThanOrEqual( 28, count( $subs ), 'Substitution map should have at least 28 entries.' );

		$expected_keys = [
			'*SITE_TITLE*',
			'*SITE_URL*',
			'*SITE_LOGO*',
			'*BILLING_NAME*',
			'*BILLING_FIRST_NAME*',
			'*AMOUNT*',
			'*PAYMENT_METHOD*',
			'*DATE*',
			'*ACCOUNT_URL*',
			'*MAGIC_LINK_OTP*',
		];
		foreach ( $expected_keys as $key ) {
			self::assertArrayHasKey( $key, $subs, "Missing expected token: $key" );
		}
	}

	/**
	 * get_preview_html() substitutes tokens in stored EMAIL_HTML_META.
	 */
	public function test_get_preview_html_with_stored_meta() {
		$source_html = '<html><body>Hello *BILLING_NAME*, your total is *AMOUNT*.</body></html>';
		$post_id     = $this->create_email_post( $source_html );

		$result = Email_Preview::get_preview_html( $post_id );

		self::assertIsString( $result );
		self::assertStringContainsString( 'Sample Reader', $result, 'BILLING_NAME should be substituted.' );
		self::assertStringContainsString( '$25.00', $result, 'AMOUNT should be substituted.' );
		self::assertStringNotContainsString( '*BILLING_NAME*', $result, 'Raw token should not remain.' );
		self::assertStringNotContainsString( '*AMOUNT*', $result, 'Raw token should not remain.' );
	}

	/**
	 * get_preview_html() falls back to template HTML when no stored meta exists.
	 */
	public function test_get_preview_html_fallback_to_template() {
		$post_id = $this->create_email_post();

		$result = Email_Preview::get_preview_html( $post_id );

		self::assertIsString( $result );
		self::assertNotEmpty( $result, 'Fallback to template should produce non-empty HTML.' );
		// The receipt template contains "Thank you!" — verify substitution ran.
		self::assertStringContainsString( 'Thank you!', $result );
	}

	/**
	 * get_preview_html() returns false for a nonexistent post.
	 */
	public function test_get_preview_html_returns_false_for_nonexistent() {
		$result = Email_Preview::get_preview_html( 999999 );
		self::assertFalse( $result );
	}

	/**
	 * REST API returns 404 for a post that is not of the email post type.
	 */
	public function test_api_get_preview_returns_404_for_wrong_post_type() {
		$post_id = self::factory()->post->create( [ 'post_type' => 'post' ] );

		$request = new WP_REST_Request( 'GET', '/newspack/v1/wizard/newspack-settings/emails/' . $post_id . '/preview' );
		$request->set_param( 'post_id', $post_id );

		$response = Email_Preview::api_get_preview( $request );

		self::assertInstanceOf( 'WP_Error', $response );
		self::assertEquals( 'newspack_email_preview_not_found', $response->get_error_code() );
	}

	/**
	 * REST API returns HTML and post_id on success.
	 */
	public function test_api_get_preview_returns_html() {
		$source_html = '<html><body>Preview for *BILLING_NAME*</body></html>';
		$post_id     = $this->create_email_post( $source_html );

		$request = new WP_REST_Request( 'GET', '/newspack/v1/wizard/newspack-settings/emails/' . $post_id . '/preview' );
		$request->set_param( 'post_id', $post_id );

		$response = Email_Preview::api_get_preview( $request );

		self::assertInstanceOf( 'WP_REST_Response', $response );

		$data = $response->get_data();
		self::assertArrayHasKey( 'html', $data );
		self::assertArrayHasKey( 'post_id', $data );
		self::assertEquals( $post_id, $data['post_id'] );
		self::assertStringContainsString( 'Sample Reader', $data['html'] );
	}
}

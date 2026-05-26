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
	 * Filter callback reference so it can be removed in tear_down().
	 *
	 * @var callable
	 */
	private $config_filter_callback;

	/**
	 * Setup.
	 */
	public function set_up() {
		parent::set_up();

		$this->config_filter_callback = function ( $types ) {
			$types[ self::$test_config_name ] = [
				'name'        => self::$test_config_name,
				'label'       => __( 'Test preview config', 'newspack' ),
				'description' => __( 'Email for testing preview.', 'newspack' ),
				'template'    => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-revenue-emails/receipt.php',
				'category'    => 'test',
			];
			return $types;
		};
		add_filter( 'newspack_email_configs', $this->config_filter_callback );
	}

	/**
	 * Teardown.
	 */
	public function tear_down() {
		remove_filter( 'newspack_email_configs', $this->config_filter_callback );
		parent::tear_down();
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
	 * The substitution map has the expected three-key structure.
	 */
	public function test_sample_substitutions_structure() {
		$subs = Email_Preview::get_sample_substitutions();

		self::assertIsArray( $subs );
		self::assertArrayHasKey( 'html', $subs, 'Missing "html" key.' );
		self::assertArrayHasKey( 'url', $subs, 'Missing "url" key.' );
		self::assertArrayHasKey( 'raw', $subs, 'Missing "raw" key.' );
		self::assertCount( 3, $subs, 'Substitution map should have exactly 3 top-level keys.' );
	}

	/**
	 * The sample-substitutions map contains all expected token keys.
	 */
	public function test_sample_substitutions_map() {
		$subs = Email_Preview::get_sample_substitutions();
		$all  = array_merge( $subs['html'], $subs['url'], $subs['raw'] );

		self::assertGreaterThanOrEqual( 32, count( $all ), 'Substitution map should have at least 32 entries.' );

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
			self::assertArrayHasKey( $key, $all, "Missing expected token: $key" );
		}
	}

	/**
	 * HTML metacharacters in html-context tokens are escaped.
	 */
	public function test_html_tokens_are_escaped() {
		$source_html = '<html><body>Hello *BILLING_FIRST_NAME*</body></html>';
		$post_id     = $this->create_email_post( $source_html );

		// Inject a malicious value via the filter.
		$filter = function ( $subs ) {
			$subs['html']['*BILLING_FIRST_NAME*'] = '<script>alert(1)</script>';
			return $subs;
		};
		add_filter( 'newspack_email_preview_substitutions', $filter );

		$result = Email_Preview::get_preview_html( $post_id );

		self::assertStringContainsString( '&lt;script&gt;', $result, 'HTML metacharacters should be escaped.' );
		self::assertStringNotContainsString( '<script>alert(1)</script>', $result, 'Raw script tag should not appear.' );

		remove_filter( 'newspack_email_preview_substitutions', $filter );
	}

	/**
	 * URL tokens reject dangerous protocols.
	 */
	public function test_url_tokens_are_sanitized() {
		$source_html = '<html><body><a href="*ACCOUNT_URL*">Account</a></body></html>';
		$post_id     = $this->create_email_post( $source_html );

		$filter = function ( $subs ) {
			$subs['url']['*ACCOUNT_URL*'] = 'javascript:alert(1)';
			return $subs;
		};
		add_filter( 'newspack_email_preview_substitutions', $filter );

		$result = Email_Preview::get_preview_html( $post_id );

		self::assertStringNotContainsString( 'javascript:', $result, 'javascript: protocol should be rejected by esc_url().' );

		remove_filter( 'newspack_email_preview_substitutions', $filter );
	}

	/**
	 * Raw tokens preserve their pre-escaped HTML intact.
	 */
	public function test_raw_tokens_are_not_double_escaped() {
		$source_html = '<html><body>Contact: *CONTACT_EMAIL*</body></html>';
		$post_id     = $this->create_email_post( $source_html );

		$result = Email_Preview::get_preview_html( $post_id );

		self::assertStringContainsString( '<a href=', $result, 'CONTACT_EMAIL <a> tag should be preserved.' );
		self::assertStringNotContainsString( '&lt;a href=', $result, 'CONTACT_EMAIL <a> tag should not be double-escaped.' );
	}

	/**
	 * Translatable sample strings are wrapped in __().
	 */
	public function test_translated_strings() {
		$subs = Email_Preview::get_sample_substitutions();

		// These values should match __() output (in English they're identical,
		// but this asserts the wrapping is in place).
		self::assertEquals( __( 'Sample', 'newspack-plugin' ), $subs['html']['*BILLING_FIRST_NAME*'] );
		self::assertEquals( __( 'Reader', 'newspack-plugin' ), $subs['html']['*BILLING_LAST_NAME*'] );
		self::assertEquals( __( 'Sample Reader', 'newspack-plugin' ), $subs['html']['*BILLING_NAME*'] );
		self::assertEquals( __( 'Visa ending in 4242', 'newspack-plugin' ), $subs['html']['*PAYMENT_METHOD*'] );
		self::assertEquals( __( 'Monthly Membership', 'newspack-plugin' ), $subs['html']['*PRODUCT_NAME*'] );
		self::assertEquals( __( 'monthly', 'newspack-plugin' ), $subs['html']['*BILLING_FREQUENCY*'] );
	}

	/**
	 * CONTACT_EMAIL resolves through Emails::get_reply_to_email() — not admin_email.
	 *
	 * Pins the fix for the function_exists() bug: function_exists() cannot
	 * test class methods, so the guard was always false and the token fell
	 * back to admin_email regardless of the Reader Activation contact setting.
	 */
	public function test_contact_email_uses_reply_to_email() {
		$custom_email = 'reply@example.org';
		add_filter( 'newspack_reply_to_email', fn() => $custom_email );

		$source_html = '<html><body>Contact us at *CONTACT_EMAIL*</body></html>';
		$post_id     = $this->create_email_post( $source_html );

		$result = Email_Preview::get_preview_html( $post_id );

		self::assertStringContainsString( $custom_email, $result, 'CONTACT_EMAIL should resolve to the filtered reply-to address.' );
		self::assertStringNotContainsString( '*CONTACT_EMAIL*', $result, 'Raw CONTACT_EMAIL token should not remain.' );

		remove_all_filters( 'newspack_reply_to_email' );
	}

	/**
	 * Tests that get_preview_html() substitutes tokens in stored EMAIL_HTML_META.
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
	 * Tests that get_preview_html() falls back to template HTML when no stored meta exists.
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
	 * Tests that get_preview_html() returns false for a nonexistent post.
	 */
	public function test_get_preview_html_returns_false_for_nonexistent() {
		$result = Email_Preview::get_preview_html( 999999 );
		self::assertFalse( $result );
	}

	/**
	 * Permission check rejects non-admin users.
	 */
	public function test_api_permissions_check_rejects_non_admin() {
		wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );
		$result = Email_Preview::api_permissions_check();
		self::assertInstanceOf( 'WP_Error', $result );
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
		self::assertEquals( 404, $response->get_error_data()['status'] );
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

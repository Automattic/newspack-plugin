<?php
/**
 * Tests for the Recaptcha class.
 *
 * @package Newspack
 */

use Newspack\Recaptcha;

if ( ! function_exists( 'tribe_is_community_edit_event_page' ) ) {
	/**
	 * Test stub for The Events Calendar Community Events plugin helper.
	 *
	 * Reads a global so tests can toggle the TEC community submission page state.
	 */
	function tribe_is_community_edit_event_page() {
		global $newspack_test_is_tec_community_page;
		return $newspack_test_is_tec_community_page ?? false;
	}
}

/**
 * Class Test_Recaptcha
 */
class Test_Recaptcha extends WP_UnitTestCase {
	/**
	 * Reset options, enqueued scripts, and the TEC page global before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( 'newspack_recaptcha_use_captcha' );
		delete_option( 'newspack_recaptcha_version' );
		delete_option( 'newspack_recaptcha_credentials' );
		wp_dequeue_script( 'newspack-recaptcha' );
		wp_dequeue_script( 'newspack-recaptcha-api' );
		wp_deregister_script( 'newspack-recaptcha' );
		wp_deregister_script( 'newspack-recaptcha-api' );
		$GLOBALS['newspack_test_is_tec_community_page'] = false;
	}

	/**
	 * Configure valid reCAPTCHA v3 credentials so can_use_captcha() returns true.
	 */
	private function enable_recaptcha() {
		update_option( 'newspack_recaptcha_use_captcha', true );
		update_option( 'newspack_recaptcha_version', 'v3' );
		update_option(
			'newspack_recaptcha_credentials',
			[
				'v3'           => [
					'site_key'    => 'test_key',
					'site_secret' => 'test_secret',
				],
				'v2_invisible' => [
					'site_key'    => '',
					'site_secret' => '',
				],
			]
		);
	}

	/**
	 * Normal front-end pages should enqueue Google's reCAPTCHA api.js.
	 */
	public function test_enqueues_api_script_on_normal_page() {
		$this->enable_recaptcha();
		$GLOBALS['newspack_test_is_tec_community_page'] = false;

		Recaptcha::register_scripts();

		$this->assertTrue(
			wp_script_is( 'newspack-recaptcha-api', 'registered' ),
			'reCAPTCHA api.js should be registered on a normal page when reCAPTCHA is enabled.'
		);
	}

	/**
	 * The TEC Community Events submission page should bail out and not enqueue api.js.
	 */
	public function test_skips_api_script_on_tec_community_page() {
		$this->enable_recaptcha();
		$GLOBALS['newspack_test_is_tec_community_page'] = true;

		Recaptcha::register_scripts();

		$this->assertFalse(
			wp_script_is( 'newspack-recaptcha-api', 'registered' ),
			'reCAPTCHA api.js should NOT be registered on TEC Community Events submission pages.'
		);
	}

	/**
	 * When reCAPTCHA is disabled, api.js should never be enqueued regardless of page.
	 */
	public function test_does_not_enqueue_when_recaptcha_disabled() {
		delete_option( 'newspack_recaptcha_use_captcha' );
		$GLOBALS['newspack_test_is_tec_community_page'] = false;

		Recaptcha::register_scripts();

		$this->assertFalse(
			wp_script_is( 'newspack-recaptcha-api', 'registered' ),
			'reCAPTCHA api.js should not be registered when reCAPTCHA is disabled.'
		);
	}
}

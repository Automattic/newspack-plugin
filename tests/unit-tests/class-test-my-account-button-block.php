<?php
/**
 * Tests for My Account Button block.
 *
 * @package Newspack\Tests
 */

use Newspack\Blocks\My_Account_Button\My_Account_Button_Block;

require_once NEWSPACK_ABSPATH . 'tests/mocks/wc-my-account.php';

/**
 * Tests the My Account Button block rendering.
 */
class Newspack_Test_My_Account_Button_Block extends WP_UnitTestCase {
	/**
	 * Whether reader activation is enabled.
	 *
	 * @var bool
	 */
	private static $reader_activation_enabled = true;

	/**
	 * Setup.
	 */
	public function setUp(): void {
		parent::setUp();
		add_filter( 'newspack_reader_activation_enabled', [ __CLASS__, 'filter_reader_activation_enabled' ], 9999 );

		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( 'newspack/my-account-button' ) ) {
			\register_block_type_from_metadata(
				NEWSPACK_ABSPATH . 'src/blocks/my-account-button/block.json',
				[
					'render_callback' => [ My_Account_Button_Block::class, 'render_block' ],
				]
			);
		}
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		remove_filter( 'newspack_reader_activation_enabled', [ __CLASS__, 'filter_reader_activation_enabled' ], 9999 );
		wp_logout();
		parent::tearDown();
	}

	/**
	 * Filter to set reader activation enabled state.
	 *
	 * @param bool $enabled Default enabled value.
	 *
	 * @return bool
	 */
	public static function filter_reader_activation_enabled( $enabled ) {
		return self::$reader_activation_enabled;
	}

	/**
	 * Test signed-out rendering includes labels and href.
	 */
	public function test_render_block_signed_out() {
		self::$reader_activation_enabled = true;

		$output = do_blocks(
			'<!-- wp:newspack/my-account-button {"signedInLabel":"My Account","signedOutLabel":"Sign in"} /-->'
		);

		$this->assertNotEmpty( $output );
		$this->assertStringContainsString( 'data-newspack-reader-account-link', $output );
		$this->assertStringContainsString( 'href="#"', $output );
		$this->assertStringContainsString( '&quot;signedout&quot;:&quot;Sign in&quot;', $output );
	}

	/**
	 * Test logged-in non-reader gets disabled class and account URL.
	 */
	public function test_render_block_logged_in_non_reader() {
		self::$reader_activation_enabled = true;

		$user_id = self::factory()->user->create(
			[
				'role' => 'administrator',
			]
		);
		wp_set_current_user( $user_id );

		$output = do_blocks(
			'<!-- wp:newspack/my-account-button {"signedInLabel":"My Account","signedOutLabel":"Sign in"} /-->'
		);

		$this->assertNotEmpty( $output );
		$this->assertStringContainsString( 'wp-block-newspack-my-account-button--disabled', $output );
		$this->assertStringContainsString( 'href="https://example.com/my-account"', $output );
	}
}

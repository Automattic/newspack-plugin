<?php
/**
 * Tests Reader Revenue Emails.
 *
 * @package Newspack\Tests
 */

use Newspack\Plugin_Manager;
use Newspack\Emails;

/**
 * Tests Reader Revenue Emails.
 */
class Newspack_Test_Emails extends WP_UnitTestCase {
	/**
	 * Setup.
	 */
	public function setUp() {
		reset_phpmailer_instance();
		add_filter(
			'newspack_email_configs',
			function ( $types ) {
				$types['test-email-config'] = [
					'name'        => 'test-email-config',
					'label'       => __( 'Test config', 'newspack' ),
					'description' => __( 'Email sent to test things.', 'newspack' ),
					'template'    => dirname( NEWSPACK_PLUGIN_FILE ) . '/includes/templates/reader-revenue-emails/receipt.php',
				];
				return $types;
			}
		);
	}

	/**
	 * Teardown.
	 */
	public function tearDown() {
		reset_phpmailer_instance();
	}

	/**
	 * Get an email, by type.
	 *
	 * @param string $type Email type.
	 */
	private static function get_test_email( $type ) {
		$email = Emails::get_emails()[ $type ];
		// Mitigate a weird issue with PHPUnit – when running the whole test suite (as opposed to a
		// single run with `--filter` flag), the default values from `register_meta` calls are ignored.
		update_post_meta( $email['post_id'], 'from_name', get_bloginfo( 'name' ) );
		update_post_meta( $email['post_id'], 'from_email', get_bloginfo( 'admin_email' ) );
		// Return the updated version.
		return Emails::get_emails()[ $type ];
	}

	/**
	 * Email setup & defaults generation.
	 */
	public function test_emails_setup() {
		self::assertEquals(
			Emails::get_emails( [ 'test-email-config' ] ),
			[],
			'Emails are empty until configured.'
		);
		self::assertFalse(
			Emails::can_send_email( 'test-email-config' ),
			'Test email cannot be sent.'
		);
		self::assertFalse(
			Emails::supports_emails(),
			'Emails are not configured until the Newspack Newsletters plugin is active.'
		);
		$send_result = Emails::send_email(
			'test-email-config',
			'someone@example.com'
		);
		self::assertFalse( $send_result, 'Email cannot be sent until the instance is configured.' );

		Plugin_Manager::activate( 'newspack-newsletters' );
		self::assertTrue(
			Emails::supports_emails(),
			'Emails are configured after Newspack Newsletters plugin is active.'
		);

		self::assertTrue(
			Emails::can_send_email( 'test-email-config' ),
			'Test email can now be sent.'
		);

		$emails     = Emails::get_emails( [ 'test-email-config' ] );
		$test_email = $emails['test-email-config'];
		self::assertEquals(
			'Test config',
			$test_email['label'],
			'Test email has the expected label'
		);
		self::assertEquals(
			'Thank you!',
			$test_email['subject'],
			'Test email has the expected subject'
		);
		self::assertContains(
			'<!doctype html>',
			$test_email['html_payload'],
			'Test email has the HTML payload'
		);
	}

	/**
	 * Email sending, with a template.
	 */
	public function test_emails_send_with_template() {
		Plugin_Manager::activate( 'newspack-newsletters' );

		$test_email = self::get_test_email( 'test-email-config' );

		$recipient    = 'tester@tests.com';
		$amount       = '$42';
		$placeholders = [
			[
				'template' => '*AMOUNT*',
				'value'    => $amount,
			],
		];
		$send_result  = Emails::send_email(
			'test-email-config',
			$recipient,
			$placeholders
		);

		self::assertTrue( $send_result, 'Email has been sent.' );

		$mailer = tests_retrieve_phpmailer_instance();

		self::assertContains(
			$recipient,
			$mailer->get_sent()->to[0],
			'Sent email has the expected recipient'
		);
		self::assertEquals(
			$test_email['subject'],
			$mailer->get_sent()->subject,
			'Sent email has the expected subject'
		);
		self::assertContains(
			'From: Test Blog <admin@example.org>',
			$mailer->get_sent()->header,
			'Sent email has the expected "From" header'
		);
		self::assertContains(
			$amount,
			$mailer->get_sent()->body,
			'Sent email contains the replaced placeholder content'
		);
	}

	/**
	 * Sending by email id.
	 */
	public function test_emails_send_by_id() {
		Plugin_Manager::activate( 'newspack-newsletters' );
		$test_email = self::get_test_email( 'test-email-config' );

		$send_result = Emails::send_email(
			$test_email['post_id'],
			'someone@example.com'
		);
		self::assertTrue( $send_result, 'Email has been sent.' );

		$send_result = Emails::send_email(
			9999,
			'someone@example.com'
		);
		self::assertFalse( $send_result, 'Non-existent email is not sent.' );
	}

	/**
	 * Email post status handling.
	 */
	public function test_emails_status() {
		Plugin_Manager::activate( 'newspack-newsletters' );
		$test_email = self::get_test_email( 'test-email-config' );
		wp_update_post(
			[
				'ID'          => $test_email['post_id'],
				'post_status' => 'draft',
			]
		);

		self::assertFalse( Emails::can_send_email( 'test-email-config' ), 'Email can\'t be sent – it\'s not published.' );
		$send_result = Emails::send_email(
			$test_email['post_id'],
			'someone@example.com'
		);

		self::assertFalse( $send_result, 'Email has been sent.' );
	}
}

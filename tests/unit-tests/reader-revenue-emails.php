<?php
/**
 * Tests Reader Revenue Emails.
 *
 * @package Newspack\Tests
 */

use Newspack\Plugin_Manager;
use Newspack\Reader_Revenue_Emails;

/**
 * Tests Reader Revenue Emails.
 */
class Newspack_Test_Reader_Revenue_Emails extends WP_UnitTestCase {
	/**
	 * Setup.
	 */
	public function setUp() {
		reset_phpmailer_instance();
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
	private static function get_email( $type ) {
		$email = Reader_Revenue_Emails::get_emails()[ $type ];
		// Mitigate a weird issue with PHPUnit – when running the whole test suite (as opposed to a
		// single run with `--filter` flag), the default values from `register_meta` calls are ignored.
		update_post_meta( $email['post_id'], 'from_name', get_bloginfo( 'name' ) );
		update_post_meta( $email['post_id'], 'from_email', get_bloginfo( 'admin_email' ) );
		// Return the updated version.
		return Reader_Revenue_Emails::get_emails()['receipt'];
	}

	/**
	 * Email setup & defaults generation.
	 */
	public function test_reader_revenue_emails_setup() {
		self::assertEquals(
			Reader_Revenue_Emails::get_emails(),
			[],
			'Emails are empty until configured.'
		);
		self::assertFalse(
			Reader_Revenue_Emails::can_send_email( 'receipt' ),
			'Receipt email cannot be sent.'
		);
		self::assertFalse(
			Reader_Revenue_Emails::supports_emails(),
			'Emails are not configured until the Newspack Newsletters plugin is active.'
		);
		$send_result = Reader_Revenue_Emails::send_email(
			Reader_Revenue_Emails::EMAIL_TYPE_RECEIPT,
			'someone@example.com'
		);
		self::assertFalse( $send_result, 'Email cannot be sent until the instance is configured.' );

		Plugin_Manager::activate( 'newspack-newsletters' );
		self::assertTrue(
			Reader_Revenue_Emails::supports_emails(),
			'Emails are configured after Newspack Newsletters plugin is active.'
		);

		self::assertTrue(
			Reader_Revenue_Emails::can_send_email( 'receipt' ),
			'Receipt email can now be sent.'
		);

		$emails        = Reader_Revenue_Emails::get_emails();
		$receipt_email = $emails['receipt'];
		self::assertEquals(
			'Receipt',
			$receipt_email['label'],
			'Receipt email has the expected label'
		);
		self::assertEquals(
			'Thank you!',
			$receipt_email['subject'],
			'Receipt email has the expected subject'
		);
		self::assertContains(
			'<!doctype html>',
			$receipt_email['html_payload'],
			'Receipt email has the HTML payload'
		);
	}

	/**
	 * Email sending.
	 */
	public function test_reader_revenue_emails_send() {
		Plugin_Manager::activate( 'newspack-newsletters' );

		$receipt_email = self::get_email( 'receipt' );

		$recipient    = 'tester@tests.com';
		$amount       = '$42';
		$placeholders = [
			[
				'template' => '*AMOUNT*',
				'value'    => $amount,
			],
		];
		$send_result  = Reader_Revenue_Emails::send_email(
			Reader_Revenue_Emails::EMAIL_TYPE_RECEIPT,
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
			$receipt_email['subject'],
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
	public function test_reader_revenue_emails_send_by_id() {
		Plugin_Manager::activate( 'newspack-newsletters' );
		$receipt_email = self::get_email( 'receipt' );

		$send_result = Reader_Revenue_Emails::send_email(
			$receipt_email['post_id'],
			'someone@example.com'
		);
		self::assertTrue( $send_result, 'Email has been sent.' );

		$send_result = Reader_Revenue_Emails::send_email(
			9999,
			'someone@example.com'
		);
		self::assertFalse( $send_result, 'Non-existend email is not sent.' );
	}

	/**
	 * Email post status handling.
	 */
	public function test_reader_revenue_emails_status() {
		Plugin_Manager::activate( 'newspack-newsletters' );
		$receipt_email = self::get_email( 'receipt' );
		wp_update_post(
			[
				'ID'          => $receipt_email['post_id'],
				'post_status' => 'draft',
			]
		);

		self::assertFalse( Reader_Revenue_Emails::can_send_email( 'receipt' ), 'Email can\'t be sent – it\'s not published.' );
		$send_result = Reader_Revenue_Emails::send_email(
			$receipt_email['post_id'],
			'someone@example.com'
		);

		self::assertFalse( $send_result, 'Email has been sent.' );
	}
}

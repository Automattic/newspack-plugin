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
	 * Email setup & defaults generation.
	 */
	public function test_reader_revenue_emails_setup() {
		self::assertEquals(
			Reader_Revenue_Emails::get_emails(),
			[],
			'Emails are empty until configured.'
		);
		self::assertFalse(
			Reader_Revenue_Emails::supports_emails(),
			'Emails are not configured until the Newspack Newsletters plugin is active.'
		);
		Plugin_Manager::activate( 'newspack-newsletters' );
		self::assertTrue(
			Reader_Revenue_Emails::supports_emails(),
			'Emails are not configured after Newspack Newsletters plugin is active.'
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

		$recipient    = 'tester@tests.com';
		$amount       = '$42';
		$placeholders = [
			[
				'template' => '*AMOUNT*',
				'value'    => $amount,
			],
		];
		Reader_Revenue_Emails::send_email(
			Reader_Revenue_Emails::EMAIL_TYPE_RECEIPT,
			$recipient,
			$placeholders
		);

		$mailer        = tests_retrieve_phpmailer_instance();
		$receipt_email = Reader_Revenue_Emails::get_emails()['receipt'];

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
}

<?php
/**
 * Newspack Data Events Mailchimp Connector
 *
 * @package Newspack
 */

namespace Newspack\Data_Events\Connectors;

use \Newspack\Data_Events;
use \Newspack\Mailchimp_API;
use \Newspack\Newspack_Newsletters;
use \Newspack\Reader_Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Main Class.
 */
class Mailchimp {

	/**
	 * Merge fields.
	 *
	 * @var array
	 */
	public static $fields = [
		'FNAME' => 'first_name',
		'LNAME' => 'last_name',
	];

	/**
	 * Constructor.
	 */
	public function __construct() {
		Data_Events::register_handler( [ __CLASS__, 'reader_registered' ], 'reader_registered' );
	}

	/**
	 * Get audience ID.
	 *
	 * @return string|bool Audience ID or false if not set.
	 */
	public static function get_audience_id() {
		/** TODO: UI for handling Mailchimp's master list in RAS. */
		if ( Reader_Activation::is_enabled() ) {
			$audience_id = Reader_Activation::get_setting( 'mailchimp_audience_id' );
		}
		/** Attempt to use list ID from "Mailchimp for WooCommerce" */
		if ( ! $audience_id && function_exists( 'mailchimp_get_list_id' ) ) {
			$audience_id = mailchimp_get_list_id();
		}
		return ! empty( $audience_id ) ? $audience_id : false;
	}

	/**
	 * Handle a reader registering.
	 *
	 * @param int   $timestamp Timestamp of the event.
	 * @param array $data      Data associated with the event.
	 * @param int   $client_id ID of the client that triggered the event.
	 */
	public static function reader_registered( $timestamp, $data, $client_id ) {
		$email = $data['email'];

		$audience_id = self::get_audience_id();
		if ( ! $audience_id ) {
			return;
		}
		$hash = md5( strtolower( $email ) );
		Mailchimp_API::put(
			"lists/$audience_id/members/$hash",
			[
				'email_address' => $email,
				'status_if_new' => 'transactional',
			]
		);
	}
}
new Mailchimp();

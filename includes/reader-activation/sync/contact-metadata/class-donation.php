<?php
/**
 * Donation contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Donation metadata class.
 */
class Donation extends Contact_Metadata {

	/**
	 * Whether or not the metadata fields of this class are available to be synced.
	 *
	 * @return boolean
	 */
	public static function is_available() {
		return true;
	}

	/**
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return [
			'Donor_Status'                   => 'Donor_Status',
			'Active_Donation_Count'          => 'Active_Donation_Count',
			'Current_Donation_Start_Date'    => 'Current_Donation_Start_Date',
			'Current_Donation_End_Date'      => 'Current_Donation_End_Date',
			'Current_Donation_Cycle'         => 'Current_Donation_Cycle',
			'Current_Recurring_Donation'     => 'Current_Recurring_Donation',
			'Next_Donation_Date'             => 'Next_Donation_Date',
			'_Current_Donation_Product_Name' => '_Current_Donation_Product_Name',
			'Previous_Donation_Product'      => 'Previous_Donation_Product',
			'Previous_Donation_Amount'       => 'Previous_Donation_Amount',
			'Last_Donation_Amount'           => 'Last_Donation_Amount',
			'Last_Donation_Date'             => 'Last_Donation_Date',
		];
	}

	/**
	 * Get the metadata for the given user, customer or order.
	 *
	 * @return array
	 */
	public function get_metadata() {
		return [];
	}
}

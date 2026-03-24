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
	 * The name of the metadata class, used as a section name for the fields handled by this class when syncing and in the UI for selecting which fields to sync.
	 *
	 * @return string
	 */
	public static function get_section_name() {
		return __( 'Donation', 'newspack' );
	}

	/**
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return [
			'Donor_Status'                  => 'Donor Status',
			'Active_Donation_Count'         => 'Active Donation Count',
			'Current_Donation_Start_Date'   => 'Current Donation Start Date',
			'Current_Donation_End_Date'     => 'Current Donation End Date',
			'Current_Donation_Cycle'        => 'Current Donation Cycle',
			'Current_Recurring_Donation'    => 'Current Recurring Donation',
			'Next_Donation_Date'            => 'Next Donation Date',
			'Current_Donation_Product_Name' => 'Current Donation Product Name',
			'Previous_Donation_Product'     => 'Previous Donation Product',
			'Previous_Donation_Amount'      => 'Previous Donation Amount',
			'Last_Donation_Amount'          => 'Last Donation Amount',
			'Last_Donation_Date'            => 'Last Donation Date',
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

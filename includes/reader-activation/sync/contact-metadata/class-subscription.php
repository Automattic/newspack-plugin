<?php
/**
 * Subscription contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Subscription metadata class.
 */
class Subscription extends Contact_Metadata {

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
		return __( 'Subscription', 'newspack' );
	}

	/**
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return [
			'Subscriber_Status'                      => 'Subscriber Status',
			'Active_Subscription_Count'              => 'Active Subscription Count',
			'Current_Subscription_Start_Date'        => 'Current Subscription Start Date',
			'Current_Subscription_End_Date'          => 'Current Subscription End Date',
			'Subscription_Cancellation_Reason'       => 'Subscription Cancellation Reason',
			'Current_Subscription_Billing_Cycle'     => 'Current Subscription Billing Cycle',
			'Current_Subscription_Recurring_Payment' => 'Current Subscription Recurring Payment',
			'Current_Subscription_Next_Payment_Date' => 'Current Subscription Next Payment Date',
			'Current_Subscription_Product_Name'      => 'Current Subscription Product Name',
			'Previous_Subscription_Product'          => 'Previous Subscription Product',
			'Current_Subscription_Coupon_Code'       => 'Current Subscription Coupon Code',
			'Last_Payment_Amount'                    => 'Last Payment Amount',
			'Last_Payment_Date'                      => 'Last Payment Date',
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

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
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return [
			'Subscriber_Status'                      => 'Subscriber_Status',
			'Active_Subscription_Count'              => 'Active_Subscription_Count',
			'Current_Subscription_Start_Date'        => 'Current_Subscription_Start_Date',
			'Current_Subscription_End_Date'          => 'Current_Subscription_End_Date',
			'Subscription_Cancellation_Reason'       => 'Subscription_Cancellation_Reason',
			'Current_Subscription_Billing_Cycle'     => 'Current_Subscription_Billing_Cycle',
			'Current_Subscription_Recurring_Payment' => 'Current_Subscription_Recurring_Payment',
			'Current_Subscription_Next_Payment_Date' => 'Current_Subscription_Next_Payment_Date',
			'Current_Subscription_Product_Name'      => 'Current_Subscription_Product_Name',
			'Previous_Subscription_Product'          => 'Previous_Subscription_Product',
			'Current_Subscription_Coupon_Code'       => 'Current_Subscription_Coupon_Code',
			'Last_Payment_Amount'                    => 'Last_Payment_Amount',
			'Last_Payment_Date'                      => 'Last_Payment_Date',
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

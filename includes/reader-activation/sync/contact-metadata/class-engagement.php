<?php
/**
 * Engagement contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Engagement metadata class.
 */
class Engagement extends Contact_Metadata {

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
		return __( 'Engagement', 'newspack' );
	}

	/**
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return [
			'First_Visit_Date'     => 'First Visit Date',
			'Last_Active'          => 'Last Active',
			'Articles_Read'        => 'Articles Read',
			'Paywall_Hits'         => 'Paywall Hits',
			'Favorite_Categories'  => 'Favorite Categories',
			'Payment_Page'         => 'Payment Page',
			'Payment_UTM_Source'   => 'Payment UTM Source',
			'Payment_UTM_Medium'   => 'Payment UTM Medium',
			'Payment_UTM_Campaign' => 'Payment UTM Campaign',
			'Total_Paid'           => 'Total Paid',
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

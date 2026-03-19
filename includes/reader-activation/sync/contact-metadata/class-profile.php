<?php
/**
 * Profile contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Profile metadata class.
 */
class Profile extends Contact_Metadata {

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
			'first_name'                => 'First name',
			'last_name'                 => 'Last name',
			'email'                     => 'Email',
			'Account'                   => 'Account',
			'User_Role'                 => 'User Role',
			'verified'                  => 'Verified',
			'Connected_Account'         => 'Connected Account',
			'Registration_Date'         => 'Registration Date',
			'Registration_Page'         => 'Registration Page',
			'Registration_Strategy'     => 'Registration Strategy',
			'Registration_UTM_Source'   => 'Registration UTM Source',
			'Registration_UTM_Medium'   => 'Registration UTM Medium',
			'Registration_UTM_Campaign' => 'Registration UTM Campaign',
			'First_Visit_Date'          => 'First Visit Date',
			'Last_Active'               => 'Last Active',
			'Articles_Read'             => 'Articles Read',
			'Paywall_Hits'              => 'Paywall Hits',
			'Favorite_Categories'       => 'Favorite Categories',
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

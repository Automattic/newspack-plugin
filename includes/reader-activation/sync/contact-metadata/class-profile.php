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
			'first_name'                => 'first_name',
			'last_name'                 => 'last_name',
			'email'                     => 'email',
			'Account'                   => 'Account',
			'User_Role'                 => 'User_Role',
			'verified'                  => 'verified',
			'Connected_Account'         => 'Connected_Account',
			'Registration_Date'         => 'Registration_Date',
			'Registration_Page'         => 'Registration_Page',
			'Registration_Strategy'     => 'Registration_Strategy',
			'Registration_UTM_Source'   => 'Registration_UTM_Source',
			'Registration_UTM_Medium'   => 'Registration_UTM_Medium',
			'Registration_UTM_Campaign' => 'Registration_UTM_Campaign',
			'First_Visit_Date'          => 'First_Visit_Date',
			'Last_Active'               => 'Last_Active',
			'Articles_Read'             => 'Articles_Read',
			'Paywall_Hits'              => 'Paywall_Hits',
			'Favorite_Categories'       => 'Favorite_Categories',
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

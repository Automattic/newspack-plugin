<?php
/**
 * Legacy payment contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Donations;
use Newspack\Reader_Activation\Sync\Contact_Metadata;
use Newspack\Reader_Activation\Sync\Legacy_Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Legacy Payment metadata class.
 */
class Legacy_Payment extends Contact_Metadata {

	/**
	 * Whether or not the metadata fields of this class are available to be synced.
	 *
	 * @return boolean
	 */
	public static function is_available() {
		return Donations::is_platform_wc();
	}

	/**
	 * The fields handled by this metadata class.
	 *
	 * @return array
	 */
	public static function get_fields() {
		return Legacy_Metadata::get_payment_fields();
	}

	/**
	 * Get the metadata for the given user, customer or order.
	 *
	 * This method intentionally returns an empty array. Legacy_Basic already
	 * populates all legacy fields (both basic and payment) via
	 * WooCommerce::get_contact_from_customer(). This class exists only so
	 * payment fields appear in the UI field selection via get_fields().
	 *
	 * @return array
	 */
	public function get_metadata() {
		return [];
	}
}

<?php
/**
 * Legacy basic contact metadata fields.
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Contact_Metadata;

use Newspack\Reader_Activation\Sync\Contact_Metadata;
use Newspack\Reader_Activation\Sync\Legacy_Metadata;

defined( 'ABSPATH' ) || exit;

/**
 * Legacy Basic metadata class.
 */
class Legacy_Basic extends Contact_Metadata {

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
		return Legacy_Metadata::get_basic_fields();
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

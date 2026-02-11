<?php
/**
 * Mock Integration.
 *
 * @package Newspack\Tests\Unit\Integrations
 */

use Newspack\Reader_Activation\Integration;

/**
 * Concrete test implementation of Integration.
 */
class Sample_Integration extends Integration {
	/**
	 * Push contact data (test implementation).
	 *
	 * @param array      $contact The contact data.
	 * @param string     $context The sync context.
	 * @param array|null $existing_contact Existing contact data if available.
	 * @return true
	 */
	public function push_contact_data( $contact, $context = '', $existing_contact = null ) {
		return true;
	}

	/**
	 * Whether contacts can be synced to the ESP.
	 *
	 * @param bool $return_errors Optional. Whether to return a WP_Error object. Default false.
	 *
	 * @return bool|WP_Error True if contacts can be synced, false otherwise. WP_Error if return_errors is true.
	 */
	public function can_sync( $return_errors = false ) {
		return $return_errors ? new \WP_Error() : true;
	}
}

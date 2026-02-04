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
	 * Check if contacts can be synced (test implementation).
	 *
	 * @param bool $return_errors Whether to return WP_Error.
	 * @return bool|\WP_Error
	 */
	public function can_sync( $return_errors = false ) {
		return $return_errors ? new \WP_Error() : true;
	}

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
}

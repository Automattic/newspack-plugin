<?php
/**
 * ESP integration
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Sync\Integrations;

use Newspack\Reader_Activation\Sync\Integration;
use Newspack\Reader_Activation;
use Newspack_Newsletters_Subscription;
use Newspack_Newsletters_Contacts;

defined( 'ABSPATH' ) || exit;

/**
 * ESP Integration Class.
 *
 * Generic integration for ESPs using Newspack Newsletters plugin.
 */
class ESP extends Integration {
	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'esp', __( 'ESPs Integration', 'newspack-plugin' ) );
	}

	/**
	 * Fetch contact data from the integration source.
	 *
	 * This should be a simple key value pair of data.
	 *
	 * @param mixed $email The contact email to retrieve data for.
	 *
	 * @return array|\WP_Error Array of contact data or WP_Error on failure.
	 */
	public function fetch_contact_data( $email ) {
		if ( ! class_exists( 'Newspack_Newsletters_Contacts' ) ) {
			return new \WP_Error( 'missing_dependency', __( 'Newspack Newsletters plugin is required for ESP integration.', 'newspack-plugin' ) );
		}

		$contact_data = Newspack_Newsletters_Subscription::get_contact_data( $email, true );

		if ( ! is_wp_error( $contact_data ) && ! empty( $contact_data['metadata'] ) ) {
			return $contact_data['metadata'];
		}

		return [];
	}

	/**
	 * Push contact data to the integration destination.
	 *
	 * @param array  $contact The contact data to push.
	 * @param string $context Optional. The context of the sync.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	public function push_contact_data( $contact, $context = '' ) {

		$master_list_id = Reader_Activation::get_esp_master_list_id();

		return Newspack_Newsletters_Contacts::upsert( $contact, $master_list_id, $context, $existing_contact );
	}
}

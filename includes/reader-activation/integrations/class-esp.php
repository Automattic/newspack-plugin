<?php
/**
 * ESP integration
 *
 * @package Newspack
 */

namespace Newspack\Reader_Activation\Integrations;

use Newspack\Reader_Activation\Integration;
use Newspack\Reader_Activation;
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
	 * Push contact data to the integration destination.
	 *
	 * @param array      $contact The contact data to push.
	 * @param string     $context Optional. The context of the sync.
	 * @param array|null $existing_contact Optional. Existing contact data if available.
	 *
	 * @return true|\WP_Error True on success or WP_Error on failure.
	 */
	public function push_contact_data( $contact, $context = '', $existing_contact = null ) {

		// For now, the can_esp_sync method is the gatekeeper for ESP syncs. We'll move that logic here later.

		$master_list_id = Reader_Activation::get_esp_master_list_id();

		return Newspack_Newsletters_Contacts::upsert( $contact, $master_list_id, $context, $existing_contact );
	}
}

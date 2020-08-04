<?php
/**
 * Newspack setup
 *
 * @package Newspack
 */

namespace Newspack;

function newspack_mc4c_remove_cookie() {

	// Don't do anything unless we know the MC4WC plugin is
	if ( ! \class_exists( 'MailChimp_Service' ) ) {
		return;
	}

	// Remove entirely the hook that sets the cookie.
	$service = MailChimp_Service::instance();
	remove_action( 'init', [ $service, 'handleCampaignTracking' ] );

}
// MC4WC fires it's hook at priority 10 so we need to move quicker.
add_action( 'init', 'newspack_mc4c_remove_cookie', 9 );

<?php
/**
 * Newspack setup
 *
 * @package Newspack
 */

namespace Newspack;

/**
 * Disable the cookie added by the Mailchimp for WooCommerce (MC4WC) plugin when on
 * a Newspack site because the cookie causes performance issues when logged out.
 */
function newspack_mc4wc_remove_cookie() {

	// Don't do anything unless we know the MC4WC plugin is active.
	if ( ! \class_exists( 'MailChimp_Service' ) ) {
		return;
	}

	// Remove entirely the hook that sets the cookie.
	$service = MailChimp_Service::instance();
	remove_action( 'init', [ $service, 'handleCampaignTracking' ] );

}
// MC4WC fires it's hook at priority 10 so we need to move quicker.
add_action( 'init', [ __CLASS__, 'newspack_mc4wc_remove_cookie' ], 9 );

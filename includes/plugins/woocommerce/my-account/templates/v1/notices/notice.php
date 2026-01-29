<?php
/**
 * Show notifications as snackbar components.
 *
 * @author   Newspack
 * @category WooCommerce Subscriptions/Templates
 * @package  Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

if ( ! $notices ) {
	return;
}
foreach ( $notices as $notice ) {
	Newspack_UI::add_notice(
		$notice['notice'],
		[
			'id'             => uniqid( 'newspack-myaccount-notice-' ),
			'type'           => 'warning',
			'corner'         => 'top-right',
			'autohide'       => true,
			'active_on_load' => true,
		]
	);
}

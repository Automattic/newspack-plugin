/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */

/**
 * Internal dependencies
 */
import '../../shared/js/public-path';

// import './views/dashboard';

( async function ( pageParam ) {
	if ( pageParam ) {
		if ( 'newspack-dashboard' === pageParam ) {
			await import( /* webpackChunkName: "admin-newspack" */ './views/dashboard' );
		}
		else if ( 'newspack-settings' === pageParam ) {
			await import( /* webpackChunkName: "admin-newspack" */ './views/settings' );
		}
	}
} )( new URLSearchParams( window.location.search ).get( 'page' ) );

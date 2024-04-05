/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */
import '../../shared/js/public-path';

( async function ( pageParam ) {
	if ( pageParam ) {
		if ( 'newspack-dashboard' === pageParam ) {
			await import( /* webpackChunkName: "ia-newspack" */ './views/dashboard' );
		}
		if ( 'newspack-settings' === pageParam ) {
			await import( /* webpackChunkName: "ia-newspack" */ './views/settings' );
		}
	}
} )( new URLSearchParams( window.location.search ).get( 'page' ) );

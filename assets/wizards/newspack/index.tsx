/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */
import '../../shared/js/public-path';

const pageParam = new URLSearchParams( window.location.search ).get( 'page' );

console.log( { location } );

if ( pageParam ) {
	if ( 'newspack-dashboard' === pageParam ) {
		import( './views/dashboard' );
	}
	if ( 'newspack-settings' === pageParam ) {
		import( './views/settings' );
	}
}

// import './views/dashboard';
// import './views/settings';

/**
 * Newspack - Dashboard
 *
 * WP Admin Newspack Dashboard page.
 */
import '../../shared/js/public-path';

const pageParam = new URLSearchParams( window.location.search ).get( 'page' );

console.time( 'FILE-LOAD' );

if ( pageParam ) {
	if ( 'newspack-dashboard' === pageParam ) {
		import( /* webpackChunkName: "admin-newspack" */ './views/dashboard' ).then( mod => {
			console.timeEnd( 'FILE-LOAD' );
			console.log( mod );
		} );
	}
	if ( 'newspack-settings' === pageParam ) {
		import( /* webpackChunkName: "admin-newspack" */ './views/settings' ).then( mod => {
			console.timeEnd( 'FILE-LOAD' );
			console.log( mod );
		} );
	}
}

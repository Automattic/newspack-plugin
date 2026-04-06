/* globals newspack_reader_data */

/**
 * Set up general reader engagement fields.
 *
 * @param {Object} ras Reader Activation object.
 */
export default function setupEngagement( ras ) {
	// first_visit_date — preserve the oldest known value (server or client).
	const serverFirstVisit = newspack_reader_data?.items?.first_visit_date;
	const serverValue = serverFirstVisit ? JSON.parse( serverFirstVisit ) : null;
	const clientValue = ras.store.get( 'first_visit_date' );
	const candidates = [ serverValue, clientValue ].filter( Boolean );
	const firstVisit = candidates.length ? Math.min( ...candidates ) : Date.now();
	ras.store.set( 'first_visit_date', firstVisit );

	// last_active — Date reader was last seen on site.
	ras.store.set( 'last_active', Date.now() );
}

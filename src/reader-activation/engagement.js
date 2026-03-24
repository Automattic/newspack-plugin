/**
 * Set up general reader engagement fields.
 *
 * @param {Object} ras Reader Activation object.
 */
export default function setupEngagement( ras ) {
	// first_visit_date — Date of the reader's very first visit to the site, regardless of whether or not they registered.
	if ( ! ras.store.get( 'first_visit_date' ) ) {
		ras.store.set( 'first_visit_date', Date.now() );
	}

	// last_active — Date reader was last seen on site.
	ras.store.set( 'last_active', Date.now() );
}

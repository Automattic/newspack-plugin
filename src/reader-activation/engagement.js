/**
 * Set up general reader engagement fields.
 *
 * @param {Object} ras Reader Activation object.
 */
export default function setupEngagement( ras ) {
	// first_visit_date — set once, never overwritten.
	if ( ! ras.store.get( 'first_visit_date' ) ) {
		ras.store.set( 'first_visit_date', Date.now() );
	}

	// last_active — update on every page load.
	ras.store.set( 'last_active', Date.now() );
}

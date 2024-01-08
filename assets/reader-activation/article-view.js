/**
 * Create useful data from the 'article_view' activity.
 */

export default function setupArticleViewsAggregates( ras ) {
	ras.on( 'activity', ( { detail: { action, data, timestamp } } ) => {
		if ( action !== 'article_view' ) {
			return;
		}
		const date = new Date( timestamp );
		// Reset time to 00:00:00:000.
		date.setHours( 0 );
		date.setMinutes( 0 );
		date.setSeconds( 0 );
		date.setMilliseconds( 0 );

		// Per week.
		const day = date.getDay();
		const daysToSaturday = 6 - day;
		date.setDate( date.getDate() + daysToSaturday );
		const week = date.getTime();
		const per_week = ras.store.get( 'article_view_per_week' ) || {};
		if ( ! per_week[ week ] ) {
			per_week[ week ] = {};
		}
		per_week[ week ][ data.post_id ] = true;
		ras.store.set( 'article_view_per_week', per_week );

		// Per month.
		date.setMonth( date.getMonth() + 1 );
		date.setDate( 1 );
		const month = date.getTime();
		const per_month = ras.store.get( 'article_view_per_month' ) || {};
		if ( ! per_month[ month ] ) {
			per_month[ month ] = {};
		}
		per_month[ month ][ data.post_id ] = true;
		ras.store.set( 'article_view_per_month', per_month );
	} );
}

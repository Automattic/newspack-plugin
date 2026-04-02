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

		// articles_read — A cumulative count of articles the reader has read.
		const uniqueViews = ras.getUniqueActivitiesBy( 'article_view', 'post_id' );
		ras.store.set( 'articles_read', uniqueViews.length );

		// favorite_categories — A list of the reader's most-engaged content categories, ordered by frequency.
		const allActivities = ras.getActivities( 'article_view' );
		const catCounts = {};
		for ( const activity of allActivities ) {
			const cats = activity.data?.categories || [];
			for ( const cat of cats ) {
				catCounts[ cat ] = ( catCounts[ cat ] || 0 ) + 1;
			}
		}
		const topCategories = Object.entries( catCounts )
			.filter( ( [ , count ] ) => count >= 2 )
			.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
			.slice( 0, 5 )
			.map( ( [ id ] ) => Number( id ) );
		ras.store.set( 'favorite_categories', topCategories );
	} );
}

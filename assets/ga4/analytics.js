/* global gtag */

import { manageLoadedEvents } from './loaded';
// import { manageSeenEvents } from './seen';
import { manageDismissals } from './dismissed';
import { managePagination } from './pagination';
import { manageOpened } from './opened';

// import { manageClickedEvents } from './clicked';
// import { manageFormSubmissions } from './submitted';

export const handleAnalytics = ( modalCheckouts, modalCheckoutTriggers ) => {
	// Must have a gtag instance to proceed.
	if ( 'function' === typeof gtag ) {
		manageLoadedEvents( modalCheckouts )
		// manageSeenEvents();
		manageDismissals( modalCheckouts );
		// manageClickedEvents( modalCheckouts );
		// manageFormSubmissions( modalCheckouts );
		managePagination( modalCheckouts );

		manageOpened( modalCheckoutTriggers );
	}
};
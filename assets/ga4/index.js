/**
 * Internal dependencies
 */
import { handleAnalytics } from './analytics';
import { domReady, getModalCheckouts, getModalCheckoutTriggers } from './utils';

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		// Fetch all modal checkouts on the page just once.
		const modalCheckouts = getModalCheckouts();
		const modalCheckoutTriggers = getModalCheckoutTriggers();

		handleAnalytics( modalCheckouts, modalCheckoutTriggers );
	} );
}

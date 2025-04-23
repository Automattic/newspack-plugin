/**
 * Internal dependencies.
 */
import { domReady } from '../utils';

domReady( function () {
	window.newspackRAS = window.newspackRAS || [];

	// Dispatch an activity when the user cancels a subscription.
	const cancelButton = document.querySelector(
		'.subscription_details .button.cancel'
	);
	if ( cancelButton ) {
		cancelButton.addEventListener( 'click', event => {
			// Wait for the click event to be processed.
			setTimeout( () => {
				// If the event was not prevented, dispatch the activity.
				if ( ! event.defaultPrevented ) {
					window.newspackRAS.push( [ 'subscription_cancelled' ] );
				}
			} );
		} );
	}

	// Dispatch an activity when the user reactivates a subscription.
	const reactivateButton = document.querySelector(
		'.subscription_details .button.reactivate'
	);
	if ( reactivateButton ) {
		reactivateButton.addEventListener( 'click', () => {
			window.newspackRAS.push( [ 'subscription_reactivated' ] );
		} );
	}
} );

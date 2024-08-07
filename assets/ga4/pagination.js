import { getEventPayload, sendEvent } from './utils';

/**
 * Execute a callback function to send a GA event when a prompt is dismissed.
 *
 * @param {Array} prompts Array of prompts loaded in the DOM.
 */

export const managePagination = modalCheckouts => {
	modalCheckouts.forEach( modalCheckout => {
		const continueButton = modalCheckout.querySelector( '#checkout_continue' );
		const backButton = modalCheckout.querySelector( '#checkout_back' );
		if ( continueButton ) {
			const handleEvent = () => {
				const payload = getEventPayload( 'continue' );
				sendEvent( payload );
			};

			continueButton.addEventListener( 'click', handleEvent );
		}

		if ( backButton ) {
			const handleEvent = () => {
				const payload = getEventPayload( 'back' );
				sendEvent( payload );
			};

			backButton.addEventListener( 'click', handleEvent );
		}
	} );
};
// TODO: track when a modal open attempt is triggered by a checkout button, donate button


import { getEventPayload, sendEvent } from './utils';

/**
 * Execute a callback function to send a GA event when a prompt is dismissed.
 *
 * @param {Array} prompts Array of prompts loaded in the DOM.
 */

export const manageOpened = modalCheckoutTriggers => {


	modalCheckoutTriggers.forEach( modalCheckoutTrigger => {

		const handleEvent = ( event ) => {
			const payload = getEventPayload( 'modal triggered', { 'action_type': 'payment trigger whatever' } );

			const data = new FormData( event.target );

			if ( data.get( 'newspack_checkout' ) ) {
				console.log( 'is checkout button block' );
			}

			if ( data.get( 'newspack_donate' ) ) {
				console.log( 'is donate block' );
			}

			// console.log( [ ...data.entries() ] );

			sendEvent( payload );
		};

		modalCheckoutTrigger.addEventListener( 'submit', handleEvent );

	} );
};
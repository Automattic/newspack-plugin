import { getEventPayload, sendEvent } from './utils';

/**
 * Execute a callback function to send a GA event when a prompt is dismissed.
 *
 * @param {Array} prompts Array of prompts loaded in the DOM.
 */

export const manageDismissals = modalCheckouts => {
	modalCheckouts.forEach( modalCheckout => {
		const closeButton = modalCheckout.querySelector( '.newspack-ui__modal__close' );
		const forms = [ ...modalCheckout.querySelectorAll( '#newspack_modal_checkout_container form' ) ];
		if ( closeButton ) {
			const handleEvent = () => {
				const payload = getEventPayload( 'dismissed' );
				sendEvent( payload );
			};

			closeButton.addEventListener( 'click', handleEvent );

			// If a form inside an overlay prompt is submitted, closing it should not result in a `dismissed` action.
			forms.forEach( form => {
				form.addEventListener( 'submit', () =>
					closeButton.removeEventListener( 'click', handleEvent )
				);
			} );
		}
	} );
};
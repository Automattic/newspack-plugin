import { getEventPayload, sendEvent } from './utils';
/**
 * Execute a callback function to send a GA event when a prompt becomes unhidden.
 *
 * @param {Function} handleEvent Callback function to execute when the prompt becomes eligible for display.
 * @return {MutationObserver} Observer instance.
 */

const getObserver = handleEvent => {
	return new MutationObserver( mutations => {
		mutations.forEach( mutation => {
			if ( mutation.type === 'attributes' &&
				mutation.attributeName === 'data-state' &&
				mutation.target.getAttribute('data-state') === 'open'
			) {
				handleEvent();
			}
		} );
	} );
};

/**
 * Event fired as soon as a prompt is loaded in the DOM.
 *
 * @param {Array} prompts Array of prompts loaded in the DOM.
 */
export const manageLoadedEvents = modalCheckouts => {
	modalCheckouts.forEach( modalCheckout => {
		const handleEvent = () => {
			// const payload = getEventPayload( 'loaded', getRawId( modalCheckout.getAttribute( 'id' ) ) );
			const payload = getEventPayload( 'loaded' );
			sendEvent( payload );
		};
		getObserver( handleEvent ).observe( modalCheckout, { attributes: true } );
	} );
};


/**
 * Run the resubscribe action through the modal checkout.
 */

import { domReady } from '../utils';

/**
 * Start the modal checkout given a resubscribe URL.
 *
 * @param {string} url The resubscribe URL.
 */
const resubscribeCheckout = async url => {
	// Fetch the resubscribe URL.
	await fetch( url );
	// Open the modal.
	window.newspackOpenModalCheckout();
};

domReady( function () {
	const resubscribeButtons = [
		...document.querySelectorAll( '.resubscribe' ),
	];

	resubscribeButtons.forEach( button => {
		button.addEventListener( 'click', function ( e ) {
			const url = button.getAttribute( 'href' );
			if ( ! url ) {
				return;
			}
			try {
				resubscribeCheckout( url );
				e.preventDefault();
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} );
	} );
} );

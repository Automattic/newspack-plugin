/**
 * Run the resubscribe action through the modal checkout.
 */

import { domReady } from '../utils';

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
				// Fetch the resubscribe URL to generate the cart.
				await fetch( url );
				// Open the modal checkout.
				window.newspackOpenModalCheckout( 'Renew subscription', {
					url: '/my-account/subscriptions',
				} );
				// Prevent the default action if the above succeeds.
				e.preventDefault();
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} );
	} );
} );

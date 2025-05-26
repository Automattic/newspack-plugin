/**
 * Initialize functions for the Payment Information page.
 */

import { domReady } from '../../utils';

domReady( function () {
	 // Add Payment Method modal.
	const addPaymentMethodButton = document.querySelector( '.newspack-my-account__add-payment-method' );
	if ( addPaymentMethodButton ) {
		const addPaymentMethodModal = document.getElementById( 'newspack-my-account__add-payment-method' );
		if ( addPaymentMethodModal ) {
			addPaymentMethodButton.addEventListener( 'click', e => {
				e.preventDefault();
				addPaymentMethodModal.setAttribute( 'data-state', 'open' );
			} );
		}
	}
} );

/* globals jQuery */

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

	// Edit address modals.
	const editAddressButtons = [ ...document.querySelectorAll( '.newspack-my-account__edit-address' ) ];
	if ( editAddressButtons ) {
		editAddressButtons.forEach( button => {
			button.addEventListener( 'click', e => {
				e.preventDefault();
				const addressType = button.getAttribute( 'data-address-type' );
				const editAddressModal = document.getElementById( `newspack-my-account__edit-address-${ addressType }` );

				if ( editAddressModal ) {
					editAddressModal.setAttribute( 'data-state', 'open' );
					jQuery( document.body ).trigger( 'refresh' );
				}
			} );
		} );
	}
} );

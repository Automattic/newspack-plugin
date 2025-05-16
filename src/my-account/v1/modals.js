/**
 * Common functions for Newspack UI modals throughout My Account.
 */

import { domReady } from '../../utils';

domReady( function () {
	const modals = [ ...document.querySelectorAll( '.newspack-ui__modal-container' ) ];

	modals.forEach( modal => {
		const closeButtons = [ ...modal.querySelectorAll( '.newspack-ui__modal__close' ) ];
		closeButtons.forEach( closeButton => {
			closeButton.addEventListener( 'click', () => modal.setAttribute( 'data-state', 'closed' ) );
		} );
	} );
} );

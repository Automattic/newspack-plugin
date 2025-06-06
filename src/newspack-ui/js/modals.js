/**
 * Common functions for Newspack UI modals throughout My Account.
 */

import { domReady } from '../../utils';

domReady( function () {
	const modals = [ ...document.querySelectorAll( '.newspack-ui__modal-container' ) ];

	modals.forEach( modal => {
		const content = modal.querySelector( '.newspack-ui__modal__content' );
		const closeButtons = [ ...modal.querySelectorAll( '.newspack-ui__modal__close' ) ];
		closeButtons.forEach( closeButton => {
			closeButton.addEventListener( 'click', e => {
				e.preventDefault();
				modal.setAttribute( 'data-state', 'closed' );
			} );
		} );

		const fetchButtons = [ ...modal.querySelectorAll( '[data-fetch]' ) ];
		fetchButtons.forEach( fetchButton => {
			fetchButton.addEventListener( 'click', e => {
				const fetchData = JSON.parse( fetchButton.getAttribute( 'data-fetch' ) );
				if ( fetchData.url && fetchData.nonce ) {
					const errors = content.querySelector( '.newspack-ui__notice--error' );
					if ( errors ) {
						errors.parentElement.removeChild( errors );
					}
					e.preventDefault();
					e.target.setAttribute( 'disabled', true );
					fetch( fetchData.url, {
						method: fetchData.method,
						body: JSON.stringify( fetchData.body || {} ),
						headers: {
							'X-WP-Nonce': fetchData.nonce,
						},
					} )
					.then( response => {
						const json = response.json();
						if ( ! response.ok || json.error ) {
							throw new Error( json.message || json.error || 'An error occurred. Please try again.' );
						}
						return json;
					} )
					.then( () => {
						if ( fetchData.next ) {
							const nextModal = document.getElementById( `newspack-my-account__${ fetchData.next }` );
							if ( nextModal ) {
								modal.setAttribute( 'data-state', 'closed' );
								nextModal.setAttribute( 'data-state', 'open' );
							}
						}
					} )
					.catch( error => {
						const errorsDiv = document.createElement( 'div' );
						errorsDiv.textContent = error || 'An error occurred.';
						errorsDiv.classList.add( 'newspack-ui__notice', 'newspack-ui__notice--error' );
						content.insertBefore( errorsDiv, content.firstChild );
					} )
					.finally( () => e.target.removeAttribute( 'disabled' ) );
				}
			} );
		} );
	} );
} );

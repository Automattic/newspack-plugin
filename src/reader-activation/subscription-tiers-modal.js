import { domReady } from '../utils';

export default function init() {
	domReady( () => {
		const modals = document.querySelectorAll( '.newspack__subscription-tiers' );
		if ( ! modals.length ) {
			return;
		}
		[ ...modals ].forEach( modal => {
			modal.setAttribute( 'data-state', 'open' );
			const cancelButton = modal.querySelector( '.newspack-ui__modal__cancel' );
			if ( cancelButton ) {
				cancelButton.addEventListener( 'click', () => {
					modal.setAttribute( 'data-state', 'closed' );
				} );
			}

			const form = modal.querySelector( '.newspack__subscription-tiers__form' );
			if ( ! form ) {
				return;
			}
			form.addEventListener( 'submit', ev => {
				if ( window.newspackOpenModalCheckout ) {
					ev.preventDefault();
					const formData = new FormData( form );
					const params = new URLSearchParams( formData );
					modal.setAttribute( 'data-state', 'closed' );
					window.newspackOpenModalCheckout( {
						url: form.action + '?' + params.toString(),
						title: 'Change Subscription',
						actionType: 'change_subscription',
						onCheckoutComplete: () => {
							// modal.setAttribute( 'data-state', 'closed' );
						},
						onClose: () => {
							modal.setAttribute( 'data-state', 'open' );
						},
					} );
				}
			} );
		} );
	} );
}

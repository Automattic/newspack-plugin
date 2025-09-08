import { domReady } from '../utils';

export default function init() {
	domReady( () => {
		const forms = document.querySelectorAll( '.newspack__subscription-tiers__form' );
		if ( ! forms.length ) {
			return;
		}

		[ ...forms ].forEach( form => {
			const modal = form.closest( '.newspack-ui__modal-container' );
			const cancelButton = form.querySelector( '.newspack-ui__modal__cancel' );

			if ( modal ) {
				cancelButton.addEventListener( 'click', () => {
					modal?.setAttribute( 'data-state', 'closed' );
				} );
			} else {
				cancelButton.style.display = 'none';
			}

			form.addEventListener( 'submit', ev => {
				// Bail if this is a variation modal from the Checkout Button block,
				// as it has its own form submission logic.
				if ( modal?.classList.contains( 'newspack-blocks__modal-variation' ) ) {
					return;
				}
				if ( ! window.newspackOpenModalCheckout ) {
					return;
				}
				ev.preventDefault();
				const formData = new FormData( form );
				const params = new URLSearchParams( formData );
				modal?.setAttribute( 'data-state', 'closed' );
				window.newspackOpenModalCheckout( {
					url: form.action + '?' + params.toString(),
					title: form.dataset.title,
					actionType: form.dataset.actionType || undefined,
					onClose: () => {
						modal?.setAttribute( 'data-state', 'open' );
					},
				} );
			} );
		} );
	} );
}

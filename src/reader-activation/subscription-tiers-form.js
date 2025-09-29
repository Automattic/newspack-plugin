import { domReady } from '../utils';

export default function init() {
	domReady( () => {
		const forms = document.querySelectorAll( '.newspack__subscription-tiers__form' );
		if ( ! forms.length ) {
			return;
		}

		[ ...forms ].forEach( form => {
			const modal = form.closest( '.newspack-ui__modal-container' );
			const submitButton = form.querySelector( 'button[type="submit"]' );
			const cancelButton = form.querySelector( '.newspack-ui__modal__cancel' );
			const isNYP = form.classList.contains( 'nyp' );
			const originalSubmitButtonText = submitButton.textContent;

			let isFormValid = false;

			const handleContentSelected = () => {
				const inputs = form.querySelectorAll( 'input[type="radio"], input[type="number"], select' );
				inputs.forEach( input => {
					input.addEventListener( 'input', handleChange );
					input.addEventListener( 'change', handleChange );
				} );
				handleChange();
			};

			const handleChange = () => {
				// Update submit label.
				if ( isNYP ) {
					const amountInput = form.querySelector( '#nyp_amount' );
					if ( amountInput?.value ) {
						const amountText = parseFloat( amountInput.value ).toLocaleString( document.documentElement.lang, {
							style: 'currency',
							currency: amountInput.dataset.currency,
							currencyDisplay: 'narrowSymbol',
						} );
						submitButton.textContent = originalSubmitButtonText + ': ' + amountText + ' / ' + amountInput.dataset.frequency;
					} else {
						submitButton.textContent = originalSubmitButtonText;
					}
				}

				// Validate inputs.
				if ( isNYP ) {
					const amountInput = form.querySelector( '#nyp_amount.current' );
					if ( amountInput && ( ! amountInput.value || amountInput.value === amountInput.dataset.originalValue ) ) {
						form.querySelector( 'button[type="submit"]' ).disabled = true;
						isFormValid = false;
					} else {
						form.querySelector( 'button[type="submit"]' ).disabled = false;
						isFormValid = true;
					}
				} else {
					const selected = form.querySelector( '.current input[type="radio"]:checked' );
					if ( selected ) {
						form.querySelector( 'button[type="submit"]' ).disabled = true;
						isFormValid = false;
					} else {
						form.querySelector( 'button[type="submit"]' ).disabled = false;
						isFormValid = true;
					}
				}
			};

			const control = form.querySelector( '.newspack-ui__segmented-control' );
			control.addEventListener( 'content-selected', handleContentSelected );

			handleChange();

			if ( modal ) {
				cancelButton.addEventListener( 'click', () => {
					modal?.setAttribute( 'data-state', 'closed' );
				} );
			} else {
				cancelButton.style.display = 'none';
			}

			form.addEventListener( 'submit', ev => {
				if ( ! isFormValid ) {
					ev.preventDefault();
					return;
				}

				// Bail if this is a variation modal from the Checkout Button block,
				// as it has its own form submission logic.
				if ( modal?.classList.contains( 'newspack-blocks__modal-variation' ) ) {
					return;
				}
				// Bail if the modal checkout API is not available.
				if ( ! window.newspackOpenModalCheckout ) {
					return;
				}
				ev.preventDefault();
				let completed = false;
				const formData = new FormData( form );
				const params = new URLSearchParams( formData );
				modal?.setAttribute( 'data-state', 'closed' );
				window.newspackOpenModalCheckout( {
					url: form.action + '?' + params.toString(),
					title: form.dataset.title,
					onCheckoutComplete: () => {
						completed = true;
					},
					onClose: () => {
						if ( completed ) {
							window.location.reload();
						}
					},
				} );
			} );
		} );
	} );
}

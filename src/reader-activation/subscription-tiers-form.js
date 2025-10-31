import { domReady } from '../utils';

function handleCheckoutOverlayClose( { detail: { overlays } } ) {
	setTimeout( () => {
		if ( ! overlays.length ) {
			window.location.reload();
			window.newspackReaderActivation.off( 'overlay', handleCheckoutOverlayClose );
		}
	}, 50 );
}

function handleCheckoutClose( completed ) {
	if ( ! completed ) {
		return;
	}
	window.newspackRAS.push( ras => {
		setTimeout( () => {
			if ( ras.overlays.get().length ) {
				ras.on( 'overlay', handleCheckoutOverlayClose );
				return;
			}
			window.location.reload();
		}, 50 );
	} );
}

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

			const attachInputListeners = () => {
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
			if ( control ) {
				control.addEventListener( 'content-selected', attachInputListeners );
			}
			attachInputListeners();

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
				modal?.setAttribute( 'data-state', 'closed' );
				const url = new URL( form.action );
				for ( const param of formData.entries() ) {
					url.searchParams.append( param[ 0 ], param[ 1 ] );
				}
				window.newspackOpenModalCheckout( {
					url: url.toString(),
					title: form.dataset.title,
					onCheckoutComplete: () => {
						completed = true;
					},
					onClose: () => handleCheckoutClose( completed ),
				} );
			} );
		} );

		// Remove the `upgrade-subscription` query param from the URL.
		const params = new URLSearchParams( window.location.search );
		if ( params.get( 'upgrade-subscription' ) ) {
			params.delete( 'upgrade-subscription' );
			const newQueryString = params.toString() ? '?' + params.toString() : '';
			window.history.replaceState( {}, '', window.location.pathname + newQueryString );
		}
	} );
}

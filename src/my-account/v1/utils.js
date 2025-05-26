/* global newspackMyAccountV1 */

window.newspackRAS = window.newspackRAS || [];

let modalCheckoutRedirectUrl = null;

/**
 * Handle overlays on checkout close.
 *
 * @param {Object} event                 The event object.
 * @param {Object} event.detail          The event detail object.
 * @param {Array}  event.detail.overlays The overlays array.
 */
function handleOverlay( { detail: { overlays } } ) {
	setTimeout( () => {
		if ( ! overlays.length ) {
			if ( modalCheckoutRedirectUrl ) {
				window.location.href = modalCheckoutRedirectUrl;
				modalCheckoutRedirectUrl = null;
			} else {
				window.location.reload();
			}
			window.newspackReaderActivation.off( 'overlay', handleOverlay );
		}
	}, 50 );
}

/**
 * Handle the checkout complete event.
 *
 * @param {Object} data The order details object.
 */
function handleCheckoutComplete( data ) {
	const { subscription_renewal, subscription_ids, order_id } = data;
	if ( subscription_ids?.length ) {
		modalCheckoutRedirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-subscription/${ subscription_ids[ 0 ] }`;
	} else if ( subscription_renewal ) {
		modalCheckoutRedirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-subscription/${ subscription_renewal }`;
	} else if ( order_id ) {
		modalCheckoutRedirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-order/${ order_id }`;
	}
}

/**
 * Handle the modal close event.
 */
function handleClose() {
	window.newspackRAS.push( ras => {
		setTimeout( () => {
			if ( ras.overlays.get().length ) {
				ras.on( 'overlay', handleOverlay );
				return;
			}
			if ( modalCheckoutRedirectUrl ) {
				window.location.href = modalCheckoutRedirectUrl;
				modalCheckoutRedirectUrl = null;
			} else {
				window.location.reload();
			}
		}, 50 );
	} );
}

/**
 * Register a modal checkout button.
 *
 * Must receive a link element with a `href` attribute that points to a cart
 * generation URL.
 *
 * @param {HTMLElement} element            The element to register.
 * @param {string}      title              The modal title.
 * @param {string}      actionType         The action type.
 * @param {Function}    onCheckoutComplete The function to call when the checkout is complete.
 * @param {Function}    onClose            The function to call when the modal is closed. Default is `handleClose`.
 */
export function registerModalCheckoutButton(
	element,
	title,
	actionType,
	onCheckoutComplete,
	onClose
) {
	const myAccountContent = document.querySelector(
		'.woocommerce-MyAccount-content'
	);

	const openCheckout = async url => {
		await fetch( url );
		window.newspackOpenModalCheckout( {
			title,
			actionType,
			onCheckoutComplete: data => {
				handleCheckoutComplete( data );
				if ( onCheckoutComplete ) {
					onCheckoutComplete( data );
				}
			},
			onClose: onClose || handleClose,
		} );
	};

	element.addEventListener( 'click', ev => {
		myAccountContent.classList.add( 'is-loading' );

		const url = element.getAttribute( 'href' );
		if ( ! url ) {
			return;
		}

		try {
			openCheckout( url );
			ev.preventDefault();
		} catch ( error ) {
			myAccountContent.classList.remove( 'is-loading' );
			console.error( error ); // eslint-disable-line no-console
		}
	} );
}

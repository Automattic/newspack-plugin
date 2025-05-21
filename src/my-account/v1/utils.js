/* global newspackMyAccountV1 */
let modalCheckoutRedirectUrl = null;

function handleCheckoutComplete( data ) {
	const { subscription_ids, order_id } = data;
	if ( subscription_ids && subscription_ids.length ) {
		modalCheckoutRedirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-subscription/${ subscription_ids[ 0 ] }`;
	} else if ( order_id ) {
		modalCheckoutRedirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-order/${ order_id }`;
	}
}

/**
 * Handle the modal close event.
 */
function handleClose() {
	if ( modalCheckoutRedirectUrl ) {
		window.location.href = modalCheckoutRedirectUrl;
		modalCheckoutRedirectUrl = null;
	} else {
		/**
		 * Reload to restore the page state.
		 * This is behind a timeout because when running in the ESC
		 * keydown thread the reload doesn't work.
		 */
		setTimeout( () => {
			window.location.reload();
		}, 100 );
	}
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

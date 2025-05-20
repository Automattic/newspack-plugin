/* globals newspackMyAccountV1 */
/**
 * Run the resubscribe action through the modal checkout.
 */

import { domReady } from '../../utils';

/**
 * The redirect URL on checkout success.
 *
 * This is set on the checkout success event and used to redirect to the
 * subscription page after the modal is closed.
 *
 * @type {string|null}
 */
let redirectUrl = null;

/**
 * Start the modal checkout given the cart generation URL.
 *
 * @param {string} url The cart generation URL.
 */
const startCheckout = async url => {
	await fetch( url );
	window.newspackOpenModalCheckout( newspackMyAccountV1.labels.resubscribe_title, 'resubscribe' );
};

/**
 * Set the redirect URL to the subscription page on checkout success.
 *
 * @param {Object} ev The activity event data.
 *
 * @return {void}
 */
const handleCheckoutSuccess = ev => {
	const { action, data } = ev.detail;
	if ( action !== 'checkout_completed' ) {
		return;
	}
	const { subscription_ids } = data;
	if ( ! subscription_ids || ! subscription_ids.length ) {
		return;
	}
	redirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-subscription/${ subscription_ids[ 0 ] }`;
};

domReady( function () {
	const resubscribeButtons = [
		...document.querySelectorAll( '.resubscribe' ),
	];

	const myAccountContent = document.querySelector( '.woocommerce-MyAccount-content' );

	resubscribeButtons.forEach( button => {
		button.addEventListener( 'click', ev => {
			const url = button.getAttribute( 'href' );
			if ( ! url ) {
				return;
			}
			try {
				startCheckout( url );
				ev.preventDefault();
				window.newspackRAS.push( ras => {
					ras.on( 'activity', handleCheckoutSuccess );
					document.addEventListener( 'checkout-closed', () => {
						myAccountContent.classList.add( 'is-loading' );

						ras.off( 'activity', handleCheckoutSuccess );
						if ( redirectUrl ) {
							window.location.href = redirectUrl;
							redirectUrl = null;
						} else {
							// Reload to restore the page state.
							window.location.reload();
						}
					} );
				} );
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} );
	} );
} );

/* globals newspackMyAccountV1 */
/**
 * Run the resubscribe action through the modal checkout.
 */

import { domReady } from '../../utils';

window.newspackRAS = window.newspackRAS || [];

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
 * Handle the checkout complete event.
 *
 * @param {Object} data The checkout complete data.
 *
 * @return {void}
 */
const handleCheckoutComplete = data => {
	const { subscription_ids } = data;
	if ( ! subscription_ids || ! subscription_ids.length ) {
		return;
	}
	redirectUrl = `${ newspackMyAccountV1.myAccountUrl }/view-subscription/${ subscription_ids[ 0 ] }`;

	// Track the subscription reactivation.
	window.newspackRAS.push( [
		'subscription_renewal_early',
		{
			subscription_id: subscription_ids[ 0 ],
		},
	] );
};

/**
 * Handle the checkout close event.
 */
const handleCheckoutClose = () => {
	if ( redirectUrl ) {
		window.location.href = redirectUrl;
		redirectUrl = null;
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
};

/**
 * Start the modal checkout given the cart generation URL.
 *
 * @param {string} url The cart generation URL.
 */
const openCheckout = async url => {
	await fetch( url );
	window.newspackOpenModalCheckout( {
		title: newspackMyAccountV1.labels.renewal_early_title,
		action_type: 'renewal_early',
		onCheckoutComplete: handleCheckoutComplete,
		onClose: handleCheckoutClose,
	} );
};

domReady( function () {
	const buttons = [ ...document.querySelectorAll( '.subscription_renewal_early' ) ];

	const myAccountContent = document.querySelector(
		'.woocommerce-MyAccount-content'
	);

	buttons.forEach( button => {
		button.addEventListener( 'click', ev => {
			myAccountContent.classList.add( 'is-loading' );
			const url = button.getAttribute( 'href' );
			if ( ! url ) {
				return;
			}
			try {
				openCheckout( url );
				ev.preventDefault();
			} catch ( error ) {
				console.error( error ); // eslint-disable-line no-console
			}
		} );
	} );
} );

import { EVENTS, emit } from './events.js';

import { getReader } from './index.js';
import Store from './store.js';

/**
 * Reader Activation Library.
 */
export const store = Store();

/**
 * Get the current checkout.
 *
 * @return {Object} Checkout data.
 */
export function getCheckout() {
	return store.get( 'checkout' ) || {};
}

/**
 * Set the current checkout data.
 *
 * @param {Object} data Checkout data. Optional.
 *                      If empty or not provided, the checkout data will be cleared.
 */
export function setCheckoutData( data = {} ) {
	store.set( 'checkout', data, false );
	emit( EVENTS.reader, getReader() );
}

/**
 * Get the reader checkout data.
 *
 * @param {string} key Checkout data key. Optional.
 *
 * @return {any} Reader checkout data.
 */
export function getCheckoutData( key ) {
	const checkout = getCheckout();
	if ( ! key ) {
		return checkout;
	}
	return checkout?.[ key ];
}

/**
 * Whether checkout is pending.
 *
 * @return {boolean} Whether checkout is pending.
 */
export function isPendingCheckout() {
	const checkout = getCheckout();
	if ( Object.keys( checkout ).length ) {
		return true;
	}
	return false;
}

/**
 * Reset the reader checkout data.
 */
export function resetCheckoutData() {
	setCheckoutData();
}

/**
 * Get a checkout redirect URL.
 *
 * @return {string} A checkout redirect URL if checkout data is present.
 *                  Otherwise, an empty string
 */
export function getCheckoutRedirectUrl() {
	const checkoutType = getCheckoutData( 'type' );
	if ( ! checkoutType ) {
		return '';
	}
	const redirectUrl = new URL( window.location.href );
	redirectUrl.searchParams.set( 'newspack_modal_checkout', 1 );
	redirectUrl.searchParams.set( 'type', checkoutType );
	// Add checkout button params.
	if ( checkoutType === 'checkout_button' ) {
		redirectUrl.searchParams.set( 'product_id', getCheckoutData( 'product_id' ) ?? '' );
		redirectUrl.searchParams.set( 'variation_id', getCheckoutData( 'variation_id' ) ?? '' );
	}
	// Add donate params.
	if ( checkoutType === 'donate' ) {
		redirectUrl.searchParams.set( 'layout', getCheckoutData( 'layout' ) ?? '' );
		redirectUrl.searchParams.set( 'frequency', getCheckoutData( 'frequency' ?? '' ) );
		redirectUrl.searchParams.set( 'amount', getCheckoutData( 'amount' ) ?? '' );
		redirectUrl.searchParams.set( 'other', getCheckoutData( 'other' ) ?? '' );
	}
	return redirectUrl.href;
}

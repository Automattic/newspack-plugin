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
	return getCheckoutData( 'is_pending_checkout' );
}

/**
 * Reset the reader checkout data.
 */
export function resetCheckoutData() {
	setCheckoutData();
}

import { EVENTS, emit } from './events.js';

import { getReader } from './index.js';
import Store from './store.js';

/**
 * Reader Activation Library.
 */
export const store = Store();

/**
 * Set the pending checkout URL.
 *
 * @param {string|false} url
 */
export function setPendingCheckout( url = false ) {
	store.set( 'pending_checkout', url, false );
	emit( EVENTS.reader, getReader() );
}

/**
 * Get the pending checkout URL.
 *
 * @return {string|false} Pending checkout URL.
 */
export function getPendingCheckout() {
	return store.get( 'pending_checkout' ) || false;
}

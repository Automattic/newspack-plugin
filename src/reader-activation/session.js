/* globals newspack_reader_data */
/**
 * Internal dependencies
 */
import { getCookie } from './utils';
import { EVENTS, emit } from './events';

let pending = null;
let nonce = ( typeof newspack_reader_data !== 'undefined' && newspack_reader_data?.nonce ) || null;

/**
 * Hydrate the current session by fetching a fresh wp_rest nonce.
 *
 * Call this after authentication to enable authenticated REST API requests
 * without a full page refresh. Concurrent calls share the same in-flight request.
 *
 * @return {Promise<string|null>} The nonce string, or null if hydration failed.
 */
export function hydrateSession() {
	if ( ! pending ) {
		pending = fetchSession().then( data => {
			if ( data?.nonce ) {
				nonce = data.nonce;
				emit( EVENTS.session, data );
			}
			return data?.nonce || null;
		} );
	}
	return pending;
}

/**
 * Get the cached API nonce from a previous hydrateSession call.
 *
 * @return {string|null} The nonce string, or null if not yet hydrated.
 */
export function getApiNonce() {
	return nonce;
}

/**
 * Fetch session data from the hydration endpoint.
 *
 * @return {Promise<Object|null>} The response data, or null on failure.
 */
async function fetchSession() {
	const cid = getCookie( 'newspack-cid' );
	if ( ! cid ) {
		return null;
	}

	try {
		const response = await fetch( '/wp-json/newspack/v1/reader/session', {
			credentials: 'same-origin',
		} );
		if ( ! response.ok ) {
			return null;
		}
		return await response.json();
	} catch {
		return null;
	}
}

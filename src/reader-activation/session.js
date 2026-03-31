/**
 * Internal dependencies
 */
import { getCookie } from './utils';

let pending = null;

/**
 * Hydrate the current session by fetching a fresh wp_rest nonce.
 *
 * Call this after authentication to enable authenticated REST API requests
 * without a full page refresh. Returns the cached nonce on subsequent calls.
 * Concurrent calls share the same in-flight request.
 *
 * @return {Promise<string|null>} The nonce string, or null if hydration failed.
 */
export function hydrateSession() {
	if ( ! pending ) {
		pending = fetchNonce();
	}
	return pending;
}

/**
 * Fetch a fresh wp_rest nonce from the session hydration endpoint.
 *
 * @return {Promise<string|null>} The nonce string, or null on failure.
 */
async function fetchNonce() {
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
		const data = await response.json();
		return data.nonce || null;
	} catch {
		return null;
	}
}

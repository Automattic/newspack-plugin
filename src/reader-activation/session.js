/**
 * Internal dependencies
 */
import { getCookie } from './utils';

let cachedNonce = null;

/**
 * Hydrate the current session by fetching a fresh wp_rest nonce.
 *
 * Call this after authentication to enable authenticated REST API requests
 * without a full page refresh. Returns the cached nonce on subsequent calls.
 *
 * @return {Promise<string|null>} The nonce string, or null if hydration failed.
 */
export async function hydrateSession() {
	if ( cachedNonce ) {
		return cachedNonce;
	}

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
		cachedNonce = data.nonce || null;
		return cachedNonce;
	} catch {
		return null;
	}
}

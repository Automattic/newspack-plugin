/**
 * Internal dependencies
 */
import { getCookie } from './utils';

/**
 * Hydrate the current session by fetching a fresh wp_rest nonce.
 *
 * Call this after authentication to enable authenticated REST API requests
 * without a full page refresh.
 *
 * @return {Promise<string|null>} The nonce string, or null if hydration failed.
 */
export async function hydrateSession() {
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

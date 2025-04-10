/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dom-ready/
 *
 * @param {Function} callback A function to execute after the DOM is ready.
 * @return {void}
 */
export function domReady( callback ) {
	if ( typeof document === 'undefined' ) {
		return;
	}
	if (
		document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
		document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
	) {
		return void callback();
	}
	// DOMContentLoaded has not fired yet, delay callback until then.
	document.addEventListener( 'DOMContentLoaded', callback );
}

/**
 * Get a cookie value given its name.
 *
 * @param {string} name Cookie name.
 *
 * @return {string} Cookie value or empty string if not found.
 */
export function getCookie( name ) {
	if ( ! name ) {
		return '';
	}
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) {
		return decodeURIComponent( parts.pop().split( ';' ).shift() );
	}

	return '';
}

/**
 * Set a cookie.
 *
 * @param {string} name           Cookie name.
 * @param {string} value          Cookie value.
 * @param {number} expirationDays Expiration in days from now.
 */
export function setCookie( name, value, expirationDays = 365 ) {
	const date = new Date();
	date.setTime( date.getTime() + expirationDays * 24 * 60 * 60 * 1000 );
	document.cookie = `${ name }=${ value }; expires=${ date.toUTCString() }; path=/`;
}

/**
 * Generate a random ID with the given length.
 *
 * If entropy is an issue, https://www.npmjs.com/package/nanoid can be used.
 *
 * @param {number} length Length of the ID. Defaults to 9.
 *
 * @return {string} Random ID.
 */
export function generateID( length = 9 ) {
	let randomString = '';
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	for ( let i = 0; i < length; i++ ) {
		const randomIndex = Math.floor( Math.random() * chars.length );
		randomString += chars.charAt( randomIndex );
	}
	return randomString;
}

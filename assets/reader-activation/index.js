/* globals newspack_reader_activation_data */

/**
 * Reader Activation Frontend Library.
 */

/**
 * Constants.
 */
const EVENT_PREFIX = 'newspack-reader-activation';
const EVENTS = {
	reader: 'reader',
};

/**
 * Initialize data.
 */
const store = {};

/**
 * Get a cookie value given its name.
 *
 * @param {string} name Cookie name.
 *
 * @return {string} Cookie value or empty string if not found.
 */
function getCookie( name ) {
	if ( ! name ) {
		return '';
	}
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) return decodeURIComponent( parts.pop().split( ';' ).shift() );
}

/**
 * Set a cookie.
 *
 * @param {string} name           Cookie name.
 * @param {string} value          Cookie value.
 * @param {number} expirationDays Expiration in days from now.
 */
function setCookie( name, value, expirationDays = 365 ) {
	const date = new Date();
	date.setTime( date.getTime() + expirationDays * 24 * 60 * 60 * 1000 );
	document.cookie = `${ name }=${ value }; expires=${ date.toUTCString() }; path=/`;
}

/**
 * Handling events.
 */
const events = Object.values( EVENTS );

/**
 * Get the full event name given its local name.
 *
 * @param {string} localEventName Local event name.
 *
 * @return {string} Full event name or empty string if event name is not valid.
 */
function getEventName( localEventName ) {
	if ( ! events.includes( localEventName ) ) {
		return '';
	}
	return `${ EVENT_PREFIX }-${ localEventName }`;
}

/**
 * Emit a reader activation event.
 *
 * @param {string} event Local event name.
 * @param {*}      data  Data to be emitted.
 */
function emit( event, data ) {
	event = getEventName( event );
	if ( ! event ) {
		throw 'Invalid event';
	}
	window.dispatchEvent( new CustomEvent( event, { detail: data } ) );
}

/**
 * Attach an event listener given a local event name.
 *
 * @param {string}   event    Local event name.
 * @param {Function} callback Callback.
 */
export function on( event, callback ) {
	event = getEventName( event );
	if ( ! event ) {
		throw 'Invalid event';
	}
	window.addEventListener( event, callback );
}

/**
 * Detach an event listener given a local event name.
 *
 * @param {string}   event    Local event name.
 * @param {Function} callback Callback.
 */
export function off( event, callback ) {
	event = getEventName( event );
	if ( ! event ) {
		throw 'Invalid event';
	}
	window.removeEventListener( event, callback );
}

/**
 * Reader functions.
 */

/**
 * Set the current reader.
 *
 * @param {string} email Email.
 */
export function setReaderEmail( email ) {
	if ( ! email ) {
		return;
	}
	if ( ! store.reader ) {
		store.reader = {};
	}
	store.reader.email = email;
	emit( EVENTS.reader, store.reader );
}

/**
 * Set whether the current reader is authenticated.
 *
 * @param {boolean} authenticated Whether the current reader is authenticated. Default is true.
 */
export function setAuthenticated( authenticated = true ) {
	if ( ! store.reader?.email ) {
		throw 'Reader email not set';
	}
	store.reader.authenticated = Boolean( authenticated );
	emit( EVENTS.reader, store.reader );
}

/**
 * Detect whether the current reader is authenticated.
 */
export function refreshAuthentication() {
	const email = getCookie( 'np_auth_reader' );
	if ( email ) {
		setReaderEmail( email );
		setAuthenticated( true );
	} else {
		setReaderEmail( getCookie( 'np_auth_intention' ) );
	}
}

/**
 * Get the current reader.
 *
 * @return {Object} Reader data.
 */
export function getReader() {
	return store.reader;
}

/**
 * Whether the current reader has a valid email link attached to the session.
 *
 * @return {boolean} Whether the current reader has a valid email link attached to the session.
 */
export function hasAuthLink() {
	const reader = getReader();
	const emailLinkSecret = getCookie( 'np_auth_link' );
	return !! ( reader?.email && emailLinkSecret );
}

const authStrategies = [ 'pwd', 'link' ];

/**
 * Get the reader's OTP hash for the current authentication request.
 *
 * @return {string} OTP hash.
 */
export function getOTPHash() {
	return getCookie( 'np_otp_hash' );
}

/**
 * Authenticate reader using an OTP code.
 *
 * @param {number} code OTP code.
 *
 * @return {Promise} Promise.
 */
export function authenticateOTP( code ) {
	return new Promise( ( resolve, reject ) => {
		const hash = getOTPHash();
		const email = getReader()?.email;
		if ( ! hash ) {
			return reject( { message: 'Code has expired', expired: true } );
		}
		if ( ! email ) {
			return reject( { message: 'You must provide an email' } );
		}
		if ( ! code ) {
			return reject( { message: 'Invalid code' } );
		}
		fetch( '', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
			},
			body: new URLSearchParams( {
				action: newspack_reader_activation_data.otp_auth_action,
				email,
				hash,
				code,
			} ),
		} )
			.then( response => response.json() )
			.then( ( { success, message, data } ) => {
				const payload = {
					...data,
					email,
					authenticated: !! success,
					message,
				};
				setAuthenticated( !! success );
				if ( success ) {
					resolve( payload );
				} else {
					reject( payload );
				}
			} );
	} );
}

/**
 * Set the reader preferred authentication strategy.
 *
 * @param {string} strategy Authentication strategy.
 *
 * @return {string} Reader preferred authentication strategy.
 */
export function setAuthStrategy( strategy ) {
	if ( ! authStrategies.includes( strategy ) ) {
		throw 'Invalid authentication strategy';
	}
	setCookie( 'np_auth_strategy', strategy );
	return strategy;
}

/**
 * Get the reader preferred authentication strategy.
 *
 * @return {string} Reader preferred authentication strategy.
 */
export function getAuthStrategy() {
	if ( getOTPHash() ) {
		return 'otp';
	}
	return getCookie( 'np_auth_strategy' );
}

/**
 * Get a captcha token based on user input
 */
export function getCaptchaToken( action = 'submit' ) {
	return new Promise( ( res, rej ) => {
		const { grecaptcha } = window;
		if ( ! grecaptcha || ! newspack_reader_activation_data ) {
			return res( '' );
		}

		const { captcha_site_key: captchaSiteKey } = newspack_reader_activation_data;

		// If the site key is not set, bail with an empty token.
		if ( ! captchaSiteKey ) {
			return res( '' );
		}

		if ( ! grecaptcha?.ready ) {
			rej( 'Error loading the reCaptcha library.' );
		}

		grecaptcha.ready( () => {
			grecaptcha
				.execute( captchaSiteKey, { action } )
				.then( token => res( token ) )
				.catch( e => rej( e ) );
		} );
	} );
}

/**
 * Initialize store data.
 */
function init() {
	const data = newspack_reader_activation_data;
	const initialEmail = data?.authenticated_email || getCookie( 'np_auth_intention' );
	const authenticated = !! data?.authenticated_email;
	store.reader = initialEmail ? { email: initialEmail, authenticated } : null;
	emit( EVENTS.reader, store.reader );
}

init();

const readerActivation = {
	on,
	off,
	setReaderEmail,
	setAuthenticated,
	refreshAuthentication,
	getReader,
	hasAuthLink,
	getOTPHash,
	authenticateOTP,
	setAuthStrategy,
	getAuthStrategy,
	getCaptchaToken,
};
window.newspackReaderActivation = readerActivation;

const clientIDCookieName = newspack_reader_activation_data.cid_cookie;
if ( ! getCookie( clientIDCookieName ) ) {
	// If entropy is an issue, https://www.npmjs.com/package/nanoid can be used.
	const getShortStringId = () => Math.floor( Math.random() * 999999999 ).toString( 36 );
	setCookie( clientIDCookieName, `${ getShortStringId() }${ getShortStringId() }` );
}

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.forEach( fn => fn( readerActivation ) );
window.newspackRAS.push = fn => fn( readerActivation );

export default readerActivation;

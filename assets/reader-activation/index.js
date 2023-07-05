/* globals newspack_ras_config */
window.newspack_ras_config = window.newspack_ras_config || {};

import Store from './store.js';
import { EVENTS, on, off, emit } from './events.js';
import { getCookie, setCookie, generateID } from './utils.js';

import './article-view.js';

/**
 * Reader Activation Library.
 */
export const store = Store();

/**
 * Dispatch reader activity.
 *
 * @param {string} action    Action name.
 * @param {Object} data      Data object.
 * @param {number} timestamp Timestamp. (optional)
 *
 * @return {Object} Activity.
 */
export function dispatchActivity( action, data, timestamp = 0 ) {
	const activity = { action, data, timestamp: timestamp || Date.now() };
	store.add( 'activity', activity );
	emit( EVENTS.activity, activity );
	return activity;
}

/**
 * Get all activities from a given action.
 *
 * @param {string} action
 *
 * @return {Array} Activities.
 */
export function getActivities( action ) {
	const activities = store.get( 'activity' ) || [];
	if ( ! action ) {
		return activities;
	}
	return activities.filter( activity => activity.action === action );
}

/**
 * Get all unique activities from a given action by a given iteratee.
 *
 * @param {string}          action   Action name.
 * @param {string|Function} iteratee Iteratee or a data key.
 *
 * @return {Array} Unique activities.
 */
export function getUniqueActivitiesBy( action, iteratee ) {
	const activities = getActivities( action );
	const unique = [];
	const seen = {};
	for ( const activity of activities ) {
		const value = typeof iteratee === 'function' ? iteratee( activity ) : activity.data[ iteratee ];
		if ( ! seen[ value ] ) {
			unique.push( activity );
			seen[ value ] = true;
		}
	}
	return unique;
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
	const reader = getReader();
	reader.email = email;
	store.set( 'reader', reader, false );
	emit( EVENTS.reader, reader );
}

/**
 * Set whether the current reader is authenticated.
 *
 * @param {boolean} authenticated Whether the current reader is authenticated. Default is true.
 */
export function setAuthenticated( authenticated = true ) {
	const reader = store.get( 'reader' ) || {};
	if ( ! reader.email ) {
		throw new Error( 'Reader email not set' );
	}
	reader.authenticated = Boolean( authenticated );
	store.set( 'reader', reader, false );
	emit( EVENTS.reader, reader );
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
	return store.get( 'reader' ) || {};
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
				action: newspack_ras_config.otp_auth_action,
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
		throw new Error( 'Invalid authentication strategy' );
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
		if ( ! grecaptcha || ! newspack_ras_config ) {
			return res( '' );
		}

		const { captcha_site_key: captchaSiteKey } = newspack_ras_config;

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
 * Ensure the client ID cookie is set.
 */
function fixClientID() {
	const clientIDCookieName = newspack_ras_config.cid_cookie;
	if ( ! getCookie( clientIDCookieName ) ) {
		setCookie( clientIDCookieName, generateID( 12 ) );
	}
}

/**
 * Initialize store data.
 */
function init() {
	const data = newspack_ras_config;
	const initialEmail = data?.authenticated_email || getCookie( 'np_auth_intention' );
	const authenticated = !! data?.authenticated_email;
	const currentReader = getReader();
	const reader = { email: initialEmail || currentReader?.email, authenticated };
	if (
		currentReader?.email !== reader?.email ||
		currentReader?.authenticated !== reader?.authenticated
	) {
		store.set( 'reader', reader, false );
	}
	emit( EVENTS.reader, reader );
	fixClientID();
}

init();

const readerActivation = {
	store,
	on,
	off,
	dispatchActivity,
	getActivities,
	getUniqueActivitiesBy,
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

/**
 * Handle a push to the newspackRAS array.
 *
 * @param {...Array|Function} args Array to dispatchActivity reader activity or
 *                                 function to callback with the
 *                                 readerActivation object.
 */
function handlePush( ...args ) {
	args.forEach( arg => {
		if ( Array.isArray( arg ) && typeof arg[ 0 ] === 'string' ) {
			dispatchActivity( ...arg );
		} else if ( typeof arg === 'function' ) {
			arg( readerActivation );
		} else {
			console.warn( 'Invalid newspackRAS.push argument', arg );
		}
	} );
}

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.forEach( arg => handlePush( arg ) );
window.newspackRAS.push = handlePush;

export default readerActivation;

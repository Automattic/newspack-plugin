/* globals newspack_reader_activation_data */
window.newspack_reader_activation_data = window.newspack_reader_activation_data || {};

import { getCookie, setCookie, generateID } from './utils.js';

/**
 * Reader Activation Frontend Library.
 */

/**
 * Constants.
 */
const EVENT_PREFIX = 'newspack-ras';
const EVENTS = {
	reader: 'reader',
	data: 'data',
	activity: 'activity',
	apiDispatch: 'apiDispatch',
};

/**
 * Initialize data.
 */
export const STORE_KEY = 'newspack-reader';
export const store = Store();

/**
 * Get store.
 *
 * @return {Object} Store.
 */
function Store() {
	const storage = window.localStorage;
	const maxItems = 1000;
	const maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days.

	const encode = object => {
		return JSON.stringify( object );
	};
	const decode = str => {
		if ( ! str ) {
			return {};
		} else if ( 'object' === typeof str ) {
			return str;
		}
		return JSON.parse( str );
	};

	const _get = () => {
		return decode( storage.getItem( STORE_KEY ) ) || {};
	};
	const _set = ( key, value ) => {
		if ( ! key ) {
			throw 'Key is required.';
		}
		const data = _get();
		data[ key ] = value;
		storage.setItem( STORE_KEY, encode( data ) );
		emit( EVENTS.data, { key, value } );
	};

	return {
		get: key => {
			const data = _get();
			if ( ! key ) {
				return data;
			}
			return data[ key ];
		},
		set: _set,
		delete: key => {
			if ( ! key ) {
				throw 'Key is required.';
			}
			const data = _get();
			delete data[ key ];
			storage.setItem( STORE_KEY, encode( data ) );
		},
		add: ( key, value ) => {
			if ( ! key ) {
				throw 'Key is required.';
			}
			const data = _get();
			data[ key ] = data[ key ] || [];
			if ( ! Array.isArray( data[ key ] ) ) {
				throw `Store key '${ key }' is not an array.`;
			}

			// Remove items older than max age if `timestamp` is set.
			if ( maxAge ) {
				const now = Date.now();
				data[ key ] = data[ key ].filter(
					item => ! item.timestamp || now - item.timestamp < maxAge
				);
			}

			data[ key ].push( value );

			// Remove items if max items is reached.
			data[ key ] = data[ key ].slice( -maxItems );

			_set( key, data[ key ] );
		},
	};
}

/**
 * Dispatch activity to the Data Events API.
 *
 * @param {string} action    Action name.
 * @param {Object} data      Data.
 * @param {number} timestamp Timestamp.
 *
 * @return {Promise} Promise.
 */
export function dispatchApi( action, data, timestamp = 0 ) {
	if ( ! newspack_reader_activation_data.dispatch_url ) {
		return Promise.reject( 'No dispatch URL.' );
	}

	const req = new XMLHttpRequest();
	req.open( 'POST', newspack_reader_activation_data.dispatch_url, true );
	req.setRequestHeader( 'Content-Type', 'application/json' );

	const activity = {
		action,
		data,
		timestamp: Math.floor( timestamp || Date.now() / 1000 ),
	};

	// Send request.
	req.send( JSON.stringify( activity ) );

	return new Promise( ( resolve, reject ) => {
		req.onreadystatechange = () => {
			if ( 4 !== req.readyState ) {
				return;
			}
			if ( 200 !== req.status ) {
				reject( req );
			}
			resolve( req );
			emit( EVENTS.apiDispatch, activity );
		};
	} );
}

/**
 * Dispatch reader activity.
 *
 * @param {string}  action    Action name.
 * @param {Object}  data      Data object.
 * @param {boolean} api       Whether to dispatch to the Data Events API. Default false.
 * @param {number}  timestamp Timestamp. (optional)
 *
 * @return {Object} Activity.
 */
export function dispatch( action, data, api = false, timestamp = 0 ) {
	const activity = { action, data, timestamp: timestamp || Date.now() };
	store.add( 'activity', activity );
	emit( EVENTS.activity, activity );
	if ( api ) {
		dispatchApi( activity.action, activity.data, activity.timestamp );
	}
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
	const reader = getReader();
	reader.email = email;
	store.set( 'reader', reader );
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
		throw 'Reader email not set';
	}
	reader.authenticated = Boolean( authenticated );
	store.set( 'reader', reader );
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
 * Ensure the client ID cookie is set.
 */
function fixClientID() {
	const clientIDCookieName = newspack_reader_activation_data.cid_cookie;
	if ( ! getCookie( clientIDCookieName ) ) {
		setCookie( clientIDCookieName, generateID( 12 ) );
	}
}

/**
 * Initialize store data.
 */
function init() {
	const data = newspack_reader_activation_data;
	const initialEmail = data?.authenticated_email || getCookie( 'np_auth_intention' );
	const authenticated = !! data?.authenticated_email;
	const reader = initialEmail ? { email: initialEmail, authenticated } : null;
	store.set( 'reader', reader );
	emit( EVENTS.reader, reader );
	fixClientID();
}

init();

const readerActivation = {
	store,
	on,
	off,
	dispatch,
	dispatchApi,
	getActivities,
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
 * @param {...Array|Function} args Array to dispatch reader activity or
 *                                 function to callback with the
 *                                 readerActivation object.
 */
function handlePush( ...args ) {
	args.forEach( arg => {
		if ( Array.isArray( arg ) && typeof arg[ 0 ] === 'string' ) {
			dispatch( ...arg );
		} else if ( typeof arg === 'function' ) {
			arg( readerActivation );
		} else {
			console.warn( 'Invalid newspackRAS.push argument', arg );
		}
	} );
}

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.forEach( handlePush );
window.newspackRAS.push = handlePush;

export default readerActivation;

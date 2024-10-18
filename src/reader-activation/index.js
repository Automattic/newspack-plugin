/* globals newspack_ras_config, newspack_reader_data */

window.newspack_ras_config = window.newspack_ras_config || {};

import Store from './store.js';
import { getPendingCheckout, setPendingCheckout } from './checkout.js';
import { EVENTS, on, off, emit } from './events.js';
import { getCookie, setCookie, generateID } from './utils.js';
import overlays from './overlays.js';

import setupArticleViewsAggregates from './article-view.js';

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
	const otpHash = getCookie( 'np_otp_hash' );
	return !! ( reader?.email && otpHash );
}

const authStrategies = [ 'pwd', 'link' ];

/**
 * Start the authentication modal with an optional custom callback.
 *
 * @param {Object} config Config.
 */
export function openAuthModal( config = {} ) {
	// Set default config.
	config = {
		...{
			onSuccess: null,
			onDismiss: null,
			onError: null,
			initialState: null,
			skipSuccess: false,
			skipNewslettersSignup: false,
			labels: {
				signin: {
					title: null,
				},
				register: {
					title: null,
				},
			},
			content: null,
			trigger: null,
		},
		...config,
	};

	if ( newspack_ras_config.is_logged_in ) {
		if ( config.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess();
		}
		return;
	}
	if ( readerActivation._openAuthModal ) {
		readerActivation._openAuthModal( config );
	} else {
		console.warn( 'Authentication modal not available' ); // eslint-disable-line no-console
		if ( config.onError && typeof config.onError === 'function' ) {
			config.onError();
		}
	}
}

/**
 * Start the newsletter signup modal with an optional custom callback.
 *
 * @param {Object} config Config.
 */
export function openNewslettersSignupModal( config = {} ) {
	// Set default config.
	config = {
		...{
			onSuccess: null,
			onDissmiss: null,
			onError: null,
			initialState: null,
			skipSuccess: false,
			labels: {},
			content: null,
			closeOnSuccess: true,
		},
		...config,
	};

	if ( readerActivation?._openNewslettersSignupModal ) {
		readerActivation._openNewslettersSignupModal( config );
	} else {
		console.warn( 'Newsletters signup modal not available' ); // eslint-disable-line no-console
		if ( config?.onError && typeof config.onError === 'function' ) {
			config.onError();
		}
	}
}

/**
 * Get the reader's OTP hash for the current authentication request.
 *
 * @return {string} OTP hash.
 */
export function getOTPHash() {
	return getCookie( 'np_otp_hash' );
}

/**
 * OTP timer storage key.
 */
const OTP_TIMER_STORAGE_KEY = 'newspack_otp_timer';

/**
 * Set the OTP timer to the current time.
 */
export function setOTPTimer() {
	localStorage.setItem( OTP_TIMER_STORAGE_KEY, Math.floor( Date.now() / 1000 ) );
}

/**
 * Clear the OTP timer.
 */
export function clearOTPTimer() {
	localStorage.removeItem( OTP_TIMER_STORAGE_KEY );
}

/**
 * Get the time remaining for the OTP timer.
 *
 * @return {number} Time remaining in seconds
 */
export function getOTPTimeRemaining() {
	const timer = localStorage.getItem( OTP_TIMER_STORAGE_KEY );
	if ( ! timer ) {
		return 0;
	}
	const timeRemaining =
		newspack_ras_config.otp_rate_interval - ( Math.floor( Date.now() / 1000 ) - timer );
	if ( ! timeRemaining ) {
		clearOTPTimer();
	}
	return timeRemaining > 0 ? timeRemaining : 0;
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
 * Ensure the client ID cookie is set.
 */
function fixClientID() {
	const clientIDCookieName = newspack_ras_config.cid_cookie;
	if ( ! getCookie( clientIDCookieName ) ) {
		setCookie( clientIDCookieName, generateID( 12 ) );
	}
}

/**
 * Push activities coming from the server.
 */
function pushActivities() {
	const activity = newspack_reader_data?.reader_activity || [];
	activity.forEach( ( { action, data } ) => dispatchActivity( action, data ) );
}

/**
 * Store the referrer.
 */
function setReferrer() {
	const referrer = document.referrer ? new URL( document.referrer ).hostname : '';
	if ( referrer && referrer !== window.location.hostname ) {
		store.set( 'referrer', referrer.replace( 'www.', '' ).trim().toLowerCase() );
	}
}

/**
 * Listen to cookie changes to detect authentication.
 */
function attachAuthCookiesListener() {
	// If the reader is already authenticated, bail.
	if ( getCookie( 'np_auth_reader' ) ) {
		return;
	}
	const interval = setInterval( () => {
		const reader = getReader();
		const intentionCookie = getCookie( 'np_auth_intention' );
		if ( intentionCookie && reader.email !== intentionCookie ) {
			setReaderEmail( intentionCookie );
		} else {
			const authCookie = getCookie( 'np_auth_reader' );
			if ( authCookie ) {
				setReaderEmail( authCookie );
				setAuthenticated( true );
				clearInterval( interval );
			}
		}
	}, 1000 );
}

/**
 * Set the reader as newsletter subscriber once a newsletter form is submitted.
 */
function attachNewsletterFormListener() {
	const newspackForms = [ '.newspack-newsletters-subscribe', '.newspack-subscribe-form' ];
	const thirdPartyForms = [ '.mc4wp-form' ];

	const attachHandler = ( el, eventToListenTo = 'submit' ) => {
		const form = 'FORM' === el.tagName ? el : el.querySelector( 'form' );
		if ( ! form ) {
			return;
		}
		form.addEventListener( eventToListenTo, () => {
			store.set( 'is_newsletter_subscriber', true );
		} );
	};

	// For third-party forms, set reader data on form submit. For first-party forms, listen for the custom event upon successful signup response.
	document.querySelectorAll( thirdPartyForms.join( ',' ) ).forEach( el => attachHandler( el ) );
	document
		.querySelectorAll( newspackForms.join( ',' ) )
		.forEach( el => attachHandler( el, 'newspack-newsletters-subscribe-success' ) );
}

const readerActivation = {
	store,
	overlays,
	on,
	off,
	dispatchActivity,
	getActivities,
	getUniqueActivitiesBy,
	setReaderEmail,
	setAuthenticated,
	refreshAuthentication,
	getReader,
	openNewslettersSignupModal,
	hasAuthLink,
	getOTPHash,
	setOTPTimer,
	clearOTPTimer,
	getOTPTimeRemaining,
	authenticateOTP,
	setAuthStrategy,
	getAuthStrategy,
	setPendingCheckout,
	getPendingCheckout,
	...( newspack_ras_config.is_ras_enabled && { openAuthModal } )
};

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
			console.warn( 'Invalid newspackRAS.push argument', arg ); // eslint-disable-line no-console
		}
	} );
}

/**
 * Initialize.
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
	setupArticleViewsAggregates( readerActivation );
	attachAuthCookiesListener();
	attachNewsletterFormListener();
	pushActivities();
	setReferrer();

	window.newspackReaderActivation = readerActivation;

	window.newspackRAS = window.newspackRAS || [];
	window.newspackRAS.forEach( arg => handlePush( arg ) );
	window.newspackRAS.push = handlePush;

	window.newspackRASInitialized = true;
}

if ( ! window.newspackRASInitialized ) {
	init();
}

export default readerActivation;

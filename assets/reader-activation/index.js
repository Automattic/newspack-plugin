/** globals newspack_reader_activation_data */

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
	store.reader.authenticated = !! authenticated;
	emit( EVENTS.reader, store.reader );
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

/**
 * Initialize store data.
 */
function init() {
	const data = window.newspack_reader_activation_data;
	const initialEmail = data?.authenticated_email || getCookie( data?.auth_intention_cookie );
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
	getReader,
	hasAuthLink,
};
window.newspackReaderActivation = readerActivation;

export default readerActivation;

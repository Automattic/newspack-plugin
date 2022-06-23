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
const data = window.newspack_reader_activation_data;
const initialEmail = data?.reader_email || getCookie( data?.auth_intention_cookie );
const store = {
	reader: initialEmail ? { email: initialEmail } : null,
};

/**
 * Handling events.
 */
const events = Object.values( EVENTS );

/**
 * Get the full event name given its local name.
 *
 * @param {string} localEventName Local event name.
 *
 * @return {string} Full event name.
 */
function getEventName( localEventName ) {
	return `${ EVENT_PREFIX }-${ localEventName }`;
}

/**
 * Attach an event listener given a local event name.
 *
 * @param {string}   event    Local event name.
 * @param {Function} callback Callback.
 */
export function on( event, callback ) {
	if ( events.includes( event ) ) {
		event = getEventName( event );
		window.addEventListener( event, callback );
	}
}

/**
 * Detach an event listener given a local event name.
 *
 * @param {string}   event    Local event name.
 * @param {Function} callback Callback.
 */
export function off( event, callback ) {
	if ( events.includes( event ) ) {
		event = getEventName( event );
		window.removeEventListener( event, callback );
	}
}

/**
 * Reader functions.
 */

/**
 * Set the current reader email.
 *
 * @param {string} email Email.
 */
export function setReader( email ) {
	store.reader = null;
	if ( ! email ) {
		return;
	}
	store.reader = { email };
	/** Emit reader event. */
	const event = new CustomEvent( getEventName( EVENTS.reader ), { detail: store.reader } );
	window.dispatchEvent( event );
}

/**
 * Get the current reader email.
 *
 * @return {string} Email.
 */
export function getReader() {
	return store.reader;
}

const readerActivation = { on, off, setReader, getReader };
window.newspackReaderActivation = readerActivation;

export default readerActivation;

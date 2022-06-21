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
 * Data.
 */
function getCookie( name ) {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ name }=` );
	if ( parts.length === 2 ) return decodeURIComponent( parts.pop().split( ';' ).shift() );
}
const data = window.newspack_reader_activation_data;
const store = {
	reader: data?.reader_email || getCookie( data.intention_cookie ) || null,
};

/**
 * Events.
 */
const events = Object.values( EVENTS );
function getEventName( event ) {
	return `${ EVENT_PREFIX }-${ event }`;
}
export function on( eventName, callback ) {
	if ( events.includes( eventName ) ) {
		eventName = getEventName( eventName );
		window.addEventListener( eventName, callback );
	}
}
export function off( eventName, callback ) {
	if ( events.includes( eventName ) ) {
		eventName = getEventName( eventName );
		window.removeEventListener( eventName, callback );
	}
}

/**
 * Reader functions.
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
export function getReader() {
	return store.reader;
}

const readerActivation = { on, off, setReader, getReader };
window.newspackReaderActivation = readerActivation;
export default readerActivation;

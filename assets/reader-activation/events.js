const EVENT_PREFIX = 'newspack-ras';

export const EVENTS = {
	reader: 'reader',
	data: 'data',
	activity: 'activity',
	apiDispatch: 'apiDispatch',
};

const eventList = Object.values( EVENTS );

/**
 * Get the full event name given its local name.
 *
 * @param {string} localEventName Local event name.
 *
 * @return {string} Full event name or empty string if event name is not valid.
 */
function getEventName( localEventName ) {
	if ( ! eventList.includes( localEventName ) ) {
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
export function emit( event, data ) {
	event = getEventName( event );
	if ( ! event ) {
		throw new Error( 'Invalid event' );
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
		throw new Error( 'Invalid event' );
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
		throw new Error( 'Invalid event' );
	}
	window.removeEventListener( event, callback );
}

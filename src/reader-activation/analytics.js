/**
 * Get a GA4 event payload.
 *
 * @param {Object} payload Event payload.
 * @param {Object} data    Data from the dispatched reader data activity.
 *
 * @return {Object} Event payload.
 */
const getEventPayload = ( payload = {}, data = {} ) => {
	return {
		...payload,
		newspack_popup_id: data?.newspack_popup_id || null,
		gate_post_id: data?.gate_post_id || null,
		referrer: window.location.pathname,
	};
};

/**
 * Send an event to GA4.
 *
 * @param {Object} payload   Event payload.
 * @param {string} eventName Name of the event. Defaults to `np_reader_activation_interaction` but can be overriden if necessary.
 */

const sendEvent = (
	payload,
	eventName = 'np_reader_activation_interaction'
) => {
	if ( 'function' === typeof window.gtag && payload ) {
		window.gtag( 'event', eventName, payload );
	}
};

/**
 * Events to be sent to GA4.
 *
 * @type {Object}
 */
const events = {};

/**
 * Register an event to be sent to GA4.
 *
 * @param {string}   action    Name of the reader data action to register an event for.
 * @param {Function} cb        Callback function that returns the event payload.
 * @param {string}   eventName Name of the event to send. Defaults to `np_{action}`.
 */
export const registerEvent = ( action, cb, eventName = `np_${ action }` ) => {
	// If no callback is provided, use the activity data as the payload.
	if ( ! cb ) {
		cb = data => data;
	}
	events[ action ] = {
		cb,
		eventName,
	};
};

/**
 * Register default events to be sent to GA4.
 */
const registerEvents = () => {
	registerEvent( 'reader_registered', data => ( {
		registration_method: data?.registration_method || 'unknown',
	} ) );
	registerEvent( 'reader_logged_in', data => ( {
		login_method: data?.login_method || 'unknown',
	} ) );
	registerEvent(
		'newsletter_signup',
		data => ( {
			newsletters_subscription_method:
				data?.newsletters_subscription_method || 'unknown',
			lists: data?.lists || [],
		} ),
		'np_newsletter_subscribed'
	);
	registerEvent( 'subscription_cancelled' );
	registerEvent( 'subscription_reactivated' );
};

/**
 * Initialize analytics listeners.
 *
 * @param {Object} ras Reader Activation Library.
 */
export default function init( ras ) {
	registerEvents();

	ras.on( 'activity', function ( ev ) {
		const { action, data } = ev.detail;
		if ( ! events[ action ] ) {
			return;
		}
		const { cb, eventName } = events[ action ];
		const payload = cb( data );
		sendEvent( getEventPayload( payload, data ), eventName );
	} );
}

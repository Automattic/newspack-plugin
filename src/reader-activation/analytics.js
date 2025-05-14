/**
 * Get a GA4 event payload.
 *
 * @param {Object} payload Event payload.
 * @param {Object} data    Data from the dispatched reader data activity.
 *
 * @return {Object} Event payload.
 */
const getEventPayload = ( payload = {}, data = {} ) => {
	const eventPayload = { ...payload };
	if ( data?.newspack_popup_id ) {
		eventPayload.newspack_popup_id = data.newspack_popup_id;
	}
	if ( data?.gate_post_id ) {
		eventPayload.gate_post_id = data.gate_post_id;
	}
	if ( data?.sso ) {
		eventPayload.sso = data.sso;
	}
	return eventPayload;
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
 * Events to be sent to GA4 based on reader data activity dispatch.
 *
 * @type {Object}
 */
const activityEvents = {};

/**
 * Register an event to be sent to GA4 based on a reader data activity dispatch.
 *
 * @param {string}   action    Name of the reader data action to register an event for.
 * @param {Function} cb        Callback function that returns the event payload.
 * @param {string}   eventName Name of the event to send. Defaults to `np_{action}`.
 */
export const registerActivityEvent = ( action, cb, eventName ) => {
	if ( ! eventName ) {
		eventName = `np_${ action }`;
	}
	// If no callback is provided, use the activity data as the payload.
	if ( ! cb ) {
		cb = data => data;
	}
	activityEvents[ action ] = { cb, eventName };
};

/**
 * Register default events to be sent to GA4 based on reader data activity dispatch.
 */
const registerActivityEvents = () => {
	registerActivityEvent( 'reader_registered', data => ( {
		registration_method: data?.registration_method || 'unknown',
	} ) );
	registerActivityEvent( 'reader_logged_in', data => ( {
		login_method: data?.login_method || 'unknown',
	} ) );
	registerActivityEvent(
		'newsletter_signup',
		data => ( {
			newsletters_subscription_method:
				data?.newsletters_subscription_method || 'unknown',
			lists: data?.lists || [],
		} ),
		'np_newsletter_subscribed'
	);
	registerActivityEvent( 'subscription_cancelled' );
	registerActivityEvent( 'subscription_reactivated' );
	registerActivityEvent( 'subscription_switched' );
	registerActivityEvent( 'payment_method_deleted' );
	registerActivityEvent( 'payment_method_added' );
	registerActivityEvent( 'payment_method_changed' );
	registerActivityEvent( 'address_updated' );
	registerActivityEvent( 'product_reordered' );
	registerActivityEvent( 'subscription_renewal_early' );
};

/**
 * Handle a successful newsletter signup.
 *
 * @param {Object} ras Reader Activation Store.
 */
const handleNewsletterSignupSuccess = ras => {
	ras.on( 'activity', function( ev ) {
		if ( 'newsletter_signup' === ev.detail.action && ev.detail.data?.lists?.length ) {
			const payload = getEventPayload(
				{
					newsletters_subscription_method: ev.detail.data?.newsletters_subscription_method || 'unknown',
					lists: ev.detail.data.lists,
				},
				ev.detail.data
			);
			sendEvent( payload, 'np_newsletter_subscribed' );
		}
	} );
}

/**
 * Handle a successful reader registration.
 *
 * @param {Object} ras Reader Activation Store.
 */
const handleRegistrationSuccess = ras => {
	ras.on( 'activity', function( ev ) {
		if (
			'reader_registered' === ev.detail.action &&
			! window?.newspackReaderActivation?.getPendingCheckout()
		) {
			const payload = getEventPayload(
				{
					registration_method: ev.detail.data?.registration_method || 'unknown',
				},
				ev.detail.data
			);
			sendEvent( payload, 'np_reader_registered' );
		}
	} );
}

/**
 * Handle a successful reader login.
 *
 * @param {Object} ras Reader Activation Store.
 */
const handleLoginSuccess = ras => {
	ras.on( 'activity', function( ev ) {
		if ( 'reader_logged_in' === ev.detail.action ) {
			const payload = getEventPayload(
				{
					login_method: ev.detail.data?.login_method || 'unknown',
				},
				ev.detail.data
			);
			sendEvent( payload, 'np_reader_logged_in' );
		}
	} );
};

/**
 * Initialize analytics listeners.
 *
 * @param {Object} ras Reader Activation Library.
 */
export default function init( ras ) {
	handleNewsletterSignupSuccess( ras );
	handleRegistrationSuccess( ras );
	handleLoginSuccess( ras );
	registerActivityEvents();

	ras.on( 'activity', function ( ev ) {
		const { action, data } = ev.detail;
		if ( ! activityEvents[ action ] ) {
			return;
		}
		const { cb, eventName } = activityEvents[ action ];
		const payload = cb( data );
		sendEvent( getEventPayload( payload, data ), eventName );
	} );
}

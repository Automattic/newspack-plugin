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

const sendEvent = ( payload, eventName = 'np_reader_activation_interaction' ) => {
	if ( 'function' === typeof window.gtag && payload ) {
		window.gtag( 'event', eventName, payload );
	}
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
};

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
};

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
 * Initialize the analytics.
 */
export const initAnalytics = () => {
	window.newspackRAS = window.newspackRAS || [];
	window.newspackRAS.push( function( ras ) {
		handleNewsletterSignupSuccess( ras );
		handleRegistrationSuccess( ras );
		handleLoginSuccess( ras );
	} );
};

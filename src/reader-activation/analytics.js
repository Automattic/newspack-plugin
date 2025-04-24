/**
 * Get a GA4 event payload for a given prompt.
 *
 * @param {string} action      Action name for the event.
 * @param {number} promptId    ID of the prompt
 * @param {Object} extraParams Additional key/value pairs to add as params to the event payload.
 *
 * @return {Object} Event payload.
 */

const getEventPayload = ( extraParams = {} ) => {
	return {
		...extraParams,
		referrer: window.location.pathname,
	};
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
			const payload = getEventPayload( {
				referrer: window.location.pathname,
				newsletters_subscription_method: ev.detail.data?.newsletters_subscription_method || 'unknown',
				lists: ev.detail.data.lists,
			} );
			if ( ev.detail.data?.newspack_popup_id ) {
				payload.newspack_popup_id = ev.detail.data.newspack_popup_id;
			}
			if ( ev.detail.data?.gate_post_id ) {
				payload.gate_post_id = ev.detail.data.gate_post_id;
			}
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
			const payload = getEventPayload( {
				referrer: window.location.pathname,
				registration_method: ev.detail.data?.registration_method || 'unknown',
			} );
			if ( ev.detail.data?.newspack_popup_id ) {
				payload.newspack_popup_id = ev.detail.data.newspack_popup_id;
			}
			if ( ev.detail.data?.gate_post_id ) {
				payload.gate_post_id = ev.detail.data.gate_post_id;
			}
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
			const payload = getEventPayload( {
				referrer: window.location.pathname,
				login_method: ev.detail.data?.login_method || 'unknown',
			} );
			if ( ev.detail.data?.newspack_popup_id ) {
				payload.newspack_popup_id = ev.detail.data.newspack_popup_id;
			}
			if ( ev.detail.data?.gate_post_id ) {
				payload.gate_post_id = ev.detail.data.gate_post_id;
			}
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

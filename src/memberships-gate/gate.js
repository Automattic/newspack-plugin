/* globals newspack_memberships_gate */
/**
 * Internal dependencies
 */
import './gate.scss';

const EVENT_NAME = 'np_gate_interaction';

/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dom-ready/
 *
 * @param {Function} callback A function to execute after the DOM is ready.
 * @return {void}
 */
function domReady( callback ) {
	if ( typeof document === 'undefined' ) {
		return;
	}
	if (
		document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
		document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
	) {
		return void callback();
	}
	// DOMContentLoaded has not fired yet, delay callback until then.
	document.addEventListener( 'DOMContentLoaded', callback );
}

// Gate info to send with each event.
// This is mutable so that its properties can be carried from event to event in gate interaction flows.
const gateInfo = {
	...newspack_memberships_gate.metadata,
	referrer: window.location.pathname,
};

/**
 * Reload the page when a newly registered reader is detected.
 */
function initReloadHandlers() {
	window.newspackRAS = window.newspackRAS || [];
	window.newspackRAS.push( function( ras ) {
		let newReader = false;
		let newCheckout = false;
		const refreshPage = function( ev ) {
			if (
				! newReader &&
				'reader_registered' === ev.detail.action &&
				! window?.newspackReaderActivation?.getPendingCheckout()
			) {
				newReader = true;
			}

			const activities = window?.newspackReaderActivation?.getActivities();
			if (
				! newCheckout &&
				activities.length &&
				'checkout_completed' === activities[ activities.length - 1 ]?.action
			) {
				newCheckout = true;
			}

			if ( ! ras.overlays.get().length ) {
				if ( newReader ) {
					handleRegistrationSuccess( ras );
				} else if ( newCheckout ) {
					handleCheckoutSuccess( ras, activities[ activities.length - 1 ] );
				} else {
					newReader = false;
					newCheckout = false;
					handleDismissed();
				}
			}

			// If there are no overlays and a new reader is detected,
			// reload the window, but allow other JS – which might have
			// triggered another overlay – to be executed (setTimeout hack).
			setTimeout( () => {
				if ( ! ras.overlays.get().length && ( newReader || newCheckout ) ) {
					window.location.reload();
				}
			}, 2000 );
		}

		ras.on( 'overlay', refreshPage ); // When an overlay is closed.
		ras.on( 'activity', refreshPage ); // When a newly registered reader is detected.
	} );
}

/**
 * Adds 'memberships_content_gate' hidden input to every form inside the gate.
 *
 * @param {HTMLElement} gate The gate element.
 */
function addFormInputs( gate ) {
	const forms = [
		...document.querySelectorAll( '.newspack-reader-auth form' ), // Auth modal.
		...gate.querySelectorAll( '.newspack-registration form' ), // Registration block.
		...gate.querySelectorAll( '.wp-block-newspack-blocks-checkout-button form' ), // Checkout button block.
		...gate.querySelectorAll( '.wp-block-newspack-blocks-donate form' ), // Donate block.
	];
	forms.forEach( form => {
		if ( ! form.querySelector( 'input[name="memberships_content_gate"]' ) ) {
			const input = document.createElement( 'input' );
			input.type = 'hidden';
			input.name = 'memberships_content_gate';
			input.value = newspack_memberships_gate.metadata?.gate_post_id || '1';
			form.appendChild( input );
			form.addEventListener( 'submit', evt => handleFormSubmission( evt, gate ) );
		}
	} );
}

/**
 * Check if a DOM element is visible.
 */
function isVisible( el ) {
	if ( ! el ) {
		return false;
	}

	return el.offsetWidth > 0 && el.offsetHeight > 0;
}

/**
 * Get the full event payload for GA4.
 *
 * @param {Array}       payload The event payload.
 * @param {HTMLElement} gate    The gate element.
 *
 * @return {Array} The full event payload
 */
function getEventPayload( payload, gate ) {
	if ( gate ) {
		gateInfo.gate_has_donation_block = isVisible( gate.querySelector( '.wp-block-newspack-blocks-donate' ) ) ? 'yes' : 'no';
		gateInfo.gate_has_registration_block = isVisible( gate.querySelector( '.newspack-registration' ) ) ? 'yes' : 'no';
		gateInfo.gate_has_checkout_button = isVisible( gate.querySelector( '.wp-block-newspack-blocks-checkout-button') ) ? 'yes' : 'no';
	}

	return {
		...gateInfo,
		...payload,
	};
}

/**
 * Handle when the gate is seen.
 *
 * @param {HTMLElement} gate The gate element.
 */
function handleSeen( gate ) {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}

	// Add hidden form inputs.
	addFormInputs( gate );
	const payload = {
		action: 'seen',
	};
	window.gtag( 'event', EVENT_NAME, getEventPayload( payload, gate ) );
}

/**
 * Handle when an overlay (auth modal, checkout modal, or post-checkout modal) is dismissed.
 */
function handleDismissed() {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}
	const payload = getEventPayload( {
		action: 'dismissed',
	} );
	window.gtag( 'event', EVENT_NAME, payload );
}

/**
 * Handle when a registration attempt is made from the gate.
 *
 * @param {Event}       evt  The event object.
 * @param {HTMLElement} gate The gate element.
 */
function handleFormSubmission( evt, gate ) {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}
	const payload = { action: 'form_submission' };
	const postedData = new FormData( evt.target );
	const data = {};
	for ( const pair of postedData.entries() ) {
		data[ pair[ 0 ] ] = pair[ 1 ];
	}

	// Parse form data to determine the type of action.
	if ( data['reader-activation-auth-form'] && data.action ) {
		payload.action_type = 'register' === data.action ? 'registration' : 'signin';
	}
	if ( data.newspack_reader_registration ) {
		payload.action_type = 'registration';
	}
	if ( data.newspack_donate ) {
		payload.action_type = 'donation';
		if ( data.donation_currency ) {
			payload.donation_currency = data.donation_currency;
		}
		if ( data.donation_frequency ) {
			payload.donation_frequency = data.donation_frequency;
			if ( data[ `donation_value_${data.donation_frequency}` ] ) {
				payload.donation_amount = data[ `donation_value_${data.donation_frequency}` ];
				if ( 'other' === payload.donation_amount && data[ `donation_value_${data.donation_frequency}_other` ] ) {
					payload.donation_amount = data[ `donation_value_${data.donation_frequency}_other` ];
				}
			}
		}
	}
	if ( data.newspack_checkout ) {
		payload.action_type = 'checkout_button';

		// Product data attached to Checkout Button form.
		const productData = evt.target.getAttribute( 'data-product' ) ? JSON.parse( evt.target.getAttribute( 'data-product' ) ) : null;
		if ( productData ) {
			Object.assign( payload, productData );
		}
	}

	window.gtag( 'event', EVENT_NAME, getEventPayload( payload, gate ) );
}

/**
 * Handle when a registration attempt is successful.
 */
function handleRegistrationSuccess() {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}
	const payload = getEventPayload( {
		action: 'form_submission_success',
		action_type: 'registration',
	} );
	window.gtag( 'event', EVENT_NAME, payload );
}

/**
 * Handle when a checkout attempt is successful.
 *
 * @param {Object} activity The activity object.
 */
function handleCheckoutSuccess( activity = {} ) {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}
	const payload = getEventPayload( {
		action: 'form_submission_success',
		action_type: activity?.data?.action_type || 'unknown',
	} );
	window.gtag( 'event', EVENT_NAME, payload );
}

/**
 * Initializes the overlay gate.
 *
 * @param {HTMLElement} gate The gate element.
 */
function initOverlay( gate ) {
	let entry = document.querySelector( '.entry-content' );
	if ( ! entry ) {
		entry = document.querySelector( '#content' );
	}
	gate.style.removeProperty( 'display' );
	let seen = false;
	const handleScroll = () => {
		const delta = ( entry?.getBoundingClientRect().top || 0 ) - window.innerHeight / 2;
		let visible = false;
		if ( delta < 0 ) {
			visible = true;
			if ( ! seen ) {
				handleSeen( gate );
			}
			seen = true;
		}
		gate.setAttribute( 'data-visible', visible );
	};
	document.addEventListener( 'scroll', handleScroll );
	handleScroll();
}

domReady( function () {
	const gate = document.querySelector( '.newspack-memberships__gate' );
	if ( ! gate ) {
		return;
	}

	initReloadHandlers();
	if ( gate.classList.contains( 'newspack-memberships__overlay-gate' ) ) {
		initOverlay( gate );
	} else {
		// Seen event for inline gate.
		const detectSeen = () => {
			const delta =
				( gate?.getBoundingClientRect().top || 0 ) -
				window.innerHeight / 2;
			if ( delta < 0 ) {
				if ( 'function' === typeof window.gtag ) {
					handleSeen( gate );
					document.removeEventListener( 'scroll', detectSeen );
				}
			}
		};
		document.addEventListener( 'scroll', detectSeen );
		detectSeen();
	}
} );

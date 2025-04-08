/* globals newspack_memberships_gate */
/**
 * Internal dependencies
 */
import './gate.scss';

const EVENT_NAME = 'np_gate_interaction';

// Gate info to send with each event.
// This is mutable so that its properties can be carried from event to event in gate interaction flows.
let gateInfo = {
	...newspack_memberships_gate.metadata,
	referrer: window.location.pathname,
};

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

/**
 * Reload the page when a newly registered reader is detected.
 */
function initReloadHandler() {
	window.newspackRAS = window.newspackRAS || [];
	window.newspackRAS.push( function( ras ) {
		const refreshPage = function() {
			// If there are no overlays and a reader is detected,
			// reload the window, but allow other JS – which might have
			// triggered another overlay – to be executed (setTimeout hack).
			const dismissed = ! ras.overlays.get().length;
			if ( dismissed ) {
				setTimeout( () => {
					// Reload the page if a newly registered reader is detected.
					if ( newReader ) {
						window.location.reload();
					} else {
						handleDismissed();
					}
				}, 2000 )
			}
		};
		let newReader = false;

		ras.on( 'overlay', refreshPage ); // When an overlay is closed.
		ras.on( 'reader', function( ev ) { // When a newly registered reader is detected.
			if (
				! newReader &&
				ev.detail.authenticated &&
				! window?.newspackReaderActivation?.getPendingCheckout() &&
				( ! newspack_memberships_gate.metadata?.logged_in || 'no' === newspack_memberships_gate.metadata?.logged_in )
			) {
				newReader = true;
				handleRegistrationSuccess();
				refreshPage();
			}
		} );
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
			input.value = '1';
			form.appendChild( input );
		}

		form.addEventListener( 'submit', evt => handleFormSubmission( evt, gate ) );
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
	gateInfo = {
		...gateInfo,
		...payload,
	}
	if ( gate ) {
		gateInfo.gate_has_donation_block = isVisible( gate.querySelector( '.wp-block-newspack-blocks-donate' ) ) ? 'yes' : 'no';
		gateInfo.gate_has_registration_block = isVisible( gate.querySelector( '.newspack-registration' ) ) ? 'yes' : 'no';
		gateInfo.gate_has_checkout_button = isVisible( gate.querySelector( '.wp-block-newspack-blocks-checkout-button') ) ? 'yes' : 'no';
	}

	return gateInfo;
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
 * Handle when the gate is dismissed.
 */
function handleDismissed() {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}
	const payload = {
		action: 'dismissed',
	};
	window.gtag( 'event', EVENT_NAME, getEventPayload( payload ) );
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

	// Product data attached to Checkout Button form.
	const productData = evt.target.getAttribute( 'data-product' ) ? JSON.parse( evt.target.getAttribute( 'data-product' ) ) : null;
	if ( productData ) {
		Object.assign( payload, productData );
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
	}
	if ( data.newspack_checkout ) {
		payload.action_type = 'paid_membership';
	}

	window.gtag( 'event', EVENT_NAME, getEventPayload( payload, gate ) );
}

// TODO: Event to track checkout button click.

// TODO: Event to track dismissal of checkout modal or auth modal.

// TODO: Event to track checkout form submission.

// TODO: Deprecate back-end GA4 events.

/**
 * Handle when a registration attempt is successful.
 */
function handleRegistrationSuccess() {
	if ( 'function' !== typeof window.gtag ) {
		return;
	}
	const payload = {
		action: 'form_submission_success',
		action_type: 'registration',
	};
	window.gtag( 'event', EVENT_NAME, getEventPayload( payload ) );
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

	initReloadHandler();
	if ( gate.classList.contains( 'newspack-memberships__overlay-gate' ) ) {
		initOverlay( gate );
	} else {
		// Seen event for inline gate.
		const detectSeen = () => {
			const delta =
				( gate?.getBoundingClientRect().top || 0 ) -
				window.innerHeight / 2;
			if ( delta < 0 ) {
				handleSeen( gate );
				document.removeEventListener( 'scroll', detectSeen );
			}
		};
		document.addEventListener( 'scroll', detectSeen );
		detectSeen();
	}
} );

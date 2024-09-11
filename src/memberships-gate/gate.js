/* globals newspack_memberships_gate */
/**
 * Internal dependencies
 */
import './gate.scss';

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
 * Adds 'memberships_content_gate' hidden input to every form inside the gate.
 *
 * @param {HTMLElement} gate The gate element.
 */
function addFormInputs( gate ) {
	const forms = [
		...gate.querySelectorAll( 'form' ),
		...document.querySelectorAll( '.newspack-reader-auth form' ),
	];
	forms.forEach( form => {
		const input = document.createElement( 'input' );
		input.type = 'hidden';
		input.name = 'memberships_content_gate';
		input.value = '1';
		form.appendChild( input );
	} );
}

/**
 * Get the full event payload for GA4.
 *
 * @param {Array} payload The event payload.
 *
 * @return {Array} The full event payload
 */
function getEventPayload( payload ) {
	return {
		...newspack_memberships_gate.metadata,
		...payload,
	}
}

/**
 * Handle when the gate is seen.
 */
function handleSeen( gate ) {
	// Add form inputs.
	addFormInputs( gate );
	// Push gate 'seen' event to Google Analytics.
	const eventName = 'np_gate_interaction';
	const payload = {
		action: 'seen',
	};
	if ( 'function' === typeof window.gtag && payload ) {
		window.gtag( 'event', eventName, getEventPayload( payload ) );
	}
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

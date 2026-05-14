/**
 * Search Overlay Block — Frontend Script
 *
 * Initializes a self-contained search overlay for each block instance on the
 * page. Multiple instances work independently: each trigger opens only its own
 * panel. When Jetpack Instant Search rendered the trigger as
 * `.jetpack-search-filter__link`, no panel exists and this controller bails.
 */

/**
 * Internal dependencies
 */
import { domReady } from '../../utils';

const init = trigger => {
	const panelId = trigger.getAttribute( 'aria-controls' );
	const panel = panelId ? document.getElementById( panelId ) : null;
	if ( ! panel ) {
		// Jetpack path or markup mismatch — nothing to wire up.
		return;
	}

	const closeBtn = panel.querySelector( '.newspack-search-overlay__close' );

	let isOpen = false;
	let originalParent = panel.parentNode;
	let originalNextSibling = panel.nextSibling;

	const openOverlay = () => {
		if ( isOpen ) {
			return;
		}
		isOpen = true;

		// Capture original location so we can restore on close.
		originalParent = panel.parentNode;
		originalNextSibling = panel.nextSibling;

		// Move to body so position:fixed isn't affected by ancestor transforms.
		document.body.appendChild( panel );

		// ARIA state.
		trigger.setAttribute( 'aria-expanded', 'true' );
		panel.setAttribute( 'aria-hidden', 'false' );
		panel.removeAttribute( 'inert' );

		// Body class for theme hooks.
		document.body.classList.add( `menu-open--search-overlay-${ panelId }` );
	};

	const closeOverlay = () => {
		if ( ! isOpen ) {
			return;
		}
		isOpen = false;

		// Restore ARIA state.
		trigger.setAttribute( 'aria-expanded', 'false' );
		panel.setAttribute( 'aria-hidden', 'true' );
		panel.setAttribute( 'inert', '' );
		document.body.classList.remove( `menu-open--search-overlay-${ panelId }` );

		// Move panel back to its original DOM location.
		if ( originalParent ) {
			try {
				if ( originalNextSibling && originalNextSibling.parentNode === originalParent ) {
					originalParent.insertBefore( panel, originalNextSibling );
				} else {
					originalParent.appendChild( panel );
				}
			} catch {
				document.body.appendChild( panel );
			}
		}
	};

	trigger.addEventListener( 'click', e => {
		e.preventDefault();
		if ( isOpen ) {
			closeOverlay();
		} else {
			openOverlay();
		}
	} );

	if ( closeBtn ) {
		closeBtn.addEventListener( 'click', e => {
			e.preventDefault();
			closeOverlay();
		} );
	}
};

domReady( () => {
	document.querySelectorAll( '.newspack-search-overlay__trigger[aria-controls]' ).forEach( init );
} );

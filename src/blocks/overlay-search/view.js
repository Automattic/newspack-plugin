/**
 * Overlay Search Block — Frontend Script
 *
 * Initializes a self-contained search overlay for each block instance on the
 * page. Multiple instances work independently: each trigger opens only its own
 * panel. When Jetpack Instant Search rendered the trigger as
 * `.jetpack-search-filter__link`, no panel exists and this controller bails.
 */

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

const FOCUSABLE_SELECTOR =
	'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
	'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), iframe, object, embed, ' +
	'[contenteditable="true"]';

/**
 * Pick black or white for legibility against a background color, using the same
 * YIQ formula as the plugin's `getContrast` helper (packages/components/src/utils/color.ts).
 *
 * Reads the panel's already-resolved CSS background via getComputedStyle so it
 * works for hex, rgba, and theme-token defaults uniformly.
 *
 * @param {HTMLElement} el Element whose computed background-color drives the choice.
 * @return {string} 'black' or 'white'.
 */
const pickContrastColor = el => {
	const bg = window.getComputedStyle( el ).backgroundColor;
	const match = bg.match( /rgba?\(([^)]+)\)/ );
	if ( ! match ) {
		return 'white';
	}
	const [ r, g, b ] = match[ 1 ].split( ',' ).map( s => parseFloat( s.trim() ) );
	if ( ! Number.isFinite( r ) || ! Number.isFinite( g ) || ! Number.isFinite( b ) ) {
		return 'white';
	}
	const yiq = ( r * 299 + g * 587 + b * 114 ) / 1000;
	return yiq >= 128 ? 'black' : 'white';
};

const getVisibleFocusable = container =>
	Array.from( container.querySelectorAll( FOCUSABLE_SELECTOR ) ).filter( el => {
		try {
			const rect = el.getBoundingClientRect();
			const style = window.getComputedStyle( el );
			return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && ! el.hasAttribute( 'hidden' );
		} catch {
			return false;
		}
	} );

const init = trigger => {
	const panelId = trigger.getAttribute( 'aria-controls' );
	const panel = panelId ? document.getElementById( panelId ) : null;
	if ( ! panel ) {
		return;
	}

	const closeBtn = panel.querySelector( '.newspack-overlay-search__close' );

	// Set close-button color to whichever of black/white contrasts the panel's
	// resolved background.
	if ( closeBtn ) {
		closeBtn.style.color = pickContrastColor( panel );
	}

	// Captured once. Reassigning on every open is unsafe: if a previous close ever
	// fell through to the `document.body` fallback, the next open would record
	// `document.body` as "original" and the panel would be stranded there.
	const originalParent = panel.parentNode;
	const originalNextSibling = panel.nextSibling;

	let isOpen = false;
	let lastFocused = null;
	let focusTrapCleanup = null;
	let escCleanup = null;

	const trapFocus = () => {
		const handleKeyDown = e => {
			if ( e.key !== 'Tab' ) {
				return;
			}
			const focusable = getVisibleFocusable( panel );
			if ( ! focusable.length ) {
				e.preventDefault();
				return;
			}
			const first = focusable[ 0 ];
			const last = focusable[ focusable.length - 1 ];
			const active = panel.ownerDocument.activeElement;
			if ( e.shiftKey && active === first ) {
				e.preventDefault();
				last.focus();
			} else if ( ! e.shiftKey && active === last ) {
				e.preventDefault();
				first.focus();
			}
		};
		document.addEventListener( 'keydown', handleKeyDown, true );
		return () => document.removeEventListener( 'keydown', handleKeyDown, true );
	};

	const openOverlay = () => {
		if ( isOpen ) {
			return;
		}
		isOpen = true;

		lastFocused = trigger.ownerDocument.activeElement;

		document.body.appendChild( panel );

		trigger.setAttribute( 'aria-expanded', 'true' );
		panel.setAttribute( 'aria-hidden', 'false' );
		panel.removeAttribute( 'inert' );
		document.body.classList.add( `menu-open--overlay-search-${ panelId }` );

		focusTrapCleanup = trapFocus();

		const onEsc = e => {
			if ( e.key === 'Escape' ) {
				closeOverlay();
			}
		};
		document.addEventListener( 'keydown', onEsc );
		escCleanup = () => document.removeEventListener( 'keydown', onEsc );

		// Focus the search input on the next paint. Two `requestAnimationFrame`s
		// guarantee that the panel's `aria-hidden`/`inert` flips and the CSS
		// transition's first frame have committed before we try to focus —
		// otherwise the input may still be considered hidden by some browsers.
		// Survives `prefers-reduced-motion` (transitions collapse to 0s) where a
		// fixed `setTimeout` would either fire too early or hold focus too long.
		// The `isOpen` guard prevents the callback from stealing focus back into
		// the panel if the user closed the overlay before the frame landed.
		requestAnimationFrame( () => {
			requestAnimationFrame( () => {
				if ( ! isOpen ) {
					return;
				}
				const searchInput = panel.querySelector( 'input[type="search"]' );
				const focusTarget = searchInput || getVisibleFocusable( panel )[ 0 ] || closeBtn;
				if ( focusTarget && document.contains( focusTarget ) ) {
					focusTarget.focus();
				}
			} );
		} );
	};

	const closeOverlay = () => {
		if ( ! isOpen ) {
			return;
		}
		isOpen = false;

		if ( focusTrapCleanup ) {
			focusTrapCleanup();
			focusTrapCleanup = null;
		}
		if ( escCleanup ) {
			escCleanup();
			escCleanup = null;
		}

		trigger.setAttribute( 'aria-expanded', 'false' );
		panel.setAttribute( 'aria-hidden', 'true' );
		panel.setAttribute( 'inert', '' );
		document.body.classList.remove( `menu-open--overlay-search-${ panelId }` );

		// Return focus to the element that had focus when we opened — usually
		// the trigger, but fall back to it if for some reason that element is
		// gone.
		const focusTarget = lastFocused && document.contains( lastFocused ) ? lastFocused : trigger;
		focusTarget.focus();

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

	// Click on the panel background (outside the search form / close button)
	// closes the overlay. Clicks on any child element bubble with that element
	// as e.target, so only true scrim clicks satisfy this check.
	panel.addEventListener( 'click', e => {
		if ( e.target === panel ) {
			closeOverlay();
		}
	} );
};

domReady( () => {
	document.querySelectorAll( '.newspack-overlay-search__trigger[aria-controls]' ).forEach( init );
} );

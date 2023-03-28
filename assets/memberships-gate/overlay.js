/**
 * Internal dependencies
 */
import './overlay.scss';

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

domReady( function () {
	const overlay = document.querySelector( '.newspack-memberships__overlay-gate' );
	if ( ! overlay ) {
		return;
	}
	let entry = document.querySelector( '.entry-content' );
	if ( ! entry ) {
		entry = document.querySelector( '#content' );
	}
	if ( overlay ) {
		overlay.style.removeProperty( 'display' );
		const handleScroll = () => {
			const delta = ( entry?.getBoundingClientRect().top || 0 ) - window.innerHeight / 2;
			if ( delta < 0 ) {
				overlay.setAttribute( 'data-visible', 'true' );
			} else {
				overlay.setAttribute( 'data-visible', 'false' );
			}
		};
		document.addEventListener( 'scroll', handleScroll );
		handleScroll();
	}
} );

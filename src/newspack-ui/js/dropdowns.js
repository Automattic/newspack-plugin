/**
 * Dropdown menu functionality.
 */

import { domReady } from '../../utils';

domReady( function () {
	const dropdowns = [ ...document.querySelectorAll( '.newspack-ui__dropdown' ) ];
	dropdowns.forEach( dropdown => {
		const toggle = dropdown.querySelector( '.newspack-ui__dropdown__toggle' );
		const content = dropdown.querySelector( '.newspack-ui__dropdown__content' );

		if ( toggle && content ) {
			toggle.addEventListener( 'click', () => {
				dropdown.classList.toggle( 'active' );

				const rect = content.getBoundingClientRect();
				const viewportWidth = window.innerWidth;

				// If content would overflow the right edge of viewport.
				if ( rect.right + rect.width > viewportWidth ) {
					const contentWidth = rect.width;
					content.style.left = `calc(100% - ${ contentWidth }px - var(--newspack-ui-spacer-base))`;
				} else {
					// Reset position if no overflow
					content.style.left = 'calc(100% - var(--newspack-ui-spacer-6))';
				}
			} );
		}
		document.addEventListener( 'keydown', e => {
			if ( e.key === 'Escape' ) {
				dropdown.classList.remove( 'active' );
			}
		} );
		document.addEventListener( 'click', e => {
			if ( ! dropdown.contains( e.target ) && dropdown.classList.contains( 'active' ) ) {
				dropdown.classList.remove( 'active' );
			}
		} );
	} );
} );

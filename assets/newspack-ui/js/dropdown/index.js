import { domReady } from '../utils'; // Global utils.

domReady( function () {
	function toggle_dropdown( element ) {
		const button = element.querySelector( ':scope > .newspack-ui__button' );

		button.addEventListener( 'click', function () {
			const openDropdowns = document.querySelectorAll( '.dropdown-opened' );
			openDropdowns.forEach( openDD => {
				if ( openDD !== element ) {
					openDD.classList.remove( 'dropdown-opened' );
				}
			} );
			element.classList.toggle( 'dropdown-opened' );
		} );
	}

	[ ...document.querySelectorAll( '.newspack-ui__dropdown' ) ].forEach( x => toggle_dropdown( x ) );
} );

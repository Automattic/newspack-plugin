import { domReady } from '../utils'; // Global utils.

domReady( function () {
	function toggle_section( element ) {
		const toggle_header = element.querySelector( '.newspack-ui__toggle-section__header' );
		toggle_header.addEventListener( 'click', function () {
			element.classList.toggle( 'expanded' );
		} );
	}

	[ ...document.querySelectorAll( '.newspack-ui__toggle-section' ) ].forEach( x =>
		toggle_section( x )
	);
} );

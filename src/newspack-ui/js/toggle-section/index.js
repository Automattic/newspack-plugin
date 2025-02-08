/* globals jQuery */
import { domReady } from '../utils'; // Global utils.

function update_toggle_section() {
	function toggle_section( element ) {
		const toggle_header = element.querySelector( '.newspack-ui__toggle-section__header' );
		toggle_header.addEventListener( 'click', function () {
			element.classList.toggle( 'expanded' );
		} );
	}

	[ ...document.querySelectorAll( '.newspack-ui__toggle-section' ) ].forEach( x =>
		toggle_section( x )
	);
}

domReady( function () {
	update_toggle_section();

	// Fire again specifically for the Transaction Details:
	if ( jQuery ) {
		jQuery( document ).on( 'updated_checkout', function() {
			update_toggle_section();
		} );
	}
} );

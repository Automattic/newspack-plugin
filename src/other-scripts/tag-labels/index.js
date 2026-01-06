/* globals jQuery */

( function ( $ ) {
	$( '.newspack-label-enable input[type="checkbox"]' ).on( 'change', function () {
		if ( $( this ).is( ':checked' ) ) {
			$( '.newspack-label-setting input' ).prop( 'disabled', false );
		} else {
			$( '.newspack-label-setting input' ).prop( 'disabled', true );
		}
	} );
} )( jQuery );

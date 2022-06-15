( function ( $, readerActivation ) {
	$( document ).ready( function () {
		$( '.newspack-reader-registration form' ).on( 'submit', function ( ev ) {
			ev.preventDefault();
			const url = $( this ).attr( 'action' ) || window.location.pathname;
			$.ajax( {
				url,
				type: 'POST',
				data: $( this ).serialize(),
				dataType: 'json',
				accepts: {
					text: 'application/json',
				},
				success: ( { message, email } ) => {
					console.log( message );
					readerActivation.setReader( { email } );
				},
				error: err => {
					console.log( err );
				},
			} );
		} );
	} );
	readerActivation.on( 'reader', function ( ev ) {
		console.log( ev );
	} );
} )( window.jQuery, window.newspackReaderActivation );

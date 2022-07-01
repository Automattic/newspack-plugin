( function ( readerActivation ) {
	if ( ! readerActivation ) {
		return;
	}
	[ ...document.querySelectorAll( '.newspack-reader-account-link' ) ].forEach( menuItem => {
		menuItem.querySelector( 'a' ).addEventListener( 'click', function ( ev ) {
			/** If logged in, allow page redirection. */
			if ( menuItem.classList.contains( 'logged-in' ) ) {
				return;
			}
			ev.preventDefault();
		} );
	} );
} )( window.newspackReaderActivation );

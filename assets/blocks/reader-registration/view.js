/**
 * Internal dependencies
 */
import './style.scss';

( function ( readerActivation ) {
	[ ...document.querySelectorAll( '.newspack-reader-registration' ) ].forEach( container => {
		const form = container.querySelector( 'form' );
		form.addEventListener( 'submit', ev => {
			ev.preventDefault();
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body: new FormData( form ),
			} ).then( res => {
				res.json().then( ( { message, email } ) => {
					const messageNode = document.createElement( 'p' );
					messageNode.innerHTML = message;
					messageNode.className = `message status-${ res.status }`;
					container.replaceChild( messageNode, form );
					if ( res.status === 200 && email ) {
						readerActivation.setReader( email );
					}
				} );
			} );
		} );
	} );
} )( window.newspackReaderActivation );

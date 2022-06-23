/**
 * Internal dependencies
 */
import './style.scss';

( function ( readerActivation ) {
	if ( ! readerActivation ) {
		return;
	}
	[ ...document.querySelectorAll( '.newspack-reader-registration' ) ].forEach( container => {
		const form = container.querySelector( 'form' );
		if ( ! form ) {
			return;
		}
		readerActivation.on( 'reader', ( { detail: { email } } ) => {
			if ( email ) {
				form.style.display = 'none';
			}
		} );
		form.addEventListener( 'submit', ev => {
			ev.preventDefault();
			const body = new FormData( form );
			if ( ! body.has( 'email' ) || ! body.get( 'email' ) ) {
				return;
			}
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
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

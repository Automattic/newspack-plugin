/**
 * Internal dependencies
 */
import './style.scss';

( function ( readerActivation ) {
	if ( ! readerActivation ) {
		return;
	}
	[ ...document.querySelectorAll( '.newspack-registration' ) ].forEach( container => {
		const form = container.querySelector( 'form' );
		if ( ! form ) {
			return;
		}
		const messageElement = container.querySelector( '.newspack-registration__response' );
		const submitElement = form.querySelector( 'input[type="submit"]' );
		readerActivation.on( 'reader', ( { detail: { email } } ) => {
			if ( email ) {
				form.style.display = 'none';
			}
		} );

		const endLoginFlow = ( message, status, data ) => {
			const messageNode = document.createElement( 'p' );
			messageNode.innerHTML = message;
			messageNode.className = `message status-${ status }`;
			if ( status === 200 ) {
				container.replaceChild( messageNode, form );
				if ( data?.email ) {
					readerActivation.setReader( data.email );
				}
			} else {
				messageElement.appendChild( messageNode );
			}
		};

		form.addEventListener( 'submit', ev => {
			ev.preventDefault();
			const body = new FormData( form );
			if ( ! body.has( 'email' ) || ! body.get( 'email' ) ) {
				return;
			}
			submitElement.disabled = true;
			messageElement.innerHTML = '';
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} ).then( res => {
				submitElement.disabled = false;
				res.json().then( ( { message, data } ) => endLoginFlow( message, res.status, data ) );
			} );
		} );
	} );
} )( window.newspackReaderActivation );

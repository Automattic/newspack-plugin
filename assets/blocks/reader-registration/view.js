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
		const messageContainer = container.querySelector(
			'.newspack-newsletters-registration-response'
		);
		const submit = form.querySelector( 'input[type="submit"]' );
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
			submit.disabled = true;
			messageContainer.innerHTML = '';
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} ).then( res => {
				submit.disabled = false;
				res.json().then( ( { message, data } ) => {
					const messageNode = document.createElement( 'p' );
					messageNode.innerHTML = message;
					messageNode.className = `message status-${ res.status }`;
					if ( res.status === 200 ) {
						container.replaceChild( messageNode, form );
						if ( data?.email ) {
							readerActivation.setReaderEmail( data.email );
						}
					} else {
						messageContainer.appendChild( messageNode );
					}
				} );
			} );
		} );
	} );
} )( window.newspackReaderActivation );

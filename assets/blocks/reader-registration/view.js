/**
 * Internal dependencies
 */
import './style.scss';

( function ( readerActivation ) {
	window.onload = function () {
		if ( ! readerActivation ) {
			return;
		}
		document.querySelectorAll( '.newspack-registration' ).forEach( container => {
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
					container.classList.remove( 'error' );
					container.classList.add( 'success' );
					container.replaceChild( messageNode, form );
					if ( data?.email ) {
						readerActivation.setReader( data.email );
					}
				} else {
					container.classList.add( 'error' );
					container.classList.remove( 'success' );
					messageElement.appendChild( messageNode );
				}
			};

			form.addEventListener( 'submit', ev => {
				ev.preventDefault();
				const body = new FormData( form );
				if ( ! body.has( 'email' ) || ! body.get( 'email' ) ) {
					return;
				}
				form.style.opacity = 0.5;
				submitElement.disabled = true;
				messageElement.innerHTML = '';
				fetch( form.getAttribute( 'action' ) || window.location.pathname, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
					},
					body,
				} )
					.then( res => {
						res.json().then( ( { message, data } ) => endLoginFlow( message, res.status, data ) );
					} )
					.finally( () => {
						submitElement.disabled = false;
						form.style.opacity = 1;
					} );
			} );
		} );
	};
} )( window.newspackReaderActivation );

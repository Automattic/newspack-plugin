/**
 * Internal dependencies
 */
import './style.scss';

( function ( readerActivation ) {
	window.onload = function () {
		if ( ! readerActivation ) {
			return;
		}
		[ ...document.querySelectorAll( '.newspack-registration' ) ].forEach( container => {
			const form = container.querySelector( 'form' );
			if ( ! form ) {
				return;
			}
			const messageContainer = container.querySelector( '.newspack-registration__response' );
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
				form.style.opacity = 0.5;
				submit.disabled = true;
				messageContainer.innerHTML = '';
				fetch( form.getAttribute( 'action' ) || window.location.pathname, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
					},
					body,
				} )
					.then( res => {
						res.json().then( ( { message, data } ) => {
							const messageNode = document.createElement( 'p' );
							messageNode.innerHTML = message;
							messageNode.className = `message status-${ res.status }`;
							if ( res.status === 200 ) {
								container.classList.remove( 'error' );
								container.classList.add( 'success' );
								container.replaceChild( messageNode, form );
								if ( data?.email ) {
									readerActivation.setReader( data.email );
								}
							} else {
								container.classList.add( 'error' );
								container.classList.remove( 'success' );
								messageContainer.appendChild( messageNode );
							}
						} );
					} )
					.finally( () => {
						submit.disabled = false;
						form.style.opacity = 1;
					} );
			} );
		} );
	};
} )( window.newspackReaderActivation );

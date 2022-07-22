/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dom-ready/
 *
 * @param {Function} callback A function to execute after the DOM is ready.
 * @return {void}
 */
function domReady( callback ) {
	if ( typeof document === 'undefined' ) {
		return;
	}
	if (
		document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
		document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
	) {
		return void callback();
	}
	// DOMContentLoaded has not fired yet, delay callback until then.
	document.addEventListener( 'DOMContentLoaded', callback );
}

( function ( readerActivation ) {
	domReady( function () {
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
			const successElement = container.querySelector( '.newspack-registration__success' );

			readerActivation.on( 'reader', ( { detail: { authenticated } } ) => {
				if ( authenticated ) {
					form.style.display = 'none';
				}
			} );

			const endLoginFlow = ( message, status, data ) => {
				if ( status === 200 ) {
					successElement.classList.remove( 'newspack-registration--hidden' );
					form.remove();
					if ( data?.email ) {
						readerActivation.setReaderEmail( data.email );
					}
					readerActivation.setAuthenticated( data?.authenticated );
				} else {
					const messageNode = document.createElement( 'p' );
					messageNode.innerHTML = message;
					messageNode.className = `message status-${ status }`;
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
	} );
} )( window.newspackReaderActivation );

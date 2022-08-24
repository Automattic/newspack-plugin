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
			let successElement = container.querySelector(
				'.newspack-registration__registration-success'
			);

			readerActivation.on( 'reader', ( { detail: { authenticated } } ) => {
				if ( authenticated ) {
					form.style.display = 'none';
				}
			} );

			form.startLoginFlow = () => {
				messageElement.classList.add( 'newspack-registration--hidden' );
				messageElement.innerHTML = '';
				submitElement.disabled = true;
				container.classList.add( 'newspack-registration--in-progress' );
			};

			form.endLoginFlow = ( message = null, status = 500, data = null ) => {
				let messageNode;

				if ( data?.existing_user ) {
					successElement = container.querySelector( '.newspack-registration__login-success' );
				}

				if ( message ) {
					messageNode = document.createElement( 'p' );
					messageNode.classList.add( 'has-text-align-center' );
					messageNode.textContent = message;

					const defaultMessage = successElement.querySelector( 'p' );
					if ( defaultMessage && data?.sso ) {
						defaultMessage.replaceWith( messageNode );
					}
				}

				const isSuccess = status === 200;
				container.classList.add( `newspack-registration--${ isSuccess ? 'success' : 'error' }` );
				if ( isSuccess ) {
					successElement.classList.remove( 'newspack-registration--hidden' );
					form.remove();
					if ( data?.email ) {
						readerActivation.setReaderEmail( data.email );
						// Set authenticated only if email is set, otherwise an error will be thrown.
						readerActivation.setAuthenticated( data?.authenticated );
					}
				} else if ( messageNode ) {
					messageElement.appendChild( messageNode );
					messageElement.classList.remove( 'newspack-registration--hidden' );
				}
				submitElement.disabled = false;
				container.classList.remove( 'newspack-registration--in-progress' );
			};

			form.addEventListener( 'submit', ev => {
				ev.preventDefault();

				readerActivation
					.getCaptchaToken()
					.then( captchaToken => {
						if ( ! captchaToken ) {
							return;
						}
						const tokenField = document.createElement( 'input' );
						tokenField.setAttribute( 'type', 'hidden' );
						tokenField.setAttribute( 'name', 'captcha_token' );
						tokenField.value = captchaToken;
						form.appendChild( tokenField );
					} )
					.catch( e => {
						form.endLoginFlow( e, 400 );
					} )
					.finally( () => {
						const body = new FormData( form );
						if ( ! body.has( 'npe' ) || ! body.get( 'npe' ) ) {
							return;
						}
						form.startLoginFlow();
						fetch( form.getAttribute( 'action' ) || window.location.pathname, {
							method: 'POST',
							headers: {
								Accept: 'application/json',
							},
							body,
						} )
							.then( res => {
								res
									.json()
									.then( ( { message, data } ) => form.endLoginFlow( message, res.status, data ) );
							} )
							.catch( e => {
								form.endLoginFlow( e, 400 );
							} );
					} );
			} );
		} );
	} );
} )( window.newspackReaderActivation );

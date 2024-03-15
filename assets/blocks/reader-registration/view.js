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

window.newspackRAS = window.newspackRAS || [];

window.newspackRAS.push( function ( readerActivation ) {
	domReady( function () {
		document.querySelectorAll( '.newspack-registration' ).forEach( container => {
			const { __ } = wp.i18n;
			const form = container.querySelector( 'form' );
			if ( ! form ) {
				return;
			}

			const messageElement = container.querySelector( '.newspack-registration__response' );
			const submitElement = form.querySelector( 'input[type="submit"]' );
			let successElement = container.querySelector(
				'.newspack-registration__registration-success'
			);

			const createMessageNode = message => {
				const node = document.createElement( 'p' );
				node.classList.add( 'has-text-align-center' );
				node.textContent = message;
				return node;
			};

			form.startLoginFlow = () => {
				submitElement.disabled = true;
				container.classList.add( 'newspack-registration--in-progress' );
				const messageNode = createMessageNode(
					__( 'Registering your account. This can take a few seconds.', 'newspack-plugin' )
				);
				messageElement.innerHTML = '';
				messageElement.appendChild( messageNode );
				messageElement.classList.remove( 'newspack-registration--hidden' );
			};

			form.endLoginFlow = ( message = null, status = 500, data = null ) => {
				let messageNode;

				messageElement.classList.add( 'newspack-registration--hidden' );

				if ( data?.existing_user ) {
					successElement = container.querySelector( '.newspack-registration__login-success' );
				}

				if ( message ) {
					messageNode = createMessageNode( message );
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
					messageElement.innerHTML = '';
					messageElement.appendChild( messageNode );
					messageElement.classList.remove( 'newspack-registration--hidden' );
				}
				submitElement.disabled = false;
				container.classList.remove( 'newspack-registration--in-progress' );
			};

			form.addEventListener( 'submit', ev => {
				ev.preventDefault();
				form.startLoginFlow();

				if ( ! form.npe?.value ) {
					return form.endLoginFlow( 'Please enter a vaild email address.', 400 );
				}

				readerActivation
					.getCaptchaToken()
					.then( captchaToken => {
						if ( ! captchaToken ) {
							return;
						}
						let tokenField = form.captcha_token;
						if ( ! tokenField ) {
							tokenField = document.createElement( 'input' );
							tokenField.setAttribute( 'type', 'hidden' );
							tokenField.setAttribute( 'name', 'captcha_token' );
							tokenField.setAttribute( 'autocomplete', 'off' );
							form.appendChild( tokenField );
						}
						tokenField.value = captchaToken;
					} )
					.catch( e => {
						form.endLoginFlow( e, 400 );
					} )
					.finally( () => {
						const body = new FormData( form );
						if ( ! body.has( 'npe' ) || ! body.get( 'npe' ) ) {
							return form.endFlow( 'Please enter a vaild email address.', 400 );
						}
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

			readerActivation.on( 'reader', ( { detail: { authenticated } } ) => {
				if ( authenticated ) {
					form.endLoginFlow( null, 200 );
				}
			} );
		} );
	} );
} );

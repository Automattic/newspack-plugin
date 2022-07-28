/**
 * Internal dependencies.
 */
import './auth.scss';

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

/**
 * Converts FormData into an object.
 *
 * @param {FormData} formData    The form data to convert.
 * @param {Array}    ignoredKeys Keys to ignore.
 *
 * @return {Object} The converted form data.
 */
const convertFormDataToObject = ( formData, ignoredKeys = [] ) =>
	Array.from( formData.entries() ).reduce( ( acc, [ key, val ] ) => {
		if ( ignoredKeys.includes( key ) ) {
			return acc;
		}
		if ( key.indexOf( '[]' ) > -1 ) {
			key = key.replace( '[]', '' );
			acc[ key ] = acc[ key ] || [];
			acc[ key ].push( val );
		} else {
			acc[ key ] = val;
		}
		return acc;
	}, {} );

( function ( readerActivation ) {
	domReady( function () {
		if ( ! readerActivation ) {
			return;
		}

		const container = document.querySelector( '#newspack-reader-auth' );
		if ( ! container ) {
			return;
		}

		const initialForm = container.querySelector( 'form' );
		let form;
		/** Workaround AMP's enforced XHR strategy. */
		if ( initialForm.getAttribute( 'action-xhr' ) ) {
			initialForm.removeAttribute( 'action-xhr' );
			form = initialForm.cloneNode( true );
			initialForm.replaceWith( form );
		} else {
			form = initialForm;
		}

		const actionInput = form.querySelector( 'input[name="action"]' );
		const emailInput = form.querySelector( 'input[name="email"]' );
		const passwordInput = form.querySelector( 'input[name="password"]' );
		const submitButtons = form.querySelectorAll( '[type="submit"]' );

		container.querySelector( 'button[data-close]' ).addEventListener( 'click', function ( ev ) {
			ev.preventDefault();
			container.classList.remove( 'newspack-reader__auth-form__visible' );
			container.style.display = 'none';
		} );

		const messageContentElement = container.querySelector(
			'.newspack-reader__auth-form__response__content'
		);

		const authLinkMessage = container.querySelector( '[data-has-auth-link]' );
		authLinkMessage.hidden = true;

		let accountLinks, triggerLinks;
		const initLinks = function () {
			accountLinks = document.querySelectorAll( '.newspack-reader__account-link' );
			triggerLinks = document.querySelectorAll( '[data-newspack-reader-account-link]' );
			triggerLinks.forEach( link => {
				link.addEventListener( 'click', handleAccountLinkClick );
			} );
		};
		initLinks();
		/** Re-initialize links in case the navigation DOM was modified by a third-party. */
		setTimeout( initLinks, 1000 );

		/**
		 * Handle reader changes.
		 */
		readerActivation.on( 'reader', ( { detail: { email, authenticated } } ) => {
			emailInput.value = email || '';
			if ( accountLinks?.length ) {
				accountLinks.forEach( link => {
					try {
						const labels = JSON.parse( link.getAttribute( 'data-labels' ) );
						link.querySelector( '.newspack-reader__account-link__label' ).textContent =
							authenticated ? labels.signedin : labels.signedout;
					} catch {}
				} );
			}
			if ( authenticated ) {
				container.style.display = 'none';
			}
		} );

		/**
		 * Handle account links.
		 */
		function handleAccountLinkClick( ev ) {
			const reader = readerActivation.getReader();
			/** If logged in, bail and allow page redirection. */
			if ( reader?.authenticated ) {
				return;
			}
			ev.preventDefault();

			if ( readerActivation.hasAuthLink() ) {
				authLinkMessage.style.display = 'block';
			} else {
				authLinkMessage.style.display = 'none';
			}

			emailInput.value = reader?.email || '';

			container.hidden = false;
			container.style.display = 'flex';

			if ( emailInput.value && 'pwd' === actionInput.value ) {
				passwordInput.focus();
			} else {
				emailInput.focus();
			}
		}

		/**
		 * Handle auth form action selection.
		 */
		function setFormAction( action ) {
			actionInput.value = action;
			container.removeAttribute( 'data-form-status' );
			messageContentElement.innerHTML = '';
			container.querySelectorAll( '[data-action]' ).forEach( item => {
				if ( 'none' !== item.style.display ) {
					item.prevDisplay = item.style.display;
				}
				item.style.display = 'none';
			} );
			container.querySelectorAll( '[data-action~="' + action + '"]' ).forEach( item => {
				item.style.display = item.prevDisplay;
			} );
			try {
				const labels = JSON.parse( container.getAttribute( 'data-labels' ) );
				const label = 'register' === action ? labels.register : labels.signin;
				container.querySelector( 'h2' ).textContent = label;
			} catch {}
			if ( action === 'pwd' && emailInput.value ) {
				passwordInput.focus();
			} else {
				emailInput.focus();
			}
		}
		setFormAction( actionInput.value );
		container.querySelectorAll( '[data-set-action]' ).forEach( item => {
			item.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				setFormAction( ev.target.getAttribute( 'data-set-action' ) );
			} );
		} );

		form.startLoginFlow = () => {
			container.removeAttribute( 'data-form-status' );
			submitButtons.forEach( button => {
				button.disabled = true;
			} );
			messageContentElement.innerHTML = '';
			form.style.opacity = 0.5;
		};

		form.endLoginFlow = ( message, status, data, redirect ) => {
			if ( message ) {
				const messageNode = document.createElement( 'p' );
				messageNode.textContent = message;
				messageContentElement.appendChild( messageNode );
			}
			if ( status === 200 && data ) {
				const authenticated = !! data?.authenticated;
				readerActivation.setReaderEmail( data.email );
				readerActivation.setAuthenticated( authenticated );
				if ( authenticated ) {
					if ( redirect ) {
						window.location = redirect;
					}
				} else {
					form.replaceWith( messageContentElement.parentNode );
				}
			}
			form.style.opacity = 1;
			submitButtons.forEach( button => {
				button.disabled = false;
			} );
		};

		/**
		 * Handle auth form submission.
		 */
		form.addEventListener( 'submit', function ( ev ) {
			ev.preventDefault();
			const body = new FormData( ev.target );
			if ( ! body.has( 'email' ) || ! body.get( 'email' ) ) {
				return;
			}
			readerActivation.setReaderEmail( body.get( 'email' ) );
			form.startLoginFlow();
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} )
				.then( res => {
					container.setAttribute( 'data-form-status', res.status );
					res.json().then( ( { message, data } ) => {
						form.endLoginFlow( message, res.status, data, body.get( 'redirect' ) );
					} );
				} )
				.catch( err => {
					throw err;
				} )
				.finally( form.endLoginFlow );
		} );

		/**
		 * Third party auth.
		 */
		const googleLoginElements = document.querySelectorAll( '.newspack-reader__logins__google' );
		googleLoginElements.forEach( googleLoginElement => {
			const googleLoginForm = googleLoginElement.closest( 'form' );

			const checkLoginStatus = metadata => {
				fetch(
					`/wp-json/newspack/v1/login/google/register?metadata=${ JSON.stringify( metadata ) }`
				).then( res => {
					res.json().then( ( { message, data } ) => {
						if ( googleLoginForm.endLoginFlow ) {
							googleLoginForm.endLoginFlow( message, res.status, data );
						}
					} );
				} );
			};

			googleLoginElement.addEventListener( 'click', () => {
				if ( googleLoginForm?.startLoginFlow ) {
					googleLoginForm.startLoginFlow();
				}

				const metadata = googleLoginForm
					? convertFormDataToObject( new FormData( googleLoginForm ), [
							'email',
							'password',
							'_wp_http_referer',
							'newspack_reader_registration',
					  ] )
					: {};
				metadata.current_page_url = window.location.href;
				fetch( '/wp-json/newspack/v1/login/google' )
					.then( res => res.json().then( data => Promise.resolve( { data, status: res.status } ) ) )
					.then( ( { data, status } ) => {
						if ( status !== 200 ) {
							if ( googleLoginForm?.endLoginFlow ) {
								googleLoginForm.endLoginFlow( data.message, status );
							}
						} else {
							const authWindow = window.open(
								'about:blank',
								'newspack_google_login',
								'width=500,height=600'
							);
							if ( authWindow ) {
								authWindow.location = data;
								const interval = setInterval( () => {
									if ( authWindow.closed ) {
										checkLoginStatus( metadata );
										clearInterval( interval );
									}
								}, 500 );
							} else if ( googleLoginForm?.endLoginFlow ) {
								googleLoginForm.endLoginFlow();
							}
						}
					} );
			} );
		} );
	} );
} )( window.newspackReaderActivation );

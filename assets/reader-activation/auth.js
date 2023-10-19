/* globals newspack_ras_config newspack_reader_auth_labels */

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
 * @param {FormData} formData       The form data to convert.
 * @param {Array}    includedFields Form fields to include.
 *
 * @return {Object} The converted form data.
 */
const convertFormDataToObject = ( formData, includedFields = [] ) =>
	Array.from( formData.entries() ).reduce( ( acc, [ key, val ] ) => {
		if ( ! includedFields.includes( key ) ) {
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

const SIGN_IN_MODAL_HASHES = [ 'signin_modal', 'register_modal' ];
let currentHash;

window.newspackRAS = window.newspackRAS || [];

window.newspackRAS.push( function ( readerActivation ) {
	domReady( function () {
		const containers = [ ...document.querySelectorAll( '.newspack-reader-auth' ) ];
		const alerts = [ ...document.querySelectorAll( '.woocommerce-message' ) ];
		if ( ! containers.length ) {
			return;
		}

		let accountLinks, triggerLinks;
		const initLinks = function () {
			accountLinks = document.querySelectorAll( '.newspack-reader__account-link' );
			triggerLinks = document.querySelectorAll(
				`[data-newspack-reader-account-link],[href="${ newspack_ras_config.account_url }"]`
			);
			triggerLinks.forEach( link => {
				link.addEventListener( 'click', handleAccountLinkClick );
			} );
		};
		const handleHashChange = function ( ev ) {
			currentHash = window.location.hash.replace( '#', '' );
			if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
				if ( ev ) {
					ev.preventDefault();
				}
				handleAccountLinkClick();
			}
		};
		window.addEventListener( 'hashchange', handleHashChange );
		handleHashChange();
		initLinks();
		/** Re-initialize links in case the navigation DOM was modified by a third-party. */
		setTimeout( initLinks, 1000 );

		/**
		 * Handle reader changes.
		 */
		function handleReaderChanges() {
			const allContainers = [ ...document.querySelectorAll( '.newspack-reader-auth' ) ];
			/** If no modal login form, bail. */
			if ( ! allContainers.length ) {
				return;
			}

			allContainers.forEach( container => {
				const form = container.querySelector( 'form' );
				const emailInput = container.querySelector( 'input[name="npe"]' );
				const redirectInput = container.querySelector( 'input[name="redirect"]' );
				const reader = readerActivation.getReader();

				if ( emailInput ) {
					emailInput.value = reader?.email || '';
				}

				if ( accountLinks?.length ) {
					accountLinks.forEach( link => {
						/** If there's a pre-auth, signing in redirects to the reader account. */
						if ( reader?.email && ! reader?.authenticated ) {
							link.setAttribute( 'data-redirect', link.getAttribute( 'href' ) );
							redirectInput.value = link.getAttribute( 'href' );
						} else {
							link.removeAttribute( 'data-redirect' );
						}
						try {
							const labels = JSON.parse( link.getAttribute( 'data-labels' ) );
							link.querySelector( '.newspack-reader__account-link__label' ).textContent =
								reader?.email ? labels.signedin : labels.signedout;
						} catch {}
					} );
				}
				if ( reader?.authenticated ) {
					const messageContentElement = container.querySelector(
						'.newspack-reader__auth-form__response__content'
					);
					if ( messageContentElement && form ) {
						form.replaceWith( messageContentElement.parentNode );
					}
				}
			} );
		}
		readerActivation.on( 'reader', handleReaderChanges );
		handleReaderChanges();

		/**
		 * Handle account links.
		 */
		function handleAccountLinkClick( ev ) {
			const reader = readerActivation.getReader();
			/** If logged in, bail and allow page redirection. */
			if ( reader?.authenticated ) {
				return;
			}

			const container = document.querySelector(
				'.newspack-reader-auth:not(.newspack-reader__auth-form__inline)'
			);
			/** If no modal login form, bail. */
			if ( ! container ) {
				return;
			}

			if ( ev ) {
				ev.preventDefault();
			}

			const authLinkMessage = container.querySelector( '[data-has-auth-link]' );
			const emailInput = container.querySelector( 'input[name="npe"]' );
			const redirectInput = container.querySelector( 'input[name="redirect"]' );
			const passwordInput = container.querySelector( 'input[name="password"]' );
			const actionInput = container.querySelector( 'input[name="action"]' );

			if ( authLinkMessage ) {
				if ( readerActivation.hasAuthLink() ) {
					authLinkMessage.style.display = 'flex';
				} else {
					authLinkMessage.style.display = 'none';
				}
			}

			if ( emailInput ) {
				emailInput.value = reader?.email || '';
			}

			if ( redirectInput && ev?.target?.getAttribute( 'data-redirect' ) ) {
				redirectInput.value = ev.target.getAttribute( 'data-redirect' );
			}

			container.hidden = false;
			container.style.display = 'flex';

			document.body.classList.add( 'newspack-signin' );

			if ( passwordInput && emailInput?.value && 'pwd' === actionInput?.value ) {
				passwordInput.focus();
			} else {
				emailInput.focus();
			}
			container.overlayId = readerActivation.overlays.add();
		}

		containers.forEach( container => {
			const initialForm = container.querySelector( 'form' );
			if ( ! initialForm ) {
				return;
			}
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
			const emailInput = form.querySelector( 'input[name="npe"]' );
			const otpCodeInput = form.querySelector( 'input[name="otp_code"]' );
			const passwordInput = form.querySelector( 'input[name="password"]' );
			const submitButtons = form.querySelectorAll( '[type="submit"]' );
			const closeButton = container.querySelector( 'button[data-close]' );

			if ( closeButton ) {
				closeButton.addEventListener( 'click', function ( ev ) {
					ev.preventDefault();
					container.classList.remove( 'newspack-reader__auth-form__visible' );
					container.style.display = 'none';
					document.body.classList.remove( 'newspack-signin' );
					if ( SIGN_IN_MODAL_HASHES.includes( window.location.hash.replace( '#', '' ) ) ) {
						history.pushState(
							'',
							document.title,
							window.location.pathname + window.location.search
						);
					}
					if ( container.overlayId ) {
						readerActivation.overlays.remove( container.overlayId );
					}
				} );
			}

			const messageContentElement = container.querySelector(
				'.newspack-reader__auth-form__response__content'
			);

			const authLinkMessage = container.querySelector( '[data-has-auth-link]' );
			authLinkMessage.hidden = true;

			/**
			 * Handle auth form action selection.
			 */
			function setFormAction( action, shouldFocus = false ) {
				if ( 'otp' === action ) {
					if ( ! readerActivation.getOTPHash() ) {
						return;
					}
				}
				if ( [ 'link', 'pwd' ].includes( action ) ) {
					readerActivation.setAuthStrategy( action );
				}
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
				if ( shouldFocus ) {
					if ( action === 'pwd' && emailInput.value ) {
						passwordInput.focus();
					} else if ( action === 'otp' ) {
						otpCodeInput.focus();
					} else {
						emailInput.focus();
					}
				}
			}
			setFormAction(
				currentHash === 'register_modal' ? 'register' : readerActivation.getAuthStrategy() || 'link'
			);
			window.addEventListener( 'hashchange', () => {
				if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
					setFormAction(
						currentHash === 'register_modal'
							? 'register'
							: readerActivation.getAuthStrategy() || 'link'
					);
				}
			} );
			readerActivation.on( 'reader', () => {
				if ( readerActivation.getOTPHash() ) {
					setFormAction( 'otp' );
				}
			} );
			container.querySelectorAll( '[data-set-action]' ).forEach( item => {
				item.addEventListener( 'click', function ( ev ) {
					ev.preventDefault();
					setFormAction( ev.target.getAttribute( 'data-set-action' ), true );
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

			form.endLoginFlow = ( message = null, status = 500, data = null, redirect ) => {
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
				container.setAttribute( 'data-form-status', status );
				form.style.opacity = 1;
				submitButtons.forEach( button => {
					button.disabled = false;
				} );
			};

			/**
			 * Handle auth form submission.
			 */
			form.addEventListener( 'submit', ev => {
				ev.preventDefault();
				form.startLoginFlow();

				if ( 0 < alerts.length ) {
					alerts.forEach( alert => ( alert.style.display = 'none' ) );
				}

				const action = form.action?.value;

				if ( ! form.npe?.value ) {
					return form.endLoginFlow( newspack_reader_auth_labels.invalid_email, 400 );
				}

				if ( 'pwd' === action && ! form.password?.value ) {
					return form.endLoginFlow( newspack_reader_auth_labels.invalid_password, 400 );
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
						const body = new FormData( ev.target );
						if ( ! body.has( 'npe' ) || ! body.get( 'npe' ) ) {
							return form.endFlow( newspack_reader_auth_labels.invalid_email, 400 );
						}
						readerActivation.setReaderEmail( body.get( 'npe' ) );
						if ( 'otp' === action ) {
							readerActivation
								.authenticateOTP( body.get( 'otp_code' ) )
								.then( data => {
									form.endLoginFlow(
										data.message,
										200,
										data,
										currentHash ? '' : body.get( 'redirect' )
									);
								} )
								.catch( data => {
									if ( data.expired ) {
										setFormAction( 'link' );
									}
									form.endLoginFlow( data.message, 400 );
								} );
						} else {
							fetch( form.getAttribute( 'action' ) || window.location.pathname, {
								method: 'POST',
								headers: {
									Accept: 'application/json',
								},
								body,
							} )
								.then( res => {
									container.setAttribute( 'data-form-status', res.status );
									res
										.json()
										.then( ( { message, data } ) => {
											let status = res.status;
											let redirect = body.get( 'redirect' );
											/** Redirect every registration to the account page for verification if not coming from a hash link */
											if ( action === 'register' ) {
												redirect = newspack_ras_config.account_url;
											}
											// Never redirect from hash links.
											if ( currentHash ) {
												redirect = '';
											}
											const otpHash = readerActivation.getOTPHash();
											if ( otpHash && [ 'register', 'link' ].includes( action ) ) {
												setFormAction( 'otp' );
												/** If action is link, suppress message and status so the OTP handles it. */
												if ( status === 200 && action === 'link' ) {
													status = null;
													message = null;
												}
											}
											form.endLoginFlow( message, status, data, redirect );
										} )
										.catch( () => {
											form.endLoginFlow();
										} );
								} )
								.catch( () => {
									form.endLoginFlow();
								} );
						}
					} );
			} );
		} );

		/**
		 * OTP Input
		 */
		const otpInputs = document.querySelectorAll( 'input[name="otp_code"]' );
		otpInputs.forEach( originalInput => {
			const length = parseInt( originalInput.getAttribute( 'maxlength' ) );
			if ( ! length ) {
				return;
			}
			const inputContainer = originalInput.parentNode;
			inputContainer.removeChild( originalInput );
			const values = [];
			const otpCodeInput = document.createElement( 'input' );
			otpCodeInput.setAttribute( 'type', 'hidden' );
			otpCodeInput.setAttribute( 'name', 'otp_code' );
			inputContainer.appendChild( otpCodeInput );
			for ( let i = 0; i < length; i++ ) {
				const digit = document.createElement( 'input' );
				digit.setAttribute( 'type', 'text' );
				digit.setAttribute( 'maxlength', '1' );
				digit.setAttribute( 'pattern', '[0-9]' );
				digit.setAttribute( 'autocomplete', 'off' );
				digit.setAttribute( 'inputmode', 'numeric' );
				digit.setAttribute( 'data-index', i );
				digit.addEventListener( 'keydown', ev => {
					const prev = inputContainer.querySelector( `[data-index="${ i - 1 }"]` );
					const next = inputContainer.querySelector( `[data-index="${ i + 1 }"]` );
					switch ( ev.key ) {
						case 'Backspace':
							ev.preventDefault();
							ev.target.value = '';
							if ( prev ) {
								prev.focus();
							}
							values[ i ] = '';
							otpCodeInput.value = values.join( '' );
							break;
						case 'ArrowLeft':
							ev.preventDefault();
							if ( prev ) {
								prev.focus();
							}
							break;
						case 'ArrowRight':
							ev.preventDefault();
							if ( next ) {
								next.focus();
							}
							break;
						default:
							if ( ev.key.match( /^[0-9]$/ ) ) {
								ev.preventDefault();
								ev.target.value = ev.key;
								ev.target.dispatchEvent(
									new Event( 'input', {
										bubbles: true,
										cancelable: true,
									} )
								);
								if ( next ) {
									next.focus();
								}
							}
							break;
					}
				} );
				digit.addEventListener( 'input', ev => {
					if ( ev.target.value.match( /^[0-9]$/ ) ) {
						values[ i ] = ev.target.value;
					} else {
						ev.target.value = '';
					}
					otpCodeInput.value = values.join( '' );
				} );
				digit.addEventListener( 'paste', ev => {
					ev.preventDefault();
					const paste = ( ev.clipboardData || window.clipboardData ).getData( 'text' );
					if ( paste.length !== length ) {
						return;
					}
					for ( let j = 0; j < length; j++ ) {
						if ( paste[ j ].match( /^[0-9]$/ ) ) {
							const digitInput = inputContainer.querySelector( `[data-index="${ j }"]` );
							digitInput.value = paste[ j ];
							values[ j ] = paste[ j ];
						}
					}
					otpCodeInput.value = values.join( '' );
				} );
				inputContainer.appendChild( digit );
			}
		} );

		/**
		 * Third party auth.
		 */
		const loginsElements = document.querySelectorAll( '.newspack-reader__logins' );
		[ ...loginsElements ].forEach( element => {
			element.classList.remove( 'newspack-reader__logins--disabled' );
		} );
		const googleLoginElements = document.querySelectorAll( '.newspack-reader__logins__google' );
		googleLoginElements.forEach( googleLoginElement => {
			const googleLoginForm = googleLoginElement.closest( 'form' );
			const redirectInput = googleLoginForm.querySelector( 'input[name="redirect"]' );
			const checkLoginStatus = metadata => {
				fetch(
					`/wp-json/newspack/v1/login/google/register?metadata=${ JSON.stringify( metadata ) }`
				)
					.then( res => {
						res
							.json()
							.then( ( { message, data } ) => {
								const redirect = redirectInput?.value || null;
								if ( googleLoginForm?.endLoginFlow ) {
									googleLoginForm.endLoginFlow( message, res.status, data, redirect );
								}
							} )
							.catch( error => {
								if ( googleLoginForm?.endLoginFlow ) {
									googleLoginForm.endLoginFlow( error?.message, res.status );
								}
							} );
					} )
					.catch( error => {
						if ( googleLoginForm?.endLoginFlow ) {
							googleLoginForm.endLoginFlow( error?.message );
						}
					} );
			};

			googleLoginElement.addEventListener( 'click', () => {
				if ( googleLoginForm?.startLoginFlow ) {
					googleLoginForm.startLoginFlow();
				}

				const metadata = googleLoginForm
					? convertFormDataToObject( new FormData( googleLoginForm ), [ 'lists[]' ] )
					: {};
				metadata.current_page_url = window.location.href;
				const authWindow = window.open(
					'about:blank',
					'newspack_google_login',
					'width=500,height=600'
				);
				fetch( '/wp-json/newspack/v1/login/google' )
					.then( res => res.json().then( data => Promise.resolve( { data, status: res.status } ) ) )
					.then( ( { data, status } ) => {
						if ( status !== 200 ) {
							if ( authWindow ) {
								authWindow.close();
							}
							if ( googleLoginForm?.endLoginFlow ) {
								googleLoginForm.endLoginFlow( data.message, status );
							}
						} else if ( authWindow ) {
							authWindow.location = data;
							const interval = setInterval( () => {
								if ( authWindow.closed ) {
									checkLoginStatus( metadata );
									clearInterval( interval );
								}
							}, 500 );
						} else if ( googleLoginForm?.endLoginFlow ) {
							googleLoginForm.endLoginFlow( newspack_reader_auth_labels.blocked_popup );
						}
					} )
					.catch( error => {
						console.log( error );
						if ( googleLoginForm?.endLoginFlow ) {
							googleLoginForm.endLoginFlow( error?.message, 400 );
						}
						if ( authWindow ) {
							authWindow.close();
						}
					} );
			} );
		} );
	} );
} );

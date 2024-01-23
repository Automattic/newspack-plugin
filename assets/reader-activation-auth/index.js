/* globals newspack_ras_config newspack_reader_auth_labels */

/**
 * Internal dependencies.
 */
import { domReady, formatTime } from './utils';

import './google-oauth';
import './otp-input';

import './style.scss';

const SIGN_IN_MODAL_HASHES = [ 'signin_modal', 'register_modal' ];

const FORM_ALLOWED_ACTIONS = [ 'register', 'signin', 'pwd', 'otp', 'success' ];

let currentHash;

window.newspackRAS = window.newspackRAS || [];

window.newspackRAS.push( function ( readerActivation ) {
	domReady( function () {
		const container = document.querySelector( '.newspack-reader-auth' );
		if ( ! container ) {
			return;
		}

		const alerts = [ ...document.querySelectorAll( '.woocommerce-message' ) ];

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
			const form = container.querySelector( 'form' );
			const emailInput = container.querySelector( 'input[name="npe"]' );
			const reader = readerActivation.getReader();

			if ( emailInput ) {
				emailInput.value = reader?.email || '';
			}

			if ( accountLinks?.length ) {
				accountLinks.forEach( link => {
					try {
						const labels = JSON.parse( link.getAttribute( 'data-labels' ) );
						link.querySelector( '.newspack-reader__account-link__label' ).textContent =
							reader?.authenticated ? labels.signedin : labels.signedout;
					} catch {}
				} );
			}
			if ( reader?.authenticated ) {
				const messageContentElement = container.querySelector( '.response' );
				if ( messageContentElement && form ) {
					form.replaceWith( messageContentElement.parentNode );
				}
			}
		}
		readerActivation.on( 'reader', handleReaderChanges );
		handleReaderChanges();

		function handleAccountLinkClick( ev ) {
			let callback;
			if ( ev ) {
				ev.preventDefault();
				let redirect;
				if ( ev.target.getAttribute( 'data-redirect' ) ) {
					redirect = ev.target.getAttribute( 'data-redirect' );
				} else {
					redirect = ev.target.getAttribute( 'href' );
				}
				if ( ! redirect ) {
					const closestEl = ev.target.closest( 'a' );
					if ( closestEl ) {
						if ( closestEl.getAttribute( 'data-redirect' ) ) {
							redirect = closestEl.getAttribute( 'data-redirect' );
						} else {
							redirect = closestEl.getAttribute( 'href' );
						}
					}
				}
				if ( redirect ) {
					callback = () => {
						window.location.href = redirect;
					};
				}
			}
			authModal( { callback } );
		}

		/**
		 * Start the authentication modal with a custom callback.
		 *
		 * @param {Object} config Configuration object.
		 *
		 * @return {void}
		 */
		function authModal( config = {} ) {
			const reader = readerActivation.getReader();
			if ( reader?.authenticated ) {
				if ( config.callback ) {
					config.callback();
				}
				return;
			}

			/** Attach config to the container. */
			container.config = config;

			let initialFormAction = 'signin';
			if ( readerActivation.hasAuthLink() ) {
				initialFormAction = 'otp';
			}
			if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
				initialFormAction = currentHash === 'register_modal' ? 'register' : 'signin';
			}
			if ( config.initialState ) {
				initialFormAction = config.initialState;
			}
			setFormAction( initialFormAction, true );

			const titleEl = container.querySelector( 'h2' );
			if ( titleEl && config.title ) {
				titleEl.textContent = config.title;
			}

			const emailInput = container.querySelector( 'input[name="npe"]' );
			if ( emailInput ) {
				emailInput.value = reader?.email || '';
			}

			container.setAttribute( 'data-state', 'open' );

			document.body.classList.add( 'newspack-signin' );
			container.overlayId = readerActivation.overlays.add();

			/** Remove the modal hash from the URL if any. */
			if ( SIGN_IN_MODAL_HASHES.includes( window.location.hash.replace( '#', '' ) ) ) {
				history.pushState( '', document.title, window.location.pathname + window.location.search );
			}
		}
		/** Expose the function to the RAS scope. */
		readerActivation._authModal = authModal;

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
		const closeButtons = container.querySelectorAll(
			'button[data-close], .newspack-ui__modal__close'
		);
		const backButtons = container.querySelectorAll( '[data-back]' );
		const sendCodeButtons = container.querySelectorAll( '[data-send-code]' );

		backButtons.forEach( backButton => {
			backButton.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				setFormAction( 'signin', true );
			} );
		} );

		function handleOTPTimer() {
			if ( ! sendCodeButtons.length ) {
				return;
			}
			sendCodeButtons.forEach( button => {
				button.originalButtonText = button.textContent;
				if ( button.otpTimerInterval ) {
					clearInterval( button.otpTimerInterval );
				}
				const updateButton = () => {
					const remaining = readerActivation.getOTPTimeRemaining();
					if ( remaining ) {
						button.textContent = `${ button.originalButtonText } (${ formatTime( remaining ) })`;
						button.disabled = true;
					} else {
						button.textContent = button.originalButtonText;
						button.disabled = false;
						clearInterval( button.otpTimerInterval );
					}
				};
				const remaining = readerActivation.getOTPTimeRemaining();
				if ( remaining ) {
					button.otpTimerInterval = setInterval( updateButton, 1000 );
					updateButton();
				}
			} );
		}

		if ( sendCodeButtons.length ) {
			handleOTPTimer();
			sendCodeButtons.forEach( button => {
				button.addEventListener( 'click', function ( ev ) {
					messageContentElement.innerHTML = '';
					ev.preventDefault();
					form.startLoginFlow();
					const body = new FormData();
					body.set( 'reader-activation-auth-form', 1 );
					body.set( 'npe', emailInput.value );
					body.set( 'action', 'link' );
					readerActivation
						.getCaptchaToken()
						.then( captchaToken => {
							if ( ! captchaToken ) {
								return;
							}
							body.set( 'captcha_token', captchaToken );
						} )
						.catch( e => {
							console.log( { e } );
						} )
						.finally( () => {
							fetch( form.getAttribute( 'action' ) || window.location.pathname, {
								method: 'POST',
								headers: {
									Accept: 'application/json',
								},
								body,
							} )
								.then( () => {
									messageContentElement.innerHTML = newspack_reader_auth_labels.code_resent;
									setFormAction( 'otp' );
									readerActivation.setOTPTimer();
								} )
								.catch( e => {
									console.log( e );
								} )
								.finally( () => {
									handleOTPTimer();
									form.style.opacity = 1;
									submitButtons.forEach( submitButton => {
										submitButton.disabled = false;
									} );
								} );
						} );
				} );
			} );
		}

		if ( closeButtons?.length ) {
			closeButtons.forEach( closeButton => {
				closeButton.addEventListener( 'click', function ( ev ) {
					ev.preventDefault();
					container.setAttribute( 'data-state', 'closed' );
					document.body.classList.remove( 'newspack-signin' );
					if ( container.overlayId ) {
						readerActivation.overlays.remove( container.overlayId );
					}
				} );
			} );
		}

		const messageContentElement = container.querySelector( '.response' );

		/**
		 * Handle auth form action selection.
		 */
		let formAction;
		function setFormAction( action, shouldFocus = false ) {
			if ( ! FORM_ALLOWED_ACTIONS.includes( action ) ) {
				action = 'signin';
			}
			if ( 'otp' === action ) {
				if ( ! readerActivation.getOTPHash() ) {
					return;
				}
				const emailAddressElements = container.querySelectorAll( '.email-address' );
				emailAddressElements.forEach( element => {
					element.textContent = readerActivation.getReader()?.email || '';
				} );
				// Focus on the first input.
				const firstInput = container.querySelector( '.otp-field input[type="text"]' );
				if ( firstInput ) {
					firstInput.focus();
				}
			}
			formAction = action;
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
			const labels = {
				...newspack_reader_auth_labels,
				...container.config?.labels,
			};
			const titleEl = container.querySelector( 'h2' );
			if ( titleEl ) {
				const label = 'register' === action ? labels.register.title : labels.signin.title;
				titleEl.textContent = label;
			}
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
		window.addEventListener( 'hashchange', () => {
			if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
				setFormAction( currentHash === 'register_modal' ? 'register' : 'signin' );
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

		form.endLoginFlow = ( message = null, status = 500, data = null ) => {
			container.setAttribute( 'data-form-status', status );
			form.style.opacity = 1;
			submitButtons.forEach( button => {
				button.disabled = false;
			} );
			if ( message ) {
				const messageNode = document.createElement( 'p' );
				messageNode.innerHTML = message;
				messageContentElement.appendChild( messageNode );
			}
			if ( status === 200 && data ) {
				const resolve = () => {
					/** Close the modal */
					container.setAttribute( 'data-state', 'closed' );
					document.body.classList.remove( 'newspack-signin' );
					if ( container.overlayId ) {
						readerActivation.overlays.remove( container.overlayId );
					}
					/** Global callback takes priority, otherwise use the container callback. */
					if ( readerActivation._authModalCallback ) {
						readerActivation._authModalCallback( data, container );
					} else if ( container.config.callback ) {
						container.config.callback( data, container );
					}
				};

				const authenticated = !! data?.authenticated;
				readerActivation.setReaderEmail( data.email );
				readerActivation.setAuthenticated( authenticated );

				/** Resolve the modal immediately or display the "success" state. */
				if ( container.config.skipSuccess ) {
					resolve();
				} else {
					setFormAction( 'success' );
					let title = newspack_reader_auth_labels.signedin_title;
					let description = newspack_reader_auth_labels.signedin_description;
					if ( formAction === 'register' ) {
						title = newspack_reader_auth_labels.registered_title;
						description = newspack_reader_auth_labels.registered_description;
					}
					container.querySelector( '.success-title' ).innerHTML = title;
					container.querySelector( '.success-description' ).innerHTML = description;
					const callbackButton = container.querySelector( '.auth-callback' );
					if ( callbackButton ) {
						callbackButton.addEventListener( 'click', ev => {
							ev.preventDefault();
							resolve();
						} );
					}
				}
			}
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
					if ( 'otp' === action ) {
						readerActivation
							.authenticateOTP( body.get( 'otp_code' ) )
							.then( data => {
								form.endLoginFlow( data.message, 200, data );
							} )
							.catch( data => {
								if ( data.expired ) {
									setFormAction( 'signin' );
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
										const status = res.status;
										if ( status === 200 ) {
											readerActivation.setReaderEmail( body.get( 'npe' ) );
										}
										if ( data.action ) {
											setFormAction( data.action, true );
											if ( data.action === 'otp' ) {
												readerActivation.setOTPTimer();
												handleOTPTimer();
											}
										} else {
											form.endLoginFlow( message, status, data );
										}
									} )
									.catch( () => {
										form.endLoginFlow();
									} )
									.finally( () => {
										form.style.opacity = 1;
										submitButtons.forEach( button => {
											button.disabled = false;
										} );
									} );
							} )
							.catch( () => {
								form.endLoginFlow();
							} );
					}
				} );
		} );
	} );
} );

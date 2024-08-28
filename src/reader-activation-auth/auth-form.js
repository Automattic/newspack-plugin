/* globals newspack_reader_activation_labels */

/**
 * Internal dependencies.
 */
import { domReady, formatTime } from '../utils';
import { getCheckoutRedirectUrl } from '../reader-activation/checkout';
import { openNewslettersSignupModal } from '../reader-activation-newsletters/newsletters-modal';

import './google-oauth';
import './otp-input';

import './style.scss';

const FORM_ALLOWED_ACTIONS = [ 'register', 'signin', 'pwd', 'otp', 'success' ];

window.newspackRAS = window.newspackRAS || [];

window.newspackRAS.push( function ( readerActivation ) {
	domReady( function () {
		const containers = [ ...document.querySelectorAll( '.newspack-reader-auth' ) ];
		if ( ! containers?.length ) {
			return;
		}

		containers.forEach( container => {
			const form = container.querySelector( 'form' );
			if ( ! form ) {
				return;
			}

			const actionInput = form.querySelector( 'input[name="action"]' );
			const emailInput = form.querySelector( 'input[name="npe"]' );
			const otpCodeInput = form.querySelector( 'input[name="otp_code"]' );
			const passwordInput = form.querySelector( 'input[name="password"]' );
			const submitButtons = form.querySelectorAll( '[type="submit"]' );
			const backButtons = container.querySelectorAll( '[data-back]' );
			const sendCodeButton = container.querySelector( '[data-send-code]' );
			const resendCodeButton = container.querySelector( '[data-resend-code]' );
			const messageContentElement = container.querySelector( '.response' );

			/**
			 * Set action listener on the given item.
			 */
			const setActionListener = item => {
				item.addEventListener( 'click', function ( ev ) {
					ev.preventDefault();
					container.setFormAction( ev.target.getAttribute( 'data-set-action' ), true );
				} );
			};

			/**
			 * Handle auth form action selection.
			 */
			let formAction;
			container.setFormAction = ( action, shouldFocus = false ) => {
				const newspack_grecaptcha = window.newspack_grecaptcha || {};
				if ( ! FORM_ALLOWED_ACTIONS.includes( action ) ) {
					action = 'signin';
				}
				if ( 'v2_invisible' === newspack_grecaptcha?.version ) {
					if ( 'register' === action ) {
						submitButtons.forEach( button => button.removeAttribute( 'data-skip-recaptcha' ) );
						newspack_grecaptcha.render( [ form ], ( error ) => form.setMessageContent( error, true ) );
					} else {
						submitButtons.forEach( button => button.setAttribute( 'data-skip-recaptcha', '' ) );
					}
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
				container.querySelectorAll( '[data-action]' ).forEach( item => {
					if ( 'none' !== item.style.display ) {
						item.prevDisplay = item.style.display;
					}
					item.style.display = 'none';
				} );
				container.querySelectorAll( '[data-action~="' + action + '"]' ).forEach( item => {
					item.style.display = item.prevDisplay;
				} );
				if ( shouldFocus ) {
					if ( action === 'pwd' && emailInput.value ) {
						passwordInput.focus();
					} else if ( action === 'otp' ) {
						otpCodeInput.focus();
					} else {
						emailInput.focus();
					}
				}
				if ( container.formActionCallback ) {
					container.formActionCallback( action );
				}
			};
			container.setFormAction( 'signin' );

			/**
			 * Handle reader changes.
			 */
			const handleReaderChanges = () => {
				const reader = readerActivation.getReader();
				if ( emailInput ) {
					emailInput.value = reader?.email || '';
				}
				setTimeout( function () {
					if ( reader?.authenticated && formAction !== 'success' ) {
						form.endLoginFlow( null, 200 );
					}
				}, 1000 );
			};
			readerActivation.on( 'reader', handleReaderChanges );
			handleReaderChanges();

			backButtons.forEach( backButton => {
				backButton.addEventListener( 'click', function ( ev ) {
					ev.preventDefault();
					form.setMessageContent();
					container.setFormAction( 'signin', true );
				} );
			} );

			/**
			 * Handle OTP Timer.
			 */
			const handleOTPTimer = () => {
				if ( ! resendCodeButton ) {
					return;
				}
				resendCodeButton.originalButtonText = resendCodeButton.textContent.replace( /\s\(\d{1,}:\d{2}\)/, '' );
				const updateButton = () => {
					const remaining = readerActivation.getOTPTimeRemaining();
					if ( remaining ) {
						resendCodeButton.textContent = `${ resendCodeButton.originalButtonText } (${ formatTime( remaining ) })`;
					} else {
						resendCodeButton.textContent = resendCodeButton.originalButtonText;
						clearInterval( resendCodeButton.otpTimerInterval );
					}
					resendCodeButton.disabled = !!remaining;
				};
				const remaining = readerActivation.getOTPTimeRemaining();
				if ( remaining ) {
					resendCodeButton.otpTimerInterval = setInterval( updateButton, 1000 );
					updateButton();
				}
			};

			if ( sendCodeButton || resendCodeButton ) {
				[ sendCodeButton, resendCodeButton ].forEach( button => {
					button.addEventListener( 'click', function ( ev ) {
						form.setMessageContent();
						ev.preventDefault();
						form.startLoginFlow();
						const body = new FormData();
						body.set( 'reader-activation-auth-form', 1 );
						body.set( 'npe', emailInput.value );
						body.set( 'action', 'link' );
						if ( readerActivation.isPendingCheckout() ) {
							const redirectUrl = getCheckoutRedirectUrl();
							if ( redirectUrl ) {
								body.set( 'redirect_url', redirectUrl );
							}
						}
						fetch( form.getAttribute( 'action' ) || window.location.pathname, {
							method: 'POST',
							headers: {
								Accept: 'application/json',
							},
							body,
						} )
							.then( response => {
								if ( 200 !== response.status ) {
									return response.json().then( ( { message } ) => {
										form.endLoginFlow( message, response.status );
									} );
								}
								form.setMessageContent(
									formAction === 'pwd'
										? newspack_reader_activation_labels.code_sent
										: newspack_reader_activation_labels.code_resent
								);
								container.setFormAction( 'otp' );
								if ( ! readerActivation.getOTPTimeRemaining() ) {
									readerActivation.setOTPTimer();
								}
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
			}

			container.querySelectorAll( '[data-set-action]' ).forEach( setActionListener );

			form.startLoginFlow = () => {
				container.removeAttribute( 'data-form-status' );
				submitButtons.forEach( button => {
					button.disabled = true;
				} );
				form.setMessageContent();
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

					if ( status !== 200 ) {
						form.setMessageContent( message, true );
						messageContentElement
							.querySelectorAll( '[data-set-action]' )
							.forEach( setActionListener );
					}
				}
				if ( status === 200 ) {
					if ( data ) {
						readerActivation.setReaderEmail( data.email );
						readerActivation.setAuthenticated( !! data.authenticated );
					}

					let callback;
					if (
						container.authCallback &&
						data?.registered &&
						! readerActivation.isPendingCheckout()
					) {
						callback = ( authMessage, authData ) =>
							openNewslettersSignupModal( {
								callback: container.authCallback( authMessage, authData ),
							} );
					} else {
						callback = container.authCallback;
					}

					/** Resolve the modal immediately or display the "success" state. */
					if ( container.config?.skipSuccess ) {
						if ( callback ) {
							callback( message, data );
						}
					} else {
						let labels = newspack_reader_activation_labels.signin;
						if ( data?.registered ) {
							labels = newspack_reader_activation_labels.register;
						}
						container.setFormAction( 'success' );
						container.querySelector( '.success-title' ).innerHTML = labels.success_title || '';
						container.querySelector( '.success-description' ).innerHTML =
							labels.success_description || '';
						const callbackButton = container.querySelector( '.auth-callback' );
						if ( callbackButton ) {
							callbackButton.addEventListener( 'click', ev => {
								ev.preventDefault();
								if ( callback ) {
									callback( message, data );
								}
							} );
						}

						const setPasswordButton = container.querySelector( '.set-password' );
						if ( setPasswordButton ) {
							const originalDisplay = setPasswordButton.style.display;
							if ( data?.password_url ) {
								setPasswordButton.style.display = originalDisplay;
								setPasswordButton.setAttribute( 'href', data.password_url );
							} else {
								setPasswordButton.style.display = 'none';
								setPasswordButton.setAttribute( 'href', '#' );
								const continueButton = container.querySelector( '.auth-callback' );
								if ( continueButton ) {
									continueButton.classList.add( 'newspack-ui__last-child' );
								}
							}
						}
					}
				}
			};

			/**
			 * Sets response message content.
			 *
			 * @param {string|HTMLElement} message Message content.
			 * @param {boolean}            isError Whether the message is an error.
			 *
			 * @return {void}
			 */
			form.setMessageContent = ( message = '', isError = false ) => {
				if ( message ) {
					if ( typeof message === 'string' ) {
						messageContentElement.innerHTML = message;
					} else {
						messageContentElement.appendChild( message );
					}
					if ( isError ) {
						messageContentElement.classList.remove( 'newspack-ui__helper-text' );
						messageContentElement.classList.add( 'newspack-ui__inline-error' );
					} else {
						messageContentElement.classList.remove( 'newspack-ui__inline-error' );
						messageContentElement.classList.add( 'newspack-ui__helper-text' );
					}
					messageContentElement.style.display = 'block';

					// If the message includes a registration toggle, hide the message when clicked.
					messageContentElement
						.querySelectorAll( 'a[data-set-action="register"], a[data-set-action="signin"]' )
						.forEach( registerLink => {
							registerLink.parentNode.setAttribute( 'data-action', 'signin' );

							registerLink.addEventListener(
								'click',
								function () {
									messageContentElement.innerHTML = '';
								},
								false
							);
						} );
				} else {
					messageContentElement.style.display = 'none';
					messageContentElement.innerHTML = '';
					messageContentElement.classList.remove(
						'newspack-ui__inline-error',
						'newspack-ui__helper-text'
					);
				}
			};

			/**
			 * Handle auth form submission.
			 */
			form.addEventListener( 'submit', ev => {
				ev.preventDefault();
				form.startLoginFlow();

				const action = form.action?.value;

				if ( ! form.npe?.value ) {
					return form.endLoginFlow( newspack_reader_activation_labels.invalid_email, 400 );
				}

				if ( 'pwd' === action && ! form.password?.value ) {
					return form.endLoginFlow( newspack_reader_activation_labels.invalid_password, 400 );
				}

				const body = new FormData( ev.target );
				if ( ! body.has( 'npe' ) || ! body.get( 'npe' ) ) {
					return form.endLoginFlow( newspack_reader_activation_labels.invalid_email, 400 );
				}
				if ( 'otp' === action ) {
					readerActivation
						.authenticateOTP( body.get( 'otp_code' ) )
						.then( data => {
							form.endLoginFlow( data.message, 200, data );
						} )
						.catch( data => {
							if ( data.expired ) {
								container.setFormAction( 'signin' );
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
										container.setFormAction( data.action, true );
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

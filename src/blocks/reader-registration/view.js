/**
 * Internal dependencies
 */
import './style.scss';
import { domReady } from '../../utils';
import { initOTPInput } from '../../reader-activation-auth/otp-input';
import {
	createOTPTimerHandler,
	createOTPSubmitHandler,
	createPasswordSubmitHandler,
	createSendLinkHandler,
} from '../../reader-activation-auth/auth-utils';
window.newspackRAS = window.newspackRAS || [];

window.newspackRAS.push( function ( readerActivation ) {
	domReady( function () {
		document.querySelectorAll( '.newspack-registration' ).forEach( container => {
			const form = container.querySelector( 'form' );
			if ( ! form ) {
				return;
			}

			let body = new FormData( form );
			const messageElement = container.querySelector( '.newspack-registration__response' );
			const submitElement = form.querySelector( 'button[type="submit"]' );
			const spinner = document.createElement( 'span' );
			spinner.classList.add( 'spinner' );

			// OTP elements
			const otpEmailElement = container.querySelector( '.newspack-registration__otp-email' );
			const otpSubmitButton = container.querySelector( '[data-otp-submit]' );
			const otpResendButton = container.querySelector( '[data-otp-resend]' );
			const otpBackButton = container.querySelector( '[data-otp-back]' );
			const otpResponseElement = container.querySelector( '.newspack-registration__otp-response' );

			// Password elements
			const pwdEmailElement = container.querySelector( '.newspack-registration__password-email' );
			const pwdInput = container.querySelector( '.newspack-registration__password-input input[name="password"]' );
			const pwdSubmitButton = container.querySelector( '[data-pwd-submit]' );
			const pwdLinkButton = container.querySelector( '[data-pwd-link]' );
			const pwdBackButton = container.querySelector( '[data-pwd-back]' );
			const pwdResponseElement = container.querySelector( '.newspack-registration__password-response' );

			// Pending verification elements
			const resendVerificationButton = container.querySelector( '[data-resend-verification]' );

			// Initialize OTP input lazily
			let otpCodeInput = null;
			const ensureOtpInputInitialized = () => {
				if ( otpCodeInput ) {
					return true;
				}
				const originalInput = container.querySelector( '.newspack-ui__code-input input[name="otp_code"]' );
				if ( originalInput ) {
					otpCodeInput = initOTPInput( originalInput );
				}
				return !! otpCodeInput;
			};

			// Store the email for auth flows
			let currentEmail = '';

			// Get form action URL
			const getActionUrl = () => form.getAttribute( 'action' ) || window.location.pathname;

			// Create OTP timer handler using shared utility
			const handleOTPTimer = createOTPTimerHandler( readerActivation, otpResendButton );

			/**
			 * Clear error message.
			 *
			 * @param {HTMLElement} element Response element.
			 */
			const clearError = element => {
				if ( element ) {
					element.textContent = '';
				}
			};

			/**
			 * Set the current form state.
			 *
			 * @param {string} state State name: 'form', 'otp', 'pwd'.
			 * @param {string} email Email address.
			 */
			const setFormState = ( state, email = '' ) => {
				// Remove all state classes
				container.classList.remove( 'newspack-registration--otp', 'newspack-registration--pwd' );

				if ( email ) {
					currentEmail = email;
					readerActivation.setReaderEmail( email );
				}

				if ( state === 'otp' ) {
					ensureOtpInputInitialized();
					container.classList.add( 'newspack-registration--otp' );
					if ( otpEmailElement ) {
						otpEmailElement.textContent = currentEmail;
					}
					clearError( otpResponseElement );
					// Focus first OTP digit
					const firstInput = container.querySelector( '.newspack-ui__code-input input[data-index="0"]' );
					if ( firstInput ) {
						firstInput.focus();
					}
					readerActivation.setOTPTimer();
					handleOTPTimer();
				} else if ( state === 'pwd' ) {
					container.classList.add( 'newspack-registration--pwd' );
					if ( pwdEmailElement ) {
						pwdEmailElement.textContent = currentEmail;
					}
					clearError( pwdResponseElement );
					if ( pwdInput ) {
						pwdInput.value = '';
						pwdInput.focus();
					}
				}
			};

			// Create handlers using shared utilities
			const handleOtpSubmit = createOTPSubmitHandler(
				readerActivation,
				{
					getOtpCode: () => otpCodeInput?.value,
					submitButton: otpSubmitButton,
					responseElement: otpResponseElement,
				},
				{
					onSuccess: data => {
						setFormState( 'form' );
						// OTP flow is always for existing users
						form.endLoginFlow( data.message, 200, { ...data, existing_user: true } );
					},
					onExpired: () => setFormState( 'form' ),
				}
			);

			const handlePwdSubmit = createPasswordSubmitHandler(
				{
					getEmail: () => currentEmail,
					passwordInput: pwdInput,
					submitButton: pwdSubmitButton,
					responseElement: pwdResponseElement,
				},
				getActionUrl(),
				{
					onSuccess: ( message, data ) => {
						setFormState( 'form' );
						// Password flow is always for existing users
						form.endLoginFlow( message, 200, { ...data, existing_user: true } );
					},
				}
			);

			const handleSendLink = createSendLinkHandler(
				{
					getEmail: () => currentEmail,
					linkButton: pwdLinkButton,
					responseElement: pwdResponseElement,
				},
				getActionUrl(),
				{
					onSuccess: () => setFormState( 'otp', currentEmail ),
				}
			);

			/**
			 * Handle OTP resend.
			 */
			const handleOtpResend = () => {
				if ( ! currentEmail ) {
					return;
				}
				clearError( otpResponseElement );
				if ( otpResendButton ) {
					otpResendButton.disabled = true;
				}

				const resendBody = new FormData();
				resendBody.set( 'newspack_reader_registration', 'newspack_reader_registration' );
				resendBody.set( 'npe', currentEmail );

				fetch( getActionUrl(), {
					method: 'POST',
					headers: { Accept: 'application/json' },
					body: resendBody,
				} )
					.then( res => {
						if ( res.status === 200 ) {
							readerActivation.setOTPTimer();
							handleOTPTimer();
						} else {
							res.json().then( ( { message } ) => {
								if ( otpResponseElement ) {
									otpResponseElement.textContent = message || 'Failed to resend code.';
								}
							} );
						}
					} )
					.catch( () => {
						if ( otpResponseElement ) {
							otpResponseElement.textContent = 'Failed to resend code.';
						}
					} );
			};

			// Attach OTP event listeners
			if ( otpSubmitButton ) {
				otpSubmitButton.addEventListener( 'click', handleOtpSubmit );
			}
			if ( otpResendButton ) {
				otpResendButton.addEventListener( 'click', handleOtpResend );
			}
			if ( otpBackButton ) {
				otpBackButton.addEventListener( 'click', () => setFormState( 'form' ) );
			}

			// Attach password event listeners
			if ( pwdSubmitButton ) {
				pwdSubmitButton.addEventListener( 'click', handlePwdSubmit );
			}
			if ( pwdLinkButton ) {
				pwdLinkButton.addEventListener( 'click', handleSendLink );
			}
			if ( pwdBackButton ) {
				pwdBackButton.addEventListener( 'click', () => setFormState( 'form' ) );
			}
			if ( pwdInput ) {
				pwdInput.addEventListener( 'keydown', ev => {
					if ( ev.key === 'Enter' ) {
						ev.preventDefault();
						handlePwdSubmit();
					}
				} );
			}

			// Handle pending verification resend
			if ( resendVerificationButton ) {
				resendVerificationButton.addEventListener( 'click', () => {
					resendVerificationButton.disabled = true;
					const reader = readerActivation.getReader();
					const email = reader?.email;

					if ( ! email ) {
						resendVerificationButton.disabled = false;
						return;
					}

					const verifyBody = new FormData();
					verifyBody.set( 'newspack_reader_registration', 'newspack_reader_registration' );
					verifyBody.set( 'npe', email );

					fetch( getActionUrl(), {
						method: 'POST',
						headers: { Accept: 'application/json' },
						body: verifyBody,
					} )
						.then( res => {
							if ( res.status === 200 ) {
								resendVerificationButton.textContent = 'Email sent!';
								setTimeout( () => {
									resendVerificationButton.textContent = 'Resend verification email';
									resendVerificationButton.disabled = false;
								}, 3000 );
							} else {
								resendVerificationButton.disabled = false;
							}
						} )
						.catch( () => {
							resendVerificationButton.disabled = false;
						} );
				} );
			}

			form.startLoginFlow = () => {
				messageElement.classList.add( 'newspack-registration--hidden' );
				messageElement.innerHTML = '';
				submitElement.disabled = true;
				submitElement.appendChild( spinner );
				container.classList.add( 'newspack-registration--in-progress' );
			};

			form.endLoginFlow = ( message = null, status = 500, data = null ) => {
				let messageNode;

				// Handle auth flow for existing users based on action
				if ( data?.existing_user && ! data?.authenticated && data?.action ) {
					const email = data.email || form.npe?.value;
					setFormState( data.action, email );
					if ( submitElement.contains( spinner ) ) {
						submitElement.removeChild( spinner );
					}
					submitElement.disabled = false;
					container.classList.remove( 'newspack-registration--in-progress' );
					return;
				}

				// Determine which success element to show
				const registrationSuccessEl = container.querySelector( '.newspack-registration__registration-success' );
				const loginSuccessEl = container.querySelector( '.newspack-registration__login-success' );
				const successElement = data?.existing_user ? loginSuccessEl : registrationSuccessEl;

				// Hide both success elements first to ensure only one shows
				registrationSuccessEl?.classList.add( 'newspack-registration--hidden' );
				loginSuccessEl?.classList.add( 'newspack-registration--hidden' );

				if ( message ) {
					messageNode = document.createElement( 'p' );
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
					if ( data?.email ) {
						body = new FormData( form );
						readerActivation.setReaderEmail( data.email );
						readerActivation.setAuthenticated( data?.authenticated );

						if ( data.authenticated ) {
							const baseActivity = { email: data.email };
							const lists = body.getAll( 'lists[]' );
							if ( body.has( 'newspack_popup_id' ) ) {
								baseActivity.newspack_popup_id = body.get( 'newspack_popup_id' );
							}
							if ( body.has( 'gate_post_id' ) ) {
								baseActivity.gate_post_id = body.get( 'gate_post_id' );
							}
							if ( data?.sso ) {
								baseActivity.sso = true;
							}
							if ( lists?.length ) {
								readerActivation.dispatchActivity( 'newsletter_signup', {
									...baseActivity,
									newsletters_subscription_method: 'reader-registration',
									lists,
								} );
							}
							if ( data?.existing_user ) {
								readerActivation.dispatchActivity( 'reader_logged_in', {
									...baseActivity,
									login_method: data?.metadata?.login_method || 'registration-block',
								} );
							} else {
								readerActivation.dispatchActivity( 'reader_registered', {
									...baseActivity,
									registration_method: data?.metadata?.registration_method || 'registration-block',
								} );
							}
						}
					}
					form.remove();
				} else if ( messageNode ) {
					messageElement.appendChild( messageNode );
					messageElement.classList.remove( 'newspack-registration--hidden' );
				}
				if ( submitElement.contains( spinner ) ) {
					submitElement.removeChild( spinner );
				}
				submitElement.disabled = false;
				container.classList.remove( 'newspack-registration--in-progress' );
			};

			form.addEventListener( 'submit', ev => {
				ev.preventDefault();
				form.startLoginFlow();

				if ( ! form.npe?.value ) {
					return form.endLoginFlow( 'Please enter a valid email address.', 400 );
				}

				body = new FormData( form );
				if ( ! body.has( 'npe' ) || ! body.get( 'npe' ) ) {
					return form.endLoginFlow( 'Please enter a valid email address.', 400 );
				}
				fetch( getActionUrl(), {
					method: 'POST',
					headers: { Accept: 'application/json' },
					body,
				} )
					.then( res => {
						res.json().then( ( { message, data } ) => form.endLoginFlow( message, res.status, data ) );
					} )
					.catch( e => {
						form.endLoginFlow( e?.message || 'An error occurred.', 400 );
					} );
			} );
		} );
	} );
} );

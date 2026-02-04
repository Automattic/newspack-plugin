/**
 * Internal dependencies
 */
import './style.scss';
import { domReady } from '../../utils';
import { openAuthModal } from '../../reader-activation-auth/auth-modal';

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

			form.startLoginFlow = () => {
				messageElement.classList.add( 'newspack-registration--hidden' );
				messageElement.innerHTML = '';
				submitElement.disabled = true;
				submitElement.appendChild( spinner );
				container.classList.add( 'newspack-registration--in-progress' );
			};

			form.endLoginFlow = ( message = null, status = 500, data = null ) => {
				let messageNode;

				// For existing users, open the auth modal with the appropriate state
				if ( data?.existing_user && ! data?.authenticated && data?.action ) {
					const email = data.email || form.npe?.value;
					if ( submitElement.contains( spinner ) ) {
						submitElement.removeChild( spinner );
					}
					submitElement.disabled = false;
					container.classList.remove( 'newspack-registration--in-progress' );

					// Set the reader email before opening the modal
					readerActivation.setReaderEmail( email );

					// Helper to open the modal
					const openModal = initialState => {
						openAuthModal( {
							initialState,
							closeOnSuccess: true,
							onSuccess: () => window.location.reload(),
						} );
					};

					// For OTP action, check if we have a valid OTP hash cookie
					if ( data.action === 'otp' ) {
						if ( readerActivation.getOTPHash() ) {
							// Valid OTP hash exists, just open the modal
							readerActivation.setOTPTimer();
							openModal( 'otp' );
						} else {
							// No valid OTP hash, request a fresh one using the email we already have
							const otpBody = new FormData();
							otpBody.set( 'reader-activation-auth-form', '1' );
							otpBody.set( 'npe', email );
							otpBody.set( 'action', 'link' );

							fetch( form.getAttribute( 'action' ) || window.location.pathname, {
								method: 'POST',
								headers: { Accept: 'application/json' },
								body: otpBody,
							} )
								.then( res => {
									if ( res.status === 200 ) {
										readerActivation.setOTPTimer();
										openModal( 'otp' );
									} else {
										openModal( 'signin' );
									}
								} )
								.catch( () => openModal( 'signin' ) );
						}
						return;
					}

					// For password or other actions, just open the modal
					openModal( data.action );
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

					const defaultMessage = successElement?.querySelector( 'p' );
					if ( defaultMessage && data?.sso ) {
						defaultMessage.replaceWith( messageNode );
					}
				}

				const isSuccess = status === 200;
				container.classList.add( `newspack-registration--${ isSuccess ? 'success' : 'error' }` );
				if ( isSuccess ) {
					successElement?.classList.remove( 'newspack-registration--hidden' );
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
				fetch( form.getAttribute( 'action' ) || window.location.pathname, {
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

			readerActivation.on( 'reader', ( { detail } ) => {
				if ( detail.authenticated ) {
					form.endLoginFlow( null, 200, { existing_user: true } );
				}
			} );

			// Handle pending verification resend button
			const resendVerificationButton = container.querySelector( '[data-resend-verification]' );
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

					fetch( form.getAttribute( 'action' ) || window.location.pathname, {
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
		} );
	} );
} );

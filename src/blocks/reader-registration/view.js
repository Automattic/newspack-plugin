/* globals reader_registration_block_config */
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
			let flowCompleted = false; // Guard to prevent re-running endLoginFlow
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
				// Prevent re-running after successful completion
				if ( flowCompleted ) {
					return;
				}

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
				const verifyEmailEl = container.querySelector( '.newspack-registration__verify-email' );

				// Check if this is a new registration that needs email verification
				// Note: verified can be false, null, or undefined - we need verification if it's not true
				const needsVerification =
					! data?.existing_user && reader_registration_block_config.require_account_verification && data?.verified !== true;

				let successElement;
				if ( needsVerification ) {
					successElement = verifyEmailEl;
					// Set the email address in the verification UI
					const emailAddressEl = verifyEmailEl?.querySelector( '.newspack-registration__verify-email-address' );
					if ( emailAddressEl && data?.email ) {
						emailAddressEl.textContent = data.email;
					}
				} else {
					successElement = data?.existing_user ? loginSuccessEl : registrationSuccessEl;
				}

				// Hide all success/verification elements first to ensure only one shows
				registrationSuccessEl?.classList.add( 'newspack-registration--hidden' );
				loginSuccessEl?.classList.add( 'newspack-registration--hidden' );
				verifyEmailEl?.classList.add( 'newspack-registration--hidden' );

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
					// Set flowCompleted early to prevent 'reader' event listener from interfering
					flowCompleted = true;
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
				if ( detail.authenticated && ! flowCompleted ) {
					form.endLoginFlow( null, 200, { existing_user: true } );
				}
			} );

			// Store the form action URL before the form might be removed
			const formActionUrl = form.getAttribute( 'action' ) || window.location.pathname;

			// Handle verification resend buttons (pending verification and post-registration)
			container.querySelectorAll( '[data-resend-verification]' ).forEach( resendButton => {
				const originalText = resendButton.textContent;
				resendButton.addEventListener( 'click', () => {
					resendButton.disabled = true;
					const reader = readerActivation.getReader();
					const email = reader?.email;

					if ( ! email ) {
						resendButton.disabled = false;
						return;
					}

					const verifyBody = new FormData();
					verifyBody.set( 'newspack_reader_registration', 'newspack_reader_registration' );
					verifyBody.set( 'npe', email );

					fetch( formActionUrl, {
						method: 'POST',
						headers: { Accept: 'application/json' },
						body: verifyBody,
					} )
						.then( res => {
							if ( res.status === 200 ) {
								resendButton.textContent = 'Email sent!';
								setTimeout( () => {
									resendButton.textContent = originalText;
									resendButton.disabled = false;
								}, 3000 );
							} else {
								resendButton.disabled = false;
							}
						} )
						.catch( () => {
							resendButton.disabled = false;
						} );
				} );
			} );
		} );
	} );
} );

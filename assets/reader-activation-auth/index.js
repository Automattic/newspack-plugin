/* globals newspack_ras_config newspack_reader_auth_labels */

/**
 * Internal dependencies.
 */
import { domReady, formatTime } from './utils';

import './google-oauth';
import './otp-input';

import './style.scss';

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
		let lastModalTrigger; // Button clicked to open modal.
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
								reader?.authenticated ? labels.signedin : labels.signedout;
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
		 * Trap focus in the modal when opened.
		 * See: https://uxdesign.cc/how-to-trap-focus-inside-modal-to-make-it-ada-compliant-6a50f9a70700
		 */
		function trapFocus( currentModal ) {
			const focusableEls =
				'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

			const firstFocusableEl = currentModal.querySelectorAll( focusableEls )[ 0 ]; // get first element to be focused inside modal
			const focusableElsAll = currentModal.querySelectorAll( focusableEls );
			const lastFocusableEl = focusableElsAll[ focusableElsAll.length - 1 ]; // get last element to be focused inside modal

			document.addEventListener( 'keydown', function ( e ) {
				const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

				if ( ! isTabPressed ) {
					return;
				}

				/* eslint-disable @wordpress/no-global-active-element */
				if ( e.shiftKey ) {
					if ( document.activeElement === firstFocusableEl ) {
						lastFocusableEl.focus();
						e.preventDefault();
					}
				} else if ( document.activeElement === lastFocusableEl ) {
					firstFocusableEl.focus();
					e.preventDefault();
				}
				/* eslint-enable @wordpress/no-global-active-element */
			} );
		}

		/**
		 * Handle account links.
		 */
		function handleAccountLinkClick( ev ) {
			const reader = readerActivation.getReader();
			/** If logged in, bail and allow page redirection. */
			if ( reader?.authenticated ) {
				return;
			}
			// Store element that was clicked as the modal trigger.
			lastModalTrigger = this;

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

			trapFocus( container );

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

			// Function to close the modal.
			function closeModal( ev ) {
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
				if ( lastModalTrigger ) {
					// Return focus to the element that triggered the modal.
					lastModalTrigger.focus();
				}
			}

			// Add an event listener if the Close button exists:
			if ( closeButton ) {
				closeButton.addEventListener( 'click', function ( ev ) {
					closeModal( ev );
				} );
				document.addEventListener( 'keydown', function ( ev ) {
					if ( ev.key === 'Escape' || ev.keyCode === 27 ) {
						closeModal( ev );
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
				if ( ! [ 'register', 'signin', 'pwd', 'otp' ].includes( action ) ) {
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
			setFormAction( currentHash === 'register_modal' ? 'register' : 'signin' );
			window.addEventListener( 'hashchange', () => {
				if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
					setFormAction( currentHash === 'register_modal' ? 'register' : 'signin' );
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
				container.setAttribute( 'data-form-status', status );
				form.style.opacity = 1;
				submitButtons.forEach( button => {
					button.disabled = false;
				} );
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
									form.endLoginFlow(
										data.message,
										200,
										data,
										currentHash ? '' : body.get( 'redirect' )
									);
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
											let redirect = body.get( 'redirect' );
											if ( status === 200 ) {
												readerActivation.setReaderEmail( body.get( 'npe' ) );
											}
											/** Redirect every registration to the account page for verification if not coming from a hash link */
											if ( action === 'register' ) {
												redirect = newspack_ras_config.account_url;
											}
											/** Never redirect from hash links. */
											if ( currentHash ) {
												redirect = '';
											}
											if ( data.action ) {
												setFormAction( data.action );
												if ( data.action === 'otp' ) {
													readerActivation.setOTPTimer();
													handleOTPTimer();
												}
											} else {
												form.endLoginFlow( message, status, data, redirect );
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
} );

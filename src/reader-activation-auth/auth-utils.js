/**
 * Shared utilities for authentication flows.
 *
 * Used by both the auth form modal and the reader registration block.
 */

import { formatTime } from '../utils';

/**
 * Create an OTP timer handler for a resend button.
 *
 * @param {Object}            readerActivation The readerActivation API.
 * @param {HTMLButtonElement} resendButton     The resend button element.
 *
 * @return {Function} A function to start/update the OTP timer.
 */
export function createOTPTimerHandler( readerActivation, resendButton ) {
	if ( ! resendButton ) {
		return () => {};
	}

	return () => {
		resendButton.originalButtonText = resendButton.textContent.replace( /\s\(\d{1,}:\d{2}\)/, '' );

		const updateButton = () => {
			const remaining = readerActivation.getOTPTimeRemaining();
			if ( remaining ) {
				resendButton.textContent = `${ resendButton.originalButtonText } (${ formatTime( remaining ) })`;
				resendButton.disabled = true;
			} else {
				resendButton.textContent = resendButton.originalButtonText;
				resendButton.disabled = false;
				clearInterval( resendButton.otpTimerInterval );
			}
		};

		const remaining = readerActivation.getOTPTimeRemaining();
		if ( remaining ) {
			resendButton.otpTimerInterval = setInterval( updateButton, 1000 );
			updateButton();
		}
	};
}

/**
 * Handle OTP verification.
 *
 * @param {Object}   readerActivation  The readerActivation API.
 * @param {string}   code              The OTP code to verify.
 * @param {Object}   options           Options object.
 * @param {Function} options.onSuccess Callback on successful verification.
 * @param {Function} options.onError   Callback on error.
 * @param {Function} options.onExpired Callback when OTP has expired.
 * @param {Function} options.onFinally Callback that always runs after verification.
 *
 * @return {Promise} The authentication promise.
 */
export function verifyOTP( readerActivation, code, { onSuccess, onError, onExpired, onFinally } = {} ) {
	return readerActivation
		.authenticateOTP( code )
		.then( data => {
			if ( onSuccess ) {
				onSuccess( data );
			}
		} )
		.catch( data => {
			const errorMessage = data?.message || 'Invalid code. Please try again.';
			if ( data?.expired ) {
				if ( onExpired ) {
					onExpired( errorMessage, data );
				} else if ( onError ) {
					onError( errorMessage, data );
				}
			} else if ( onError ) {
				onError( errorMessage, data );
			}
		} )
		.finally( () => {
			if ( onFinally ) {
				onFinally();
			}
		} );
}

/**
 * Send authentication link (magic link) to an email address.
 *
 * @param {string}   email               The email address.
 * @param {string}   actionUrl           The form action URL.
 * @param {Object}   options             Options object.
 * @param {string}   options.formId      Optional form identifier (e.g., 'reader-activation-auth-form').
 * @param {string}   options.redirectUrl Optional redirect URL after authentication.
 * @param {Function} options.onSuccess   Callback on success.
 * @param {Function} options.onError     Callback on error.
 * @param {Function} options.onFinally   Callback that always runs.
 *
 * @return {Promise} The fetch promise.
 */
export function sendAuthLink( email, actionUrl, { formId = 'reader-activation-auth-form', redirectUrl, onSuccess, onError, onFinally } = {} ) {
	const body = new FormData();
	body.set( formId, '1' );
	body.set( 'npe', email );
	body.set( 'action', 'link' );

	if ( redirectUrl ) {
		body.set( 'redirect_url', redirectUrl );
	}

	return fetch( actionUrl || window.location.pathname, {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body,
	} )
		.then( res => {
			if ( res.status === 200 ) {
				if ( onSuccess ) {
					onSuccess( res );
				}
			} else {
				res.json().then( ( { message } ) => {
					if ( onError ) {
						onError( message || 'Failed to send authentication link.' );
					}
				} );
			}
		} )
		.catch( () => {
			if ( onError ) {
				onError( 'Failed to send authentication link.' );
			}
		} )
		.finally( () => {
			if ( onFinally ) {
				onFinally();
			}
		} );
}

/**
 * Authenticate with password.
 *
 * @param {string}   email             The email address.
 * @param {string}   password          The password.
 * @param {string}   actionUrl         The form action URL.
 * @param {Object}   options           Options object.
 * @param {string}   options.formId    Optional form identifier.
 * @param {Function} options.onSuccess Callback on success with data.
 * @param {Function} options.onError   Callback on error with message.
 * @param {Function} options.onFinally Callback that always runs.
 *
 * @return {Promise} The fetch promise.
 */
export function authenticateWithPassword(
	email,
	password,
	actionUrl,
	{ formId = 'reader-activation-auth-form', onSuccess, onError, onFinally } = {}
) {
	const body = new FormData();
	body.set( formId, '1' );
	body.set( 'npe', email );
	body.set( 'password', password );
	body.set( 'action', 'pwd' );

	return fetch( actionUrl || window.location.pathname, {
		method: 'POST',
		headers: { Accept: 'application/json' },
		body,
	} )
		.then( res => {
			res.json().then( ( { message, data } ) => {
				if ( res.status === 200 && data?.authenticated ) {
					if ( onSuccess ) {
						onSuccess( message, data );
					}
				} else if ( onError ) {
					onError( message || 'Password not recognized, try again.' );
				}
			} );
		} )
		.catch( () => {
			if ( onError ) {
				onError( 'An error occurred. Please try again.' );
			}
		} )
		.finally( () => {
			if ( onFinally ) {
				onFinally();
			}
		} );
}

/**
 * Create an OTP submission handler.
 *
 * @param {Object}      readerActivation         The readerActivation API.
 * @param {Object}      elements                 DOM elements.
 * @param {Function}    elements.getOtpCode      Function that returns the OTP code value.
 * @param {HTMLElement} elements.submitButton    The submit button element.
 * @param {HTMLElement} elements.responseElement The response/error element.
 * @param {Object}      callbacks                Callback functions.
 * @param {Function}    callbacks.onSuccess      Callback on successful verification.
 * @param {Function}    callbacks.onExpired      Callback when OTP has expired.
 *
 * @return {Function} The submit handler function.
 */
export function createOTPSubmitHandler( readerActivation, { getOtpCode, submitButton, responseElement }, { onSuccess, onExpired } = {} ) {
	const showError = message => {
		if ( responseElement ) {
			responseElement.textContent = message;
		}
	};

	const clearError = () => {
		if ( responseElement ) {
			responseElement.textContent = '';
		}
	};

	return () => {
		const code = getOtpCode();
		if ( ! code || code.length !== 6 ) {
			showError( 'Please enter the 6-digit code.' );
			return;
		}
		clearError();
		if ( submitButton ) {
			submitButton.disabled = true;
		}

		verifyOTP( readerActivation, code, {
			onSuccess: data => {
				if ( onSuccess ) {
					onSuccess( data );
				}
			},
			onExpired: errorMessage => {
				showError( errorMessage );
				if ( onExpired ) {
					setTimeout( onExpired, 2000 );
				}
			},
			onError: errorMessage => {
				showError( errorMessage );
			},
			onFinally: () => {
				if ( submitButton ) {
					submitButton.disabled = false;
				}
			},
		} );
	};
}

/**
 * Create a password submission handler.
 *
 * @param {Object}      elements                 DOM elements.
 * @param {Function}    elements.getEmail        Function that returns the current email.
 * @param {HTMLElement} elements.passwordInput   The password input element.
 * @param {HTMLElement} elements.submitButton    The submit button element.
 * @param {HTMLElement} elements.responseElement The response/error element.
 * @param {string}      actionUrl                The form action URL.
 * @param {Object}      callbacks                Callback functions.
 * @param {Function}    callbacks.onSuccess      Callback on successful authentication.
 *
 * @return {Function} The submit handler function.
 */
export function createPasswordSubmitHandler( { getEmail, passwordInput, submitButton, responseElement }, actionUrl, { onSuccess } = {} ) {
	const showError = message => {
		if ( responseElement ) {
			responseElement.textContent = message;
		}
	};

	const clearError = () => {
		if ( responseElement ) {
			responseElement.textContent = '';
		}
	};

	return () => {
		const email = getEmail();
		if ( ! passwordInput || ! email ) {
			return;
		}
		const password = passwordInput.value;
		if ( ! password ) {
			showError( 'Please enter your password.' );
			return;
		}
		clearError();
		if ( submitButton ) {
			submitButton.disabled = true;
		}

		authenticateWithPassword( email, password, actionUrl, {
			onSuccess: ( message, data ) => {
				if ( onSuccess ) {
					onSuccess( message, data );
				}
			},
			onError: errorMessage => {
				showError( errorMessage );
			},
			onFinally: () => {
				if ( submitButton ) {
					submitButton.disabled = false;
				}
			},
		} );
	};
}

/**
 * Create a "send link" handler that sends a magic link and transitions to OTP state.
 *
 * @param {Object}      elements                 DOM elements.
 * @param {Function}    elements.getEmail        Function that returns the current email.
 * @param {HTMLElement} elements.linkButton      The send link button element.
 * @param {HTMLElement} elements.responseElement The response/error element.
 * @param {string}      actionUrl                The form action URL.
 * @param {Object}      callbacks                Callback functions.
 * @param {Function}    callbacks.onSuccess      Callback on success (to transition to OTP state).
 *
 * @return {Function} The handler function.
 */
export function createSendLinkHandler( { getEmail, linkButton, responseElement }, actionUrl, { onSuccess } = {} ) {
	const showError = message => {
		if ( responseElement ) {
			responseElement.textContent = message;
		}
	};

	const clearError = () => {
		if ( responseElement ) {
			responseElement.textContent = '';
		}
	};

	return () => {
		const email = getEmail();
		if ( ! email ) {
			return;
		}
		clearError();
		if ( linkButton ) {
			linkButton.disabled = true;
		}

		sendAuthLink( email, actionUrl, {
			onSuccess: () => {
				if ( onSuccess ) {
					onSuccess();
				}
			},
			onError: errorMessage => {
				showError( errorMessage );
			},
			onFinally: () => {
				if ( linkButton ) {
					linkButton.disabled = false;
				}
			},
		} );
	};
}

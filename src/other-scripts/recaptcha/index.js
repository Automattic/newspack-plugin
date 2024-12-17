/* globals jQuery, grecaptcha, newspack_recaptcha_data */

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

window.newspack_grecaptcha = window.newspack_grecaptcha || {
	destroy: destroyV3Field,
	render,
	version: newspack_recaptcha_data.version,
};

const isV2 = 'v2' === newspack_recaptcha_data.version.substring( 0, 2 );
const isV3 = 'v3' === newspack_recaptcha_data.version;
const siteKey = newspack_recaptcha_data.site_key;
const isInvisible = 'v2_invisible' === newspack_recaptcha_data.version;

/**
 * Destroy hidden reCAPTCHA v3 token fields to avoid unnecessary reCAPTCHA checks.
 */
function destroyV3Field( forms = [] ) {
	if ( isV3 ) {
		const formsToHandle = forms.length
			? forms
			: [ ...document.querySelectorAll( 'form[data-newspack-recaptcha]' ) ];

		formsToHandle.forEach( form => {
			removeHiddenV3Field( form );
		} );
	}
}

/**
 * Refresh the reCAPTCHA v3 token for the given form and action.
 *
 * @param {HTMLElement} field  The hidden input field storing the token for a form.
 * @param {string}      action The action name to pass to reCAPTCHA.
 *
 * @return {Promise<void>|void} A promise that resolves when the token is refreshed.
 */
function refreshV3Token( field, action = 'submit' ) {
	if ( field ) {
		// Get a token to pass to the server. See https://developers.google.com/recaptcha/docs/v3 for API reference.
		return grecaptcha.execute( siteKey, { action } ).then( token => {
			field.value = token;
		} );
	}
}

/**
 * Append a hidden reCAPTCHA v3 token field to the given form.
 *
 * @param {HTMLElement} form The form element.
 */
function addHiddenV3Field( form ) {
	let field = form.querySelector( 'input[name="g-recaptcha-response"]' );
	if ( ! field ) {
		field = document.createElement( 'input' );
		field.type = 'hidden';
		field.name = 'g-recaptcha-response';
		form.appendChild( field );

		const action = form.getAttribute( 'data-newspack-recaptcha' ) || 'submit';
		refreshV3Token( field, action );
		setInterval( () => refreshV3Token( field, action ), 30000 ); // Refresh token every 30 seconds.

		// Refresh reCAPTCHAs on Woo checkout update and error.
		if ( jQuery ) {
			jQuery( document ).on( 'updated_checkout', () => refreshV3Token( field, action ) );
			jQuery( document.body ).on( 'checkout_error', () => refreshV3Token( field, action ) );
		}
	}
}

/**
 * Remove the hidden reCAPTCHA v3 token field from the given form.
 *
 * @param {HTMLElement} form The form element.
 */
function removeHiddenV3Field( form ) {
	const field = form.querySelector( 'input[name="g-recaptcha-response"]' );
	if ( field ) {
		field.parentElement.removeChild( field );
	}
}

/**
 * Refresh the reCAPTCHA v2 widget attached to the given element.
 *
 * @param {HTMLElement} el Element with the reCAPTCHA widget to refresh.
 */
function refreshV2Widget( el ) {
	const widgetId = parseInt( el.getAttribute( 'data-recaptcha-widget-id' ) );
	if ( ! isNaN( widgetId ) ) {
		grecaptcha.reset( widgetId );
	}
}

/**
 * Render reCAPTCHA v2 widget on the given form.
 *
 * @param {HTMLElement}   form      The form element.
 * @param {Function|null} onSuccess Callback to handle success. Optional.
 * @param {Function|null} onError   Callback to handle errors. Optional.
 */
function renderV2Widget( form, onSuccess = null, onError = null ) {
	// Common render options for reCAPTCHA v2 widget. See https://developers.google.com/recaptcha/docs/invisible#render_param for supported params.
	const options = {
		sitekey: siteKey,
		size: isInvisible ? 'invisible' : 'normal',
		isolated: true,
	};

	const submitButtons = [
		...form.querySelectorAll( 'input[type="submit"], button[type="submit"]' )
	];
	submitButtons.forEach( button => {
		// Don't render widget if the button has a data-skip-recaptcha attribute.
		if ( button.hasAttribute( 'data-skip-recaptcha' ) ) {
			return;
		}
		// Refresh widget if it already exists.
		if ( button.hasAttribute( 'data-recaptcha-widget-id' ) ) {
			refreshV2Widget( button );
			return;
		}
		// Callback when reCAPTCHA passes validation or skip flag is present.
		const successCallback = () => {
			onSuccess?.()
			form.requestSubmit( button );
			refreshV2Widget( button );
		};
		// Callback when reCAPTCHA rendering fails or expires.
		const errorCallback = () => {
			const retryCount = parseInt( button.getAttribute( 'data-recaptcha-retry-count' ) ) || 0;
			if ( retryCount < 3 ) {
				refreshV2Widget( button );
				grecaptcha.execute( button.getAttribute( 'data-recaptcha-widget-id' ) );
				button.setAttribute( 'data-recaptcha-retry-count', retryCount + 1 );
			} else {
				const message = wp.i18n.__( 'There was an error connecting with reCAPTCHA. Please reload the page and try again.', 'newspack-plugin' );
				if ( onError ) {
					onError( message );
				} else {
					addErrorMessage( form, message );
				}
			}
		}
		const container = document.createElement( 'div' );
		container.classList.add( 'grecaptcha-container' );
		button.parentElement.append( container );
		const widgetId = grecaptcha.render( container, {
			...options,
			callback: successCallback,
			'error-callback': errorCallback,
			'expired-callback': errorCallback,
		} );
		button.setAttribute( 'data-recaptcha-widget-id', widgetId );

		// Refresh reCAPTCHA widgets on Woo checkout update and error.
		if ( jQuery ) {
			jQuery( document ).on( 'updated_checkout', () => renderV2Widget( form, onSuccess, onError ) );
			jQuery( document.body ).on( 'checkout_error', () => renderV2Widget( form, onSuccess, onError ) );
		}

		button.addEventListener( 'click', e => {
			e.preventDefault();
			e.stopImmediatePropagation();
			// Empty error messages if present.
			removeErrorMessages( form );
			// Skip reCAPTCHA verification if the button has a data-skip-recaptcha attribute.
			if ( button.hasAttribute( 'data-skip-recaptcha' ) ) {
				successCallback();
			} else {
				grecaptcha.execute( widgetId ).then( () => {
					// If we are in an iframe scroll to top.
					if ( window?.location !== window?.parent?.location ) {
						document.body.scrollIntoView( { behavior: 'smooth' } );
					}
				} );
			}
		} );
	} );
}

/**
 * Append a generic error message above the given form.
 *
 * @param {HTMLElement} form    The form element.
 * @param {string}      message The error message to display.
 */
function addErrorMessage( form, message ) {
	const errorText = document.createElement( 'p' );
	errorText.textContent = message;
	const container = document.createElement( 'div' );
	container.classList.add( 'newspack-recaptcha-error' );
	container.appendChild( errorText );
	// Newsletters block errors render below the form.
	if ( form.parentElement.classList.contains( 'newspack-newsletters-subscribe' ) ) {
		form.append( container );
	} else {
		container.classList.add( 'newspack-ui__notice', 'newspack-ui__notice--error' );
		form.insertBefore( container, form.firstChild );
	}
}

/**
 * Remove generic error messages from form if present.
 *
 * @param {HTMLElement} form The form element.
 */
function removeErrorMessages( form ) {
	const errors = form.querySelectorAll( '.newspack-recaptcha-error' );
	for ( const error of errors ) {
		error.parentElement.removeChild( error );
	}
}

/**
 * Render reCAPTCHA elements.
 *
 * @param {Array}         forms     Array of form elements to render reCAPTCHA on.
 * @param {Function|null} onSuccess Callback to handle success. Optional.
 * @param {Function|null} onError   Callback to handle errors. Optional.
 */
function render( forms = [], onSuccess = null, onError = null ) {
	// In case some other file calls this function before the reCAPTCHA API is ready.
	if ( ! grecaptcha ) {
		return domReady( () => grecaptcha.ready( () => render( forms, onSuccess, onError ) ) );
	}

	const formsToHandle = forms.length
		? forms
		: [ ...document.querySelectorAll( 'form[data-newspack-recaptcha]' ) ];

	formsToHandle.forEach( form => {
		if ( ! form.hasAttribute( 'data-recaptcha-rendered' ) ) {
			form.addEventListener( 'focusin', () => {
				if ( isV2 ) {
					renderV2Widget( form, onSuccess, onError );
				}
				if ( isV3 ) {
					addHiddenV3Field( form );
				}
			} );
			form.setAttribute( 'data-recaptcha-rendered', 'true' );
		} else {
			// Call render methods to trigger refresh.
			if ( isV2 ) {
				renderV2Widget( form, onSuccess, onError );
			}
			if ( isV3 ) {
				addHiddenV3Field( form );
			}
		}
	} );
}

/**
 * Invoke only after reCAPTCHA API is ready.
 */
domReady( function () {
	grecaptcha.ready( render );
} );

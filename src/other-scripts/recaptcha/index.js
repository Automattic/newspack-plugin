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
	destroy,
	render,
	version: newspack_recaptcha_data.version,
};

const isV2 = 'v2' === newspack_recaptcha_data.version.substring( 0, 2 );
const isV3 = 'v3' === newspack_recaptcha_data.version;
const siteKey = newspack_recaptcha_data.site_key;
const isInvisible = 'v2_invisible' === newspack_recaptcha_data.version;

/**
 * Refresh the reCAPTCHA v3 token for the given form and action.
 *
 * @param {HTMLElement} field  The hidden input field storing the token for a form.
 * @param {string}      action The action name to pass to reCAPTCHA.
 *
 * @return {Promise<void>|void} A promise that resolves when the token is refreshed.
 */
function refresh( field, action = 'submit' ) {
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
function addHiddenField( form ) {
	let field = form.querySelector( 'input[name="g-recaptcha-response"]' );
	if ( ! field ) {
		field = document.createElement( 'input' );
		field.type = 'hidden';
		field.name = 'g-recaptcha-response';
		form.appendChild( field );

		const action = form.getAttribute( 'data-newspack-recaptcha' ) || 'submit';
		refresh( field, action );
		setInterval( () => refresh( field, action ), 30000 ); // Refresh token every 30 seconds.

		// Refresh reCAPTCHAs on Woo checkout update and error.
		( function ( $ ) {
			if ( ! $ ) {
				return;
			}
			$( document ).on( 'updated_checkout', () => refresh( field, action ) );
			$( document.body ).on( 'checkout_error', () => refresh( field, action ) );
		} )( jQuery );
	}
}

/**
 * Remove the hidden reCAPTCHA v3 token field from the given form.
 *
 * @param {HTMLElement} form The form element.
 */
function removeHiddenField( form ) {
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
function refreshWidget( el ) {
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
function renderWidget( form, onSuccess = null, onError = null ) {
	const submitButtons = [
		...form.querySelectorAll( 'input[type="submit"], button[type="submit"]' ),
	];

	// Common render options for reCAPTCHA v2 widget. See https://developers.google.com/recaptcha/docs/invisible#render_param for supported params.
	const options = {
		sitekey: siteKey,
		size: isInvisible ? 'invisible' : 'normal',
		isolated: true,
	};

	submitButtons.forEach( button => {
		// Don't render widget if the button has a data-skip-recaptcha attribute.
		if ( button.hasAttribute( 'data-skip-recaptcha' ) ) {
			return;
		}

		// Don't render widget if the button has been retried 3 times.
		if ( button.hasAttribute( 'data-recaptcha-retry-count' ) && parseInt( button.getAttribute( 'data-recaptcha-retry-count' ) ) >= 3 ) {
			return;
		}

		// Refresh widget if it already exists.
		if ( button.hasAttribute( 'data-recaptcha-widget-id' ) ) {
			refreshWidget( button );
			return;
		}

		// Callback when reCAPTCHA passes validation.
		const successCallback = () => {
			onSuccess?.()
			form.requestSubmit( button );
			refreshWidget( button );
		};

		// Render reCAPTCHA widget. See https://developers.google.com/recaptcha/docs/invisible#js_api for API reference.
		const widgetId = grecaptcha.render( button, {
			...options,
			callback: successCallback,
			'error-callback': () => {
				const retryCount = parseInt( button.getAttribute( 'data-recaptcha-retry-count' ) ) || 0;
				if ( retryCount < 3 ) {
					button.setAttribute( 'data-recaptcha-retry-count', retryCount + 1 );
					refreshWidget( button );
				} else {
					clearInterval( refreshIntervalId );
				}
				const message = retryCount < 3
					? wp.i18n.__( 'There was an error with reCAPTCHA. Please try again.', 'newspack-plugin' )
					: wp.i18n.__( 'There was an error with reCAPTCHA. Please reload the page and try again.', 'newspack-plugin' );
				if ( onError ) {
					onError( message );
				} else {
					// Recaptcha's default error behavior is to alert with the above message.
					// eslint-disable-next-line no-alert
					alert( message );
				}
			},
		} );

		button.setAttribute( 'data-recaptcha-widget-id', widgetId );
		const refreshIntervalId = setInterval( () => refreshWidget( button ), 120000 ); // Refresh widget every 2 minutes.

		button.addEventListener( 'click', e => {
			e.preventDefault();
			// Skip reCAPTCHA verification if the button has a data-skip-recaptcha attribute.
			if ( button.hasAttribute( 'data-skip-recaptcha' ) ) {
				successCallback();
			} else {
				grecaptcha.execute( widgetId );
			}
		} );
	} );
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
		if ( isV3 ) {
			addHiddenField( form );
		}
		if ( isV2 ) {
			renderWidget( form, onSuccess, onError );
		}
	} );
}

/**
 * Destroy hidden reCAPTCHA v3 token fields to avoid unnecessary reCAPTCHA checks.
 */
function destroy( forms = [] ) {
	if ( isV3 ) {
		const formsToHandle = forms.length
			? forms
			: [ ...document.querySelectorAll( 'form[data-newspack-recaptcha]' ) ];

		formsToHandle.forEach( form => {
			removeHiddenField( form );
		} );
	}
}

/**
 * Invoke only after reCAPTCHA API is ready.
 */
domReady( function () {
	grecaptcha.ready( render );
} );

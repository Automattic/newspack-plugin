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

// A global object to store reCAPTCHA functions and data to access from other plugins.
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
 * If using the invisible reCAPTCHA v2, set up a global callback function
 * to be fired after a successful challenge response. (v2 only)
 */
if ( isInvisible ) {
	window.newspack_grecaptcha_callback = function ( token ) {
		const button = document.querySelector( '[data-newspack-recaptcha-is-active]' );
		if ( button ) {
			const form = button.closest( 'form' );
			addHiddenField( form, token );
			form.requestSubmit( form.querySelector( 'input[type="submit"], button[type="submit"]' ) );
			button.removeAttribute( 'data-newspack-recaptcha-is-active' );
			grecaptcha.reset();
		}
	};
}

/**
 * Refresh the reCAPTCHA v3 token for the given form and action. (v3 only)
 *
 * @param {HTMLElement} field  The hidden input field storing the token for a form.
 * @param {string}      action The action name to pass to reCAPTCHA.
 *
 * @return {Promise<void>}
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
 * Append a hidden reCAPTCHA token field to the given form. (v2 and v3)
 *
 * @param {HTMLElement} form  The form element.
 * @param {string|null} token The reCAPTCHA token. (v2 only)
 */
function addHiddenField( form, token = null ) {
	let field = form.querySelector( 'input[name="g-recaptcha-response"]' );
	if ( ! field ) {
		field = document.createElement( 'input' );
		field.type = 'hidden';
		field.name = 'g-recaptcha-response';
		form.appendChild( field );

		// If passed a token, set it and return early. (v2 only)
		if ( field && token ) {
			field.value = token;
			return field;
		}

		// Otherwise, fetch a token and set it. (v3 only)
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

	return field;
}

/**
 * Remove the hidden reCAPTCHA v3 token field from the given form. (v2 and v3)
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
 * Clear token fields and refresh the reCAPTCHA v2 widget. (v2 only)
 */
function refreshWidget() {
	destroy();
	grecaptcha.reset();
}

/**
 * Render reCAPTCHA v2 widget on the given form. (v2 only)
 *
 * @param {HTMLElement} form The form element.
 */
function renderWidget( form ) {
	const submitButtons = [
		...form.querySelectorAll( 'input[type="submit"], button[type="submit"]' ),
	];

	submitButtons.forEach( button => {
		button.addEventListener( 'click', e => {
			const parent = button.closest( 'form' );
			if ( parent.hasAttribute( 'data-newspack-recaptcha' ) ) {
				button.setAttribute( 'data-newspack-recaptcha-is-active', '' );
				grecaptcha.execute();

				// For some reason, WooCommerce checkout forms don't properly pin the widget in a fixed location, so we need to scroll to the top of the page to ensure it's visible.
				if ( 'newspack_modal_checkout_container' === document.body.getAttribute( 'id' ) ) {
					document.body.scrollIntoView( { behavior: 'smooth' } );
				}
				e.preventDefault();
			}
		} );
	} );

	// Clear tokens and refresh widget every 2 minutes.
	setInterval( refreshWidget, 120000 );

	// Re-render widget on Woo checkout update and error.
	( function ( $ ) {
		if ( ! $ ) {
			return;
		}
		$( document ).on( 'updated_checkout', () => renderWidget( form ) );
		$( document.body ).on( 'checkout_error', () => renderWidget( form ) );
	} )( jQuery );
}

/**
 * Render reCAPTCHA elements. (v2 and v3)
 */
function render( forms = [] ) {
	// In case some other file calls this function before the reCAPTCHA API is ready.
	if ( ! grecaptcha ) {
		return domReady( () => grecaptcha.ready( () => render( forms ) ) );
	}

	const formsToHandle = forms.length
		? forms
		: [ ...document.querySelectorAll( 'form[data-newspack-recaptcha]' ) ];

	formsToHandle.forEach( form => {
		if ( isV3 ) {
			addHiddenField( form );
		}
		if ( isV2 ) {
			renderWidget( form );
		}
	} );
}

/**
 * Destroy hidden reCAPTCHA token fields on the given forms. (v2 and v3)
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
 * Invoke only after reCAPTCHA API is ready. (v2 and v3)
 */
domReady( render );

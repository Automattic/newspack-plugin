/* globals jQuery, grecaptcha, newspack_recaptcha_data, newspack_grecaptcha */

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
	destroyV3Captchas,
	renderV3Captchas,
	widgets: {},
};

const isV2 = 'v2' === newspack_recaptcha_data.version.substring( 0, 2 );
const isV3 = 'v3' === newspack_recaptcha_data.version;
const siteKey = newspack_recaptcha_data.site_key;
const isInvisible = 'v2_invisible' === newspack_recaptcha_data.version;

/**
 *
 * @param {HTMLElement} field  The hidden input field storing the token for a form.
 * @param {string}      action The action name to pass to reCAPTCHA.
 *
 * @return {Promise<void>}
 */
function refreshV3Token( field, action = 'submit' ) {
	return grecaptcha.execute( siteKey, { action } ).then( token => {
		if ( field ) {
			field.value = token;
		}
	} );
}

/**
 * Attach hidden reCAPTCHA v3 token fields to forms with the expected data attribute.
 */
function renderV3Captchas( forms = [] ) {
	const formsToHandle = forms.length
		? forms
		: [ ...document.querySelectorAll( 'form[data-newspack-recaptcha]' ) ];

	formsToHandle.forEach( form => {
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
			( function ( $ ) {
				if ( ! $ ) {
					return;
				}
				$( document ).on( 'updated_checkout', () => refreshV3Token( field, action ) );
				$( document.body ).on( 'checkout_error', () => refreshV3Token( field, action ) );
			} )( jQuery );
		}
	} );
}

/**
 * Destroy hidden reCAPTCHA v3 token fields to avoid unnecessary reCAPTCHA checks.
 */
function destroyV3Captchas( forms = [] ) {
	const formsToHandle = forms.length
		? forms
		: [ ...document.querySelectorAll( 'form[data-newspack-recaptcha]' ) ];

	formsToHandle.forEach( form => {
		const field = form.querySelector( 'input[name="g-recaptcha-response"]' );
		if ( field ) {
			field.parentElement.removeChild( field );
		}
	} );
}

/**
 * We need to chain these callbacks to avoid two potential race conditions.
 */
domReady( function () {
	grecaptcha.ready( function () {
		if ( isV2 ) {
			renderCaptchas();
		}
		if ( isV3 ) {
			renderV3Captchas();
		}
	} );
} );

/**
 * Render reCAPTCHA v2 widgets.
 */
function renderCaptchas() {
	const widgetContainers = [ ...document.querySelectorAll( '.grecaptcha-container' ) ];
	widgetContainers.forEach( container => {
		const containerId = container.id;
		const form = container.closest( 'form' );
		const submitButtons = isInvisible &&
			form && [ ...form.querySelectorAll( 'input[type="submit"], button[type="submit"]' ) ]; // If using the invisible widget, the target element must be the form's submit button.
		const options = {
			sitekey: siteKey,
			size: isInvisible ? 'invisible' : 'normal',
		};

		if ( isV2 && isInvisible && 0 < submitButtons.length ) {
			submitButtons.forEach( submitButton => {
				submitButton.addEventListener( 'click', e => e.preventDefault() ); // Prevent the submit button from submitting the form so reCAPTCHA can intervene.
				options.callback = () => form.requestSubmit( submitButton ); // If reCAPTCHA passes the action with a token, submit the form.

				const widgetId = grecaptcha.render( submitButton || container, options );
				newspack_grecaptcha.widgets[ containerId ] = widgetId;
			} );
		}
	} );
}

/**
 * Refresh all reCAPTCHA tokens.
 */
function refreshCaptchas() {
	if ( isV2 ) {
		const { widgets } = newspack_grecaptcha;
		for ( const containerId in widgets ) {
			grecaptcha.reset( newspack_grecaptcha.widgets[ containerId ] );
		}
	}
}

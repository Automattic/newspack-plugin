/* globals jQuery, grecaptcha, newspack_recaptcha_data, newspack_grecaptcha */

import './style.scss';

window.newspack_grecaptcha = window.newspack_grecaptcha || {
	widgets: {},
	getCaptchaV3Token,
	disableCaptchasForForm,
};

const isV2 = 'v2' === newspack_recaptcha_data.version.substring( 0, 2 );
const isV3 = 'v3' === newspack_recaptcha_data.version;
const siteKey = newspack_recaptcha_data.site_key;
const isInvisible = 'v2_invisible' === newspack_recaptcha_data.version;

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

/**
 * We need to chain these callbacks to avoid two potential race conditions.
 */
if ( isV2 ) {
	domReady( function () {
		grecaptcha.ready( function () {
			renderCaptchas();
		} );
	} );
}

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
				if ( ! form.hasAttribute( 'data-skip-captcha' ) ) {
					submitButton.addEventListener( 'click', e => {
						// Prevent the submit button from submitting the form so reCAPTCHA can intervene.
						e.preventDefault();
					} );
					options.callback = () => form.requestSubmit( submitButton ); // If reCAPTCHA passes the action with a token, submit the form.

					const widgetId = grecaptcha.render( submitButton || container, options );
					newspack_grecaptcha.widgets[ containerId ] = widgetId;
				}
			} );
		}
	} );
}

/**
 * Enable or disable reCAPTCHA for the given form.
 *
 * @param {HTMLElement} form    The form element.
 * @param {boolean}     disable If true, disable reCAPTCHA for the form. Otherwise, enable it.
 */
function disableCaptchasForForm( form, disable = false ) {
	if ( disable ) {
		form.setAttribute( 'data-skip-captcha', 'true' );
	} else {
		form.removeAttribute( 'data-skip-captcha' );
	}
	let submitButtons = isInvisible &&
		form && [ ...form.querySelectorAll( 'input[type="submit"], button[type="submit"]' ) ];

	submitButtons.forEach( submitButton => {
		// Replace the submit button with a clone of itself to detach event listeners.
		const clone = submitButton.cloneNode( true );
		submitButton.replaceWith( clone );
		submitButtons = form.querySelectorAll( '[type="submit"]' );
		renderCaptchas();
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

/**
 * Fetch a reCAPTCHA token via the v3 JS API. Only needed for reCAPTCHA v3.
 * v2 automatically generates a token on form submission, so if using v2 the
 * promise can be silently resolved.
 *
 * See: https://developers.google.com/recaptcha/docs/v3#programmatically_invoke_the_challenge
 *
 * @param {boolean} skip If true, skip reCAPTCHA verification and allow the action to proceed.
 *
 * @return {Promise<string>} The reCAPTCHA token, if needed, or an empty string.
 */
function getCaptchaV3Token( skip = false ) {
	return new Promise( ( res, rej ) => {
		if ( ! grecaptcha || ! isV3 || skip ) {
			return res( '' );
		}

		if ( ! grecaptcha?.ready ) {
			rej( 'Error loading the reCAPTCHA library.' );
		}

		grecaptcha.ready( () => {
			grecaptcha
				.execute( siteKey, { action: 'submit' } )
				.then( token => res( token ) )
				.catch( e => rej( e ) );
		} );
	} );
}

// Refresh reCAPTCHAs on Woo checkout update and error.
( function ( $ ) {
	if ( ! $ ) {
		return;
	}
	$( document ).on( 'updated_checkout', renderCaptchas );
	$( document.body ).on( 'checkout_error', refreshCaptchas );
} )( jQuery );

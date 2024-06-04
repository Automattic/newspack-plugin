/* globals jQuery, grecaptcha, newspack_recaptcha_data, newspack_grecaptcha */

import './style.scss';

window.newspack_grecaptcha = window.newspack_grecaptcha || {
	widgets: {},
	getCaptchaV3Token,
};

const isV2 = 'v2' === newspack_recaptcha_data.version.substring( 0, 2 );
const isV3 = 'v3' === newspack_recaptcha_data.version;
const siteKey = newspack_recaptcha_data.site_key;
const isInvisible = 'v2_invisible' === newspack_recaptcha_data.version;

if ( isV2 ) {
	window.renderCaptchas = () => {
		const widgetContainers = [ ...document.querySelectorAll( '.grecaptcha-container' ) ];
		widgetContainers.forEach( container => {
			const containerId = container.id;
			const form = container.closest( 'form' );
			const submitButton =
				isInvisible && form && form.querySelector( 'input[type="submit"], button[type="submit"]' ); // If using the invisible widget, the target element must be the form's submit button.
			const options = {
				sitekey: siteKey,
				size: isInvisible ? 'invisible' : 'normal',
			};

			if ( isV2 && isInvisible && submitButton ) {
				submitButton.addEventListener( 'click', e => e.preventDefault() ); // Prevent the submit button from submitting the form so reCAPTCHA can intervene.
				options.callback = () => form.requestSubmit( submitButton ); // If reCAPTCHA passes the action with a token, submit the form.
			}

			const widgetId = grecaptcha.render( submitButton || container, options );
			newspack_grecaptcha.widgets[ containerId ] = widgetId;
		} );
	};
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
 * @return {Promise<string>} The reCAPTCHA token, if needed, or an empty string.
 */
function getCaptchaV3Token() {
	return new Promise( ( res, rej ) => {
		if ( ! grecaptcha || ! isV3 ) {
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
	$( document ).on( 'update_checkout', refreshCaptchas );
	$( document.body ).on( 'checkout_error', refreshCaptchas );
} )( jQuery );

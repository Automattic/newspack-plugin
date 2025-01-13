/* globals jQuery, grecaptcha, newspack_recaptcha_data */

import {
	addErrorMessage,
	addHiddenV3Field,
	destroyV3Field,
	domReady,
	getIntersectionObserver,
	refreshV2Widget,
	removeErrorMessages
} from './utils';
import './style.scss';

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
		// Callback when reCAPTCHA passes validation or skip flag is present.
		const successCallback = token => {
			onSuccess?.();
			// Ensure the token gets submitted with the form submission.
			let hiddenField = form.querySelector( '[name="g-recaptcha-response"]' );
			if ( ! hiddenField ) {
				hiddenField = document.createElement( 'input' );
				hiddenField.type = 'hidden';
				hiddenField.name = 'g-recaptcha-response';
				form.appendChild( hiddenField );
			}
			hiddenField.value = token;
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
		// Attach widget to form events.
		const attachListeners = () => {
			getIntersectionObserver( () => renderV2Widget( form, onSuccess, onError ) ).observe( form, { attributes: true } );
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
		}
		// Refresh reCAPTCHA widgets on Woo checkout update and error.
		if ( jQuery ) {
			jQuery( document ).on( 'updated_checkout', () => attachListeners );
			jQuery( document.body ).on( 'checkout_error', () => attachListeners );
		}
		// Refresh widget if it already exists.
		if ( button.hasAttribute( 'data-recaptcha-widget-id' ) ) {
			refreshV2Widget( button );
			return;
		}
		const container = document.createElement( 'div' );
		container.classList.add( 'grecaptcha-container' );
		document.body.append( container );
		const widgetId = grecaptcha.render( container, {
			...options,
			callback: successCallback,
			'error-callback': errorCallback,
			'expired-callback': errorCallback,
		} );
		button.setAttribute( 'data-recaptcha-widget-id', widgetId );
		attachListeners();
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
		: [ ...document.querySelectorAll(
			'form[data-newspack-recaptcha],form#add_payment_method',
		) ];

	formsToHandle.forEach( form => {
		const renderForm = () => {
			if ( isV2 ) {
				renderV2Widget( form, onSuccess, onError );
			}
			if ( isV3 ) {
				addHiddenV3Field( form );
			}
		};
		getIntersectionObserver( renderForm ).observe( form, { attributes: true } );
	} );
}

/**
 * Invoke only after reCAPTCHA API is ready.
 */
domReady( function () {
	grecaptcha.ready( render );
} );

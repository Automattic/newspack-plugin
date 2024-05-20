/* globals jQuery, grecaptcha, newspack_recaptcha_data */

import './style.scss';

window.newspack_grecaptcha = window.newspack_grecaptcha || {
	widgets: {},
	getCaptchaToken,
	refreshCaptchas,
};

window.renderCaptchas = () => {
	const widgetContainers = document.querySelectorAll( '.grecaptcha-container' );
	for ( let i = 0; i < widgetContainers.length; i++ ) {
		const containerId = widgetContainers[ i ].id;
		const widgetId = grecaptcha.render( widgetContainers[ i ], {
			sitekey: newspack_recaptcha_data.site_key,
		} );
		window.newspack_grecaptcha.widgets[ containerId ] = widgetId;
	}
};

function refreshCaptchas() {
	if ( 'v2' === newspack_recaptcha_data.version ) {
		const { widgets } = window.newspack_grecaptcha;
		for ( const containerId in widgets ) {
			grecaptcha.reset( window.newspack_grecaptcha.widgets[ containerId ] );
		}
	}
}

/**
 * Get a reCAPTCHA token on form submission. Only needed for v3.
 *
 * @return {Promise<string>} A promise that resolves with a reCAPTCHA token.
 */
function getCaptchaToken() {
	return new Promise( ( res, rej ) => {
		if (
			! grecaptcha ||
			! newspack_recaptcha_data.site_key ||
			'v3' !== newspack_recaptcha_data.version
		) {
			return res( '' );
		}

		if ( ! grecaptcha?.ready ) {
			rej( 'Error loading the reCAPTCHA v3 library.' );
		}

		grecaptcha.ready( () => {
			grecaptcha
				.execute( newspack_recaptcha_data.site_key, { action: 'submit' } )
				.then( token => res( token ) )
				.catch( e => rej( e ) );
		} );
	} );
}

( function ( $ ) {
	if ( ! $ ) {
		return;
	}
	$( document ).on( 'update_checkout', refreshCaptchas );
	$( document.body ).on( 'checkout_error', refreshCaptchas );
} )( jQuery );

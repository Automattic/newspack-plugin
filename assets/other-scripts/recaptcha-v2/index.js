/* globals grecaptcha, newspack_recaptcha_data */

import './style.scss';

window.grecaptchaWidgets = window.grecaptchaWidgets || {};
window.renderCaptchas = function () {
	const widgetContainers = document.querySelectorAll( '.grecaptcha-container' );
	for ( let i = 0; i < widgetContainers.length; i++ ) {
		const containerId = widgetContainers[ i ].id;
		const widgetId = grecaptcha.render( widgetContainers[ i ], {
			sitekey: newspack_recaptcha_data.site_key,
		} );
		window.grecaptchaWidgets[ containerId ] = widgetId;
	}
};

/* globals newspack_reader_activation_newsletters */

/**
 * Internal dependencies.
 */
import { domReady } from '../reader-activation-auth/utils';

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( function () {
	domReady( function () {
		const containers = [ ...document.querySelectorAll( '.newspack-newsletters-signup' ) ];
		if ( ! containers?.length ) {
			return;
		}

		containers.forEach( container => {
			const form = container.querySelector( 'form' );
			if ( ! form ) {
				return;
			}

			/**
			 * Handle newsletters signup form submission.
			 */
			form.addEventListener( 'submit', ev => {
				ev.preventDefault();

				const formData = new FormData( form );

				formData.append( 'security', newspack_reader_activation_newsletters.security );
				formData.append( 'action', 'newspack_reader_activation_newsletters_signup' );

				// Ajax request.
				fetch( newspack_reader_activation_newsletters.ajax_url, {
					method: 'POST',
					body: formData,
				} ).finally( () => {
					if ( container?.newslettersSignupCallback ) {
						container.newslettersSignupCallback();
					}
				} );
			} );
		} );
	} );
} );

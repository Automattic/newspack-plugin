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

				// TODO: Trigger form submission and handle signups on backend.
				//
				// For now, just trigger success callback.
				if ( container?.newslettersSignupCallback ) {
					container.newslettersSignupCallback();
				}
			} );
		} );
	} );
} );

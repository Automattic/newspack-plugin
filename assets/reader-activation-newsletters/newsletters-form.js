/* globals newspack_reader_activation_newsletters */

/**
 * Internal dependencies.
 */
import { domReady } from '../reader-activation-auth/utils';

import './style.scss';

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( function ( readerActivation ) {
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

			// Populate email if not already set.
			const emailInput = form.querySelector( 'input[name="email_address"]' );
			if ( emailInput && ! emailInput.value ) {
				const reader = readerActivation?.getReader();
				emailInput.value = reader?.email || '';
			}

			/**
			 * Handle newsletters signup form submission.
			 */
			form.addEventListener( 'submit', ev => {
				ev.preventDefault();

				if ( form.classList.contains( 'processing' ) ) {
					return;
				}

				form.classList.add( 'processing' );
				form.querySelector( 'button' ).setAttribute( 'disabled', 'disabled' );

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
					form.classList.remove( 'processing' );
					form.querySelector( 'button' ).removeAttribute( 'disabled' );
				} );
			} );
		} );
	} );
} );

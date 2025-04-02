/* globals newspack_reader_activation_newsletters */

/**
 * Internal dependencies.
 */
import { domReady } from '../utils';

import './style.scss';

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( function ( readerActivation ) {
	domReady( function () {
		const containers = [ ...document.querySelectorAll( '.newspack-newsletters-signup' ) ];
		if ( ! containers?.length ) {
			return;
		}

		containers.forEach( container => {
			let form = container.querySelector( 'form' );
			if ( ! form ) {
				return;
			}

			// Handle "See all" button logic.
			const seeAllButton = container.querySelector( '.see-all-button' );
			const newsletterContainer = container.querySelector( '.newsletter-list-container' );

			if ( seeAllButton && newsletterContainer ) {
				seeAllButton.addEventListener( 'click', () => {
					// Remove the "hidden" class from all newsletter items.
					newsletterContainer.querySelectorAll( '.hidden' ).forEach( ( item ) => {
						item.classList.remove( 'hidden' );
					} );

					// Adjust the container's max-height to fit all items.
					newsletterContainer.style.maxHeight = 'none';

					// Hide the "See all" button after expanding.
					seeAllButton.style.display = 'none';
				});

				// Set the initial max-height to show the default number of newsletters + 1 partially visible.
				const listDefaultSize = parseInt( newsletterContainer.dataset.listDefaultSize, 10 );
				const newsletterItems = newsletterContainer.querySelectorAll( '.newspack-ui__input-card' );

				if ( newsletterItems.length > listDefaultSize ) {
					const itemHeight = newsletterItems[0].offsetHeight; // Height of a single newsletter item.
					const gap = 16; // Adjust based on CSS gap/margin between items.
					const extraSpace = 32; // Additional space for partial visibility.

					// Calculate max-height: visible newsletters + 1 partially visible + gaps + extra space.
					const maxHeight = ( listDefaultSize * itemHeight ) + ( listDefaultSize * gap ) + extraSpace;

					newsletterContainer.style.maxHeight = `${maxHeight}px`;
				}
			}

			const handleSubmit = ev => {
				ev.preventDefault();

				if ( form.classList.contains( 'processing' ) ) {
					return;
				}

				form.classList.add( 'processing' );
				form.querySelector( 'button' ).setAttribute( 'disabled', 'disabled' );

				// Populate email if not already set.
				const emailInput = form.querySelector( 'input[name="email_address"]' );
				if ( emailInput && ! emailInput.value ) {
					const reader = readerActivation?.getReader();
					emailInput.value = reader?.email || '';
				}

				const data = new FormData( form );

				data.append( 'action', 'newspack_reader_activation_newsletters_signup' );

				// Ajax request.
				fetch( newspack_reader_activation_newsletters.newspack_ajax_url, {
					method: 'POST',
					body: data,
				} ).finally( () => {
					if ( container?.newslettersSignupCallback ) {
						container.newslettersSignupCallback();
					}
					form.classList.remove( 'processing' );
					form.querySelector( 'button' ).removeAttribute( 'disabled' );
				} );
			}

			/**
			 * Handle newsletters signup form submission.
			 */
			form.addEventListener( 'submit', handleSubmit );

			/**
			 * Handle container refresh.
			 */
			container.addEventListener( 'newspack:refresh', () => {
				form = container.querySelector( 'form' );
				if ( ! form ) {
					return;
				}
				// Make sure we aren't adding multiple event listeners to the form.
				form.removeEventListener( 'submit', handleSubmit );
				form.addEventListener( 'submit', handleSubmit );
			} );
		} );
	} );
} );

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
				// Remove the "hidden" class from all newsletter items.
				seeAllButton.addEventListener( 'click', () => {
					newsletterContainer.querySelectorAll( '.hidden' ).forEach( item => {
						item.classList.remove( 'hidden' );
					} );

					newsletterContainer.style.maxHeight = 'none';
					seeAllButton.remove();
				} );

				// Set the initial height to show partially visible.
				const listDefaultSize = parseInt( newsletterContainer.dataset.listDefaultSize, 10 );
				const newsletterItems = newsletterContainer.querySelectorAll( '.newspack-ui__input-card' );

				if ( newsletterItems.length > listDefaultSize ) {
					const gap = 12;
					const extraSpace = 32; // Additional space for partial visibility.

					let totalHeight = 0;
					newsletterItems.forEach( ( item, index ) => {
						if ( index < listDefaultSize ) {
							totalHeight += item.offsetHeight;
						}
					} );

					const maxHeight = totalHeight + listDefaultSize * gap + extraSpace;

					newsletterContainer.style.maxHeight = `${ maxHeight }px`;
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
				} )
					.then( () => {
						const lists = data.getAll( 'lists[]' );
						if ( lists.length ) {
							const signupMethod = form.getAttribute( 'data-signup-method' ) || 'post-checkout';
							readerActivation.dispatchActivity( 'newsletter_signup', {
								email: emailInput.value,
								lists,
								newsletters_subscription_method: signupMethod,
							} );
						}
					} )
					.finally( () => {
						if ( container?.newslettersSignupCallback ) {
							container.newslettersSignupCallback();
						}
						form.classList.remove( 'processing' );
						form.querySelector( 'button' ).removeAttribute( 'disabled' );
					} );
			};

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

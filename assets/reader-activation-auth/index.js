/* globals newspack_ras_config */
/**
 * Internal dependencies
 */
import { domReady } from './utils';
import { SIGN_IN_MODAL_HASHES, getModalContainer, openAuthModal } from './auth-modal.js';

import './auth-form.js';

window.newspackRAS = window.newspackRAS || [];
window.newspackRAS.push( readerActivation => {
	domReady( function () {
		/** Expose the openAuthModal function to the RAS scope */
		readerActivation._openAuthModal = openAuthModal;

		/**
		 * Handle hash change.
		 *
		 * @param {Event} ev Hash change event.
		 */
		function handleHashChange( ev ) {
			const container = getModalContainer();
			if ( ! container ) {
				return;
			}
			const currentHash = window.location.hash.replace( '#', '' );
			if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
				if ( ev ) {
					ev.preventDefault();
				}
				container.setFormAction( currentHash === 'register_modal' ? 'register' : 'signin' );
				openAuthModal();
			}
		}
		window.addEventListener( 'hashchange', handleHashChange );
		handleHashChange();

		/**
		 * Handle account link click.
		 *
		 * @param {Event} ev Click event.
		 */
		function handleAccountLinkClick( ev ) {
			ev.preventDefault();
			let callback, redirect;
			if ( ev.target.getAttribute( 'data-redirect' ) ) {
				redirect = ev.target.getAttribute( 'data-redirect' );
			} else {
				redirect = ev.target.getAttribute( 'href' );
			}
			if ( ! redirect ) {
				const closestEl = ev.target.closest( 'a' );
				if ( closestEl ) {
					if ( closestEl.getAttribute( 'data-redirect' ) ) {
						redirect = closestEl.getAttribute( 'data-redirect' );
					} else {
						redirect = closestEl.getAttribute( 'href' );
					}
				}
			}
			if ( redirect ) {
				callback = () => {
					window.location.href = redirect;
				};
			}
			openAuthModal( { callback } );
		}

		/**
		 * Initialize trigger links.
		 */
		function initializeTriggerLinks() {
			const triggerLinks = document.querySelectorAll(
				`[data-newspack-reader-account-link],[href="${ newspack_ras_config.account_url }"]`
			);
			triggerLinks.forEach( link => {
				link.addEventListener( 'click', handleAccountLinkClick );
			} );
		}
		initializeTriggerLinks();
		/** Re-initialize links in case the navigation DOM was modified by a third-party. */
		setTimeout( initializeTriggerLinks, 1000 );

		/**
		 * Handle reader changes.
		 */
		function handleReaderChanges() {
			const container = getModalContainer();
			if ( ! container ) {
				return;
			}
			const form = container.querySelector( 'form' );
			const emailInput = container.querySelector( 'input[name="npe"]' );
			const reader = window.newspackReaderActivation.getReader();

			if ( emailInput ) {
				emailInput.value = reader?.email || '';
			}

			const accountLinks = document.querySelectorAll( '.newspack-reader__account-link' );
			if ( accountLinks?.length ) {
				accountLinks.forEach( link => {
					try {
						const labels = JSON.parse( link.getAttribute( 'data-labels' ) );
						link.querySelector( '.newspack-reader__account-link__label' ).textContent =
							reader?.authenticated ? labels.signedin : labels.signedout;
					} catch {}
				} );
			}
			if ( reader?.authenticated ) {
				const messageContentElement = container.querySelector( '.response' );
				if ( messageContentElement && form ) {
					form.replaceWith( messageContentElement.parentNode );
				}
			}
		}
		window.newspackReaderActivation.on( 'reader', handleReaderChanges );
		handleReaderChanges();
	} );
} );

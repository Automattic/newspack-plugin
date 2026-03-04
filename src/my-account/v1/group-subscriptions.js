/**
 * Initialize functions for the Subscriptions page.
 */

import { domReady } from '../../utils';

domReady( function () {
	// Look for the activeTab parameter in the URL and set the active tab accordingly.
	const params = new URLSearchParams( window.location.search );
	const activeTab = params.get( 'activeTab' ) === 'invites' ? 'invites' : 'members';
	const content = document.querySelector( '.newspack-my-account__group_subscription__content' );
	if ( content ) {
		content.setAttribute( 'data-active-tab', activeTab );
	}

	// Handle tab switching.
	const tabs = document.querySelectorAll( '.newspack-my-account__group_subscription__tabs a' );
	tabs.forEach( tab => {
		tab.addEventListener( 'click', event => {
			event.preventDefault();
			if ( ! content ) {
				return;
			}
			const tabName = event.currentTarget.getAttribute( 'data-tab' );
			content.setAttribute( 'data-active-tab', tabName );
		} );
	} );

	// Handle invite modal.
	const newspackModal = document.getElementById( 'newspack-my-account__group_subscription--invite-member' );
	const openModal = document.querySelector( '.newspack-my-account__subscription--invite-member' );
	if ( newspackModal && openModal ) {
		openModal.addEventListener( 'click', event => {
			event.preventDefault();
			newspackModal.setAttribute( 'data-state', 'open' );
		} );
	}
} );

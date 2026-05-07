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

	// Invite-link: copy / create flow.
	const copyButton = document.querySelector( '.newspack-my-account__group_subscription__invite-link__copy' );
	const copyToClipboard = async text => {
		if ( ! text ) {
			return false;
		}
		try {
			await navigator.clipboard.writeText( text );
			return true;
		} catch ( e ) {
			return false;
		}
	};

	if ( copyButton ) {
		const restUrl = copyButton.getAttribute( 'data-rest-url' );
		const nonce = copyButton.getAttribute( 'data-rest-nonce' );
		const subId = parseInt( copyButton.getAttribute( 'data-subscription-id' ) );
		const idleText = copyButton.getAttribute( 'data-idle-text' );
		const successText = copyButton.getAttribute( 'data-success-text' );
		copyButton.addEventListener( 'click', async e => {
			e.preventDefault();
			copyButton.classList.add( 'newspack-ui__button--loading' );
			copyButton.setAttribute( 'disabled', '' );
			copyButton.textContent = '';
			try {
				const response = await fetch( restUrl, {
					method: 'POST',
					credentials: 'same-origin',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': nonce,
					},
					body: JSON.stringify( { subscription_id: subId } ),
				} );
				const data = await response.json();
				if ( ! response.ok || ! data || ! data.url ) {
					const message = ( data && data.message ) || 'Could not create the invite link.';
					showSnackbar( message, 'error' );
					return;
				}
				await copyToClipboard( data.url );
				copyButton.textContent = successText;
				const resetButtonText = setTimeout( () => {
					copyButton.textContent = idleText;
					clearTimeout( resetButtonText );
				}, 2000 );
			} catch ( error ) {
				showSnackbar( 'Could not create the invite link.', 'error' );
				copyButton.textContent = idleText;
			} finally {
				copyButton.classList.remove( 'newspack-ui__button--loading' );
				copyButton.removeAttribute( 'disabled' );
			}
		} );
	}
} );

function showSnackbar( message, type = 'success' ) {
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'newspack-ui';
	wrapper.innerHTML = `
		<div class="newspack-ui__snackbar newspack-ui__snackbar--top-right">
			<div class="newspack-ui__snackbar__item newspack-ui__snackbar__item--${ type }" data-autohide="true">
				<div class="newspack-ui__snackbar__content"></div>
			</div>
		</div>
	`;
	wrapper.querySelector( '.newspack-ui__snackbar__content' ).textContent = message;
	document.body.appendChild( wrapper );

	const item = wrapper.querySelector( '.newspack-ui__snackbar__item' );
	if ( window.newspackUI && window.newspackUI.notices && typeof window.newspackUI.notices.openNotice === 'function' ) {
		// Delegate timing/transition handling to the Newspack UI notices module.
		// The `true` flag tells it to remove the element on close.
		window.newspackUI.notices.openNotice( item, true );
	} else {
		// Minimal fallback if Newspack UI's notices module isn't loaded.
		setTimeout( () => wrapper.remove(), 8000 );
	}
}

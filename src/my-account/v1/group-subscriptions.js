/* globals newspackMyAccountV1, newspackUI */

/**
 * Initialize functions for the Subscriptions page.
 */

import { domReady } from '../../utils';

domReady( function () {
	const content = document.querySelector( '.newspack-my-account__group_subscription__content' );
	if ( ! content ) {
		return;
	}

	// Look for the activeTab parameter in the URL and set the active tab accordingly.
	const params = new URLSearchParams( window.location.search );
	const activeTab = params.get( 'activeTab' ) === 'invites' ? 'invites' : 'members';
	const subId = parseInt( content.getAttribute( 'data-subscription-id' ), 10 );
	const baseUrl = newspackMyAccountV1?.rest?.base_url;
	const namespace = newspackMyAccountV1?.rest?.namespaces?.group;
	const nonce = newspackMyAccountV1?.rest?.nonce;
	const showSnackbar =
		typeof newspackUI?.notices?.createNotice === 'function'
			? newspackUI.notices.createNotice
			: ( msg, type ) => console.warn( '[group-subscriptions]', type, msg ); // eslint-disable-line no-console
	if ( content ) {
		content.setAttribute( 'data-active-tab', activeTab );
	}

	// Handle tab switching.
	const tabs = [ ...document.querySelectorAll( '.newspack-my-account__group_subscription__tabs a' ) ];
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
	const inviteModal = document.getElementById( 'newspack-my-account__group_subscription--invite-member' );
	const openInviteModal = [ ...document.querySelectorAll( '.newspack-my-account__subscription--invite-member' ) ];
	if ( openInviteModal && inviteModal ) {
		openInviteModal.forEach( open => {
			open.addEventListener( 'click', event => {
				event.preventDefault();
				inviteModal.setAttribute( 'data-state', 'open' );
			} );
		} );
	}

	// Invite-link: copy / create / regenerate / disable flow.
	const restUrl = `${ baseUrl }${ namespace }/invite-link`;
	const copyButtons = [ ...document.querySelectorAll( '.newspack-my-account__group_subscription__invite-link__copy' ) ];
	const regenerateButtons = [ ...document.querySelectorAll( '.newspack-my-account__group_subscription__invite-link__regenerate' ) ];
	const disableButtons = [ ...document.querySelectorAll( '.newspack-my-account__group_subscription__invite-link__disable' ) ];
	const regenerateModal = document.getElementById( 'newspack-my-account__group_subscription--confirm-regenerate-link' );
	const disableModal = document.getElementById( 'newspack-my-account__group_subscription--confirm-disable-link' );
	const openRegenerateModal = [ ...document.querySelectorAll( '.newspack-my-account__group_subscription__invite-link__confirm-regenerate' ) ];
	const openDisableModal = [ ...document.querySelectorAll( '.newspack-my-account__group_subscription__invite-link__confirm-disable' ) ];
	if ( regenerateModal ) {
		openRegenerateModal.forEach( open => {
			open.addEventListener( 'click', event => {
				event.preventDefault();
				regenerateModal.setAttribute( 'data-state', 'open' );
			} );
		} );
	}
	if ( disableModal ) {
		openDisableModal.forEach( open => {
			open.addEventListener( 'click', event => {
				event.preventDefault();
				disableModal.setAttribute( 'data-state', 'open' );
			} );
		} );
	}

	// After an invite link is created or deleted, close open modals and show or hide invite link controls.
	const afterInviteLink = ( show = true ) => {
		[ ...openRegenerateModal, ...openDisableModal ].forEach( button => {
			const parent = button.closest( 'li' );
			const el = parent || button;
			if ( show ) {
				el.classList.remove( 'hidden' );
			} else {
				el.classList.add( 'hidden' );
			}
		} );
		[ ...document.querySelectorAll( '.newspack-ui__modal-container[data-state="open"]' ) ].forEach( modal =>
			modal.setAttribute( 'data-state', 'closed' )
		);
	};
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
	const generateLink = async e => {
		const el = e.currentTarget;
		el.classList.add( 'newspack-ui__button--loading' );
		el.setAttribute( 'aria-busy', 'true' );
		el.setAttribute( 'disabled', '' );
		const errorText = e.currentTarget.getAttribute( 'data-error-text' );
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
				const message = ( data && data.message ) || errorText;
				showSnackbar( message, 'error' );
				return;
			}
			if ( await copyToClipboard( data.url ) ) {
				const message = !! content.getAttribute( 'data-invite-link' )
					? newspackMyAccountV1?.labels?.invite_link_regenerated || 'New invite link copied. Previous link is no longer valid.'
					: newspackMyAccountV1?.labels?.invite_link_copied || 'Invite link copied.';
				showSnackbar( message );
			}
			content.setAttribute( 'data-invite-link', data.url );
			afterInviteLink( true );
		} catch ( error ) {
			showSnackbar( errorText, 'error' );
		} finally {
			el.classList.remove( 'newspack-ui__button--loading' );
			el.removeAttribute( 'aria-busy' );
			el.removeAttribute( 'disabled' );
		}
	};

	const deleteLink = async e => {
		const el = e.currentTarget;
		el.classList.add( 'newspack-ui__button--loading' );
		el.setAttribute( 'aria-busy', 'true' );
		el.setAttribute( 'disabled', '' );
		const errorText = e.currentTarget.getAttribute( 'data-error-text' );
		try {
			const response = await fetch( restUrl, {
				method: 'DELETE',
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': nonce,
				},
				body: JSON.stringify( { subscription_id: subId } ),
			} );
			const data = await response.json();
			if ( ! response.ok ) {
				const message = ( data && data.message ) || errorText;
				showSnackbar( message, 'error' );
				return;
			}
			showSnackbar( newspackMyAccountV1?.labels?.invite_link_disabled || 'Invite link disabled.' );
			content.removeAttribute( 'data-invite-link' );
			afterInviteLink( false );
		} catch ( error ) {
			showSnackbar( errorText, 'error' );
		} finally {
			el.classList.remove( 'newspack-ui__button--loading' );
			el.removeAttribute( 'aria-busy' );
			el.removeAttribute( 'disabled' );
		}
	};

	copyButtons.forEach( button => {
		button.addEventListener( 'click', async e => {
			e.preventDefault();
			const inviteLink = content.getAttribute( 'data-invite-link' );
			if ( inviteLink ) {
				if ( await copyToClipboard( inviteLink ) ) {
					showSnackbar( newspackMyAccountV1?.labels?.invite_link_copied || 'Invite link copied.' );
				}
			} else {
				generateLink( e );
			}
		} );
	} );
	regenerateButtons.forEach( button => {
		button.addEventListener( 'click', async e => {
			e.preventDefault();
			generateLink( e );
		} );
	} );
	disableButtons.forEach( button => {
		button.addEventListener( 'click', async e => {
			e.preventDefault();
			deleteLink( e );
		} );
	} );
} );

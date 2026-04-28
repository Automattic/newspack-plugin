/**
 * Newsletters screen — client-side optimistic UI.
 *
 * The prototype is stateless (brief §7): every Sign up / Unsubscribe action
 * mutates the DOM in place and fires a snackbar. No fetch, no form post.
 * State resets on reload.
 */

import { __, sprintf } from '@wordpress/i18n';

const SUBSCRIBE = 'subscribe';
const UNSUBSCRIBE = 'unsubscribe';
const UNSUBSCRIBE_FROM_ALL = 'unsubscribe-from-all';

/**
 * Show a transient snackbar via newspack-ui's notices module. Falls back to
 * a no-op if the global helper isn't on the page yet — the optimistic UI
 * mutation still runs, so the user sees a result either way.
 *
 * @param {string} message Pre-translated message.
 * @param {string} type    'success' | 'error' (default 'success').
 */
function snackbar( message, type = 'success' ) {
	const api = window.newspackUI && window.newspackUI.notices;
	if ( ! api || typeof api.openNotice !== 'function' ) {
		return;
	}
	const container = ensureSnackbarContainer();
	const item = document.createElement( 'div' );
	item.className = `newspack-ui__snackbar__item newspack-ui__snackbar__item--${ type }`;
	item.dataset.autohide = 'true';
	const content = document.createElement( 'div' );
	content.className = 'newspack-ui__snackbar__content';
	content.textContent = message;
	item.appendChild( content );
	container.appendChild( item );
	api.openNotice( item, true );
}

/**
 * Lazily create a top-right snackbar container if the page has none yet.
 * On a fresh request with no PHP-rendered notices, the .newspack-ui__snackbar
 * markup is absent and openNotice() needs somewhere to live.
 *
 * @return {HTMLElement} Snackbar container element.
 */
function ensureSnackbarContainer() {
	let container = document.querySelector( '.newspack-ui__snackbar--top-right' );
	if ( container ) {
		return container;
	}
	const wrap = document.createElement( 'div' );
	wrap.className = 'newspack-ui';
	container = document.createElement( 'div' );
	container.className = 'newspack-ui__snackbar newspack-ui__snackbar--top-right';
	wrap.appendChild( container );
	document.body.appendChild( wrap );
	return container;
}

/**
 * Flip a single newsletter row between subscribed and unsubscribed. Updates
 * the data attribute, button modifier class, label, and data-action so the
 * next click toggles the other way.
 *
 * @param {HTMLElement} row        Row element.
 * @param {boolean}     subscribed Target state.
 */
function setRowSubscribed( row, subscribed ) {
	row.dataset.subscribed = subscribed ? 'true' : 'false';
	const button = row.querySelector( 'button[data-action]' );
	if ( ! button ) {
		return;
	}
	if ( subscribed ) {
		button.classList.remove( 'newspack-ui__button--primary' );
		button.classList.add( 'newspack-ui__button--secondary' );
		button.dataset.action = UNSUBSCRIBE;
		button.textContent = button.dataset.labelUnsubscribe;
	} else {
		button.classList.remove( 'newspack-ui__button--secondary' );
		button.classList.add( 'newspack-ui__button--primary' );
		button.dataset.action = SUBSCRIBE;
		button.textContent = button.dataset.labelSubscribe;
	}
}

/**
 * Toggle the bottom "Unsubscribe from all" button's disabled state to match
 * whether anything is left to unsubscribe from. Mirrors the Figma frame
 * 2636:46736 where the button greys out once everything is unsubscribed.
 *
 * @param {HTMLElement} root Container element.
 */
function syncUnsubscribeAllState( root ) {
	const button = root.querySelector( 'button[data-action="unsubscribe-from-all"]' );
	if ( ! button ) {
		return;
	}
	const anySubscribed = !! root.querySelector( '[data-list-id][data-subscribed="true"]' );
	button.disabled = ! anySubscribed;
}

/**
 * Wire up a single newsletters root via event delegation. Idempotent —
 * subsequent calls on the same root are no-ops.
 *
 * @param {HTMLElement} root Container.
 */
function wireRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';

	root.addEventListener( 'click', event => {
		const button = event.target.closest( 'button[data-action]' );
		if ( ! button || ! root.contains( button ) ) {
			return;
		}
		const action = button.dataset.action;

		if ( action === SUBSCRIBE || action === UNSUBSCRIBE ) {
			const row = button.closest( '[data-list-id]' );
			if ( ! row ) {
				return;
			}
			const willSubscribe = action === SUBSCRIBE;
			const name = button.dataset.listName || '';
			setRowSubscribed( row, willSubscribe );
			syncUnsubscribeAllState( root );
			snackbar(
				willSubscribe
					? // translators: %s is a newsletter name.
					  sprintf( __( 'Subscribed to %s.', 'newspack-plugin' ), name )
					: // translators: %s is a newsletter name.
					  sprintf( __( 'Unsubscribed from %s.', 'newspack-plugin' ), name )
			);
			return;
		}

		if ( action === UNSUBSCRIBE_FROM_ALL ) {
			if ( button.disabled ) {
				return;
			}
			root.querySelectorAll( '[data-list-id][data-subscribed="true"]' ).forEach( row => {
				setRowSubscribed( row, false );
			} );
			syncUnsubscribeAllState( root );
			snackbar( __( 'Unsubscribed from all newsletters.', 'newspack-plugin' ) );
		}
	} );

	syncUnsubscribeAllState( root );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="newsletters"]' ).forEach( wireRoot );
} );

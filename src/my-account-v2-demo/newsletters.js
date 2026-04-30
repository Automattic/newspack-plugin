/**
 * Newsletters screen — client-side optimistic UI.
 *
 * Every Sign up / Unsubscribe action mutates the DOM in place and fires a
 * snackbar. No fetch, no form post — but the per-row subscribed state is
 * mirrored to localStorage so it survives a refresh (a deviation from the
 * brief §7 "state resets on reload" rule, kept because designers reviewing
 * the prototype expect to see their toggles stick).
 */

import { __, sprintf } from '@wordpress/i18n';

import { snackbar } from './util/snackbar';

const SUBSCRIBE = 'subscribe';
const UNSUBSCRIBE = 'unsubscribe';
const UNSUBSCRIBE_FROM_ALL = 'unsubscribe-from-all';
// Fake-network delay before flipping a row's state. Long enough to let the
// loading spinner read as intentional; short enough not to feel broken.
const LOADING_DELAY_MS = 1500;
// localStorage key for the per-row subscribed state. Stored shape:
// `{ [list_id: string]: boolean }`. Scoped to the prototype so it can't
// collide with anything else on the site.
const STORAGE_KEY = 'newspack-my-account-v2-demo:newsletters';

/**
 * Read the persisted state map. Tolerates missing / corrupt storage by
 * returning an empty map — refresh-without-persistence falls back to the
 * server-rendered fake data.
 *
 * @return {Object} Map of list id -> boolean.
 */
function readState() {
	try {
		const raw = window.localStorage.getItem( STORAGE_KEY );
		const parsed = raw ? JSON.parse( raw ) : {};
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch ( _err ) {
		return {};
	}
}

/**
 * Persist a single row's subscribed state. No-op when storage is unavailable
 * (private mode quota errors, etc.) — same UX as before, just without the
 * cross-refresh memory.
 *
 * @param {string}  listId     Newsletter list id.
 * @param {boolean} subscribed Subscribed state.
 */
function persistRow( listId, subscribed ) {
	if ( ! listId ) {
		return;
	}
	try {
		const state = readState();
		state[ listId ] = !! subscribed;
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( state ) );
	} catch ( _err ) {
		// Swallow.
	}
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
	const label = button.querySelector( 'span' ) || button;
	if ( subscribed ) {
		button.classList.remove( 'newspack-ui__button--primary' );
		button.classList.add( 'newspack-ui__button--secondary' );
		button.dataset.action = UNSUBSCRIBE;
		label.textContent = button.dataset.labelUnsubscribe;
	} else {
		button.classList.remove( 'newspack-ui__button--secondary' );
		button.classList.add( 'newspack-ui__button--primary' );
		button.dataset.action = SUBSCRIBE;
		label.textContent = button.dataset.labelSubscribe;
	}
	persistRow( row.dataset.listId, subscribed );
}

/**
 * Replay any persisted row state on top of the server-rendered fake data.
 * Called once when wireRoot mounts. Rows whose ids aren't in storage stay
 * at whatever the fake data put them at.
 *
 * @param {HTMLElement} root Container.
 */
function applyPersistedState( root ) {
	const state = readState();
	root.querySelectorAll( '[data-list-id]' ).forEach( row => {
		const listId = row.dataset.listId;
		if ( Object.prototype.hasOwnProperty.call( state, listId ) ) {
			setRowSubscribed( row, !! state[ listId ] );
		}
	} );
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
			if ( button.disabled ) {
				return;
			}
			const row = button.closest( '[data-list-id]' );
			if ( ! row ) {
				return;
			}
			const willSubscribe = action === SUBSCRIBE;
			const name = button.dataset.listName || '';
			// Show a loading state on the clicked button while the prototype
			// pretends to talk to the server. State flip + snackbar fire
			// after the delay; further clicks are ignored while loading.
			button.classList.add( 'newspack-ui__button--loading' );
			button.disabled = true;
			setTimeout( () => {
				button.classList.remove( 'newspack-ui__button--loading' );
				button.disabled = false;
				setRowSubscribed( row, willSubscribe );
				syncUnsubscribeAllState( root );
				snackbar(
					willSubscribe
						? // translators: %s is a newsletter name.
						  sprintf( __( 'Subscribed to %s.', 'newspack-plugin' ), name )
						: // translators: %s is a newsletter name.
						  sprintf( __( 'Unsubscribed from %s.', 'newspack-plugin' ), name )
				);
			}, LOADING_DELAY_MS );
			return;
		}

		if ( action === UNSUBSCRIBE_FROM_ALL ) {
			if ( button.disabled ) {
				return;
			}
			// Loading state cascades: the bulk button itself plus every
			// currently-subscribed row's Unsubscribe button. Wrapping the
			// row buttons in span happened in the partial, so the loading
			// modifier hides their labels via newspack-ui's _buttons.scss.
			const subscribedRows = Array.from( root.querySelectorAll( '[data-list-id][data-subscribed="true"]' ) );
			const rowButtons = subscribedRows.map( row => row.querySelector( 'button[data-action="unsubscribe"]' ) ).filter( Boolean );
			[ button, ...rowButtons ].forEach( el => {
				el.classList.add( 'newspack-ui__button--loading' );
				el.disabled = true;
			} );
			setTimeout( () => {
				rowButtons.forEach( el => {
					el.classList.remove( 'newspack-ui__button--loading' );
					el.disabled = false;
				} );
				button.classList.remove( 'newspack-ui__button--loading' );
				subscribedRows.forEach( row => setRowSubscribed( row, false ) );
				syncUnsubscribeAllState( root );
				snackbar( __( 'Unsubscribed from all newsletters.', 'newspack-plugin' ) );
			}, LOADING_DELAY_MS );
		}
	} );

	applyPersistedState( root );
	syncUnsubscribeAllState( root );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="newsletters"]' ).forEach( wireRoot );
} );

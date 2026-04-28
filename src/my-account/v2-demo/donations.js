/**
 * Donations screens — client-side wiring.
 *
 * Responsibilities:
 *  - List page: navigate when a `<tr data-href>` row in the previous-
 *    donations table is clicked. Provides the row-as-link affordance that
 *    pure HTML doesn't give us inside <table> markup. (Hover/cursor styling
 *    is intentionally deferred — Phase 6 polish, not a Phase 3 blocker.)
 *  - Detail page: stub snackbars for the modal-trigger buttons (Modify /
 *    Cancel / Restart / Update payment method). Phase 5 swaps these for
 *    real modals; for now we surface the would-be confirmation copy so the
 *    end-state is clickable in the prototype.
 *  - Dropdown for the "More" menu auto-wires via newspack-ui's own
 *    `js/dropdowns.js` — no work needed here.
 *
 * Snackbar helpers are duplicated from `newsletters.js` for now; we'll
 * factor them into a shared util when the third caller lands (Phase 5
 * modals). See devlog for the rationale.
 */

import { __ } from '@wordpress/i18n';

const SNACKBAR_LIFETIME_MS = 5000;

/**
 * Lazily create a top-right snackbar container if the page has none yet.
 * Mirrors the helper in newsletters.js — same justification (page may have
 * no PHP-rendered notice mount on first paint).
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
 * Show a transient snackbar. Uses newspack-ui markup directly rather than
 * `newspackUI.notices.openNotice`, which posts an AJAX dismissal nonce we
 * don't have in the demo (matches the same call in newsletters.js).
 *
 * @param {string} message Pre-translated copy.
 * @param {string} type    'success' | 'error' (default 'success').
 */
function snackbar( message, type = 'success' ) {
	const container = ensureSnackbarContainer();
	const item = document.createElement( 'div' );
	item.className = `newspack-ui__snackbar__item newspack-ui__snackbar__item--${ type } active`;
	item.dataset.autohide = 'true';
	item.setAttribute( 'role', 'status' );
	item.setAttribute( 'aria-live', 'polite' );
	const content = document.createElement( 'div' );
	content.className = 'newspack-ui__snackbar__content';
	content.textContent = message;
	item.appendChild( content );
	container.appendChild( item );

	window.setTimeout( () => {
		item.classList.remove( 'active' );
		window.setTimeout( () => {
			if ( item.parentNode ) {
				item.parentNode.removeChild( item );
			}
		}, 300 );
	}, SNACKBAR_LIFETIME_MS );
}

/**
 * Wire row-click + keyboard navigation for the previous-donations table on
 * the list page. The template marks each `<tr>` with `tabindex="0"` and
 * `role="link"`; this handler activates them on click, Enter, or Space so
 * keyboard and screen-reader users can navigate too. Idempotent.
 *
 * @param {HTMLElement} root List container element.
 */
function wireListRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';

	const navigateToRow = row => {
		const url = row.dataset.href;
		if ( url ) {
			window.location.href = url;
		}
	};

	root.addEventListener( 'click', event => {
		const row = event.target.closest( 'tr[data-href]' );
		if ( ! row || ! root.contains( row ) ) {
			return;
		}
		// Don't hijack clicks on actual links/buttons inside cells (none
		// today, but cheap insurance for future cell affordances).
		if ( event.target.closest( 'a, button' ) ) {
			return;
		}
		navigateToRow( row );
	} );

	root.addEventListener( 'keydown', event => {
		if ( event.key !== 'Enter' && event.key !== ' ' ) {
			return;
		}
		const row = event.target.closest( 'tr[data-href]' );
		if ( ! row || ! root.contains( row ) ) {
			return;
		}
		// Same insurance as the click handler — let nested controls own
		// their own keyboard semantics.
		if ( event.target.closest( 'a, button, input, select, textarea' ) ) {
			return;
		}
		event.preventDefault();
		navigateToRow( row );
	} );

	// "Billing history" Button Card has no Phase 3 destination — wire a
	// stub snackbar so the card actually does something when clicked.
	// Phase 6 scenario fixtures will flip `billing_history_inline` and
	// replace the card with the embedded table.
	root.addEventListener( 'click', event => {
		const trigger = event.target.closest( '[data-action="open-billing-history"]' );
		if ( ! trigger || ! root.contains( trigger ) ) {
			return;
		}
		event.preventDefault();
		snackbar( __( 'Billing history will be available in a future update.', 'newspack-plugin' ) );
	} );
}

/**
 * Wire the detail-page modal-trigger buttons. Each surfaces a snackbar with
 * the eventual success copy from Figma so the click feels real even before
 * Phase 5 hooks up real modals.
 *
 * @param {HTMLElement} root Detail container element.
 */
function wireDetailRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';

	root.addEventListener( 'click', event => {
		const button = event.target.closest( 'button[data-action]' );
		if ( ! button || ! root.contains( button ) ) {
			return;
		}
		// Let the dropdown toggle keep its own behaviour — newspack-ui's
		// dropdowns.js owns it.
		if ( button.classList.contains( 'newspack-ui__dropdown__toggle' ) ) {
			return;
		}

		// If a dropdown menu is open and the click was inside it, close it
		// before showing the snackbar so the menu doesn't linger.
		const openDropdown = root.querySelector( '.newspack-ui__dropdown.active' );
		if ( openDropdown && openDropdown.contains( button ) ) {
			openDropdown.classList.remove( 'active' );
		}

		const action = button.dataset.action;
		switch ( action ) {
			case 'modify-donation':
				snackbar( __( 'Donation modified.', 'newspack-plugin' ) );
				break;
			case 'cancel-donation':
				snackbar( __( 'Donation cancelled.', 'newspack-plugin' ) );
				break;
			case 'restart-donation':
				snackbar( __( 'Donation restarted.', 'newspack-plugin' ) );
				break;
			case 'update-payment-method':
				snackbar( __( 'Payment method updated.', 'newspack-plugin' ) );
				break;
			default:
				// Unknown action — let it fall through.
				break;
		}
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="donations"]' ).forEach( wireListRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="donation-details"]' ).forEach( wireDetailRoot );

	// If the user just landed via a Phase 5–style update flow that includes
	// a `payment-updated` query param (Figma 2636:46500 "new payment method"
	// state), surface a snackbar on first paint. Hooked here so the detail
	// template stays declarative.
	try {
		const params = new URL( window.location.href ).searchParams;
		if ( params.get( 'payment-updated' ) ) {
			snackbar( __( 'Payment method updated.', 'newspack-plugin' ) );
		}
	} catch ( _e ) {
		// URL parsing failures are harmless; the snackbar is best-effort.
	}
} );

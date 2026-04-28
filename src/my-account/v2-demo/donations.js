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
 * Snackbar helper is shared with newsletters.js / subscriptions.js via
 * `./util/snackbar` (factored out at the rule-of-three threshold ahead of
 * the Phase 5 modals).
 */

import { __ } from '@wordpress/i18n';

import { snackbar } from './util/snackbar';

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

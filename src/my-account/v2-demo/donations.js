/**
 * Donations screens — client-side wiring.
 *
 * Responsibilities:
 *  - List page: navigate when a `<tr data-href>` row in the previous-
 *    donations table is clicked. Provides the row-as-link affordance that
 *    pure HTML doesn't give us inside <table> markup. (Hover/cursor styling
 *    is intentionally deferred — Phase 6 polish, not a Phase 3 blocker.)
 *  - Detail page: open the Modify / Cancel / Restart donation modals when
 *    their trigger buttons fire. Each modal lives at the bottom of the
 *    detail template (one per donation, keyed by id); init / success steps
 *    transition inline. Update payment method stays a stub snackbar — the
 *    brief lumps it with the v1 checkout flow, not a Phase 5 modal.
 *  - Dropdown for the "More" menu auto-wires via newspack-ui's own
 *    `js/dropdowns.js` — no work needed here.
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
 * Wire the Cancel donation modal — confirmation pattern (init step → success
 * step inline). Mirrors the subscriptions.js wireConfirmModal helper; kept
 * local rather than shared because the donation/subscription packages stay
 * independent at the wiring layer.
 *
 * @param {HTMLElement} modal The modal container element.
 */
function wireCancelDonationModal( modal ) {
	if ( modal.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	modal.dataset.newspackMyAccountV2DemoWired = 'true';

	const initStep = modal.querySelector( '[data-step="init"]' );
	const successStep = modal.querySelector( '[data-step="success"]' );
	const confirmBtn = modal.querySelector( '[data-action="confirm"]' );

	const goToStep = step => {
		if ( ! initStep || ! successStep ) {
			return;
		}
		initStep.hidden = step !== 'init';
		successStep.hidden = step !== 'success';
	};

	if ( confirmBtn ) {
		confirmBtn.addEventListener( 'click', () => goToStep( 'success' ) );
	}

	modal.addEventListener( 'closeModal', () => goToStep( 'init' ) );
}

/**
 * Wire the Restart donation modal — single-screen transaction (billing +
 * payment form), terminating on a snackbar (no Figma success state). The
 * Confirm button just closes the modal and surfaces "Donation restarted."
 *
 * @param {HTMLElement} modal The modal container element.
 */
function wireRestartDonationModal( modal ) {
	if ( modal.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	modal.dataset.newspackMyAccountV2DemoWired = 'true';

	const confirmBtn = modal.querySelector( '[data-action="confirm"]' );
	if ( confirmBtn ) {
		confirmBtn.addEventListener( 'click', () => {
			modal.setAttribute( 'data-state', 'closed' );
			snackbar( __( 'Donation restarted.', 'newspack-plugin' ) );
		} );
	}
}

/**
 * Wire the Modify donation modal — frequency segmented control + amount
 * editor + recurring totals readout that recomputes as the amount changes.
 * Confirm → snackbar (no Figma success state for modify).
 *
 * Math model: amount in the input is the gross "Recurring total" the reader
 * pays. Subtotal is amount / (1 + vatRate); vat is amount - subtotal;
 * transaction fee defaults to null but flips on when "Cover transaction
 * fees?" is checked (2% of amount, rounded to 2dp). All numbers update
 * declaratively whenever the amount, frequency, or fee toggle changes.
 *
 * @param {HTMLElement} modal The modal container element.
 */
function wireModifyDonationModal( modal ) {
	if ( modal.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	modal.dataset.newspackMyAccountV2DemoWired = 'true';

	const tabs = [ ...modal.querySelectorAll( '[data-frequency][role="tab"]' ) ];
	const amountInput = modal.querySelector( '[data-modify-amount]' );
	const feeToggle = modal.querySelector( '[data-modify-cover-fees]' );
	const amountUnitLabel = modal.querySelector( '[data-modify-amount-unit]' );
	const totalsHeading = modal.querySelector( '[data-modify-totals-heading]' );
	const subtotalEl = modal.querySelector( '[data-modify-subtotal]' );
	const vatEl = modal.querySelector( '[data-modify-vat]' );
	const feeEl = modal.querySelector( '[data-modify-fee]' );
	const totalEl = modal.querySelector( '[data-modify-total]' );
	const nextDateEl = modal.querySelector( '[data-modify-next]' );
	const confirmBtn = modal.querySelector( '[data-action="confirm"]' );
	const confirmLabel = modal.querySelector( '[data-modify-confirm-label]' );

	const symbol = modal.dataset.currencySymbol || '$';
	const vatRate = Number.parseFloat( modal.dataset.vatRate || '0.2' );
	const feeRate = Number.parseFloat( modal.dataset.feeRate || '0.02' );
	const initialFrequency = modal.dataset.initialFrequency || 'month';
	const nextDates = ( () => {
		try {
			return JSON.parse( modal.dataset.nextDates || '{}' );
		} catch ( _e ) {
			return {};
		}
	} )();
	const unitLabels = ( () => {
		try {
			return JSON.parse( modal.dataset.unitLabels || '{}' );
		} catch ( _e ) {
			return {};
		}
	} )();
	const recurringTotalLabels = ( () => {
		try {
			return JSON.parse( modal.dataset.recurringTotalLabels || '{}' );
		} catch ( _e ) {
			return {};
		}
	} )();

	let activeFrequency = initialFrequency;

	const formatAmount = n => `${ symbol }${ Number.isFinite( n ) ? n.toFixed( 2 ) : '0.00' }`;

	const recompute = () => {
		const amount = Math.max( 0, Number.parseFloat( amountInput?.value || '0' ) || 0 );
		const subtotal = amount / ( 1 + vatRate );
		const vat = amount - subtotal;
		const fee = feeToggle?.checked ? amount * feeRate : null;
		const unit = unitLabels[ activeFrequency ] || activeFrequency;

		if ( amountUnitLabel ) {
			amountUnitLabel.textContent = unit;
		}
		if ( totalsHeading ) {
			totalsHeading.textContent = recurringTotalLabels.heading || totalsHeading.textContent;
		}
		if ( subtotalEl ) {
			subtotalEl.textContent = `${ formatAmount( subtotal ) } / ${ unit }`;
		}
		if ( vatEl ) {
			vatEl.textContent = formatAmount( vat );
		}
		if ( feeEl ) {
			feeEl.textContent = null === fee ? '—' : formatAmount( fee );
		}
		if ( totalEl ) {
			const grandTotal = null === fee ? amount : amount + fee;
			totalEl.textContent = `${ formatAmount( grandTotal ) } / ${ unit }`;
		}
		if ( nextDateEl ) {
			nextDateEl.textContent = nextDates[ activeFrequency ] || '';
		}
		if ( confirmLabel ) {
			confirmLabel.textContent = `${ formatAmount( amount ) } / ${ unit }`;
		}
		if ( confirmBtn ) {
			confirmBtn.disabled = amount <= 0;
		}
	};

	const setActiveFrequency = freq => {
		if ( ! freq || freq === activeFrequency ) {
			return;
		}
		activeFrequency = freq;
		tabs.forEach( tab => {
			const isActive = tab.dataset.frequency === freq;
			tab.classList.toggle( 'selected', isActive );
			tab.setAttribute( 'aria-selected', isActive ? 'true' : 'false' );
		} );
		recompute();
	};

	tabs.forEach( tab => {
		tab.addEventListener( 'click', () => setActiveFrequency( tab.dataset.frequency ) );
	} );
	if ( amountInput ) {
		amountInput.addEventListener( 'input', recompute );
	}
	if ( feeToggle ) {
		feeToggle.addEventListener( 'change', recompute );
	}
	if ( confirmBtn ) {
		confirmBtn.addEventListener( 'click', () => {
			if ( confirmBtn.disabled ) {
				return;
			}
			modal.setAttribute( 'data-state', 'closed' );
			snackbar( __( 'Donation modified.', 'newspack-plugin' ) );
		} );
	}

	// Reset to the initial state on close so re-opening shows the donation's
	// current values rather than the previous edit.
	modal.addEventListener( 'closeModal', () => {
		if ( amountInput ) {
			amountInput.value = amountInput.dataset.initialAmount || amountInput.value;
		}
		if ( feeToggle ) {
			feeToggle.checked = feeToggle.dataset.initialChecked === 'true';
		}
		setActiveFrequency( initialFrequency );
		recompute();
	} );

	recompute();
}

/**
 * Look up the modal for a given `data-action` + donation id, opening it if
 * it exists. Closes any open dropdown first. Returns true if a modal was
 * opened.
 *
 * @param {string}      action     Trigger's data-action.
 * @param {string}      donationId Trigger's data-donation-id.
 * @param {HTMLElement} root       Container element (for dropdown close).
 * @return {boolean} Whether a modal was opened.
 */
function tryOpenDonationModal( action, donationId, root ) {
	const slug = {
		'modify-donation': 'modify-donation',
		'cancel-donation': 'cancel-donation',
		'restart-donation': 'restart-donation',
	}[ action ];
	if ( ! slug || ! donationId ) {
		return false;
	}
	const modal = document.getElementById( `newspack-my-account__${ slug }-${ donationId }` );
	if ( ! modal ) {
		return false;
	}
	const openDropdown = root.querySelector( '.newspack-ui__dropdown.active' );
	if ( openDropdown ) {
		openDropdown.classList.remove( 'active' );
	}
	modal.setAttribute( 'data-state', 'open' );
	return true;
}

/**
 * Wire the detail-page modal-trigger buttons. Routes each `data-action`
 * through the modal lookup; falls back to a snackbar for actions without a
 * Phase 5 modal (today: only `update-payment-method`).
 *
 * @param {HTMLElement} root Detail container element.
 */
function wireDetailRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';

	root.addEventListener( 'click', event => {
		const trigger = event.target.closest( '[data-action]' );
		if ( ! trigger || ! root.contains( trigger ) ) {
			return;
		}
		if ( trigger.classList.contains( 'newspack-ui__dropdown__toggle' ) ) {
			return;
		}

		const action = trigger.dataset.action;
		const donationId = trigger.dataset.donationId || '';

		if ( tryOpenDonationModal( action, donationId, root ) ) {
			return;
		}

		const openDropdown = root.querySelector( '.newspack-ui__dropdown.active' );
		if ( openDropdown && openDropdown.contains( trigger ) ) {
			openDropdown.classList.remove( 'active' );
		}

		if ( action === 'update-payment-method' ) {
			snackbar( __( 'Payment method updated.', 'newspack-plugin' ) );
		}
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="donations"]' ).forEach( wireListRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="donation-details"]' ).forEach( wireDetailRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="modify-donation-modal"]' ).forEach( wireModifyDonationModal );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="cancel-donation-modal"]' ).forEach( wireCancelDonationModal );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="restart-donation-modal"]' ).forEach( wireRestartDonationModal );

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

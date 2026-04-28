/**
 * Subscriptions screens — client-side wiring.
 *
 * Responsibilities:
 *  - Detail page: open the Change / Cancel / Renew subscription modals when
 *    their trigger buttons fire. Each modal lives at the bottom of the
 *    detail template (one per subscription, keyed by id); init / success
 *    steps transition inline. Update payment method stays a stub snackbar
 *    — the brief lumps it with the v1 checkout flow, not a Phase 5 modal.
 *  - List page: the inline "renew now" anchor inside the expiring active
 *    card opens the Renew subscription modal too (when the modal is
 *    rendered there, e.g. once Phase 6 fixtures put an expiring sub into
 *    the active bucket). When no modal is found we fall back to a stub
 *    snackbar so the click never feels inert.
 *  - Dropdown for "More" auto-wires via newspack-ui's own js/dropdowns.js.
 */

import { __ } from '@wordpress/i18n';

import { snackbar } from './util/snackbar';

/**
 * Wire a Change subscription modal. The modal lives at the bottom of the
 * subscription-details template (one per active/renewed sub). State machine:
 *
 *  - select step (default): Frequency tabs swap which tier panel is visible.
 *    Selecting a non-current tier enables "Change subscription"; the current
 *    tier shows a CURRENT badge and keeps Change disabled.
 *  - transaction step: Reached by clicking "Change subscription". Shows the
 *    summary line (e.g. "Patron: $9.99 / month"), billing details, and a
 *    payment form. "Edit" goes back; "Pay now" closes the modal and surfaces
 *    a "Subscription changed." snackbar (Phase 4 stops at the success state).
 *
 * @param {HTMLElement} modal The modal container element.
 */
function wireChangeSubscriptionModal( modal ) {
	if ( modal.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	modal.dataset.newspackMyAccountV2DemoWired = 'true';

	const currentTierId = modal.dataset.currentTier || '';
	const currentFrequency = modal.dataset.currentFrequency || '';
	const tabs = [ ...modal.querySelectorAll( '[data-frequency][role="tab"]' ) ];
	const panels = [ ...modal.querySelectorAll( '[data-frequency-panel]' ) ];
	const tierCards = [ ...modal.querySelectorAll( '[data-tier-card]' ) ];
	const advanceBtn = modal.querySelector( '[data-action="advance-to-transaction"]' );
	const backBtn = modal.querySelector( '[data-action="back-to-select"]' );
	const confirmBtn = modal.querySelector( '[data-action="confirm-change"]' );
	const summary = modal.querySelector( '[data-transaction-summary]' );
	const selectStep = modal.querySelector( '[data-step="select"]' );
	const transactionStep = modal.querySelector( '[data-step="transaction"]' );

	let activeFrequency = currentFrequency;
	let selectedTierId = currentTierId;

	const showPanel = frequency => {
		// newspack-ui's _segmented-control.scss hides any `__panel` without
		// `.selected` (`&:not(.selected) { display: none; }`) — match that
		// instead of toggling `hidden` so the segmented control's own CSS
		// stays in charge of panel visibility.
		panels.forEach( panel => {
			panel.classList.toggle( 'selected', panel.dataset.frequencyPanel === frequency );
		} );
	};

	const setActiveTab = frequency => {
		tabs.forEach( tab => {
			const isActive = tab.dataset.frequency === frequency;
			tab.classList.toggle( 'selected', isActive );
			tab.setAttribute( 'aria-selected', isActive ? 'true' : 'false' );
		} );
	};

	const setSelectedTier = tierId => {
		selectedTierId = tierId;
		tierCards.forEach( card => {
			const isSelected = card.dataset.tierId === tierId;
			// `.current` is the v1 convention for highlighted radio cards
			// (see Subscriptions_Tiers::render_product_card). Toggle on the
			// selected card so the highlight follows the click.
			card.classList.toggle( 'current', isSelected );
			const radio = card.querySelector( '[data-tier-radio]' );
			if ( radio ) {
				radio.checked = isSelected;
			}
		} );
		// Change button enables only when a tier is selected AND it isn't the
		// one already in effect — picking the current tier is a no-op.
		const enable = !! tierId && tierId !== currentTierId;
		if ( advanceBtn ) {
			advanceBtn.disabled = ! enable;
		}
	};

	const goToStep = step => {
		if ( ! selectStep || ! transactionStep ) {
			return;
		}
		selectStep.hidden = step !== 'select';
		transactionStep.hidden = step !== 'transaction';
	};

	const updateSummary = () => {
		if ( ! summary ) {
			return;
		}
		const card = tierCards.find( c => c.dataset.tierId === selectedTierId );
		if ( ! card ) {
			return;
		}
		// Match v1's render_product_card markup: <strong> for the tier name,
		// <span class="newspack-ui__helper-text"> for the price/freq line.
		const name = card.querySelector( 'strong' )?.textContent?.trim() || '';
		const price = card.querySelector( '.newspack-ui__helper-text' )?.textContent?.trim() || '';
		// Compose "<Tier>: <amount> / <unit>" — matches Figma 2636:46297.
		summary.textContent = name && price ? `${ name }: ${ price }` : summary.textContent;
	};

	tabs.forEach( tab => {
		tab.addEventListener( 'click', () => {
			const freq = tab.dataset.frequency;
			if ( ! freq || freq === activeFrequency ) {
				return;
			}
			activeFrequency = freq;
			setActiveTab( freq );
			showPanel( freq );
			// Switching tab clears selection unless the current tier lives in
			// this tab — Figma `Monthly selected` is the unselected state.
			const stillCurrent = freq === currentFrequency ? currentTierId : '';
			setSelectedTier( stillCurrent );
		} );
	} );

	tierCards.forEach( card => {
		card.addEventListener( 'click', event => {
			// Avoid double-firing when the click started on the radio input
			// (the label wraps it, so the browser already toggles the radio).
			const tierId = card.dataset.tierId;
			if ( ! tierId ) {
				return;
			}
			// Ignore clicks on the CURRENT badge — it's purely informational.
			if ( event.target.closest( '[data-tier-current-badge]' ) ) {
				return;
			}
			setSelectedTier( tierId );
		} );
	} );

	if ( advanceBtn ) {
		advanceBtn.addEventListener( 'click', () => {
			if ( advanceBtn.disabled ) {
				return;
			}
			updateSummary();
			goToStep( 'transaction' );
		} );
	}

	if ( backBtn ) {
		backBtn.addEventListener( 'click', () => goToStep( 'select' ) );
	}

	if ( confirmBtn ) {
		confirmBtn.addEventListener( 'click', () => {
			modal.setAttribute( 'data-state', 'closed' );
			snackbar( __( 'Subscription changed.', 'newspack-plugin' ) );
		} );
	}

	// Reset to the select step + current selection every time the modal closes,
	// so re-opening shows a fresh init state instead of the previous attempt.
	modal.addEventListener( 'closeModal', () => {
		goToStep( 'select' );
		activeFrequency = currentFrequency;
		setActiveTab( currentFrequency );
		showPanel( currentFrequency );
		setSelectedTier( currentTierId );
	} );

	// Initial state.
	setActiveTab( currentFrequency );
	showPanel( currentFrequency );
	setSelectedTier( currentTierId );
}

/**
 * Wire a confirmation modal that flips between an `init` step (the "Are you
 * sure?" body) and a `success` step (green check + email-sent line). The
 * Cancel subscription modal uses this; donations.js mirrors it for Cancel
 * donation. Tied to the action-router below which opens the modal — this
 * function only owns the inside-the-modal step transitions.
 *
 * Confirm button → success step. Modal close (any close-button or overlay)
 * → state resets to init the next time it opens, via the closeModal event
 * dispatched by newspack-ui's modals.js mutation observer.
 *
 * @param {HTMLElement} modal The modal container element.
 */
function wireConfirmModal( modal ) {
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

	// Reset to the init step every time the modal closes so re-opening
	// presents a fresh confirmation rather than the lingering success state.
	modal.addEventListener( 'closeModal', () => goToStep( 'init' ) );
}

/**
 * Wire a transaction modal — single-screen flow with a billing readout +
 * payment form, terminating on a success step. Used by Renew subscription
 * (and the donations equivalent for Restart donation). The structure
 * mirrors the Change subscription modal's transaction step but skips the
 * preceding tier-picker.
 *
 * @param {HTMLElement} modal The modal container element.
 */
function wireTransactionModal( modal ) {
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
 * Look up the modal for a given `data-action` + resource id, opening it if
 * it exists. Closes any open dropdown the click came from so the menu
 * doesn't hover above the modal. Returns true if a modal was opened.
 *
 * Update-payment-method has no Phase 5 modal (the brief lumps it with the
 * v1 checkout flow), so its action returns null here and the caller falls
 * back to a stub snackbar.
 *
 * @param {string}      action         Data-action value of the trigger.
 * @param {string}      subscriptionId Resource id from the trigger.
 * @param {HTMLElement} root           Container the click came from (for
 *                                     dropdown close-on-open).
 * @return {boolean} Whether a modal was opened.
 */
function tryOpenModal( action, subscriptionId, root ) {
	const slug = {
		'change-subscription': 'change-subscription',
		'cancel-subscription': 'cancel-subscription',
		'renew-subscription': 'renew-subscription',
	}[ action ];
	if ( ! slug || ! subscriptionId ) {
		return false;
	}
	const modal = document.getElementById( `newspack-my-account__${ slug }-${ subscriptionId }` );
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
 * Map a `data-action` to the stub-snackbar copy used when no modal exists
 * for the action (today: only `update-payment-method`). The other actions
 * either resolve through `tryOpenModal` or fall through silently.
 *
 * @param {string} action Data-action value.
 * @return {string|null}  Snackbar copy, or null if there's nothing to say.
 */
function fallbackSnackbar( action ) {
	switch ( action ) {
		case 'update-payment-method':
			return __( 'Payment method updated.', 'newspack-plugin' );
		default:
			return null;
	}
}

/**
 * Click handler shared by the list and detail roots. Routes any
 * `data-action` trigger through `tryOpenModal` first; falls back to a
 * snackbar for actions that don't (yet) have a modal.
 *
 * @param {HTMLElement} root  Container element.
 * @param {Event}       event Click event.
 */
function handleActionClick( root, event ) {
	const trigger = event.target.closest( '[data-action]' );
	if ( ! trigger || ! root.contains( trigger ) ) {
		return;
	}
	// Let the dropdown toggle keep its own behaviour — newspack-ui's
	// dropdowns.js owns it.
	if ( trigger.classList.contains( 'newspack-ui__dropdown__toggle' ) ) {
		return;
	}
	const action = trigger.dataset.action;
	const subscriptionId = trigger.dataset.subscriptionId || '';

	if ( tryOpenModal( action, subscriptionId, root ) ) {
		// Only suppress navigation when we actually opened a modal — leaves
		// real anchors like the list page's "Manage subscription" link
		// (`<a data-action="manage-subscription" href="…/subscriptions/<id>/">`)
		// free to navigate normally when no modal handler exists for them.
		if ( trigger.tagName === 'A' ) {
			event.preventDefault();
		}
		return;
	}

	const message = fallbackSnackbar( action );
	if ( ! message ) {
		// Unhandled action — let the trigger behave naturally (e.g. real
		// link navigation, button no-op).
		return;
	}
	if ( trigger.tagName === 'A' ) {
		event.preventDefault();
	}
	const openDropdown = root.querySelector( '.newspack-ui__dropdown.active' );
	if ( openDropdown && openDropdown.contains( trigger ) ) {
		openDropdown.classList.remove( 'active' );
	}
	snackbar( message );
}

/**
 * Wire the list root. The only triggerable action on the list page is the
 * inline "renew now" anchor inside the expiring active card's notice. With
 * Phase 7 scenario fixtures, `?v2-demo=expiring` swaps an expiring sub
 * into `active` and the renew modal renders alongside, so the same
 * `handleActionClick` handler used on the detail page picks it up. Without
 * the scenario, the active bucket holds sub-001 (status=active) and the
 * inline anchor isn't rendered in the first place.
 *
 * @param {HTMLElement} root List container element.
 */
function wireListRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';
	root.addEventListener( 'click', event => handleActionClick( root, event ) );
}

/**
 * Wire the detail-page action triggers (header buttons, dropdown menu items,
 * and the inline `renew now` anchor on the expiring variant's notice).
 *
 * @param {HTMLElement} root Detail container element.
 */
function wireDetailRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';
	root.addEventListener( 'click', event => handleActionClick( root, event ) );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="subscriptions"]' ).forEach( wireListRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="subscription-details"]' ).forEach( wireDetailRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="change-subscription-modal"]' ).forEach( wireChangeSubscriptionModal );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="cancel-subscription-modal"]' ).forEach( wireConfirmModal );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="renew-subscription-modal"]' ).forEach( wireTransactionModal );
} );

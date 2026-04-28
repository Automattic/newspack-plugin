/**
 * Subscriptions screens — client-side wiring.
 *
 * Responsibilities:
 *  - Detail page: stub snackbars for the modal-trigger buttons (Change /
 *    Cancel / Renew / Update payment method). Phase 5 swaps these for real
 *    modals.
 *  - List page: no row-click table here (the previous-subscriptions cards
 *    are themselves <a> elements), but the inline "renew now" anchor inside
 *    the expiring active card needs the same stub snackbar treatment so it
 *    doesn't appear inert.
 *  - Dropdown for "More" auto-wires via newspack-ui's own js/dropdowns.js.
 *
 * Snackbar helpers are duplicated from `donations.js` for now; once the
 * Phase 5 modals add a third caller we'll factor them into a shared util
 * (per the cross-phase devlog decision — rule of three threshold reached
 * then, not now).
 */

import { __ } from '@wordpress/i18n';

const SNACKBAR_LIFETIME_MS = 5000;

/**
 * Lazily create a top-right snackbar container if the page has none yet.
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
 * don't have in the demo (matches donations.js / newsletters.js).
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
 * Map a `data-action` value to its stub snackbar message. `change-subscription`
 * is intentionally absent — that one opens the real Figma modal flow (see
 * wireChangeSubscriptionModal) and only the modal's terminal "Pay now" surfaces
 * a snackbar. Phase 5 swaps the rest for real modals.
 *
 * @param {string} action Data-action attribute value.
 * @return {string|null}  Snackbar message, or null if the action is unknown.
 */
function snackbarMessageForAction( action ) {
	switch ( action ) {
		case 'cancel-subscription':
			return __( 'Subscription cancelled.', 'newspack-plugin' );
		case 'renew-subscription':
			return __( 'Subscription renewed.', 'newspack-plugin' );
		case 'update-payment-method':
			return __( 'Payment method updated.', 'newspack-plugin' );
		default:
			return null;
	}
}

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
 * Wire the list-page inline "renew now" anchor inside the expiring active
 * card. The anchor points at `#renew` (and would navigate), so we
 * preventDefault and surface the same stub snackbar Phase 5 modals will
 * eventually trigger. Idempotent.
 *
 * @param {HTMLElement} root List container element.
 */
function wireListRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';

	root.addEventListener( 'click', event => {
		const trigger = event.target.closest( '[data-action="renew-subscription"]' );
		if ( ! trigger || ! root.contains( trigger ) ) {
			return;
		}
		// `<a href="...">` triggers also navigate; anchor-form triggers
		// (the inline notice) get the snackbar but skip navigation. Button
		// triggers don't navigate to begin with.
		if ( trigger.tagName === 'A' ) {
			event.preventDefault();
		}
		snackbar( __( 'Subscription renewed.', 'newspack-plugin' ) );
	} );
}

/**
 * Wire the detail-page modal-trigger buttons. Each surfaces a stub snackbar
 * with the eventual success copy from Figma so the click feels real before
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
		const trigger = event.target.closest( '[data-action]' );
		if ( ! trigger || ! root.contains( trigger ) ) {
			return;
		}
		// Let the dropdown toggle keep its own behaviour — newspack-ui's
		// dropdowns.js owns it.
		if ( trigger.classList.contains( 'newspack-ui__dropdown__toggle' ) ) {
			return;
		}

		// Change subscription opens the multi-step modal flow rendered into
		// the page by partials/change-subscription-modal.php. Other actions
		// keep the stub-snackbar treatment until Phase 5 wires their modals.
		if ( 'change-subscription' === trigger.dataset.action ) {
			const subscriptionId = trigger.dataset.subscriptionId || '';
			const modal = document.getElementById( `newspack-my-account__change-subscription-${ subscriptionId }` );
			if ( modal ) {
				event.preventDefault();
				const openDropdown = root.querySelector( '.newspack-ui__dropdown.active' );
				if ( openDropdown ) {
					openDropdown.classList.remove( 'active' );
				}
				modal.setAttribute( 'data-state', 'open' );
			}
			return;
		}

		const message = snackbarMessageForAction( trigger.dataset.action );
		if ( ! message ) {
			return;
		}

		// Header action links (`<a class="wcs-switch-link" href="#...">`) and
		// the inline "renew now" anchor in the expiring notice are anchors
		// that would otherwise navigate to a hash. Suppress the navigation
		// so the page stays put while we surface the snackbar / open the
		// modal.
		if ( trigger.tagName === 'A' ) {
			event.preventDefault();
		}

		// Close any open dropdown the click came from so the menu doesn't
		// linger above the snackbar.
		const openDropdown = root.querySelector( '.newspack-ui__dropdown.active' );
		if ( openDropdown && openDropdown.contains( trigger ) ) {
			openDropdown.classList.remove( 'active' );
		}

		snackbar( message );
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="subscriptions"]' ).forEach( wireListRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="subscription-details"]' ).forEach( wireDetailRoot );
	document.querySelectorAll( '[data-newspack-my-account-v2-demo="change-subscription-modal"]' ).forEach( wireChangeSubscriptionModal );
} );

/**
 * Payment information screen — client-side wiring.
 *
 * Mirrors the post-Phase-6 rebuild that swapped WC core's table DOM for
 * v1's `payment-information.php` card layout (see brief §2.1.1, devlog
 * "Payment information rebuild"). Five modals total:
 *
 *  - Add payment method  (singleton — `#newspack-my-account__add-payment-method`)
 *  - Edit payment method (per-card —  `#newspack-my-account__edit-payment-method-<id>`)
 *  - Delete payment method (per-card — `#newspack-my-account__delete-payment-method-<id>`)
 *  - Edit / Add address  (per-type —  `#newspack-my-account__edit-address-<type>`)
 *  - Delete address      (per-type —  `#newspack-my-account__delete-address-<type>`)
 *
 * Triggers carry v1's hook classes (`newspack-my-account__delete-payment-method`,
 * `…__edit-address`, etc.) plus a `data-payment-method` / `data-address-type`
 * attribute. Same dispatcher shape as v1's `payment-information.js`, but
 * rebuilt as event-delegated listeners on the page so dynamically-rendered
 * triggers still work without a re-wire.
 *
 * All confirm buttons fire a snackbar + close the modal. No real
 * mutations — the brief lumps that with the v1 checkout flow during
 * productionisation.
 */

import { __ } from '@wordpress/i18n';

import { snackbar } from './util/snackbar';

const TRIGGER_TO_MODAL = [
	{
		selector: 'a.newspack-my-account__add-payment-method',
		modalId: () => 'newspack-my-account__add-payment-method',
	},
	{
		selector: 'a.newspack-my-account__edit-payment-method[data-payment-method]',
		modalId: trigger => `newspack-my-account__edit-payment-method-${ trigger.dataset.paymentMethod }`,
	},
	{
		selector: 'a.newspack-my-account__delete-payment-method[data-payment-method]',
		modalId: trigger => `newspack-my-account__delete-payment-method-${ trigger.dataset.paymentMethod }`,
	},
	{
		selector: 'a.newspack-my-account__edit-address[data-address-type]',
		modalId: trigger => `newspack-my-account__edit-address-${ trigger.dataset.addressType }`,
	},
	{
		selector: 'a.newspack-my-account__delete-address[data-address-type]',
		modalId: trigger => `newspack-my-account__delete-address-${ trigger.dataset.addressType }`,
	},
];

/**
 * The success copy fired by each modal's confirm button. Keyed by the
 * `data-newspack-my-account-v2-demo` attribute on the modal container so
 * the dispatcher can look up the right message without sprinkling
 * if/else chains.
 *
 * @return {Record<string, string>} Modal slug → translated snackbar copy.
 */
function getConfirmMessages() {
	return {
		'add-payment-method-modal': __( 'Payment method added.', 'newspack-plugin' ),
		'edit-payment-method-modal': __( 'Payment method updated.', 'newspack-plugin' ),
		'delete-payment-method-modal': __( 'Payment method deleted.', 'newspack-plugin' ),
		'edit-address-modal': __( 'Address saved.', 'newspack-plugin' ),
		'delete-address-modal': __( 'Address deleted.', 'newspack-plugin' ),
	};
}

/**
 * Open a modal by id and collapse the originating dropdown so the menu
 * doesn't float above the modal overlay (matches v1 payment-information.js).
 *
 * @param {string}      modalId Modal id (no leading `#`).
 * @param {HTMLElement} trigger Element that fired the click.
 * @return {boolean} True if the modal was found and opened.
 */
function openModal( modalId, trigger ) {
	const modal = document.getElementById( modalId );
	if ( ! modal ) {
		return false;
	}
	modal.setAttribute( 'data-state', 'open' );
	const dropdown = trigger.closest( '.newspack-ui__dropdown' );
	if ( dropdown ) {
		dropdown.classList.remove( 'active' );
	}
	return true;
}

/**
 * Close a modal by setting `data-state="closed"`. newspack-ui's modals.js
 * dispatches `closeModal` on the container when the state flips, which any
 * step-resetting consumer can subscribe to.
 *
 * @param {HTMLElement} modal Modal container.
 */
function closeModal( modal ) {
	modal.setAttribute( 'data-state', 'closed' );
}

/**
 * Wire each confirm button (`[data-action="confirm"]`) to fire the
 * snackbar matching its modal slug, then close the modal. Idempotent —
 * guards against double-wiring with a dataset flag.
 */
function wireConfirmButtons() {
	const messages = getConfirmMessages();
	document.querySelectorAll( '[data-newspack-my-account-v2-demo]' ).forEach( modal => {
		if ( modal.dataset.newspackMyAccountV2DemoWired === 'true' ) {
			return;
		}
		const slug = modal.dataset.newspackMyAccountV2Demo;
		const message = messages[ slug ];
		if ( ! message ) {
			return;
		}
		const confirmBtn = modal.querySelector( '[data-action="confirm"]' );
		if ( ! confirmBtn ) {
			return;
		}
		modal.dataset.newspackMyAccountV2DemoWired = 'true';
		confirmBtn.addEventListener( 'click', event => {
			event.preventDefault();
			snackbar( message );
			closeModal( modal );
		} );
	} );
}

/**
 * Page-level click delegate. Walks the trigger map; first match opens
 * its modal and stops the click from following the placeholder `#`
 * href. Triggers without a matching modal in the DOM (e.g. the
 * "Add address" CTA when address modals were never rendered) fall
 * through to a no-op snackbar so clicks never feel broken.
 *
 * @param {MouseEvent} event Click event.
 */
function handlePageClick( event ) {
	for ( const { selector, modalId } of TRIGGER_TO_MODAL ) {
		const trigger = event.target.closest( selector );
		if ( ! trigger ) {
			continue;
		}
		event.preventDefault();
		const id = modalId( trigger );
		if ( ! openModal( id, trigger ) ) {
			snackbar( __( 'This action will be available soon.', 'newspack-plugin' ) );
		}
		return;
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const sections = document.querySelectorAll( '#payment-methods, #addresses' );
	if ( ! sections.length ) {
		return;
	}
	sections.forEach( section => {
		section.addEventListener( 'click', handlePageClick );
	} );
	wireConfirmButtons();
} );

/**
 * Account settings screen — client-side only.
 *
 * Form submits don't post anywhere; they fire a snackbar and return. The
 * Delete account button opens the two-step modal; the inner Delete account
 * button flips the modal from `init` to `success` (the "check inbox" state).
 * Modal close + reset logic reuses the closeModal event newspack-ui's
 * modals.js dispatches when data-state flips to closed (same shape as the
 * Phase 5 modals).
 */

import { __ } from '@wordpress/i18n';

import { snackbar } from './util/snackbar';

const ROOT_SELECTOR = '[data-newspack-my-account-v2-demo="account-settings"]';
const MODAL_SELECTOR = '#newspack-my-account__delete-account';

/**
 * Open the modal by flipping its `data-state` attribute. newspack-ui's
 * modals.js observes this attribute and handles the rest (focus trap,
 * close button, ESC, backdrop click).
 *
 * @param {HTMLElement} modal Modal container element.
 */
function openModal( modal ) {
	modal.setAttribute( 'data-state', 'open' );
}

/**
 * Switch the modal to its success ("check inbox") step.
 *
 * @param {HTMLElement} modal Modal container element.
 */
function showSuccessStep( modal ) {
	modal.querySelectorAll( '[data-step]' ).forEach( step => {
		step.hidden = step.dataset.step !== 'success';
	} );
}

/**
 * Reset the modal back to the init step. Wired to the closeModal event
 * dispatched by newspack-ui modals.js so the next open shows the right
 * step.
 *
 * @param {HTMLElement} modal Modal container element.
 */
function resetModal( modal ) {
	modal.querySelectorAll( '[data-step]' ).forEach( step => {
		step.hidden = step.dataset.step !== 'init';
	} );
}

/**
 * Wire one account-settings root. Idempotent.
 *
 * @param {HTMLElement} root Container element.
 */
function wireRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoAccountSettingsWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoAccountSettingsWired = 'true';

	const modal = document.querySelector( MODAL_SELECTOR );

	root.addEventListener( 'submit', event => {
		const form = event.target.closest( 'form[data-action]' );
		if ( ! form ) {
			return;
		}
		event.preventDefault();
		const action = form.dataset.action;
		if ( action === 'update-profile' ) {
			snackbar( __( 'Profile updated.', 'newspack-plugin' ) );
		} else if ( action === 'update-password' ) {
			snackbar( __( 'Password updated.', 'newspack-plugin' ) );
		}
	} );

	root.addEventListener( 'click', event => {
		const trigger = event.target.closest( '[data-action]' );
		if ( ! trigger ) {
			return;
		}
		const action = trigger.dataset.action;
		if ( action === 'forgot-password' ) {
			event.preventDefault();
			snackbar( __( 'Password reset email sent.', 'newspack-plugin' ) );
			return;
		}
		if ( action === 'delete-account' && modal ) {
			event.preventDefault();
			openModal( modal );
		}
	} );

	if ( modal ) {
		modal.addEventListener( 'click', event => {
			const confirmButton = event.target.closest( '[data-action="confirm-delete-account"]' );
			if ( confirmButton ) {
				event.preventDefault();
				showSuccessStep( modal );
			}
		} );
		modal.addEventListener( 'closeModal', () => resetModal( modal ) );
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( ROOT_SELECTOR ).forEach( wireRoot );
} );

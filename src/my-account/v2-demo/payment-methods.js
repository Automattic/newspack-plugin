/**
 * Payment methods screen — client-side wiring.
 *
 * Phase 6 ships no real mutations. Make default / Delete / Add new are all
 * stub click handlers that prevent the link's default navigation and surface
 * a snackbar. Same dispatcher pattern donations.js / subscriptions.js use,
 * trimmed to the snackbar-only case (no modals).
 *
 * Action slugs (must match the `data-action` values the template emits):
 *  - set-default-payment-method
 *  - delete-payment-method
 *  - add-payment-method
 */

import { __ } from '@wordpress/i18n';

import { snackbar } from './util/snackbar';

const ACTION_MESSAGES = {
	'set-default-payment-method': __( 'Default payment method updated.', 'newspack-plugin' ),
	'delete-payment-method': __( 'Payment method deleted.', 'newspack-plugin' ),
	'add-payment-method': __( 'Add payment method coming soon.', 'newspack-plugin' ),
};

/**
 * Wire a single root container's `data-action` clicks to the snackbar
 * dispatcher. Idempotent — guards against double-wiring with a dataset flag.
 *
 * @param {HTMLElement} root Container element.
 */
function wireRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoWired = 'true';

	root.addEventListener( 'click', event => {
		const trigger = event.target.closest( '[data-action]' );
		if ( ! trigger || ! root.contains( trigger ) ) {
			return;
		}
		const action = trigger.dataset.action;
		const message = ACTION_MESSAGES[ action ];
		if ( ! message ) {
			return;
		}
		event.preventDefault();
		snackbar( message );
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	// The endpoint body is not wrapped in a v2-demo data attribute (the
	// template is a faithful copy of WC core's, no hand-rolled wrapper). Wire
	// directly off the table + the trailing "Add payment method" anchor —
	// each is a small, scoped delegation root rather than the whole document.
	document.querySelectorAll( '.account-payment-methods-table' ).forEach( wireRoot );
	document.querySelectorAll( 'a.button[data-action="add-payment-method"]' ).forEach( anchor => wireRoot( anchor ) );
} );

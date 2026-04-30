/**
 * Homepage overlay — open/close + greeting.
 *
 * The PHP template renders the drawer with `data-state="open"` and a
 * placeholder for the time-of-day greeting word. This module fills the
 * placeholder from the browser's local time and wires up close behaviors
 * (X button, backdrop click, ESC key).
 */

import { __ } from '@wordpress/i18n';

const STATE_ATTR = 'data-state';
const STATE_CLOSED = 'closed';
const ROOT_SELECTOR = '[data-newspack-my-account-v2-demo-homepage]';

/**
 * Greeting word for the current browser hour.
 * <12 = morning, <18 = afternoon, else = evening.
 *
 * @return {string} Localized greeting word.
 */
function getGreetingWord() {
	const hour = new Date().getHours();
	if ( hour < 12 ) {
		return __( 'morning', 'newspack-plugin' );
	}
	if ( hour < 18 ) {
		return __( 'afternoon', 'newspack-plugin' );
	}
	return __( 'evening', 'newspack-plugin' );
}

/**
 * Wire one overlay root. Idempotent — subsequent calls on the same root
 * are no-ops.
 *
 * @param {HTMLElement} root Overlay container.
 */
function wireRoot( root ) {
	if ( root.dataset.newspackMyAccountV2DemoHomepageWired === 'true' ) {
		return;
	}
	root.dataset.newspackMyAccountV2DemoHomepageWired = 'true';

	root.querySelectorAll( '[data-greeting-time]' ).forEach( el => {
		el.textContent = getGreetingWord();
	} );

	const close = () => {
		root.setAttribute( STATE_ATTR, STATE_CLOSED );
	};

	root.addEventListener( 'click', event => {
		// X button (or any descendant of an element with [data-close]).
		if ( event.target.closest( '[data-close]' ) ) {
			close();
			return;
		}
		// Backdrop click — only when the click landed on the root itself,
		// not on the drawer panel inside it.
		if ( event.target === root ) {
			close();
		}
	} );

	document.addEventListener( 'keydown', event => {
		if ( event.key !== 'Escape' ) {
			return;
		}
		if ( root.getAttribute( STATE_ATTR ) === STATE_CLOSED ) {
			return;
		}
		close();
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	document.querySelectorAll( ROOT_SELECTOR ).forEach( wireRoot );
} );

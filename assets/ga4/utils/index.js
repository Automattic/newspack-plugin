/* globals newspack_popups_view */

export * from './analytics';

/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dom-ready/
 *
 * @param {Function} callback A function to execute after the DOM is ready.
 * @return {void}
 */
export function domReady( callback ) {
	if ( typeof document === 'undefined' ) {
		return;
	}
	if (
		document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
		document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
	) {
		return void callback();
	}
	// DOMContentLoaded has not fired yet, delay callback until then.
	document.addEventListener( 'DOMContentLoaded', callback );
}

/**
 * Get all modal checkouts on the page.
 *
 * @return {Array} Array of modal checkout modal elements.
 */
export const getModalCheckouts = () => {
	return [ ...document.querySelectorAll( '#newspack_modal_checkout, .newspack-reader-auth-modal, .newspack-blocks__modal-variation' ) ];
}

// Modal triggered

// Modal opened

// What screen on the modal is loaded

// is dismissed

/**
 * Get all modal checkout triggers on the page.
 *
 * @return {Array} Array of modal checkout triggers.
 */
export const getModalCheckoutTriggers = () => {
	return [ ...document.querySelectorAll( '.wp-block-newspack-blocks-checkout-button form, .wp-block-newspack-blocks-donate form' ) ];
}

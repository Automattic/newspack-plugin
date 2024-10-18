import * as a11y from '../reader-activation-auth/accessibility.js';

/**
 * Get the newsletters signup modal container.
 *
 * @return {HTMLElement} The modal container.
 */
export function getModalContainer() {
	return document.querySelector(
		'.newspack-newsletters-signup-modal .newspack-newsletters-signup'
	);
}

/**
 * Open the newsletters signup modal.
 *
 * @param {Object} config Configuration object.
 *
 * @return {void}
 */
export function openNewslettersSignupModal( config = {} ) {
	const container = getModalContainer();
	if ( ! container ) {
		if ( config?.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess();
		}
		return;
	}

	const modal = container.closest( '.newspack-newsletters-signup-modal' );
	if ( ! modal ) {
		if ( config?.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess();
		}
		return;
	}

	/**
	 * Close the modal.
	 *
	 * @param {boolean} dismiss Whether it's a dismiss action.
	 */
	const close = ( dismiss = true ) => {
		container.config = {};
		modal.setAttribute( 'data-state', 'closed' );
		if ( modal?.overlayId && window?.newspackReaderActivation?.overlays ) {
			window.newspackReaderActivation.overlays.remove( modal.overlayId );
		}
		const openerContent = container.querySelector( '.opener-content' );
		if ( openerContent ) {
			openerContent.remove();
		}
		if ( dismiss && config.onDismiss && typeof config.onDismiss === 'function' ) {
			config.onDismiss();
		}
	};

	const closeButtons = modal.querySelectorAll( 'button[data-close], .newspack-ui__modal__close' );
	if ( closeButtons?.length ) {
		closeButtons.forEach( closeButton => {
			closeButton.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				close();
			} );
		} );
	}

	config.labels = {
		...config?.labels,
	};

	/** Attach config to the container. */
	container.config = config;

	container.newslettersSignupCallback = ( message, data ) => {
		if ( config?.closeOnSuccess ) {
			close( false );
		}
		if ( config?.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess( message, data );
		}
	};

	if ( config?.content ) {
		const openerContent = document.createElement( 'div' );
		openerContent.classList.add( 'opener-content' );
		openerContent.innerHTML = config.content;
		const form = container.querySelector( 'form' );
		form.insertBefore( openerContent, form.firstChild );
	}

	// Populate email if not already set.
	const emailInput = modal.querySelector( 'span.email' );
	if ( emailInput && ! emailInput.innerText ) {
		const reader = window?.newspackReaderActivation?.getReader();

		if ( reader?.email ) {
			emailInput.textContent = reader.email;
		} else {
			// Remove parent element of emailInput if no email is found.
			emailInput.parentElement.remove();
		}
	}

	modal.setAttribute( 'data-state', 'open' );
	a11y.trapFocus( modal );
	if ( window?.newspackReaderActivation?.overlays ) {
		modal.overlayId = window.newspackReaderActivation.overlays.add();
	}
}

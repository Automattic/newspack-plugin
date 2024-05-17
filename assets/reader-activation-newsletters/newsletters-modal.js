/* globals */

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
		if ( config?.callback ) {
			config.callback();
		}
		return;
	}

	const modal = container.closest( '.newspack-newsletters-signup-modal' );

	if ( ! modal ) {
		if ( config?.callback ) {
			config.callback();
		}
		return;
	}

	const close = () => {
		container.config = {};
		modal.setAttribute( 'data-state', 'closed' );
		if ( modal?.overlayId && window?.newspackReaderActivation?.overlays ) {
			window.newspackReaderActivation.overlays.remove( modal.overlayId );
		}
		const openerContent = container.querySelector( '.opener-content' );
		if ( openerContent ) {
			openerContent.remove();
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
		close();
		if ( config?.callback ) {
			config.callback( message, data );
		}
	};

	if ( config?.content ) {
		const openerContent = document.createElement( 'div' );
		openerContent.classList.add( 'opener-content' );
		openerContent.innerHTML = config.content;
		const form = container.querySelector( 'form' );
		form.insertBefore( openerContent, form.firstChild );
	}
	modal.setAttribute( 'data-state', 'open' );
	if ( window?.newspackReaderActivation?.overlays ) {
		modal.overlayId = window.newspackReaderActivation.overlays.add();
	}
}

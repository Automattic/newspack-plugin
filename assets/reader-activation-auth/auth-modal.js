/* globals newspack_reader_activation_labels */
export const SIGN_IN_MODAL_HASHES = [ 'signin_modal', 'register_modal' ];

/**
 * Get the authentication modal container.
 *
 * @return {HTMLElement} The modal container.
 */
export function getModalContainer() {
	return document.querySelector( '.newspack-reader-auth-modal .newspack-reader-auth' );
}

/**
 * Open the authentication modal.
 *
 * @param {Object} config Configuration object.
 *
 * @return {void}
 */
export function openAuthModal( config = {} ) {
	const reader = window.newspackReaderActivation.getReader();
	const modalTrigger = config.trigger;

	if ( reader?.authenticated ) {
		if ( config.callback ) {
			config.callback();
		}
		return;
	}

	const container = getModalContainer();
	if ( ! container ) {
		if ( config.callback ) {
			config.callback();
		}
		return;
	}

	const modal = container.closest( '.newspack-reader-auth-modal' );
	if ( ! modal ) {
		if ( config.callback ) {
			config.callback();
		}
		return;
	}

	const close = () => {
		container.config = {};
		modal.setAttribute( 'data-state', 'closed' );
		document.body.classList.remove( 'newspack-signin' );
		document.body.style.overflow = 'auto';
		if ( modal.overlayId && window.newspackReaderActivation?.overlays ) {
			window.newspackReaderActivation.overlays.remove( modal.overlayId );
		}
		const openerContent = container.querySelector( '.opener-content' );
		if ( openerContent ) {
			openerContent.remove();
		}

		if ( modalTrigger ) {
			modalTrigger.focus();
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

	document.addEventListener( 'keydown', function ( ev ) {
		if ( ev.key === 'Escape' ) {
			close();
		}
	} );

	config.labels = {
		...newspack_reader_activation_labels,
		...config?.labels,
	};

	/** Attach config to the container. */
	container.config = config;

	container.authCallback = ( message, data ) => {
		close();
		if ( config.callback ) {
			config.callback( message, data );
		}
	};

	container.formActionCallback = action => {
		const titleEl = modal.querySelector( 'h2' );
		titleEl.textContent =
			'register' === action ? config.labels.register.title : config.labels.signin.title;

		modal.querySelectorAll( '[data-action]' ).forEach( item => {
			if ( 'none' !== item.style.display ) {
				item.prevDisplay = item.style.display;
			}
			item.style.display = 'none';
		} );
		modal.querySelectorAll( '[data-action~="' + action + '"]' ).forEach( item => {
			item.style.display = item.prevDisplay;
		} );
	};

	if ( config.content ) {
		const openerContent = document.createElement( 'div' );
		openerContent.classList.add( 'opener-content' );
		openerContent.innerHTML = config.content;
		const form = container.querySelector( 'form' );
		form.insertBefore( openerContent, form.firstChild );
	}

	const emailInput = container.querySelector( 'input[name="npe"]' );
	if ( emailInput ) {
		emailInput.value = reader?.email || '';
	}

	let initialFormAction = 'signin';
	if ( window.newspackReaderActivation?.hasAuthLink() ) {
		initialFormAction = 'otp';
	}
	const currentHash = window.location.hash.replace( '#', '' );
	if ( SIGN_IN_MODAL_HASHES.includes( currentHash ) ) {
		initialFormAction = currentHash === 'register_modal' ? 'register' : 'signin';
	}
	if ( config.initialState ) {
		initialFormAction = config.initialState;
	}
	container.setFormAction( initialFormAction, true );

	document.body.classList.add( 'newspack-signin' );
	document.body.style.overflow = 'hidden';
	modal.setAttribute( 'data-state', 'open' );
	if ( window.newspackReaderActivation?.overlays ) {
		modal.overlayId = window.newspackReaderActivation.overlays.add();
		trapFocus( modal );
	}

	/** Remove the modal hash from the URL if any. */
	if ( SIGN_IN_MODAL_HASHES.includes( window.location.hash.replace( '#', '' ) ) ) {
		history.pushState( '', document.title, window.location.pathname + window.location.search );
	}

	/**
	 * Trap focus in the modal when opened.
	 * See: https://uxdesign.cc/how-to-trap-focus-inside-modal-to-make-it-ada-compliant-6a50f9a70700
	 */
	function trapFocus( currentModal ) {
		const focusableEls =
			'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

		const firstFocusableEl = currentModal.querySelectorAll( focusableEls )[ 0 ]; // get first element to be focused inside modal
		const focusableElsAll = currentModal.querySelectorAll( focusableEls );
		const lastFocusableEl = focusableElsAll[ focusableElsAll.length - 1 ]; // get last element to be focused inside modal

		firstFocusableEl.focus();

		document.addEventListener( 'keydown', function ( e ) {
			const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

			if ( ! isTabPressed ) {
				return;
			}
			/* eslint-disable @wordpress/no-global-active-element */
			if ( e.shiftKey ) {
				if ( document.activeElement === firstFocusableEl ) {
					lastFocusableEl.focus();
					e.preventDefault();
				}
			} else if ( document.activeElement === lastFocusableEl ) {
				firstFocusableEl.focus();
				e.preventDefault();
			}
			/* eslint-enable @wordpress/no-global-active-element */
		} );
	}
}

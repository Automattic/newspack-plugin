/* globals newspack_reader_activation_labels */
export const SIGN_IN_MODAL_HASHES = [ 'signin_modal', 'register_modal' ];
import * as a11y from './accessibility.js';
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
		if ( config.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess();
		}
		return;
	}

	const container = getModalContainer();
	if ( ! container ) {
		if ( config.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess();
		}
		return;
	}

	const modal = container.closest( '.newspack-reader-auth-modal' );
	if ( ! modal ) {
		if ( config.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess();
		}
		return;
	}

	/**
	 * Close the auth modal.
	 *
	 * @param {boolean} dismiss Whether it's a dismiss action.
	 */
	const close = ( dismiss = true ) => {
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
		close( false );
		if ( config.onSuccess && typeof config.onSuccess === 'function' ) {
			config.onSuccess( message, data );
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
		a11y.trapFocus( modal );
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

	// Default to signin action if otp and timer has expired.
	if (
		initialFormAction === 'otp' &&
		window?.newspackReaderActivation?.getOTPTimeRemaining() <= 0
	) {
		container.setFormAction( 'signin' );
	}
	document.body.classList.add( 'newspack-signin' );
	document.body.style.overflow = 'hidden';
	modal.setAttribute( 'data-state', 'open' );
	if ( window.newspackReaderActivation?.overlays ) {
		modal.overlayId = window.newspackReaderActivation.overlays.add();
		a11y.trapFocus( modal );
	}

	/** Remove the modal hash from the URL if any. */
	if ( SIGN_IN_MODAL_HASHES.includes( window.location.hash.replace( '#', '' ) ) ) {
		history.pushState( '', document.title, window.location.pathname + window.location.search );
	}
}

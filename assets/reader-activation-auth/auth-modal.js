/* globals newspack_reader_auth_labels */
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
		modal.setAttribute( 'data-state', 'closed' );
		document.body.classList.remove( 'newspack-signin' );
		if ( modal.overlayId ) {
			window.newspackReaderActivation.overlays.remove( modal.overlayId );
		}
	};

	config.labels = {
		...newspack_reader_auth_labels,
		...config?.labels,
	};

	/** Attach config to the container. */
	container.config = config;

	container.authCallback = ( message, data ) => {
		if ( config.callback ) {
			config.callback( message, data );
		}
		close();
	};

	container.formActionCallback = action => {
		const titleEl = modal.querySelector( 'h2' );
		titleEl.textContent =
			'register' === action ? config.labels.register.title : config.labels.signin.title;
	};

	let initialFormAction = 'signin';
	if ( window.newspackReaderActivation.hasAuthLink() ) {
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

	const emailInput = container.querySelector( 'input[name="npe"]' );
	if ( emailInput ) {
		emailInput.value = reader?.email || '';
	}

	modal.setAttribute( 'data-state', 'open' );

	document.body.classList.add( 'newspack-signin' );
	modal.overlayId = window.newspackReaderActivation.overlays.add();

	const closeButtons = modal.querySelectorAll( 'button[data-close], .newspack-ui__modal__close' );
	if ( closeButtons?.length ) {
		closeButtons.forEach( closeButton => {
			closeButton.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				close();
			} );
		} );
	}

	/** Remove the modal hash from the URL if any. */
	if ( SIGN_IN_MODAL_HASHES.includes( window.location.hash.replace( '#', '' ) ) ) {
		history.pushState( '', document.title, window.location.pathname + window.location.search );
	}
}

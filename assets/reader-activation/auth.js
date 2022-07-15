/**
 * Internal dependencies.
 */
import './auth.scss';

( function ( readerActivation ) {
	window.onload = function () {
		if ( ! readerActivation ) {
			return;
		}

		const container = document.querySelector( '#newspack-reader-auth' );
		if ( ! container ) {
			return;
		}

		const initialForm = container.querySelector( 'form' );
		let form;
		/** Workaround AMP's enforced XHR strategy. */
		if ( initialForm.getAttribute( 'action-xhr' ) ) {
			initialForm.removeAttribute( 'action-xhr' );
			form = initialForm.cloneNode( true );
			initialForm.replaceWith( form );
		} else {
			form = initialForm;
		}

		const actionInput = form.querySelector( 'input[name="action"]' );
		const emailInput = form.querySelector( 'input[name="email"]' );
		const passwordInput = form.querySelector( 'input[name="password"]' );
		const submitButtons = form.querySelectorAll( '[type="submit"]' );

		container.querySelector( 'button[data-close]' ).addEventListener( 'click', function ( ev ) {
			ev.preventDefault();
			container.style.display = 'none';
		} );

		/** Apply primary color */
		const primaryColor = container.getAttribute( 'data-primary-color' );
		if ( primaryColor ) {
			submitButtons.forEach( button => {
				button.style.backgroundColor = primaryColor;
			} );
		}

		const messageContainer = container.querySelector( '.newspack-reader__auth-form__response' );

		const authLinkMessage = container.querySelector( '[data-has-auth-link]' );
		authLinkMessage.hidden = true;

		const accountLinks = document.querySelectorAll( '.newspack-reader__account-link' );

		/**
		 * Handle reader changes.
		 */
		readerActivation.on( 'reader', ( { detail: { email, authenticated } } ) => {
			emailInput.value = email || '';
			if ( accountLinks?.length ) {
				accountLinks.forEach( link => {
					try {
						const labels = JSON.parse( link.getAttribute( 'data-labels' ) );
						link.querySelector( '.newspack-reader-account-link-label' ).innerHTML = authenticated
							? labels.signedin
							: labels.signedout;
					} catch {}
				} );
			}
			if ( authenticated ) {
				container.style.display = 'none';
			}
		} );

		/**
		 * Handle account links.
		 */
		function handleAccountLinkClick( ev ) {
			const reader = readerActivation.getReader();
			/** If logged in, bail and allow page redirection. */
			if ( reader?.authenticated ) {
				return;
			}
			ev.preventDefault();

			if ( readerActivation.hasAuthLink() ) {
				authLinkMessage.style.display = 'block';
			} else {
				authLinkMessage.style.display = 'none';
			}

			emailInput.value = reader?.email || '';

			container.hidden = false;
			container.style.display = 'flex';

			if ( emailInput.value && 'pwd' === actionInput.value ) {
				passwordInput.focus();
			} else {
				emailInput.focus();
			}
		}
		accountLinks.forEach( menuItem => {
			menuItem.querySelector( 'a' ).addEventListener( 'click', handleAccountLinkClick );
		} );

		/**
		 * Handle auth form action selection.
		 */
		function setFormAction( action ) {
			actionInput.value = action;
			messageContainer.innerHTML = '';
			container.querySelectorAll( '[data-action]' ).forEach( item => {
				if ( 'none' !== item.style.display ) {
					item.prevDisplay = item.style.display;
				}
				item.style.display = 'none';
			} );
			container.querySelectorAll( '[data-action="' + action + '"]' ).forEach( item => {
				item.style.display = item.prevDisplay;
			} );
			if ( action === 'pwd' && emailInput.value ) {
				passwordInput.focus();
			} else {
				emailInput.focus();
			}
		}
		setFormAction( actionInput.value );
		container.querySelectorAll( '[data-set-action]' ).forEach( item => {
			item.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				setFormAction( ev.target.getAttribute( 'data-set-action' ) );
			} );
		} );

		/**
		 * Handle auth form submission.
		 */
		form.addEventListener( 'submit', function ( ev ) {
			ev.preventDefault();
			const body = new FormData( ev.target );
			if ( ! body.has( 'email' ) || ! body.get( 'email' ) ) {
				return;
			}
			submitButtons.forEach( button => {
				button.disabled = true;
			} );
			messageContainer.innerHTML = '';
			form.style.opacity = 0.5;
			readerActivation.setReaderEmail( body.get( 'email' ) );
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} )
				.then( res => {
					res.json().then( ( { message, data } ) => {
						const messageNode = document.createElement( 'div' );
						messageNode.innerHTML = `<p>${ message }</p>`;
						messageNode.className = `message status-${ res.status }`;
						if ( res.status === 200 ) {
							container.classList.remove( 'error' );
							container.classList.add( 'success' );
							if ( data?.email ) {
								readerActivation.setReaderEmail( data.email );
							}
							if ( data?.authenticated ) {
								readerActivation.setAuthenticated();
								if ( body.get( 'redirect' ) ) {
									window.location = body.get( 'redirect' );
								}
							} else {
								messageNode.prepend(
									container.querySelector( '.newspack-reader__auth-form__success-icon' )
								);
								form.replaceWith( messageNode );
							}
						} else {
							container.classList.add( 'error' );
							container.classList.remove( 'success' );
							messageContainer.appendChild( messageNode );
						}
					} );
				} )
				.catch( err => {
					throw err;
				} )
				.finally( () => {
					form.style.opacity = 1;
					submitButtons.forEach( button => {
						button.disabled = false;
					} );
				} );
		} );
	};
} )( window.newspackReaderActivation );

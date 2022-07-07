/**
 * Internal dependencies.
 */
import './auth.scss';

( function ( readerActivation ) {
	if ( ! readerActivation ) {
		return;
	}
	window.onload = function () {
		const container = document.querySelector( '#newspack-reader-activation-auth-form' );
		if ( ! container ) {
			return;
		}

		const initialForm = container.querySelector( 'form' );
		let form;
		/** Temporary way around AMP's enforced XHR strategy. */
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
		const redirectInput = form.querySelector( 'input[name="redirect"]' );
		const submitButton = form.querySelector( '[type="submit"]' );

		const messageContainer = form.querySelector( '.form-response' );

		const authLinkMessage = form.querySelector( '.auth-link-message' );
		authLinkMessage.hidden = true;

		/**
		 * Handle reader changes.
		 */
		readerActivation.on( 'reader', ( { email } ) => {
			emailInput.value = email || '';
		} );

		/**
		 * Handle account links.
		 */
		const accountLinks = [ ...document.querySelectorAll( '.newspack-reader-account-link' ) ];
		accountLinks.forEach( menuItem => {
			menuItem.querySelector( 'a' ).addEventListener( 'click', function ( ev ) {
				const reader = readerActivation.getReader();
				/** If logged in, bail and allow page redirection. */
				if ( reader?.authenticated ) {
					return;
				}
				ev.preventDefault();
				if ( readerActivation.hasAuthLink() ) {
					authLinkMessage.hidden = false;
				} else {
					authLinkMessage.hidden = true;
				}
				emailInput.value = reader?.email || '';
				if ( emailInput.value ) {
					passwordInput.focus();
				} else {
					emailInput.focus();
				}
				redirectInput.value = ev.target.getAttribute( 'href' );
				container.hidden = false;
				container.style.display = 'flex';
			} );
		} );

		/**
		 * Handle auth form action selection.
		 */
		function setFormAction( action ) {
			actionInput.value = action;
			form.querySelectorAll( '.action-item ' ).forEach( item => {
				item.hidden = true;
			} );
			form.querySelectorAll( '.action-' + action ).forEach( item => {
				item.hidden = false;
			} );
		}
		setFormAction( actionInput.value );

		form.querySelectorAll( '[data-set-action]' ).forEach( item => {
			item.addEventListener( 'click', function ( ev ) {
				ev.preventDefault();
				const action = ev.target.getAttribute( 'data-set-action' );
				setFormAction( ev.target.getAttribute( 'data-set-action' ) );
				if ( action === 'pwd' && emailInput.value ) {
					passwordInput.focus();
				} else {
					emailInput.focus();
				}
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
			submitButton.disabled = true;
			messageContainer.innerHTML = '';
			form.style.opacity = 0.5;
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} )
				.then( res => {
					res.json().then( ( { message, data } ) => {
						const messageNode = document.createElement( 'p' );
						messageNode.innerHTML = message;
						messageNode.className = `message status-${ res.status }`;
						if ( res.status === 200 ) {
							if ( body.get( 'redirect' ) ) {
								window.location = body.get( 'redirect' );
							} else {
								form.hidden = true;
								if ( data?.email ) {
									readerActivation.setReaderEmail( data.email );
									readerActivation.setAuthenticated();
								}
							}
						} else {
							messageContainer.appendChild( messageNode );
						}
					} );
				} )
				.catch( err => {
					throw err;
				} )
				.finally( () => {
					form.style.opacity = 1;
					submitButton.disabled = false;
				} );
		} );
	};
} )( window.newspackReaderActivation );

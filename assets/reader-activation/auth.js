/**
 * WordPress dependencies.
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies.
 */
import './auth.scss';

( function ( readerActivation ) {
	if ( ! readerActivation ) {
		return;
	}
	domReady( function () {
		const form = document.querySelector( '#newspack-reader-activation-auth-form' );
		if ( ! form ) {
			return;
		}
		const emailInput = form.querySelector( 'input[name="email"]' );
		const passwordInput = form.querySelector( 'input[name="password"]' );
		const redirectInput = form.querySelector( 'input[name="redirect"]' );
		const submitButton = form.querySelector( '[type="submit"]' );

		const authLinkMessage = form.querySelector( '.auth-link-message' );
		authLinkMessage.hidden = true;

		/**
		 * Handle account links.
		 */
		[ ...document.querySelectorAll( '.newspack-reader-account-link' ) ].forEach( menuItem => {
			menuItem.querySelector( 'a' ).addEventListener( 'click', function ( ev ) {
				const reader = readerActivation.getReader();
				/** If logged in, allow page redirection. */
				if ( reader?.authenticated ) {
					return;
				}
				ev.preventDefault();
				if ( readerActivation.hasAuthLink() ) {
					authLinkMessage.hidden = false;
				} else {
					authLinkMessage.hidden = true;
				}
				form.hidden = false;
				form.style.display = 'flex';
				if ( emailInput ) {
					emailInput.focus();
					emailInput.value = reader?.email || '';
				}
				if ( passwordInput && emailInput.value ) {
					passwordInput.focus();
				}
				redirectInput.value = ev.target.getAttribute( 'href' );
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
			fetch( form.getAttribute( 'action' ) || window.location.pathname, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
				},
				body,
			} )
				.then( res => {
					res.json().then( data => {
						console.log( data );
					} );
				} )
				.catch( err => {
					throw err;
				} )
				.finally( () => {
					submitButton.disabled = false;
				} );
		} );
	} );
} )( window.newspackReaderActivation );

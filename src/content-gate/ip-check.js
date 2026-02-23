/* global jQuery, newspack_ip_access, NewspackContentGateIpCheck */
jQuery( document ).ready( function ( $ ) {
	( 'use strict' );

	// Main object to avoid naming conflicts
	window.NewspackContentGateIpCheck = {
		isModalOpen: false,

		openModal() {
			$( '#newspack-signin-ip-login-modal' ).show().attr( 'data-state', 'open' );
			$( 'body' ).addClass( 'newspack-signin-ip-modal-open' );
			this.isModalOpen = true;
		},

		closeModal() {
			$( '#newspack-signin-ip-login-modal' ).attr( 'data-state', 'closed' ).hide();
			$( 'body' ).removeClass( 'newspack-signin-ip-modal-open' );
			this.isModalOpen = false;
			this.resetModalState();
		},

		resetModalState() {
			$( '#newspack-signin-ip-login-message' ).removeClass( 'success error' ).empty();
			$( '#newspack-signin-ip-spinner' ).show();
			$( '#newspack-signin-ip-button' ).hide();
		},

		showSpinner() {
			$( '#newspack-signin-ip-spinner' ).show();
			this.showLoginMessage( '', 'Checking IP…' );
		},

		hideSpinner() {
			$( '#newspack-signin-ip-spinner' ).hide();
		},

		// Function to create a cookie with TTL of 3 hours
		createCookie( name, value, hours ) {
			let expires = '';
			if ( hours ) {
				const date = new Date();
				date.setTime( date.getTime() + hours * 60 * 60 * 1000 );
				expires = '; expires=' + date.toUTCString();
			}
			document.cookie = name + '=' + value + expires + '; path=/';
		},

		showLoginMessage( type, message ) {
			const $msg = $( '#newspack-signin-ip-login-message' );
			$msg.removeClass( 'success error' );
			if ( type ) {
				$msg.addClass( type );
			}
			$msg.html( '<p>' + message + '</p>' );
		},

		checkIpAccess() {
			const self = this;

			// Open modal with loading state.
			self.openModal();
			self.showSpinner();
			self.showLoginMessage( '', 'Checking IP…' );
			$( '#newspack-signin-ip-button' ).hide();

			$.ajax( {
				url: newspack_ip_access.ajax_url,
				type: 'POST',
				data: {
					action: 'newspack_content_gate_check_ip',
				},
				dataType: 'json',
				success( response ) {
					self.hideSpinner();

					if ( response && response.valid_ip ) {
						self.createCookie( newspack_ip_access.cookie_name, '1', 3 );
						self.showLoginMessage( 'success', 'Your IP has been verified. You have access to our content.' );
						$( '#newspack-signin-ip-button' ).show();
					} else {
						self.showLoginMessage( 'error', 'Sorry, your IP does not give you access to our content.' );
					}
				},
				error() {
					self.hideSpinner();
					self.showLoginMessage( 'error', 'An error occurred while checking your IP. Please try again.' );
				},
			} );
		},

		// Initialize event handlers
		init() {
			// Bind click events to buttons with href="#login-ip"
			$( document ).on(
				'click',
				'a[href="#login-ip"]',
				function ( e ) {
					e.preventDefault();
					this.checkIpAccess();
				}.bind( this )
			);

			// Bind modal close events
			$( document ).on(
				'click',
				'.newspack-signin-ip-modal-close, .newspack-ui__modal-container__overlay',
				function ( e ) {
					e.preventDefault();
					this.closeModal();
				}.bind( this )
			);

			// Bind continue button click — just reload, no cookie.
			$( document ).on(
				'click',
				'#newspack-signin-ip-button',
				function ( e ) {
					e.preventDefault();
					window.location.reload();
				}.bind( this )
			);
		},
	};

	// Initialize the functionality
	NewspackContentGateIpCheck.init();

	// Expose the checkIpAccess function globally for backward compatibility
	window.checkIpAccess = function () {
		NewspackContentGateIpCheck.checkIpAccess();
	};
} );

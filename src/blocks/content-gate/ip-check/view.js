/* globals newspack_ip_check_block */

/**
 * Internal dependencies
 */
import { domReady } from '../../../utils';

domReady( () => {
	if ( typeof newspack_ip_check_block === 'undefined' ) {
		return;
	}

	const block = document.querySelector( '.newspack-content-gate-ip-check-block' );
	if ( ! block ) {
		return;
	}

	const successUrl = block.dataset.successUrl;
	const failureUrl = block.dataset.failureUrl;
	const messageEl = block.querySelector( '.newspack-signin-ip-login-message' );
	const buttonEl = block.querySelector( '.newspack-signin-ip-button' );

	function showMessage( type, text ) {
		if ( ! messageEl ) {
			return;
		}
		messageEl.className = 'newspack-signin-ip-login-message';
		if ( type ) {
			messageEl.classList.add( type );
		}
		messageEl.innerHTML = '<p>' + text + '</p>';
	}

	function createCookie( name, value, hours ) {
		let expires = '';
		if ( hours ) {
			const date = new Date();
			date.setTime( date.getTime() + hours * 60 * 60 * 1000 );
			expires = '; expires=' + date.toUTCString();
		}
		document.cookie = name + '=' + value + expires + '; path=/';
	}

	// Hide button initially, show loading state.
	if ( buttonEl ) {
		buttonEl.style.display = 'none';
	}
	showMessage( '', 'Checking IP…' );

	// Perform AJAX IP check.
	const formData = new FormData();
	formData.append( 'action', 'newspack_content_gate_check_ip' );

	fetch( newspack_ip_check_block.ajax_url, {
		method: 'POST',
		body: formData,
	} )
		.then( response => response.json() )
		.then( data => {
			if ( data && data.valid_ip ) {
				createCookie( newspack_ip_check_block.cookie_name, '1', 3 );
				showMessage( 'success', 'Your IP has been verified. You have access to our content.' );
				if ( buttonEl ) {
					buttonEl.style.display = '';
				}
				if ( successUrl ) {
					setTimeout( () => {
						window.location.href = successUrl;
					}, 1500 );
				}
			} else {
				showMessage( 'error', 'Sorry, your IP does not give you access to our content.' );
				if ( failureUrl ) {
					setTimeout( () => {
						window.location.href = failureUrl;
					}, 1500 );
				}
			}
		} )
		.catch( () => {
			showMessage( 'error', 'An error occurred while checking your IP. Please try again.' );
		} );
} );

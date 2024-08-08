/**
 * Internal dependencies.
 */
import { domReady } from '../utils';

domReady( function () {
	/**
	 * OTP Input
	 */
	const otpInputs = document.querySelectorAll( 'input[name="otp_code"]' );
	otpInputs.forEach( originalInput => {
		const length = parseInt( originalInput.getAttribute( 'maxlength' ) );
		if ( ! length ) {
			return;
		}
		const inputContainer = originalInput.parentNode;
		inputContainer.removeChild( originalInput );
		const values = [];
		const otpCodeInput = document.createElement( 'input' );
		otpCodeInput.setAttribute( 'type', 'hidden' );
		otpCodeInput.setAttribute( 'name', 'otp_code' );
		inputContainer.appendChild( otpCodeInput );
		for ( let i = 0; i < length; i++ ) {
			const digit = document.createElement( 'input' );
			digit.setAttribute( 'type', 'text' );
			digit.setAttribute( 'maxlength', '1' );
			digit.setAttribute( 'pattern', '[0-9]' );
			digit.setAttribute( 'autocomplete', 'off' );
			digit.setAttribute( 'inputmode', 'numeric' );
			digit.setAttribute( 'data-index', i );
			digit.addEventListener( 'keydown', ev => {
				const prev = inputContainer.querySelector( `[data-index="${ i - 1 }"]` );
				const next = inputContainer.querySelector( `[data-index="${ i + 1 }"]` );
				switch ( ev.key ) {
					case 'Backspace':
						ev.preventDefault();
						ev.target.value = '';
						if ( prev ) {
							prev.focus();
						}
						values[ i ] = '';
						otpCodeInput.value = values.join( '' );
						break;
					case 'ArrowLeft':
						ev.preventDefault();
						if ( prev ) {
							prev.focus();
						}
						break;
					case 'ArrowRight':
						ev.preventDefault();
						if ( next ) {
							next.focus();
						}
						break;
					default:
						if ( ev.key.match( /^[0-9]$/ ) ) {
							ev.preventDefault();
							ev.target.value = ev.key;
							ev.target.dispatchEvent(
								new Event( 'input', {
									bubbles: true,
									cancelable: true,
								} )
							);
							if ( next ) {
								next.focus();
							}
						}
						break;
				}
			} );
			digit.addEventListener( 'input', ev => {
				if ( ev.target.value.match( /^[0-9]$/ ) ) {
					values[ i ] = ev.target.value;
				} else {
					ev.target.value = '';
				}
				otpCodeInput.value = values.join( '' );
			} );
			digit.addEventListener( 'paste', ev => {
				ev.preventDefault();
				const paste = ( ev.clipboardData || window.clipboardData ).getData( 'text' );
				if ( paste.length !== length ) {
					return;
				}
				for ( let j = 0; j < length; j++ ) {
					if ( paste[ j ].match( /^[0-9]$/ ) ) {
						const digitInput = inputContainer.querySelector( `[data-index="${ j }"]` );
						digitInput.value = paste[ j ];
						values[ j ] = paste[ j ];
					}
				}
				otpCodeInput.value = values.join( '' );
			} );
			inputContainer.appendChild( digit );
		}
	} );
} );

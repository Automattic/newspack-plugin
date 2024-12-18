/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { domReady } from '../../utils';
import './style.scss';

domReady( () => {
	// Handle admin metabox for article corrections.
	const metaboxContainer = document.querySelector( '.corrections-metabox-container' );
	if ( metaboxContainer ) {
		metaboxContainer.querySelector( 'button.add-correction' ).addEventListener( 'click', () => {
			const existingCorrections = metaboxContainer.querySelector( '.existing-corrections' );
			const newCorrection = document.createElement( 'div' );
			newCorrection.classList.add( 'reveal-correction' );
			newCorrection.innerHTML = `
				<p>${ __( 'Article Correction', 'newspack-plugin' ) }</p>
				<textarea name="reveal_correction[]" rows="3" cols="60"></textarea>
				<br/>
				<p>${ __( 'Date:', 'newspack-plugin' ) } <input type="date" name="reveal_correction_date[]"></p>
				<span class="delete-correction">X</span>
			`;
			existingCorrections.appendChild( newCorrection );
			newCorrection.querySelector( 'span.delete-correction' ).addEventListener( 'click', () => {
				newCorrection.remove();
			} );
		} );
	}
} );


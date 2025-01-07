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
		// Handle deletion of existing corrections.
		metaboxContainer.querySelectorAll( '.existing-corrections button.delete-correction' )
			.forEach( button => {
				button.addEventListener( 'click', e => {
					// Get the partent .correction element.
					const correction = e.target.closest( '.correction' );
					if ( correction ) {
						correction.remove();
						const correctionId = correction.getAttribute( 'name' ).replace( 'existing-corrections[', '' ).replace( ']', '' );
						if ( correctionId ) {
							const deletedCorrections = metaboxContainer.querySelector( '.deleted-corrections' );
							const deletedCorrection = document.createElement( 'input' );
							deletedCorrection.type = 'hidden';
							deletedCorrection.name = 'deleted-corrections[]';
							deletedCorrection.value = correctionId;
							deletedCorrections.appendChild( deletedCorrection );
						}
					}
				} );
			} );
		// Handle addition of new corrections.
		let newCorrectionsCount = 0;
		metaboxContainer.querySelector( 'button.add-correction' ).addEventListener( 'click', () => {
			const newCorrections = metaboxContainer.querySelector( '.new-corrections' );
			const newCorrection = document.createElement( 'div' );
			newCorrection.classList.add( 'correction' );
			newCorrection.innerHTML = `
				<fieldset name="new-corrections[${newCorrectionsCount}]">
				<p>${ __( 'Article Correction', 'newspack-plugin' ) }</p>
				<textarea name="new-corrections[${newCorrectionsCount}][content]" rows="3" cols="60"></textarea>
				<br/>
				<p>${ __( 'Date:', 'newspack-plugin' ) } <input type="date" name="new-corrections[${newCorrectionsCount}][date]"></p>
				<button class="delete-correction">X</button>
				</fieldset>
			`;
			newCorrections.appendChild( newCorrection );
			newCorrection.querySelector( 'button.delete-correction' ).addEventListener( 'click', () => {
				newCorrection.remove();
			} );
			newCorrectionsCount++;
		} );
	}
} );


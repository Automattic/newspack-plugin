/**
 * Global functions for My Account pages.
 */

/**
 * Internal dependencies.
 */
import { domReady } from '../../utils';

domReady( () => {
	const interactionElements = [
		'.newspack-ui--block-on-interaction',
		'.newspack-ui__modal__content button[type="submit"]:not(.newspack-ui__modal__close)',
		'.newspack-ui__dropdown__content a',

	];
	const blockUIonInteraction = [ ...document.querySelectorAll( interactionElements.join( ',' ) ) ];
	blockUIonInteraction.forEach( element => {
		element.addEventListener( 'click', e => {
			const parent = e.target.closest( 'form, div' );
			if ( parent ) {
				parent.classList.add( 'newspack-ui--loading' );
			}
		} );
	} );
} );

/**
 * JS for custom My Account nav menu UI.
 */

/**
 * Internal dependencies.
 */
import { domReady } from '../../utils';

domReady( () => {
	// Open and close navigation menu.
	const openNavigationButton = document.querySelector( '.newspack-my-account__icon-button--open-navigation' );
	const closeNavigationButton = document.querySelector( '.newspack-my-account__icon-button--close-navigation' );
	if ( openNavigationButton ) {
		openNavigationButton.addEventListener( 'click', () => {
			document.body.classList.add( 'navigation-open' );
		} );
	}
	if ( closeNavigationButton ) {
		closeNavigationButton.addEventListener( 'click', () => {
			document.body.classList.remove( 'navigation-open' );
		} );
	}
} );

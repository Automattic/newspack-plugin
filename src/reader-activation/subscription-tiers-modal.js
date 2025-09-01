import { domReady } from '../utils';

domReady( () => {
	const modal = document.getElementById( 'newspack__subscription-tiers' );
	if ( modal ) {
		modal.setAttribute( 'data-state', 'open' );
		const cancelButton = modal.querySelector( '.newspack-ui__modal__cancel' );
		if ( cancelButton ) {
			cancelButton.addEventListener( 'click', () => {
				modal.setAttribute( 'data-state', 'closed' );
			} );
		}
	}
} );

import { domReady } from './utils';

domReady( function () {
	// Create a MutationObserver to watch for class changes.
	const observer = new MutationObserver( mutations => {
		mutations.forEach( mutation => {
			const element = mutation.target;
			if ( mutation.type === 'attributes' && mutation.attributeName === 'class' && element.classList.contains( 'active' ) ) {
				if ( element.dataset.autohide === 'false' ) {
					appendCloseButton( element );
					return;
				}
				// Set timeout to remove active class after 5 seconds.
				setTimeout( () => {
					element.classList.remove( 'active' );
				}, 5000 );
			}
		} );
	} );

	// Start observing all snackbar elements.
	const snackbars = [ ...document.querySelectorAll( '.newspack-ui__snackbar__item' ) ];
	snackbars.forEach( snackbar => {
		observer.observe( snackbar, {
			attributes: true,
			attributeFilter: [ 'class' ],
		} );
		if ( snackbar.dataset.activeOnLoad === 'true' ) {
			snackbar.classList.add( 'active' );
		}
	} );
} );

function appendCloseButton( element ) {
	const closeButton = document.createElement( 'button' );
	closeButton.classList.add( 'newspack-ui__snackbar__close' );
	closeButton.innerHTML = 'Close';
	element.appendChild( closeButton );
	closeButton.addEventListener( 'click', () => {
		element.classList.remove( 'active' );
	} );
}

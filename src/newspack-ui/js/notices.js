import { domReady } from './utils';

domReady( function () {
	// Create a MutationObserver to watch for class changes.
	const observer = new MutationObserver( mutations => {
		mutations.forEach( mutation => {
			if (
				mutation.type === 'attributes' &&
				mutation.attributeName === 'class' &&
				mutation.target.classList.contains( 'newspack-ui__snackbar' ) &&
				mutation.target.classList.contains( 'active' )
			) {
				// Set timeout to remove active class after 5 seconds.
				setTimeout( () => {
					mutation.target.classList.remove( 'active' );
				}, 5000 );
			}
		} );
	} );

	// Start observing all snackbar elements.
	const snackbars = [ ...document.querySelectorAll( '.newspack-ui__snackbar' ) ];
	snackbars.forEach( snackbar => {
		observer.observe( snackbar, {
			attributes: true,
			attributeFilter: [ 'class' ],
		} );
		if ( snackbar.classList.contains( 'active-on-load' ) ) {
			snackbar.classList.add( 'active' );
		}
	} );
} );

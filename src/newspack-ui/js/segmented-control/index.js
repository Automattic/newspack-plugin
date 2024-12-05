import { domReady } from '../utils'; // Global utils.

domReady( function () {
	function segmented_control( element ) {
		const header = element.querySelector( '.newspack-ui__segmented-control__tabs' );
		const tab_headers = [ ...header.children ];
		const tab_body = element.querySelector( '.newspack-ui__segmented-control__content' );
		let tab_contents = [];

		if ( null !== tab_body ) {
			tab_contents = [ ...tab_body.children ];
		}

		tab_headers.forEach( ( tab, i ) => {
			if ( tab_contents.length !== 0 && tab.classList.contains( 'selected' ) ) {
				tab_contents[ i ].classList.add( 'selected' );
			}

			tab.addEventListener( 'click', function () {
				tab_headers.forEach( t => t.classList.remove( 'selected' ) );
				this.classList.add( 'selected' );

				if ( tab_contents.length !== 0 ) {
					tab_contents.forEach( content => content.classList.remove( 'selected' ) );
					tab_contents[ i ].classList.add( 'selected' );
				}
			} );
		} );
	}

	[ ...document.querySelectorAll( '.newspack-ui__segmented-control' ) ].forEach( x =>
		segmented_control( x )
	);
} );

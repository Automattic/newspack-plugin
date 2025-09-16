import { domReady } from '../utils'; // Global utils.

domReady( function () {
	function segmented_control( element ) {
		const header = element.querySelector( '.newspack-ui__segmented-control__tabs' );
		const tab_body = element.querySelector( '.newspack-ui__segmented-control__content' );

		let tab_contents = [];
		if ( tab_body ) {
			tab_contents = [ ...tab_body.children ];
		}

		/**
		 * If no header is present, add the selected class to the
		 * first tab content and bail.
		 */
		if ( ! header && tab_contents.length ) {
			tab_contents[ 0 ].classList.add( 'selected' );
			return;
		}

		const tab_headers = [ ...header.children ];

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

					const radioInputs = tab_contents[ i ].querySelectorAll( 'input[type="radio"]' );
					const checkedRadio = [ ...radioInputs ].find( radio => radio.checked );

					if ( radioInputs.length && ! checkedRadio ) {
						radioInputs[ 0 ].click();
					}
				}
			} );
		} );
	}

	[ ...document.querySelectorAll( '.newspack-ui__segmented-control' ) ].forEach( x => segmented_control( x ) );
} );

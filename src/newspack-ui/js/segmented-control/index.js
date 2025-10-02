import { domReady } from '../utils'; // Global utils.

domReady( function () {
	function segmented_control( element ) {
		const tab_body = element.querySelector( '.newspack-ui__segmented-control__content' );
		let tab_contents = [];
		if ( tab_body ) {
			tab_contents = [ ...tab_body.children ];
		}

		/**
		 * Look for header tabs or immediate select control.
		 *
		 * If neither are found, add the selected class to the
		 * first tab content and bail.
		 */
		const header = element.querySelector( '.newspack-ui__segmented-control__tabs' );
		const select = element.querySelector( '.newspack-ui__segmented-control > select' );
		if ( ! header && ! select && tab_contents.length ) {
			tab_contents[ 0 ].classList.add( 'selected' );
			return;
		}

		const tab_headers = header ? [ ...header.children ] : [ select ];

		const select_content = index => {
			if ( tab_contents.length === 0 ) {
				return;
			}

			// First, restore any previously removed tab contents
			if ( tab_body._removedContents ) {
				tab_body._removedContents.forEach( ( { content, nextSibling } ) => {
					if ( nextSibling ) {
						tab_body.insertBefore( content, nextSibling );
					} else {
						tab_body.appendChild( content );
					}
				} );
				delete tab_body._removedContents;
			}

			// Remove all tab contents except the selected one
			const selectedContent = tab_contents[ index ];
			const removedContents = [];

			tab_contents.forEach( ( content, i ) => {
				if ( i !== index ) {
					removedContents.push( { content, nextSibling: content.nextSibling } );
					content.remove();
				}
			} );

			// Store removed contents for restoration
			if ( removedContents.length > 0 ) {
				tab_body._removedContents = removedContents;
			}

			// Add selected class to the remaining content
			selectedContent.classList.add( 'selected' );

			const radioInputs = selectedContent.querySelectorAll( 'input[type="radio"]' );
			const checkedRadio = [ ...radioInputs ].find( radio => radio.checked );

			if ( radioInputs.length && ! checkedRadio ) {
				radioInputs[ 0 ].click();
			}
			element.dispatchEvent( new CustomEvent( 'content-selected', { detail: selectedContent } ) );
		};

		tab_headers.forEach( ( tab, i ) => {
			if ( tab_contents.length === 0 ) {
				return;
			}

			if ( tab.tagName === 'SELECT' ) {
				tab.classList.add( 'selected' );
				select_content( parseInt( tab.value ) );
				tab.addEventListener( 'change', function ( ev ) {
					select_content( parseInt( ev.target.value ) );
				} );
				return;
			}

			if ( tab.classList.contains( 'selected' ) ) {
				select_content( i );
			}

			tab.addEventListener( 'click', function () {
				tab_headers.forEach( t => t.classList.remove( 'selected' ) );
				this.classList.add( 'selected' );
				select_content( i );
			} );
		} );
	}

	[ ...document.querySelectorAll( '.newspack-ui__segmented-control' ) ].forEach( x => segmented_control( x ) );
} );

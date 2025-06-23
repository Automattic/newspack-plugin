import { domReady } from './utils';

domReady( function () {
	const notices = [ ...document.querySelectorAll( '.newspack-ui__snackbar__item' ) ];
	notices.forEach( notice => {
		if ( notice.dataset.activeOnLoad === 'true' ) {
			openNotice( notice );
		}
		const interactiveElements = notice.querySelectorAll( 'a, button' );
		[ ...interactiveElements ].forEach( element => {
			element.addEventListener( 'click', () => {
				closeNotice( notice );
			} );
		} );
	} );
} );

/**
 * Open a notice.
 *
 * @param {Element} element - The notice element.
 */
function openNotice( element ) {
	element.classList.add( 'active' );
	if ( element.dataset.autohide !== 'false' ) {
		setTimeout( () => {
			closeNotice( element );
		}, 5000 );
	}
}

/**
 * Close a notice.
 *
 * @param {Element} element - The notice element.
 */
function closeNotice( element ) {
	element.classList.remove( 'active' );
	setTimeout( () => {
		element.remove();
	}, 125 );
	wp.ajax.send( 'newspack_ui_notice_dismissed', {
		data: {
			id: element.dataset.noticeId,
			nonce: element.dataset.nonce,
		},
	} );
}

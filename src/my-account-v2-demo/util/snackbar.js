/**
 * Shared snackbar helper for the my-account-v2-demo prototype screens.
 *
 * Extracted on the third caller (Phase 5 modals) per the cross-phase devlog
 * rule-of-three. Newsletters / donations / subscriptions used to each carry
 * a private copy; they now import from here.
 *
 * Renders newspack-ui's snackbar markup directly rather than going through
 * `newspackUI.notices.openNotice`: that helper posts an AJAX dismissal with
 * a server-issued nonce we don't have in the demo, so routing through it
 * would fire a 403 admin-ajax request on every toast.
 */

const SNACKBAR_LIFETIME_MS = 5000;
const SNACKBAR_FADEOUT_MS = 300;

/**
 * Lazily create a top-right snackbar container if the page has none yet.
 * On a fresh request with no PHP-rendered notices, the snackbar markup is
 * absent and the toast needs somewhere to live.
 *
 * @return {HTMLElement} Snackbar container element.
 */
function ensureSnackbarContainer() {
	let container = document.querySelector( '.newspack-ui__snackbar--top-right' );
	if ( container ) {
		return container;
	}
	const wrap = document.createElement( 'div' );
	wrap.className = 'newspack-ui';
	container = document.createElement( 'div' );
	container.className = 'newspack-ui__snackbar newspack-ui__snackbar--top-right';
	wrap.appendChild( container );
	document.body.appendChild( wrap );
	return container;
}

/**
 * Show a transient snackbar.
 *
 * @param {string} message Pre-translated message copy.
 * @param {string} type    'success' | 'error' (default 'success').
 */
export function snackbar( message, type = 'success' ) {
	const container = ensureSnackbarContainer();
	const item = document.createElement( 'div' );
	item.className = `newspack-ui__snackbar__item newspack-ui__snackbar__item--${ type } active`;
	item.dataset.autohide = 'true';
	item.setAttribute( 'role', 'status' );
	item.setAttribute( 'aria-live', 'polite' );
	const content = document.createElement( 'div' );
	content.className = 'newspack-ui__snackbar__content';
	content.textContent = message;
	item.appendChild( content );
	container.appendChild( item );

	window.setTimeout( () => {
		item.classList.remove( 'active' );
		// Give the CSS transition time to finish before detaching.
		window.setTimeout( () => {
			if ( item.parentNode ) {
				item.parentNode.removeChild( item );
			}
		}, SNACKBAR_FADEOUT_MS );
	}, SNACKBAR_LIFETIME_MS );
}

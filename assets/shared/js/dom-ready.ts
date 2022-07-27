/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dom-ready/
 */
const domReady = ( callback: () => void ): void => {
	if ( typeof document === 'undefined' ) {
		return;
	}

	const htmlElement = document.querySelector( 'html' );
	if ( ! htmlElement ) {
		return;
	}
	const isAMP = Boolean( htmlElement.getAttribute( 'amp-version' ) );
	if ( isAMP ) {
		// In AMP environment, wait for the 'complete' event. Otherwise AMP might do DOM manipulations
		// after the event listeners are attached.
		document.addEventListener( 'readystatechange', () => {
			if ( document.readyState === 'complete' ) {
				callback();
			}
		} );
		return;
	}

	if (
		document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
		document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
	) {
		return void callback();
	}
	// DOMContentLoaded has not fired yet, delay callback until then.
	document.addEventListener( 'DOMContentLoaded', callback );
};

export default domReady;

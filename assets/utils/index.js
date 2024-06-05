/**
 * Specify a function to execute when the DOM is fully loaded.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dom-ready/
 *
 * @param {Function} callback A function to execute after the DOM is ready.
 * @return {void}
 */
export function domReady( callback ) {
	if ( typeof document === 'undefined' ) {
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
}

/**
 * Format time in MM:SS format.
 *
 * @param {number} time Time in seconds.
 */
export function formatTime( time ) {
	const minutes = Math.floor( time / 60 );
	const seconds = time % 60;
	return `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
}

/**
 * Converts FormData into an object.
 *
 * @param {FormData} formData       The form data to convert.
 * @param {Array}    includedFields Form fields to include.
 *
 * @return {Object} The converted form data.
 */
export function convertFormDataToObject( formData, includedFields = [] ) {
	return Array.from( formData.entries() ).reduce( ( acc, [ key, val ] ) => {
		if ( ! includedFields.includes( key ) ) {
			return acc;
		}
		if ( key.indexOf( '[]' ) > -1 ) {
			key = key.replace( '[]', '' );
			acc[ key ] = acc[ key ] || [];
			acc[ key ].push( val );
		} else {
			acc[ key ] = val;
		}
		return acc;
	}, {} );
}

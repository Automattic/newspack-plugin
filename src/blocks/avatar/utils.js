/**
 * Compute an SVG overlap mask CSS custom property for non-circular border radii.
 * Returns a style object with --overlap-mask, or empty object for circular/default.
 *
 * @param {Object} attrs Block attributes.
 * @return {Object} Style object to spread onto the block wrapper.
 */
export const getOverlapMaskStyle = attrs => {
	const className = attrs.className || '';
	if ( ! className.includes( 'is-style-overlapped' ) ) {
		return {};
	}

	let radius = attrs?.style?.border?.radius;
	if ( ! radius ) {
		return {};
	}

	// Per-corner object: use the value if all corners are the same.
	if ( typeof radius === 'object' ) {
		const values = Object.values( radius );
		if ( new Set( values ).size === 1 ) {
			radius = values[ 0 ];
		} else {
			return {};
		}
	}

	if ( typeof radius !== 'string' || radius === '50%' ) {
		return {};
	}

	const size = attrs.size || 48;
	let rx;

	if ( radius.endsWith( 'px' ) ) {
		rx = ( parseFloat( radius ) / size ) * 100;
	} else if ( radius.endsWith( '%' ) ) {
		rx = parseFloat( radius );
	} else if ( radius.endsWith( 'rem' ) || radius.endsWith( 'em' ) ) {
		// Approximate em/rem using the 16px browser default base font size.
		rx = ( ( parseFloat( radius ) * 16 ) / size ) * 100;
	} else {
		rx = ( parseFloat( radius ) / size ) * 100;
	}

	rx = Math.round( Math.max( 0, Math.min( 50, rx ) ) * 100 ) / 100;

	const svg =
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
		`<defs><mask id='m'><rect width='100' height='100' fill='white'/>` +
		`<rect x='75' y='0' width='100' height='100' rx='${ rx }' ry='${ rx }' fill='black'/>` +
		`</mask></defs>` +
		`<rect width='100' height='100' fill='white' mask='url(#m)'/>` +
		`</svg>`;

	return {
		'--overlap-mask': `url("data:image/svg+xml,${ encodeURIComponent( svg ) }")`,
	};
};

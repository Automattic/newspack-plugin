const SVG_SIZE = 100;

// How much the next avatar overlaps into the current one (fraction of avatar
// size). Keep in sync with style.scss and class-avatar-block.php.
const OVERLAP_FRACTION = 0.175;

// The SVG mask cutout starts at this x position. The difference between the
// cutout width and the overlap is the visible separator.
const CUTOUT_X = 75;
const OVERLAP_GAP = SVG_SIZE - CUTOUT_X - OVERLAP_FRACTION * SVG_SIZE; // 7.5

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

	if ( radius.endsWith( '%' ) ) {
		rx = parseFloat( radius );
	} else if ( radius.endsWith( 'rem' ) || radius.endsWith( 'em' ) ) {
		// Approximate em/rem using the 16px browser default base font size.
		rx = ( ( parseFloat( radius ) * 16 ) / size ) * SVG_SIZE;
	} else {
		// px or plain number: convert to SVG scale.
		rx = ( parseFloat( radius ) / size ) * SVG_SIZE;
	}

	// Clamp rx between 0 and half the viewBox, then round to 2 decimals.
	rx = Math.round( Math.max( 0, Math.min( SVG_SIZE / 2, rx - OVERLAP_GAP ) ) * 100 ) / 100;

	const svg =
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${ SVG_SIZE } ${ SVG_SIZE }'>` +
		`<defs><mask id='m'><rect width='${ SVG_SIZE }' height='${ SVG_SIZE }' fill='white'/>` +
		`<rect x='${ CUTOUT_X }' y='0' width='${ SVG_SIZE }' height='${ SVG_SIZE }' rx='${ rx }' ry='${ rx }' fill='black'/>` +
		`</mask></defs>` +
		`<rect width='${ SVG_SIZE }' height='${ SVG_SIZE }' fill='white' mask='url(#m)'/>` +
		`</svg>`;

	return {
		'--overlap-mask': `url("data:image/svg+xml,${ encodeURIComponent( svg ) }")`,
	};
};

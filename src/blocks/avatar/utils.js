/**
 * Compute an SVG overlap mask CSS custom property for non-circular border radii.
 * Returns a style object with --overlap-mask, or empty object for circular/default.
 *
 * @param {Object} attrs Block attributes.
 * @return {Object} Style object to spread onto the block wrapper.
 */
const SVG_SIZE = 100;
const CUTOUT_X = 75;
const CUTOUT_SCALE = 1.05;

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
	rx = Math.round( Math.max( 0, Math.min( SVG_SIZE / 2, rx ) ) * 100 ) / 100;
	const inflateHalf = ( SVG_SIZE * ( CUTOUT_SCALE - 1 ) ) / 2;
	const cutoutSize = SVG_SIZE * CUTOUT_SCALE;
	const cutoutX = CUTOUT_X - inflateHalf;
	const cutoutY = -inflateHalf;
	const cutoutRx = Math.round( Math.max( 0, Math.min( cutoutSize / 2, rx ) ) * 100 ) / 100;

	const svg =
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${ SVG_SIZE } ${ SVG_SIZE }'>` +
		`<defs><mask id='m'><rect width='${ SVG_SIZE }' height='${ SVG_SIZE }' fill='white'/>` +
		`<rect x='${ cutoutX }' y='${ cutoutY }' width='${ cutoutSize }' height='${ cutoutSize }' rx='${ cutoutRx }' ry='${ cutoutRx }' fill='black'/>` +
		`</mask></defs>` +
		`<rect width='${ SVG_SIZE }' height='${ SVG_SIZE }' fill='white' mask='url(#m)'/>` +
		`</svg>`;

	return {
		'--overlap-mask': `url("data:image/svg+xml,${ encodeURIComponent( svg ) }")`,
	};
};

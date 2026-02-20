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

	let radius = attrs?.style?.border?.radius ?? '100%';

	// Per-corner object: use the value if all corners are the same.
	if ( typeof radius === 'object' ) {
		const values = Object.values( radius );
		if ( new Set( values ).size === 1 ) {
			radius = values[ 0 ];
		} else {
			return {};
		}
	}

	if ( typeof radius !== 'string' ) {
		return {};
	}

	const avatarSize = attrs.size || 48;
	const svgSize = avatarSize * 1.1;
	const offset = ( svgSize - avatarSize ) / 2;
	let radiusPx;

	if ( radius.endsWith( '%' ) ) {
		radiusPx = ( parseFloat( radius ) / 100 ) * avatarSize;
	} else if ( radius.endsWith( 'rem' ) || radius.endsWith( 'em' ) ) {
		// Approximate em/rem using the 16px browser default base font size.
		radiusPx = parseFloat( radius ) * 16;
	} else {
		// px or plain number.
		radiusPx = parseFloat( radius );
	}

	if ( Number.isNaN( radiusPx ) ) {
		return {};
	}

	// Offset the rounded rectangle equally on all sides for a border-like shape.
	const cutoutRx = Math.round(
		Math.max( 0, Math.min( svgSize / 2, radiusPx + offset ) ) * 100
	) / 100;

	const svg =
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${ avatarSize } ${ avatarSize }'>` +
		`<defs><mask id='m'><rect width='${ avatarSize }' height='${ avatarSize }' fill='white'/>` +
		`<rect x='${ avatarSize * 0.75 - offset }' y='${ -offset }' width='${ svgSize }' height='${ svgSize }' rx='${ cutoutRx }' ry='${ cutoutRx }' fill='black'/>` +
		`</mask></defs>` +
		`<rect width='${ avatarSize }' height='${ avatarSize }' fill='white' mask='url(#m)'/>` +
		`</svg>`;

	return {
		'--overlap-mask': `url("data:image/svg+xml,${ encodeURIComponent( svg ) }")`,
	};
};

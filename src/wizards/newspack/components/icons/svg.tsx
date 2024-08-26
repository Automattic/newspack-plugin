/**
 * Newspack Dashboard Icons, Block-Post-Date
 */

/**
 * WordPress dependencies
 */
import { SVG } from '@wordpress/primitives';

function wizardSvg( { children, ...props }: any ) {
	return (
		<SVG { ...props } onPointerEnterCapture={ undefined } onPointerLeaveCapture={ undefined }>
			{ children }
		</SVG>
	);
}

export default wizardSvg;

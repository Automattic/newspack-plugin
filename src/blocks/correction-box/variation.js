/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M4 14.5H20V16H4V14.5ZM4 20H13V18.5H4V20ZM12 5.9L10.1 4L4.7 9.4L4.1 12L6.7 11.4L12.1 6L12 5.9Z" />
	</SVG>
);

/**
 * The Correction Box block variations.
 *
 * @type {WPBlockVariation[]}
 */
const variations = [
	{
		name: 'newspack/top-correction-box',
		title: __( 'Top Corrections Box', 'newspack-plugin' ),
		icon: {
			src: icon,
			foreground: '#668bc9',
		},
		keywords: [ __( 'Top', 'newspack-plugin' ), __( 'Corrections', 'newspack-plugin' ), __( 'clarifications', 'newspack-plugin' ), __( 'updates', 'newspack-plugin' ) ],
		attributes: { location: 'top' },
		description: __( 'Display corrections whose location is set to "Top".', 'newspack-plugin' ),
	},
	{
		name: "newspack/bottom-correction-box",
		title: __( 'Bottom Corrections Box', 'newspack-plugin' ),
		icon: {
			src: icon,
			foreground: '#668bc9',
		},
		keywords: [ __( 'Bottom', 'newspack-plugin' ), __( 'Corrections', 'newspack-plugin' ), __( 'clarifications', 'newspack-plugin' ), __( 'updates', 'newspack-plugin' ) ],
		attributes: { location: 'bottom' },
		description: __( 'Display corrections whose location is set to "Bottom".', 'newspack-plugin' ),
	}
];

export default variations;

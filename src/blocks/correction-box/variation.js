/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const topCorrectionsIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M4 14.5H20V16H4V14.5ZM4 20H13V18.5H4V20ZM12 5.9L10.1 4L4.7 9.4L4.1 12L6.7 11.4L12.1 6L12 5.9Z" />
		<Path d="M16 7L20 3L24 7" stroke="#406ebc" stroke-width="1.5" fill="none"/>
	</SVG>
);

export const bottomCorrectionsIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M4 14.5H20V16H4V14.5ZM4 20H13V18.5H4V20ZM12 5.9L10.1 4L4.7 9.4L4.1 12L6.7 11.4L12.1 6L12 5.9Z" />
		<Path d="M16 3L20 7L24 3" stroke="#406ebc" stroke-width="1.5" fill="none"/>
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
			src: topCorrectionsIcon,
			foreground: '#406ebc',
		},
		keywords: [ __( 'Top', 'newspack-plugin' ), __( 'Corrections', 'newspack-plugin' ), __( 'clarifications', 'newspack-plugin' ), __( 'updates', 'newspack-plugin' ) ],
		attributes: { location: 'top' },
		description: __( 'Display corrections whose location is set to "Top".', 'newspack-plugin' ),
		isActive: [ 'location' ],
	},
	{
		name: "newspack/bottom-correction-box",
		title: __( 'Bottom Corrections Box', 'newspack-plugin' ),
		icon: {
			src: bottomCorrectionsIcon,
			foreground: '#406ebc',
		},
		keywords: [ __( 'Bottom', 'newspack-plugin' ), __( 'Corrections', 'newspack-plugin' ), __( 'clarifications', 'newspack-plugin' ), __( 'updates', 'newspack-plugin' ) ],
		attributes: { location: 'bottom' },
		description: __( 'Display corrections whose location is set to "Bottom".', 'newspack-plugin' ),
		isActive: [ 'location' ],
	}
];

export default variations;

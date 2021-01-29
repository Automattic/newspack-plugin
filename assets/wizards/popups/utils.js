/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Check whether the given popup is an overlay.
 *
 * @param {object} popup Popup object to check.
 * @return {boolean} True if the popup is an overlay, otherwise false.
 */
export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

/**
 * Filter out "Uncategorized" category, which for purposes of Campaigns behaves identically to no category.
 *
 * @param {array} categories Array of category objects.
 * @return {array} Filtered array of categories, without Uncategorized category.
 */
export const filterOutUncategorized = categories => {
	return categories.filter( category => 'uncategorized' !== category.slug );
};

export const placementForPopup = ( { options: { frequency, placement } } ) => {
	if ( 'manual' === frequency ) {
		return __( 'Manual Placement', 'newspack' );
	}
	return {
		center: __( 'Center Overlay', 'newspack' ),
		top: __( 'Top Overlay', 'newspack' ),
		bottom: __( 'Bottom Overlay', 'newspack' ),
		inline: __( 'Inline', 'newspack' ),
		above_header: __( 'Above Header', 'newspack' ),
	}[ placement ];
};

const frequencyMap = {
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page', 'newspack' ),
	manual: __( 'Manual Placement', 'newspack' ),
};

export const frequenciesForPopup = popup => {
	return Object.keys( frequencyMap )
		.filter( key => ! ( 'always' === key && isOverlay( popup ) ) )
		.map( key => ( { label: frequencyMap[ key ], value: key } ) );
};

export const frequencyForPopup = ( { options: { frequency } } ) => frequencyMap[ frequency ];

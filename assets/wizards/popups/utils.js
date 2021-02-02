/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Check whether the given popup is an overlay.
 *
 * @param {Object} popup Popup object to check.
 * @return {boolean} True if the popup is an overlay, otherwise false.
 */
export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

/**
 * Check whether the given popup is above-header.
 *
 * @param {object} popup Popup object to check.
 * @return {boolean} True if the popup is a above-header, otherwise false.
 */
export const isAboveHeader = popup => 'above_header' === popup.options.placement;

/**
 * Filter out "Uncategorized" category, which for purposes of Campaigns behaves identically to no category.
 *
 * @param {Array} categories Array of category objects.
 * @return {Array} Filtered array of categories, without Uncategorized category.
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
	always: __( 'Until dismissed', 'newspack' ),
	manual: __( 'Manual Placement', 'newspack' ),
};

export const frequenciesForPopup = popup => {
	return Object.keys( frequencyMap )
		.filter( key => ! ( 'always' === key && isOverlay( popup ) ) )
		.map( key => ( { label: frequencyMap[ key ], value: key } ) );
};

export const getCardClassName = ( { options, sitewide_default: sitewideDefault, status } ) => {
	if ( 'draft' === status || 'pending' === status || 'future' === status ) {
		return 'newspack-card__is-disabled';
	}
	if ( sitewideDefault ) {
		return 'newspack-card__is-primary';
	}
	if ( isOverlay( { options } ) && ! sitewideDefault ) {
		return 'newspack-card__is-disabled';
	}
	return 'newspack-card__is-supported';
};

export const descriptionForPopup = prompt => {
	const {
		categories,
		campaign_groups: campaigns,
		sitewide_default: sitewideDefault,
		status,
	} = prompt;
	const filteredCategories = filterOutUncategorized( categories );
	const descriptionMessages = [];
	if ( campaigns.length > 0 ) {
		const campaignsList = campaigns.map( ( { name } ) => name ).join( ', ' );
		descriptionMessages.push(
			( campaigns.length === 1
				? __( 'Campaign: ', 'newspack' )
				: __( 'Campaigns: ', 'newspack' ) ) + campaignsList
		);
	}
	if ( sitewideDefault ) {
		descriptionMessages.push( __( 'Sitewide default', 'newspack' ) );
	}
	if ( filteredCategories.length > 0 ) {
		descriptionMessages.push(
			__( 'Categories: ', 'newspack' ) +
				filteredCategories.map( category => category.name ).join( ', ' )
		);
	}
	if ( 'pending' === status ) {
		descriptionMessages.push( __( 'Pending review', 'newspack' ) );
	}
	if ( 'future' === status ) {
		descriptionMessages.push( __( 'Scheduled', 'newspack' ) );
	}
	descriptionMessages.push( __( 'Frequency: ', 'newspack' ) + frequencyForPopup( prompt ) );
	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

export const isSameType = ( campaignA, campaignB ) => {
	return (
		( isAboveHeader( campaignA ) && isAboveHeader( campaignB ) ) ||
		( isOverlay( campaignA ) && isOverlay( campaignB ) )
	);
};

export const warningForPopup = ( campaigns, campaign ) => {
	const warningMessages = [];
	if ( 'publish' === campaign.status && ( isAboveHeader( campaign ) || isOverlay( campaign ) ) ) {
		const conflictingCampaigns = campaigns.filter( conflict => {
			const campaignCategories = filterOutUncategorized( campaign.categories );
			const conflictCategories = filterOutUncategorized( conflict.categories );

			// There's a conflict if both campaigns have zero categories, or if they share at least one category.
			const hasConflictingCategory =
				( 0 === campaignCategories.length && 0 === conflictCategories.length ) ||
				0 <
					campaignCategories.filter(
						category =>
							!! conflictCategories.find(
								conflictCategory => category.term_id === conflictCategory.term_id
							)
					).length;

			return (
				'publish' === conflict.status &&
				conflict.id !== campaign.id &&
				isSameType( campaign, conflict ) &&
				campaign.options.selected_segment_id === conflict.options.selected_segment_id &&
				hasConflictingCategory
			);
		} );

		if ( 0 < conflictingCampaigns.length ) {
			warningMessages.push(
				sprintf(
					__(
						'Multiple %s campaigns can’t share the same segment or category filtering.',
						'newspack'
					),
					isAboveHeader( campaign ) ? __( 'above-header', 'newspack' ) : __( 'overlay', 'newspack' )
				)
			);
			warningMessages.push(
				`${ __( 'Conflicts with:', 'newspack' ) } ${ conflictingCampaigns
					.map( a => a.title )
					.join( ', ' ) }`
			);
		}
	}

	return warningMessages.length ? warningMessages.join( ' ' ) : null;
};

export const frequencyForPopup = ( { options: { frequency } } ) => frequencyMap[ frequency ];

export const dataForCampaignId = ( id, campaigns ) =>
	campaigns.reduce( ( acc, group ) => ( +id > 0 && +id === +group.term_id ? group : acc ), null );

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Check whether the given popup is an overlay.
 *
 * @param {Object} popup Popup object to check.
 * @return {boolean} True if the popup is an overlay, otherwise false.
 */
export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

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

export const getFavoriteCategoryNames = ( favoriteCategories, categories, setCategories ) => {
	favoriteCategories.forEach( async categoryId => {
		try {
			const category = await apiFetch( {
				path: addQueryArgs( '/wp/v2/categories/' + categoryId, {
					_fields: 'id,name',
				} ),
			} );

			if ( ! categories.find( cat => cat.id === categoryId ) ) {
				const { id, name } = category;
				setCategories( [ ...categories, { id, name } ] );
			}
		} catch ( e ) {
			console.error( e );
		}
	} );
};

export const descriptionForSegment = ( segment, categories = [] ) => {
	const { configuration } = segment;
	const {
		favorite_categories = [],
		is_donor = false,
		is_not_donor = false,
		is_not_subscribed = false,
		is_subscribed = false,
		max_posts = 0,
		max_session_posts = 0,
		min_posts = 0,
		min_session_posts = 0,
		referrers = '',
		referrers_not = '',
	} = configuration;
	const descriptionMessages = [];

	// Messages for reader engagement.
	if ( 0 < min_posts || 0 < max_posts ) {
		descriptionMessages.push(
			sprintf(
				__( 'Articles read (past 30 days): %s %s', 'newspack' ),
				0 < min_posts ? __( 'min ', 'newspack' ) + min_posts : '',
				0 < max_posts ? __( 'max ', 'newspack' ) + max_posts : ''
			)
		);
	}
	if ( 0 < min_session_posts || 0 < max_session_posts ) {
		descriptionMessages.push(
			sprintf(
				__( 'Articles read (session): %s %s', 'newspack' ),
				0 < min_session_posts ? __( 'min ', 'newspack' ) + min_session_posts : '',
				0 < max_session_posts ? __( 'max ', 'newspack' ) + max_session_posts : ''
			)
		);
	}

	// Messages for reader activity.
	if ( is_donor ) {
		descriptionMessages.push( __( 'Has donated', 'newspack' ) );
	}
	if ( is_not_donor ) {
		descriptionMessages.push( __( 'Has not donated', 'newspack' ) );
	}
	if ( is_subscribed ) {
		descriptionMessages.push( __( 'Has subscribed', 'newspack' ) );
	}
	if ( is_not_subscribed ) {
		descriptionMessages.push( __( 'Has not subscribed', 'newspack' ) );
	}

	// Messages for referrer sources.
	if ( referrers ) {
		descriptionMessages.push( __( 'Referrers (matching): ' ) + referrers );
	}
	if ( referrers_not ) {
		descriptionMessages.push( __( 'Referrers (excluding): ' ) + referrers_not );
	}

	// Messages for category affinity.
	if ( 0 < favorite_categories.length ) {
		if ( 0 < categories.length ) {
			descriptionMessages.push(
				sprintf(
					__( 'Favorite %s: %s', 'newspack' ),
					categories.length > 1 ? __( 'categories', 'newspack' ) : __( 'category', 'newspack' ),
					categories.map( cat => cat.name ).join( ', ' )
				)
			);
		} else {
			descriptionMessages.push( __( 'Has favorite categories', 'newspack' ) );
		}
	}

	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

export const frequencyForPopup = ( { options: { frequency } } ) => frequencyMap[ frequency ];

export const dataForCampaignId = ( id, campaigns ) =>
	campaigns.reduce( ( acc, group ) => ( +id > 0 && +id === +group.term_id ? group : acc ), null );

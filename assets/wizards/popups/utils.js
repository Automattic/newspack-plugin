/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies.
 */
import { memoize } from 'lodash';
import { format, parse } from 'date-fns';

/**
 * Check whether the given popup is an overlay.
 *
 * @param {Object} popup Popup object to check.
 * @return {boolean} True if the popup is an overlay, otherwise false.
 */
export const isOverlay = popup => {
	const overlayPlacements = window.newspack_popups_wizard_data?.overlay_placements || [];
	return -1 < overlayPlacements.indexOf( popup.options.placement );
};

/**
 * Check whether the given popup is above-header.
 *
 * @param {Object} popup Popup object to check.
 * @return {boolean} True if the popup is a above-header, otherwise false.
 */
export const isAboveHeader = popup => 'above_header' === popup.options.placement;

export const isCustomPlacement = popup => {
	const customPlacements = window.newspack_popups_wizard_data?.custom_placements || {};

	return -1 < Object.keys( customPlacements ).indexOf( popup.options.placement );
};

/**
 * Check whether the given prompt is inline.
 *
 * @param {Object} prompt Prompt object to check.
 * @return {boolean} True if the prompt is inline, otherwise false.
 */
export const isInline = prompt => ! isOverlay( prompt );

const placementMap = {
	top: __( 'Top Overlay', 'newspack' ),
	top_left: __( 'Top Left Overlay', 'newspack' ),
	top_right: __( 'Top Right Overlay', 'newspack' ),
	center: __( 'Center Overlay', 'newspack' ),
	center_left: __( 'Center Left Overlay', 'newspack' ),
	center_right: __( 'Center Right Overlay', 'newspack' ),
	bottom: __( 'Bottom Overlay', 'newspack' ),
	bottom_left: __( 'Bottom Left Overlay', 'newspack' ),
	bottom_right: __( 'Bottom Right Overlay', 'newspack' ),
	inline: __( 'Inline', 'newspack' ),
	archives: __( 'In archive pages', 'newspack' ),
	above_header: __( 'Above Header', 'newspack' ),
	manual: __( 'Manual Only', 'newspack' ),
};

export const placementForPopup = ( { options: { frequency, placement } } ) => {
	const customPlacements = window.newspack_popups_wizard_data?.custom_placements || {};
	if ( 'manual' === frequency || customPlacements.hasOwnProperty( placement ) ) {
		return __( 'Custom Placement', 'newspack' );
	}
	return placementMap[ placement ];
};

export const placementsForPopups = prompt => {
	const customPlacements = window.newspack_popups_wizard_data?.custom_placements;
	const overlayPlacements = window.newspack_popups_wizard_data?.overlay_placements;
	const options = Object.keys( placementMap )
		.filter( key =>
			isOverlay( prompt )
				? -1 < overlayPlacements.indexOf( key )
				: -1 === overlayPlacements.indexOf( key )
		)
		.map( key => ( { label: placementMap[ key ], value: key } ) );

	if ( ! isOverlay( prompt ) && customPlacements ) {
		return options.concat(
			Object.keys( customPlacements ).map( key => ( {
				label: customPlacements[ key ],
				value: key,
			} ) )
		);
	}

	return options;
};

const frequencyMap = {
	once: __( 'Once', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every page view', 'newspack' ),
};

export const frequenciesForPopup = popup => {
	return Object.keys( frequencyMap )
		.filter( key => ! ( 'always' === key && isOverlay( popup ) ) )
		.map( key => ( { label: frequencyMap[ key ], value: key } ) );
};

export const overlaySizesForPopups = () => {
	return window.newspack_popups_wizard_data?.overlay_sizes;
};

export const getCardClassName = ( { status } ) => {
	if ( 'publish' !== status ) {
		return 'newspack-card__is-disabled';
	}
	return 'newspack-card__is-supported';
};

export const descriptionForPopup = prompt => {
	const { categories, tags, campaign_groups: campaigns, status } = prompt;
	const descriptionMessages = [];
	if ( campaigns.length > 0 ) {
		const campaignsList = campaigns.map( ( { name } ) => name ).join( ', ' );
		descriptionMessages.push(
			( campaigns.length === 1
				? __( 'Campaign: ', 'newspack' )
				: __( 'Campaigns: ', 'newspack' ) ) + campaignsList
		);
	}
	if ( categories.length > 0 ) {
		descriptionMessages.push(
			__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
		);
	}
	if ( tags.length > 0 ) {
		descriptionMessages.push(
			__( 'Tags: ', 'newspack' ) + tags.map( tag => tag.name ).join( ', ' )
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

const getFavoriteCategoryNamesFn = async favoriteCategories => {
	try {
		const favoriteCategoryNames = await Promise.all(
			favoriteCategories.map( async categoryId => {
				const category = await apiFetch( {
					path: addQueryArgs( '/wp/v2/categories/' + categoryId, {
						_fields: 'name',
					} ),
				} );

				return category.name;
			} )
		);

		return favoriteCategoryNames;
	} catch ( e ) {
		console.error( e );
		return [];
	}
};
export const getFavoriteCategoryNames = memoize( getFavoriteCategoryNamesFn );

export const descriptionForSegment = ( segment, categories = [] ) => {
	const { configuration } = segment;
	const {
		favorite_categories = [],
		is_donor = false,
		is_not_donor = false,
		is_not_subscribed = false,
		is_subscribed = false,
		is_logged_in = false,
		is_not_logged_in = false,
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
				// Translators: %1: The minimum number of articles. %2: The maximum number of articles.
				__( 'Articles read (past 30 days): %1$s %2$s', 'newspack' ),
				0 < min_posts ? __( 'min ', 'newspack' ) + min_posts : '',
				0 < max_posts ? __( 'max ', 'newspack' ) + max_posts : ''
			)
		);
	}
	if ( 0 < min_session_posts || 0 < max_session_posts ) {
		descriptionMessages.push(
			sprintf(
				// Translators: %1: The minimum number of articles. %2: The maximum number of articles.
				__( 'Articles read (session): %1$s %2$s', 'newspack' ),
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
	if ( is_logged_in ) {
		descriptionMessages.push( __( 'Is logged in', 'newspack' ) );
	}
	if ( is_not_logged_in ) {
		descriptionMessages.push( __( 'Is not logged in', 'newspack' ) );
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
					// Translators: %1: 'categories' or 'category' depending on number of categories. %2: a list of favorite categories.
					__( 'Favorite %1$s: %2$s', 'newspack' ),
					categories.length > 1 ? __( 'categories', 'newspack' ) : __( 'category', 'newspack' ),
					categories.filter( cat => !! cat ).join( ', ' )
				)
			);
		} else {
			descriptionMessages.push( __( 'Has favorite categories', 'newspack' ) );
		}
	}

	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

export const isSameType = ( campaignA, campaignB ) => {
	return campaignA.options.placement === campaignB.options.placement;
};

const sharesSegments = ( segmentsA, segmentsB ) => {
	const segmentsArrayA = segmentsA ? segmentsA.split( ',' ) : [];
	const segmentsArrayB = segmentsB ? segmentsB.split( ',' ) : [];
	return (
		( ! segmentsArrayA.length && ! segmentsArrayB.length ) ||
		segmentsArrayA.some( segment => -1 < segmentsArrayB.indexOf( segment ) )
	);
};

export const buildWarning = ( prompt, promptCategories ) => {
	if ( isOverlay( prompt ) || isAboveHeader( prompt ) ) {
		return sprintf(
			// Translators: %1: 'uncetegorized' if no categories. %2: 'above-header prompts' if above header, 'overlays' otherwise. %3: 'and category filtering' if categories.
			__(
				'If multiple%1$s %2$s share the same segment%3$s, only the most recent one will be displayed.'
			),
			0 === promptCategories.length ? __( ' uncategorized', 'newspack' ) : '',
			isAboveHeader( prompt )
				? __( 'above-header prompts', 'newspack' )
				: __( 'overlays', 'newspack' ),
			0 < promptCategories.length ? __( ' and category filtering', 'newspack' ) : ''
		);
	}

	if ( isCustomPlacement( prompt ) ) {
		return sprintf(
			// Translators: %1: 'uncetegorized' if no categories. %2: 'and category filtering' if categories.
			__(
				'If multiple%1$s prompts in the same custom placement share the same segment%2$s, only the most recent one will be displayed.'
			),
			0 === promptCategories.length ? __( ' uncategorized', 'newspack' ) : '',
			0 < promptCategories.length ? __( ' and category filtering', 'newspack' ) : ''
		);
	}

	return '';
};

export const warningForPopup = ( prompts, prompt ) => {
	const warningMessages = [];

	if (
		'publish' === prompt.status &&
		( isAboveHeader( prompt ) || isOverlay( prompt ) || isCustomPlacement( prompt ) )
	) {
		const promptCategories = prompt.categories;
		const conflictingPrompts = prompts.filter( conflict => {
			const conflictCategories = conflict.categories;

			// There's a conflict if both campaigns have zero categories, or if they share at least one category.
			const hasConflictingCategory =
				( 0 === promptCategories.length && 0 === conflictCategories.length ) ||
				promptCategories.some( category =>
					conflictCategories.some(
						conflictCategory => category.term_id === conflictCategory.term_id
					)
				);

			return (
				'publish' === conflict.status &&
				conflict.id !== prompt.id &&
				isSameType( prompt, conflict ) &&
				sharesSegments(
					prompt.options.selected_segment_id,
					conflict.options.selected_segment_id
				) &&
				hasConflictingCategory
			);
		} );

		if ( 0 < conflictingPrompts.length ) {
			return (
				<>
					<h4 className="newspack-notice__heading">
						{ sprintf(
							// Translators: %s: 'Conflicts' or 'Conflict' depending on number of conflicts.
							__( '%s detected:', 'newspack' ),
							1 < conflictingPrompts.length
								? __( 'Conflicts', 'newspack' )
								: __( 'Conflict', 'newspack' )
						) }
					</h4>
					<ul>
						{ conflictingPrompts.map( conflictingPrompt => (
							<li key={ conflictingPrompt.id }>
								<p data-testid={ `conflict-warning-${ prompt.id }` }>
									<strong>{ sprintf( '%s: ', conflictingPrompt.title ) }</strong>
									<span>{ buildWarning( prompt, promptCategories ) }</span>
								</p>
							</li>
						) ) }
					</ul>
				</>
			);
		}

		return null;
	}

	return warningMessages.length ? warningMessages.join( ' ' ) : null;
};

export const frequencyForPopup = ( { options: { frequency } } ) => frequencyMap[ frequency ];

export const dataForCampaignId = ( id, campaigns ) =>
	campaigns.reduce( ( acc, group ) => ( +id > 0 && +id === +group.term_id ? group : acc ), null );

export const formatDate = ( date = new Date() ) => format( date, 'yyyy-MM-dd' );
export const parseDate = dateString => parse( dateString, 'yyyy-MM-dd', new Date() );

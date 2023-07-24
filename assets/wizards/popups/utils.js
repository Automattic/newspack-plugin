/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { applyFilters, addFilter } from '@wordpress/hooks';
import { useEffect, useState, Fragment } from '@wordpress/element';

/**
 * External dependencies.
 */
import memoize from 'lodash/memoize';
import { format, parse } from 'date-fns';

const allCriteria = window.newspack_popups_wizard_data?.criteria || [];

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
	once: __( 'Once a month', 'newspack' ),
	weekly: __( 'Once a week', 'newspack' ),
	daily: __( 'Once a day', 'newspack' ),
	always: __( 'Every pageview', 'newspack' ),
	custom: __( 'Custom frequency (edit prompt to manage)', 'newspack' ),
};

export const frequenciesForPopup = () => {
	return Object.keys( frequencyMap ).map( key => ( { label: frequencyMap[ key ], value: key } ) );
};

export const overlaySizesForPopups = () => {
	return window.newspack_popups_wizard_data?.overlay_sizes;
};

export const getCardClassName = ( status, forceDisabled = false ) => {
	if ( 'publish' !== status || forceDisabled ) {
		return 'newspack-card__is-disabled';
	}
	return 'newspack-card__is-supported';
};

export const promptDescription = prompt => {
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

export const segmentDescription = segment => {
	const descriptionMessages = [];

	// If the segment is disabled.
	if ( segment.configuration.is_disabled ) {
		descriptionMessages.push( __( 'Segment disabled', 'newspack' ) );
	}

	if ( segment.criteria ) {
		for ( const config of allCriteria ) {
			const item = segment.criteria.find( ( { criteria_id } ) => criteria_id === config.id );
			if ( item?.value ) {
				let value = item.value;
				if ( config.options ) {
					const option = config.options.find(
						( { value: optionValue } ) => optionValue === item.value
					);
					if ( option ) {
						value = option.label;
					}
				}
				if ( Array.isArray( value ) ) {
					value = value.join( ', ' );
				} else if ( typeof value === 'object' ) {
					const values = [];
					for ( const key in value ) {
						if ( value[ key ] ) {
							values.push( `${ key }: ${ value[ key ] }` );
						}
					}
					value = values.join( ', ' );
				}
				const message = applyFilters(
					'newspack.wizards.campaigns.segmentDescription.criteriaMessage',
					sprintf( '%1$s: %2$s', config.name, value ),
					value,
					config,
					item
				);
				descriptionMessages.push( message );
			}
		}
	}

	const render = () => (
		<Fragment>
			{ descriptionMessages.map( ( item, index ) => (
				<Fragment key={ index }>
					{ item } { descriptionMessages.length !== index + 1 ? ' | ' : null }
				</Fragment>
			) ) }
		</Fragment>
	);
	return render;
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
const getFavoriteCategoryNames = memoize( getFavoriteCategoryNamesFn );

const FavoriteCategoriesNames = ( { ids } ) => {
	const [ favoriteCategoryNames, setFavoriteCategoryNames ] = useState( [] );
	useEffect( () => {
		getFavoriteCategoryNames( ids ).then( setFavoriteCategoryNames );
	}, [ ids ] );
	return (
		<span>
			{ __( 'Favorite Categories:', 'newspack' ) }{ ' ' }
			{ favoriteCategoryNames.length ? favoriteCategoryNames.join( ', ' ) : '' }
		</span>
	);
};

addFilter(
	'newspack.wizards.campaigns.segmentDescription.criteriaMessage',
	'newspack.favoriteCategories',
	( message, value, config, item ) => {
		if ( 'favorite_categories' === config.id ) {
			return <FavoriteCategoriesNames ids={ item.value } />;
		}
		return message;
	}
);

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

		const filteredConflictingPrompts = applyFilters(
			'newspack.wizards.campaigns.conflictingPrompts',
			conflictingPrompts,
			prompt,
			prompts
		);

		if ( 0 < filteredConflictingPrompts.length ) {
			return (
				<>
					<strong>
						{ sprintf(
							// Translators: %s: 'Conflicts' or 'Conflict' depending on number of conflicts.
							__( '%s detected:', 'newspack' ),
							1 < filteredConflictingPrompts.length
								? __( 'Conflicts', 'newspack' )
								: __( 'Conflict', 'newspack' )
						) }
					</strong>
					<ul>
						{ filteredConflictingPrompts.map( conflictingPrompt => (
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

/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import { withWizardScreen, Button, SelectControl } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import { isOverlay } from '../../utils';
import './style.scss';

const descriptionForPopup = (
	{ categories, sitewide_default: sitewideDefault, options },
	segments
) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const descriptionMessages = [];
	switch ( options.placement ) {
		case 'above_header':
			descriptionMessages.push( __( 'Above header', 'newspack' ) );
			break;
		case 'inline':
			descriptionMessages.push( __( 'Inline', 'newspack' ) );
			break;
		default:
			descriptionMessages.push( __( 'Overlay', 'newspack' ) );
			break;
	}
	if ( segment ) {
		descriptionMessages.push( `${ __( 'Segment:', 'newspack' ) } ${ segment.name }` );
	}
	if ( sitewideDefault ) {
		descriptionMessages.push( __( 'Sitewide default', 'newspack' ) );
	}
	if ( categories.length > 0 ) {
		descriptionMessages.push(
			__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
		);
	}
	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

/**
 * Popup group screen
 */
const PopupGroup = ( {
	deletePopup,
	items: { active = [], draft = [], test = [], inactive = [] },
	previewPopup,
	setTermsForPopup,
	setSitewideDefaultPopup,
	publishPopup,
	updatePopup,
	segments,
} ) => {
	const [ campaignGroup, setCampaignGroup ] = useState( -1 );
	const [ campaignGroups, setCampaignGroups ] = useState( -1 );

	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name',
		} ).then( terms => setCampaignGroups( terms ) );
	}, [] );

	const getCardClassName = ( { options, sitewide_default: sitewideDefault, status } ) => {
		if ( 'draft' === status ) {
			return 'newspack-card__is-disabled';
		}
		if ( 'test' === options.frequency ) {
			return 'newspack-card__is-secondary';
		}
		if ( sitewideDefault ) {
			return 'newspack-card__is-primary';
		}
		if ( isOverlay( { options } ) && ! sitewideDefault ) {
			return 'newspack-card__is-disabled';
		}
		return 'newspack-card__is-supported';
	};

	const filteredByGroup = itemsToFilter =>
		-1 === campaignGroup
			? itemsToFilter
			: itemsToFilter.filter(
					( { campaign_groups: groups } ) =>
						groups && groups.find( term => +term.term_id === campaignGroup )
			  );

	const campaignsToDisplay = filteredByGroup( [ ...active, ...draft, ...test, ...inactive ] );

	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__filter-group-wrapper">
				<SelectControl
					options={
						-1 === campaignGroups
							? [
									{
										value: -1,
										label: __( 'Loading...', 'newspack' ),
									},
							  ]
							: [
									{ value: -1, label: __( 'All Campaigns', 'newspack' ) },
									...campaignGroups.map( term => ( {
										value: term.id,
										label: term.name,
									} ) ),
							  ]
					}
					value={ campaignGroup }
					onChange={ value => setCampaignGroup( +value ) }
					label={ __( 'Groups', 'newspack' ) }
					labelPosition="side"
					disabled={ -1 === campaignGroups }
				/>
				<Button isPrimary isSmall href="/wp-admin/post-new.php?post_type=newspack_popups_cpt">
					{ __( 'Add New', 'newspack' ) }
				</Button>
			</div>
			{ campaignsToDisplay.map( campaign => (
				<PopupActionCard
					className={ getCardClassName( campaign ) }
					deletePopup={ deletePopup }
					description={ descriptionForPopup( campaign, segments ) }
					key={ campaign.id }
					popup={ campaign }
					previewPopup={ previewPopup }
					segments={ segments }
					setTermsForPopup={ setTermsForPopup }
					setSitewideDefaultPopup={ setSitewideDefaultPopup }
					updatePopup={ updatePopup }
					publishPopup={ publishPopup }
				/>
			) ) }
			{ campaignsToDisplay.length < 1 &&
				-1 === campaignGroup &&
				__( 'No Campaigns have been created yet.', 'newspack' ) }
			{ campaignsToDisplay.length < 1 &&
				campaignGroup > 0 &&
				__( 'There are no Campaigns in this group.', 'newspack' ) }
		</Fragment>
	);
};
export default withWizardScreen( PopupGroup );

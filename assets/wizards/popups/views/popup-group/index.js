/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import { withWizardScreen, Button, Popover, SelectControl } from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import SegmentationPreview from '../../components/segmentation-preview';
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
	manageCampaignGroup,
	previewPopup,
	setTermsForPopup,
	setSitewideDefaultPopup,
	publishPopup,
	updatePopup,
	segments,
	settings,
} ) => {
	const activeCampaignGroup = settings.reduce(
		( acc, { key, value } ) => ( key === 'newspack_popups_active_campaign_group' ? value : acc ),
		null
	);
	const [ campaignGroup, setCampaignGroup ] = useState( -1 );
	const [ campaignGroups, setCampaignGroups ] = useState( -1 );
	const [ segmentId, setSegmentId ] = useState();
	const [ previewPopoverIsVisible, setPreviewPopoverIsVisible ] = useState();

	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name',
		} ).then( terms => setCampaignGroups( terms ) );
	}, [] );

	useEffect( () => {
		if ( -1 === campaignGroup && activeCampaignGroup > 0 ) {
			setCampaignGroup( +activeCampaignGroup );
		}
	}, [ activeCampaignGroup ] );

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

	const campaignGroupExists =
		campaignGroups &&
		Array.isArray( campaignGroups ) &&
		parseInt( campaignGroup ) > 0 &&
		-1 !== campaignGroups.some( ( { id: termId } ) => termId === campaignGroup );

	const filteredByGroup = itemsToFilter =>
		! campaignGroupExists
			? itemsToFilter
			: itemsToFilter.filter(
					( { campaign_groups: groups } ) =>
						groups && groups.find( term => +term.term_id === campaignGroup )
			  );

	const campaignsToDisplay = filteredByGroup( [ ...active, ...draft, ...test, ...inactive ] );

	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__filter-group-wrapper">
				<div className="newspack-campaigns__popup-group__filter-group-actions">
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
					{ campaignGroup > 0 && (
						<SegmentationPreview
							campaignGroups={ campaignGroup }
							segment={ segmentId }
							renderButton={ ( { showPreview } ) => (
								<div className="newspack-campaigns__popup-group__filter-group-segmentation">
									{ activeCampaignGroup !== campaignGroup && (
										<Button
											isTertiary
											isSmall
											onClick={ () => manageCampaignGroup( campaignGroup ) }
										>
											{ __( 'Activate', 'newspack' ) }
										</Button>
									) }
									{ campaignGroupExists && activeCampaignGroup === campaignGroup && (
										<Button
											isTertiary
											isSmall
											onClick={ () => manageCampaignGroup( campaignGroup, 'DELETE' ) }
										>
											{ __( 'Deactivate', 'newspack' ) }
										</Button>
									) }
									{ campaignGroupExists && (
										<Button
											isTertiary
											isSmall
											onClick={ () => setPreviewPopoverIsVisible( ! previewPopoverIsVisible ) }
										>
											{ __( 'Preview', 'newspack' ) }
										</Button>
									) }
									{ previewPopoverIsVisible && (
										<Popover
											className="has-select-border"
											position="bottom right"
											onFocusOutside={ () => setPreviewPopoverIsVisible( false ) }
											onKeyDown={ event =>
												ESCAPE === event.keyCode && setPreviewPopoverIsVisible( false )
											}
										>
											<SelectControl
												options={ [
													{ value: '', label: __( 'Default (no segment)', 'newspack' ) },
													...segments.map( s => ( { value: s.id, label: s.name } ) ),
												] }
												value={ segmentId }
												onChange={ setSegmentId }
												label={ __( 'Segment to preview', 'newspack' ) }
											/>
											<Button
												isLink
												onClick={ () => {
													console.log( showPreview );
													showPreview();
													setPreviewPopoverIsVisible( false );
												} }
											>
												{ __( 'Preview', 'newspack' ) }
											</Button>
										</Popover>
									) }
								</div>
							) }
						/>
					) }
				</div>
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
			{ campaignsToDisplay.length < 1 && -1 === campaignGroup && (
				<p>{ __( 'No Campaigns have been created yet.', 'newspack' ) }</p>
			) }
			{ campaignsToDisplay.length < 1 && campaignGroup > 0 && (
				<p>{ __( 'There are no Campaigns in this group.', 'newspack' ) }</p>
			) }
		</Fragment>
	);
};
export default withWizardScreen( PopupGroup );

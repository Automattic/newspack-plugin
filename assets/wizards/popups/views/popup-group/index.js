/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { useEffect, useState, Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	Button,
	Popover,
	Router,
	SelectControl,
	ToggleControl,
} from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import SegmentationPreview from '../../components/segmentation-preview';
import { filterOutUncategorized, isAboveHeader, isOverlay } from '../../utils';
import './style.scss';

const { useParams } = Router;

const descriptionForPopup = ( { categories, options, status }, segments ) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const filteredCategories = filterOutUncategorized( categories );
	const descriptionMessages = [];
	if ( segment ) {
		descriptionMessages.push( `${ __( 'Segment:', 'newspack' ) } ${ segment.name }` );
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
	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

const isSameType = ( campaignA, campaignB ) => {
	return (
		( isAboveHeader( campaignA ) && isAboveHeader( campaignB ) ) ||
		( isOverlay( campaignA ) && isOverlay( campaignB ) )
	);
};

const warningForPopup = ( campaigns, campaign ) => {
	const warningMessages = [];
	if ( isAboveHeader( campaign ) || isOverlay( campaign ) ) {
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
				conflict.id !== campaign.id &&
				isSameType( campaign, conflict ) &&
				campaign.options.selected_segment_id === conflict.options.selected_segment_id &&
				hasConflictingCategory
			);
		} );

		if ( 0 < conflictingCampaigns.length ) {
			warningMessages.push(
				`${ __( 'Conflicts with:', 'newspack' ) } ${ conflictingCampaigns
					.map( a => a.title )
					.join( ', ' ) }`
			);
		}
	}

	return warningMessages.length ? warningMessages.join( ' | ' ) : null;
};

/**
 * Popup group screen
 */
const PopupGroup = ( {
	deletePopup,
	items: { active = [], draft = [] },
	manageCampaignGroup,
	previewPopup,
	setTermsForPopup,
	publishPopup,
	unpublishPopup,
	updatePopup,
	segments,
	wizardApiFetch,
} ) => {
	const [ campaignGroup, setCampaignGroup ] = useState( -1 );
	const [ campaignGroups, setCampaignGroups ] = useState( -1 );
	const [ segmentId, setSegmentId ] = useState();
	const [ showUnpublished, setShowUnpublished ] = useState( false );
	const [ previewPopoverIsVisible, setPreviewPopoverIsVisible ] = useState();
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState();

	const { group } = useParams();

	useEffect( () => {
		wizardApiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name',
		} ).then( terms => {
			setCampaignGroups( terms );

			if ( group ) {
				const matchingTerm = terms.find( term => term.id === parseInt( group ) );

				if ( matchingTerm ) {
					setCampaignGroup( parseInt( group ) );
				}
			}
		} );
	}, [] );

	const getCardClassName = ( { status } ) => {
		if ( 'publish' !== status ) {
			return 'newspack-card__is-disabled';
		}
		return 'newspack-card__is-supported';
	};

	const campaignGroupExists =
		campaignGroups &&
		Array.isArray( campaignGroups ) &&
		+campaignGroup > 0 &&
		-1 !== campaignGroups.some( ( { id: termId } ) => termId === campaignGroup );

	const filteredByGroup = itemsToFilter =>
		! campaignGroupExists
			? itemsToFilter
			: itemsToFilter.filter(
					( { campaign_groups: groups } ) =>
						groups && groups.find( term => +term.term_id === campaignGroup )
			  );

	const campaignsToDisplay = filteredByGroup( [ ...active, ...draft ] );

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
						hideLabelFromVision={ true }
						disabled={ -1 === campaignGroups }
					/>
					{ 0 < campaignsToDisplay.length && (
						<>
							<Button
								isTertiary
								isSmall
								onClick={ () => manageCampaignGroup( campaignsToDisplay ) }
							>
								{ __( 'Publish All', 'newspack' ) }
							</Button>
							<Button
								isTertiary
								isSmall
								onClick={ () => manageCampaignGroup( campaignsToDisplay, 'DELETE' ) }
							>
								{ __( 'Unpublish All', 'newspack' ) }
							</Button>
						</>
					) }

					<SegmentationPreview
						campaignGroups={ campaignGroup > -1 ? [ campaignGroup ] : [] }
						segment={ segmentId }
						showUnpublished={ showUnpublished }
						renderButton={ ( { showPreview } ) => (
							<div className="newspack-campaigns__popup-group__filter-group-segmentation">
								{ 0 < campaignsToDisplay.length && (
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
										position="bottom right"
										onFocusOutside={ () => setPreviewPopoverIsVisible( false ) }
										onKeyDown={ event =>
											ESCAPE === event.keyCode && setPreviewPopoverIsVisible( false )
										}
									>
										<MenuItem
											onClick={ () => setPreviewPopoverIsVisible( false ) }
											className="screen-reader-text"
										>
											{ __( 'Close Popover', 'newspack' ) }
										</MenuItem>
										<SelectControl
											options={ [
												{ value: '', label: __( 'Default (no segment)', 'newspack' ) },
												...segments.map( s => ( { value: s.id, label: s.name } ) ),
											] }
											value={ segmentId }
											onChange={ setSegmentId }
											label={ __( 'Segment to preview', 'newspack' ) }
										/>
										<ToggleControl
											label={ __( 'Show unpublished campaigns', 'newspack' ) }
											checked={ showUnpublished }
											onChange={ () => setShowUnpublished( ! showUnpublished ) }
										/>
										<Button
											isLink
											onClick={ () => {
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
				</div>
				<div className="newspack-campaigns__popup-group__add-new-button">
					<Button
						isPrimary
						isSmall
						onClick={ () => setAddNewPopoverIsVisible( ! addNewPopoverIsVisible ) }
					>
						{ __( 'Add New', 'newspack' ) }
					</Button>
					{ addNewPopoverIsVisible && (
						<Popover
							position="bottom left"
							onFocusOutside={ () => setAddNewPopoverIsVisible( false ) }
							onKeyDown={ event => ESCAPE === event.keyCode && setAddNewPopoverIsVisible( false ) }
						>
							<MenuItem
								onClick={ () => setAddNewPopoverIsVisible( false ) }
								className="screen-reader-text"
							>
								{ __( 'Close Popover', 'newspack' ) }
							</MenuItem>
							<MenuItem href="/wp-admin/post-new.php?post_type=newspack_popups_cpt">
								{ __( 'Inline', 'newspack' ) }
							</MenuItem>
							<MenuItem href="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-center">
								{ __( 'Center Overlay', 'newspack' ) }
							</MenuItem>
							<MenuItem href="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-top">
								{ __( 'Top Overlay', 'newspack' ) }
							</MenuItem>
							<MenuItem href="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-bottom">
								{ __( 'Bottom Overlay', 'newspack' ) }
							</MenuItem>
							<MenuItem href="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=above-header">
								{ __( 'Above Header', 'newspack' ) }
							</MenuItem>
							<MenuItem href="/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=manual">
								{ __( 'Manual Placement', 'newspack' ) }
							</MenuItem>
						</Popover>
					) }
				</div>
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
					updatePopup={ updatePopup }
					publishPopup={ publishPopup }
					unpublishPopup={ unpublishPopup }
					warning={ warningForPopup( [ ...active, ...draft ], campaign ) }
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

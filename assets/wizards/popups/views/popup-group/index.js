/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { useEffect, useState, Fragment } from '@wordpress/element';
import { MenuItem, Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ENTER, ESCAPE } from '@wordpress/keycodes';
import { Icon, moreVertical, close } from '@wordpress/icons';

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
	Card,
	CustomSelectControl,
	Modal,
	Popover,
	Router,
	TextControl,
	ToggleControl,
} from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import SegmentationPreview from '../../components/segmentation-preview';
import { filterOutUncategorized, isOverlay, frequencyForPopup } from '../../utils';
import './style.scss';

const { useParams } = Router;

const descriptionForPopup = ( prompt, segments ) => {
	const {
		categories,
		campaign_groups: campaigns,
		sitewide_default: sitewideDefault,
		options,
		status,
	} = prompt;
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
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

const getCardClassName = ( { options, sitewide_default: sitewideDefault, status } ) => {
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

const iconInline = (
	<SVG xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
		<Path d="M21 11.01L3 11v2h18zM3 16h12v2H3zM21 6H3v2.01L21 8z" />
	</SVG>
);
const iconCenterOverlay = (
	<SVG xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
		<Path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM7 9h10v6H7V9z" />
	</SVG>
);
const iconTopOverlay = (
	<SVG xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
		<Path d="M3 21h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM3 5h18v14H3V5zm16 4H5V6h14v3z" />
	</SVG>
);
const iconBottomOverlay = (
	<SVG xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
		<Path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5z" />
	</SVG>
);
const iconAboveHeader = (
	<SVG xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
		<Path d="M3 21h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM3 8h18v11H3V8z" />
	</SVG>
);
const iconManualPlacement = (
	<SVG xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
		<Path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM3 8h11.5v4.5H3V8zm0 6.5h11.5V19H3v-4.5zM21 19h-4.5V8H21v11z" />
	</SVG>
);

const Segment = ( {
	segment,
	campaignGroup,
	deletePopup,
	previewPopup,
	segments,
	setTermsForPopup,
	setSitewideDefaultPopup,
	updatePopup,
	publishPopup,
	unpublishPopup,
} ) => {
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState();
	const { label, id, items } = segment;
	return (
		<Card isSmall className="newspack-campaigns__popup-group__card">
			<h3 className="newspack-campaigns__popup-group__card__segment">
				{ __( 'Segment: ', 'newspack' ) }
				{ label }
				<SegmentationPreview
					campaignGroups={ [ campaignGroup ] }
					segment={ id }
					showUnpublished={ true } // Do we need a control for this?
					renderButton={ ( { showPreview } ) => (
						<Button isTertiary isSmall isLink onClick={ () => showPreview() }>
							{ __( 'Preview', 'newspack' ) }
						</Button>
					) }
				/>
			</h3>
			<Card noBorder className="newspack-campaigns__popup-group__action-cards">
				{ items.map( item => (
					<PopupActionCard
						className={ getCardClassName( item ) }
						deletePopup={ deletePopup }
						description={ descriptionForPopup( item, segments ) }
						key={ item.id }
						popup={ item }
						previewPopup={ previewPopup }
						segments={ segments }
						setTermsForPopup={ setTermsForPopup }
						setSitewideDefaultPopup={ setSitewideDefaultPopup }
						updatePopup={ updatePopup }
						publishPopup={ publishPopup }
						unpublishPopup={ unpublishPopup }
					/>
				) ) }
			</Card>
			{ items.length < 1 ? <p>{ __( 'No prompts in this segment yet.', 'newspack' ) }</p> : '' }
			{ parseInt( campaignGroup ) > 0 && (
				<div className="newspack-campaigns__popup-group__add-new-wrap">
					<Button
						isSmall
						isTertiary
						onClick={ () => setAddNewPopoverIsVisible( ! addNewPopoverIsVisible ) }
					>
						{ __( 'Add New Prompt', 'newspack' ) }
					</Button>
					{ addNewPopoverIsVisible && (
						<Modal
							title={ __( 'Add New Prompt', 'newspack' ) }
							className="newspack-campaigns__popup-group__add-new-button__modal"
							onRequestClose={ () => setAddNewPopoverIsVisible( false ) }
							shouldCloseOnEsc={ false }
							shouldCloseOnClickOutside={ false }
						>
							<Card buttonsCard noBorder className="newspack-card__buttons-prompt">
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconInline } />
									{ __( 'Inline', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-center&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconCenterOverlay } />
									{ __( 'Center Overlay', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-top&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconTopOverlay } />
									{ __( 'Top Overlay', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-bottom&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconBottomOverlay } />
									{ __( 'Bottom Overlay', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=above-header&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconAboveHeader } />
									{ __( 'Above Header', 'newspack' ) }
								</Button>
								<Button
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=manual&group=${ campaignGroup }&segment=${ id }` }
								>
									<Icon icon={ iconManualPlacement } />
									{ __( 'Manual Placement', 'newspack' ) }
								</Button>
							</Card>
						</Modal>
					) }
				</div>
			) }
		</Card>
	);
};
/**
 * Popup group screen
 */
const PopupGroup = ( {
	deletePopup,
	items = [],
	groups = [],
	manageCampaignGroup,
	previewPopup,
	setTermsForPopup,
	setSitewideDefaultPopup,
	publishPopup,
	unpublishPopup,
	updatePopup,
	segments,
	wizardApiFetch,
	refetch,
	duplicateCampaignGroup,
	deleteCampaignGroup,
	archiveCampaignGroup,
} ) => {
	const [ campaignGroup, setCampaignGroup ] = useState( 'active' );
	const [ segmentId, setSegmentId ] = useState();
	const [ showUnpublished, setShowUnpublished ] = useState( false );
	const [ previewPopoverIsVisible, setPreviewPopoverIsVisible ] = useState();
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState();
	const [ campaignActionsPopoverVisible, setCampaignActionsPopoverVisible ] = useState();
	const [ newGroupName, setNewGroupName ] = useState( '' );
	const [ error, setError ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );
	const [ duplicateCampaignName, setDuplicateCampaignName ] = useState();
	const [ duplicateCampaignModalVisible, setDuplicateCampaignModalVisible ] = useState();

	const { group } = useParams();

	const createTerm = term => {
		setAddNewPopoverIsVisible( false );
		setInFlight( true );
		setError( false );
		wizardApiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy',
			method: 'POST',
			quiet: true,
			data: {
				name: term,
				slug: term,
			},
		} )
			.then( () => {
				setInFlight( false );
				setNewGroupName( '' );
				refetch();
			} )
			.catch( e => {
				const message =
					e.message || __( 'An error occurred when creating this group.', 'newspack' );
				setError( message );
				setInFlight( false );
			} );
	};

	const filterByGroup = itemsToFilter => {
		if ( 'active' === campaignGroup ) {
			return itemsToFilter.filter( ( { status } ) => 'publish' === status );
		}
		if ( 'unassigned' === campaignGroup ) {
			return itemsToFilter.filter(
				( { campaign_groups: campaignGroups } ) => ! campaignGroups || ! campaignGroups.length
			);
		}
		return itemsToFilter.filter(
			( { campaign_groups: groups } ) =>
				groups && groups.find( term => +term.term_id === +campaignGroup )
		);
	};
	const groupBySegment = ( segments, itemsToGroup ) => {
		let groupedResults = [];
		const unsegmented = itemsToGroup.filter(
			( { options: { selected_segment_id: segment } } ) => ! segment
		);
		groupedResults.push(
			...segments.map( ( { name: label, id } ) => ( {
				label,
				id,
				items: itemsToGroup.filter(
					( { options: { selected_segment_id: segment } } ) => segment === id
				),
			} ) )
		);
		groupedResults.push( {
			label: __( 'Default (no segment)', 'newspack' ),
			id: '',
			items: unsegmented,
		} );
		return groupedResults;
	};

	const allPrompts = filterByGroup( items );
	const campaignsToDisplay = groupBySegment( segments, allPrompts );
	const activeGroups = groups.filter( ( { status } ) => 'archive' !== status );
	const archivedGroups = groups.filter( ( { status } ) => 'archive' === status );
	const groupInView = groups.reduce(
		( acc, group ) => ( +campaignGroup > 0 && +campaignGroup === +group.term_id ? group : acc ),
		null
	);
	const campaignGroupData = groups.reduce(
		( acc, group ) => ( +campaignGroup === +group.term_id ? group : acc ),
		null
	);
	const valueForCampaignGroup = campaignGroup => {
		if ( 'unassigned' === campaignGroup ) {
			return {
				key: 'unassigned',
				name: __( 'Unassigned Prompts', 'newspack' ),
			};
		}

		if ( campaignGroupData ) {
			return {
				key: campaignGroupData.term_id,
				name: campaignGroupData.name,
			};
		}
		return {
			key: 'active',
			name: __( 'Active Prompts', 'newspack' ),
		};
	};
	if ( +campaignGroup > 0 && ! campaignGroupData ) {
		setCampaignGroup( 'active' );
	}
	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__filter-group-wrapper">
				<div className="newspack-campaigns__popup-group__filter-group-actions">
					<CustomSelectControl
						label={ __( 'Campaigns', 'newspack' ) }
						options={ [
							{ key: 'active', name: __( 'Active Prompts', 'newspack' ) },
							{ key: 'unassigned', name: __( 'Unassigned Prompts', 'newspack' ) },
							{
								key: 'header-campaigns',
								name: __( 'Campaigns', 'newspack' ),
								className: 'is-header',
							},
							...activeGroups.map( ( { term_id: id, name } ) => ( {
								key: id,
								name: name,
								className: 'newspack-campaigns__popup-group__select-control-group-item',
							} ) ),
							archivedGroups.length && {
								key: 'header-archived-campaigns',
								name: __( 'Archived Campaigns', 'newspack' ),
								className: 'is-header',
							},
							...archivedGroups.map( ( { term_id: id, name } ) => ( {
								key: id,
								name: name,
								className: 'newspack-campaigns__popup-group__select-control-group-item',
							} ) ),
						] }
						onChange={ ( { selectedItem: { key } } ) => setCampaignGroup( key ) }
						value={ valueForCampaignGroup( campaignGroup ) }
						hideLabelFromVision={ true }
					/>
					{ campaignGroup !== 'active' && (
						<div className="newspack-campaigns__popup-group__filter-group-actions__button">
							<Button
								isQuaternary
								isSmall
								className={ campaignActionsPopoverVisible && 'popover-active' }
								onClick={ () =>
									setCampaignActionsPopoverVisible( ! campaignActionsPopoverVisible )
								}
								icon={ moreVertical }
								label={ __( 'Actions', 'newspack' ) }
							/>
							{ campaignActionsPopoverVisible && (
								<Popover
									position="bottom right"
									onFocusOutside={ () => setCampaignActionsPopoverVisible( false ) }
									onKeyDown={ event =>
										ESCAPE === event.keyCode && setCampaignActionsPopoverVisible( false )
									}
								>
									<MenuItem
										onClick={ () => setCampaignActionsPopoverVisible( false ) }
										className="screen-reader-text"
									>
										{ __( 'Close Popover', 'newspack' ) }
									</MenuItem>

									{ allPrompts.some( ( { status } ) => 'publish' !== status ) && (
										<MenuItem
											onClick={ () => {
												setCampaignActionsPopoverVisible( false );
												manageCampaignGroup( allPrompts );
											} }
											className="newspack-button"
										>
											{ __( 'Activate all prompts', 'newspack' ) }
										</MenuItem>
									) }
									{ allPrompts.some( ( { status } ) => 'publish' === status ) && (
										<MenuItem
											onClick={ () => {
												setCampaignActionsPopoverVisible( false );
												manageCampaignGroup( allPrompts, 'DELETE' );
											} }
											className="newspack-button"
										>
											{ __( 'Deactivate all prompts', 'newspack' ) }
										</MenuItem>
									) }
									<MenuItem
										onClick={ () => {
											setCampaignActionsPopoverVisible( false );
											setDuplicateCampaignModalVisible( true );
										} }
										className="newspack-button"
									>
										{ __( 'Duplicate', 'newspack' ) }
									</MenuItem>
									{ groupInView && 'archive' !== groupInView.status && (
										<MenuItem
											onClick={ () => {
												setCampaignActionsPopoverVisible( false );
												archiveCampaignGroup( campaignGroup, true );
											} }
											className="newspack-button"
										>
											{ __( 'Archive', 'newspack' ) }
										</MenuItem>
									) }
									{ groupInView && 'archive' === groupInView.status && (
										<MenuItem
											onClick={ () => {
												setCampaignActionsPopoverVisible( false );
												archiveCampaignGroup( campaignGroup, false );
											} }
											className="newspack-button"
										>
											{ __( 'Unarchive', 'newspack' ) }
										</MenuItem>
									) }
									<MenuItem
										onClick={ () => {
											setCampaignActionsPopoverVisible( false );
											deleteCampaignGroup( campaignGroup );
										} }
										className="newspack-button"
									>
										{ __( 'Delete', 'newspack' ) }
									</MenuItem>
								</Popover>
							) }
							{ duplicateCampaignModalVisible && (
								<Modal
									title={ __( 'Duplicate Campaign', 'newspack' ) }
									isDismissible={ false }
									className="newspack-campaigns__popup-group__add-new-button__modal"
								>
									<TextControl
										placeholder={ __( 'Campaign Name', 'newspack' ) }
										onChange={ setDuplicateCampaignName }
										label={ __( 'Campaign Name', 'newspack' ) }
										hideLabelFromVision={ true }
										value={ duplicateCampaignName }
										disabled={ !! inFlight }
										onKeyDown={ event =>
											ENTER === event.keyCode && '' !== newGroupName && createTerm( newGroupName )
										}
									/>
									<Card buttonsCard noBorder>
										<Button
											isSecondary
											onClick={ () => {
												setDuplicateCampaignModalVisible( false );
											} }
										>
											{ __( 'Cancel', 'newspack' ) }
										</Button>
										<Button
											isPrimary
											disabled={ inFlight || ! duplicateCampaignName }
											onClick={ () => {
												duplicateCampaignGroup( campaignGroup, duplicateCampaignName );
												setDuplicateCampaignModalVisible( false );
											} }
										>
											{ __( 'Duplicate', 'newspack' ) }
										</Button>
									</Card>
								</Modal>
							) }
						</div>
					) }
				</div>
				<div className="newspack-campaigns__popup-group__add-new-button">
					<Button
						isPrimary
						isSmall
						onClick={ () => setAddNewPopoverIsVisible( ! addNewPopoverIsVisible ) }
					>
						{ __( 'Add New Campaign', 'newspack' ) }
					</Button>
					{ addNewPopoverIsVisible && (
						<Modal
							title={ __( 'Add New Campaign', 'newspack' ) }
							isDismissible={ false }
							className="newspack-campaigns__popup-group__add-new-button__modal"
						>
							<TextControl
								placeholder={ __( 'Campaign Name', 'newspack' ) }
								onChange={ setNewGroupName }
								label={ __( 'Campaign Name', 'newspack' ) }
								hideLabelFromVision={ true }
								value={ newGroupName }
								disabled={ !! inFlight }
								onKeyDown={ event =>
									ENTER === event.keyCode && '' !== newGroupName && createTerm( newGroupName )
								}
							/>
							<Card buttonsCard noBorder>
								<Button
									isSecondary
									onClick={ () => {
										setAddNewPopoverIsVisible( false );
									} }
								>
									{ __( 'Cancel', 'newspack' ) }
								</Button>
								<Button
									isPrimary
									disabled={ inFlight || ! newGroupName }
									onClick={ () => {
										createTerm( newGroupName );
										setAddNewPopoverIsVisible( false );
									} }
								>
									{ __( 'Add', 'newspack' ) }
								</Button>
							</Card>
						</Modal>
					) }
				</div>
			</div>
			{ campaignsToDisplay.map( ( segment, index ) => (
				<Segment
					key={ index }
					segment={ segment }
					campaignGroup={ campaignGroup }
					deletePopup={ deletePopup }
					previewPopup={ previewPopup }
					segments={ segments }
					setTermsForPopup={ setTermsForPopup }
					setSitewideDefaultPopup={ setSitewideDefaultPopup }
					updatePopup={ updatePopup }
					publishPopup={ publishPopup }
					unpublishPopup={ unpublishPopup }
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

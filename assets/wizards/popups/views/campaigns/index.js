/**
 * Campaign management screen.
 */

/**
 * WordPress dependencies.
 */
import { useEffect, useState, Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
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
import SegmentGroup from '../../components/segment-group';
import './style.scss';

const { useHistory } = Router;

/**
 * Campaign management screen.
 */
const Campaigns = props => {
	const {
		items = [],
		groups = [],
		manageCampaignGroup,
		segments,
		wizardApiFetch,
		refetch,
		duplicateCampaignGroup,
		deleteCampaignGroup,
		archiveCampaignGroup,
		renameCampaignGroup,
		match: {
			params: { id: campaignGroup },
		},
	} = props;
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
	const [ renameCampaignModalVisible, setRenameCampaignModalVisible ] = useState();
	const [ renamedCampaignName, setRenamedCampaignName ] = useState( '' );

	const history = useHistory();

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
		if ( 'active' === campaignGroup || ! campaignGroup ) {
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
						onChange={ ( { selectedItem: { key } } ) => history.push( `/campaigns/${ key }` ) }
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
									<MenuItem
										onClick={ () => {
											setCampaignActionsPopoverVisible( false );
											setRenamedCampaignName( campaignGroupData.name );
											setRenameCampaignModalVisible( true );
										} }
										className="newspack-button"
									>
										{ __( 'Rename', 'newspack' ) }
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
							{ renameCampaignModalVisible && (
								<Modal
									title={ __( 'Rename Campaign', 'newspack' ) }
									isDismissible={ false }
									className="newspack-campaigns__popup-group__add-new-button__modal"
								>
									<TextControl
										placeholder={ __( 'Campaign Name', 'newspack' ) }
										onChange={ setRenamedCampaignName }
										label={ __( 'Campaign Name', 'newspack' ) }
										hideLabelFromVision={ true }
										value={ renamedCampaignName }
										disabled={ !! inFlight }
										onKeyDown={ event =>
											ENTER === event.keyCode &&
											'' !== renamedCampaignName &&
											renameCampaignGroup( campaignGroup, renamedCampaignName )
										}
									/>
									<Card buttonsCard noBorder>
										<Button
											isSecondary
											onClick={ () => {
												setRenameCampaignModalVisible( false );
											} }
										>
											{ __( 'Cancel', 'newspack' ) }
										</Button>
										<Button
											isPrimary
											disabled={ inFlight || ! renamedCampaignName }
											onClick={ () => {
												renameCampaignGroup( campaignGroup, renamedCampaignName );
												setRenameCampaignModalVisible( false );
											} }
										>
											{ __( 'Rename', 'newspack' ) }
										</Button>
									</Card>
								</Modal>
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
				<SegmentGroup
					key={ index }
					segment={ segment }
					campaignGroup={ campaignGroup }
					segments={ segments }
					{ ...props }
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
export default withWizardScreen( Campaigns );

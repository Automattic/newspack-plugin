/**
 * Campaign management screen.
 */

/**
 * WordPress dependencies.
 */
import { useState, Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ENTER, ESCAPE } from '@wordpress/keycodes';
import { moreVertical } from '@wordpress/icons';

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
} from '../../../../components/src';
import SegmentGroup from '../../components/segment-group';
import './style.scss';

const { useHistory } = Router;

const MODAL_TYPE_DUPLICATE = 1;
const MODAL_TYPE_RENAME = 2;
const MODAL_TYPE_NEW = 3;

const modalTitle = modalType => {
	if ( MODAL_TYPE_RENAME === modalType ) {
		return __( 'Rename Campaign', 'newspack' );
	} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
		return __( 'Duplicate Campaign', 'newspack' );
	}
	return __( 'New Campaign', 'newspack' );
};

const modalButton = modalType => {
	if ( MODAL_TYPE_RENAME === modalType ) {
		return __( 'Rename', 'newspack' );
	} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
		return __( 'Duplicate', 'newspack' );
	}
	return __( 'Add', 'newspack' );
};

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

	const [ popoverVisible, setPopoverVisible ] = useState();
	const [ modalVisible, setModalVisible ] = useState();
	const [ modalType, setModalType ] = useState();
	const [ campaignName, setCampaignName ] = useState();
	const [ inFlight, setInFlight ] = useState( false );

	const history = useHistory();

	const submitModal = modalText => {
		if ( MODAL_TYPE_NEW === modalType ) {
			createTerm( modalText );
		} else if ( MODAL_TYPE_RENAME === modalType ) {
			renameCampaignGroup( campaignGroup, modalText );
		} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
			duplicateCampaignGroup( campaignGroup, modalText );
		}
		setModalVisible( false );
	};

	const createTerm = term => {
		setPopoverVisible( false );
		setInFlight( true );
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
				setCampaignName( '' );
				refetch();
			} )
			.catch( e => {
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
		const groupedResults = [];
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
								name,
								className: 'newspack-campaigns__popup-group__select-control-group-item',
							} ) ),
							archivedGroups.length && {
								key: 'header-archived-campaigns',
								name: __( 'Archived Campaigns', 'newspack' ),
								className: 'is-header',
							},
							...archivedGroups.map( ( { term_id: id, name } ) => ( {
								key: id,
								name,
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
								className={ popoverVisible && 'popover-active' }
								onClick={ () => setPopoverVisible( ! popoverVisible ) }
								icon={ moreVertical }
								label={ __( 'Actions', 'newspack' ) }
							/>
							{ popoverVisible && (
								<Popover
									position="bottom right"
									onFocusOutside={ () => setPopoverVisible( false ) }
									onKeyDown={ event => ESCAPE === event.keyCode && setPopoverVisible( false ) }
								>
									<MenuItem
										onClick={ () => setPopoverVisible( false ) }
										className="screen-reader-text"
									>
										{ __( 'Close Popover', 'newspack' ) }
									</MenuItem>

									{ allPrompts.some( ( { status } ) => 'publish' !== status ) && (
										<MenuItem
											onClick={ () => {
												setPopoverVisible( false );
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
												setPopoverVisible( false );
												manageCampaignGroup( allPrompts, 'DELETE' );
											} }
											className="newspack-button"
										>
											{ __( 'Deactivate all prompts', 'newspack' ) }
										</MenuItem>
									) }
									<MenuItem
										onClick={ () => {
											setPopoverVisible( false );
											setModalVisible( true );
											setCampaignName( '' );
											setModalType( MODAL_TYPE_DUPLICATE );
										} }
										className="newspack-button"
									>
										{ __( 'Duplicate', 'newspack' ) }
									</MenuItem>
									<MenuItem
										onClick={ () => {
											setPopoverVisible( false );
											setCampaignName( campaignGroupData.name );
											setModalVisible( true );
											setModalType( MODAL_TYPE_RENAME );
										} }
										className="newspack-button"
									>
										{ __( 'Rename', 'newspack' ) }
									</MenuItem>
									{ groupInView && 'archive' !== groupInView.status && (
										<MenuItem
											onClick={ () => {
												setPopoverVisible( false );
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
												setPopoverVisible( false );
												archiveCampaignGroup( campaignGroup, false );
											} }
											className="newspack-button"
										>
											{ __( 'Unarchive', 'newspack' ) }
										</MenuItem>
									) }
									<MenuItem
										onClick={ () => {
											setPopoverVisible( false );
											deleteCampaignGroup( campaignGroup );
										} }
										className="newspack-button"
									>
										{ __( 'Delete', 'newspack' ) }
									</MenuItem>
								</Popover>
							) }
						</div>
					) }
				</div>
				<div className="newspack-campaigns__popup-group__add-new-button">
					<Button
						isPrimary
						isSmall
						onClick={ () => {
							setModalVisible( ! modalVisible );
							setCampaignName( '' );
							setModalType( MODAL_TYPE_NEW );
						} }
					>
						{ __( 'Add New Campaign', 'newspack' ) }
					</Button>
					{ modalVisible && (
						<Modal
							title={ modalTitle( modalType ) }
							isDismissible={ false }
							className="newspack-campaigns__popup-group__add-new-button__modal"
						>
							<TextControl
								placeholder={ __( 'Campaign Name', 'newspack' ) }
								onChange={ setCampaignName }
								label={ __( 'Campaign Name', 'newspack' ) }
								hideLabelFromVision={ true }
								value={ campaignName }
								disabled={ !! inFlight }
								onKeyDown={ event =>
									ENTER === event.keyCode && '' !== campaignName && submitModal( campaignName )
								}
							/>
							<Card buttonsCard noBorder>
								<Button
									isSecondary
									onClick={ () => {
										setModalVisible( false );
									} }
								>
									{ __( 'Cancel', 'newspack' ) }
								</Button>
								<Button
									isPrimary
									disabled={ inFlight || ! campaignName }
									onClick={ () => submitModal( campaignName ) }
								>
									{ modalButton( modalType ) }
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

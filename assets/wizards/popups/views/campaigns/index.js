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

const groupBySegment = ( segments, prompts ) => {
	const grouped = [];
	grouped.push(
		...segments.map( ( { name: label, id } ) => ( {
			label,
			id,
			prompts: prompts.filter(
				( { options: { selected_segment_id: segment } } ) => segment === id
			),
		} ) )
	);
	grouped.push( {
		label: __( 'Default (no segment)', 'newspack' ),
		id: '',
		prompts: prompts.filter( ( { options: { selected_segment_id: segment } } ) => ! segment ),
	} );
	return grouped;
};

const dataForCampaignId = ( id, campaigns ) =>
	campaigns.reduce( ( acc, group ) => ( +id > 0 && +id === +group.term_id ? group : acc ), null );

/**
 * Campaign management screen.
 */
const Campaigns = props => {
	const {
		campaignId,
		prompts = [],
		campaigns = [],
		manageCampaignGroup,
		segments,
		wizardApiFetch,
		refetch,
		duplicateCampaignGroup,
		deleteCampaignGroup,
		archiveCampaignGroup,
		renameCampaignGroup,
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
			renameCampaignGroup( campaignId, modalText );
		} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
			duplicateCampaignGroup( campaignId, modalText );
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

	const activeCampaigns = campaigns.filter( ( { status } ) => 'archive' !== status );
	const archivedCampaigns = campaigns.filter( ( { status } ) => 'archive' === status );
	const campaignData = dataForCampaignId( campaignId, campaigns );

	const valueForCampaignId = id => {
		if ( 'unassigned' === id ) {
			return {
				key: 'unassigned',
				name: __( 'Unassigned Prompts', 'newspack' ),
			};
		}

		const data = dataForCampaignId( id, campaigns );

		if ( data ) {
			return {
				key: data.term_id,
				name: data.name,
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
							...activeCampaigns.map( ( { term_id: id, name } ) => ( {
								key: id,
								name,
								className: 'newspack-campaigns__popup-group__select-control-group-item',
							} ) ),
							archivedCampaigns.length && {
								key: 'header-archived-campaigns',
								name: __( 'Archived Campaigns', 'newspack' ),
								className: 'is-header',
							},
							...archivedCampaigns.map( ( { term_id: id, name } ) => ( {
								key: id,
								name,
								className: 'newspack-campaigns__popup-group__select-control-group-item',
							} ) ),
						] }
						onChange={ ( { selectedItem: { key } } ) => history.push( `/campaigns/${ key }` ) }
						value={ valueForCampaignId( campaignId ) }
						hideLabelFromVision={ true }
					/>
					{ campaignId !== 'active' && (
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

									{ prompts.some( ( { status } ) => 'publish' !== status ) && (
										<MenuItem
											onClick={ () => {
												setPopoverVisible( false );
												manageCampaignGroup( prompts );
											} }
											className="newspack-button"
										>
											{ __( 'Activate all prompts', 'newspack' ) }
										</MenuItem>
									) }
									{ prompts.some( ( { status } ) => 'publish' === status ) && (
										<MenuItem
											onClick={ () => {
												setPopoverVisible( false );
												manageCampaignGroup( prompts, 'DELETE' );
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
											setCampaignName( campaignData.name );
											setModalVisible( true );
											setModalType( MODAL_TYPE_RENAME );
										} }
										className="newspack-button"
									>
										{ __( 'Rename', 'newspack' ) }
									</MenuItem>
									{ campaignData && 'archive' !== campaignData.status && (
										<MenuItem
											onClick={ () => {
												setPopoverVisible( false );
												archiveCampaignGroup( campaignId, true );
											} }
											className="newspack-button"
										>
											{ __( 'Archive', 'newspack' ) }
										</MenuItem>
									) }
									{ campaignData && 'archive' === campaignData.status && (
										<MenuItem
											onClick={ () => {
												setPopoverVisible( false );
												archiveCampaignGroup( campaignId, false );
											} }
											className="newspack-button"
										>
											{ __( 'Unarchive', 'newspack' ) }
										</MenuItem>
									) }
									<MenuItem
										onClick={ () => {
											setPopoverVisible( false );
											deleteCampaignGroup( campaignId );
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
			{ groupBySegment( segments, prompts ).map( ( segment, index ) => (
				<SegmentGroup
					key={ index }
					segment={ segment }
					campaignId={ campaignId }
					segments={ segments }
					{ ...props }
				/>
			) ) }
			{ prompts.length < 1 && -1 === campaignId && (
				<p>{ __( 'No Campaigns have been created yet.', 'newspack' ) }</p>
			) }
			{ prompts.length < 1 && campaignId > 0 && (
				<p>{ __( 'There are no Campaigns in this group.', 'newspack' ) }</p>
			) }
		</Fragment>
	);
};
export default withWizardScreen( Campaigns );

/**
 * Campaign management screen.
 */

/**
 * WordPress dependencies.
 */
import { useContext, useEffect, useRef, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ENTER } from '@wordpress/keycodes';
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
	Router,
	TextControl,
} from '../../../../components/src';
import CampaignManagementPopover from '../../components/campaign-management-popover';
import SegmentGroup from '../../components/segment-group';
import { dataForCampaignId } from '../../utils';
import { CampaignsContext } from '../../contexts';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

const { useHistory } = Router;

const MODAL_TYPE_DUPLICATE = 1;
const MODAL_TYPE_RENAME = 2;
const MODAL_TYPE_NEW = 3;
const DEFAULT_CAMPAIGNS_FILTER = 'active';

const modalTitle = modalType => {
	if ( MODAL_TYPE_RENAME === modalType ) {
		return __( 'Rename Campaign', 'newspack' );
	} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
		return __( 'Duplicate Campaign', 'newspack' );
	}
	return __( 'Add New Campaign', 'newspack' );
};

const modalButton = modalType => {
	if ( MODAL_TYPE_RENAME === modalType ) {
		return __( 'Rename', 'newspack' );
	} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
		return __( 'Duplicate', 'newspack' );
	}
	return __( 'Add', 'newspack' );
};

const filterByCampaign = ( prompts, campaignId ) => {
	if ( DEFAULT_CAMPAIGNS_FILTER === campaignId ) {
		return prompts.filter( ( { status } ) => 'publish' === status );
	}
	if ( 'all' === campaignId ) {
		return prompts;
	}
	if ( 'unassigned' === campaignId ) {
		return prompts.filter(
			( { campaign_groups: campaigns } ) => ! campaigns || ! campaigns.length
		);
	}
	return prompts.filter(
		( { campaign_groups: campaigns } ) =>
			campaigns && campaigns.find( term => +term.term_id === +campaignId )
	);
};

const groupBySegment = ( segments, prompts ) => {
	const grouped = [];
	grouped.push(
		...segments.map( ( { name: label, id, configuration } ) => ( {
			label,
			id,
			configuration,
			prompts: prompts.filter( ( { options: { selected_segment_id: _segments } } ) => {
				return _segments ? -1 < _segments.split( ',' ).indexOf( id ) : false;
			} ),
		} ) )
	);
	grouped.push( {
		label: __( 'Everyone', 'newspack' ),
		id: '',
		prompts: prompts.filter( ( { options: { selected_segment_id: segment } } ) => ! segment ),
		configuration: {},
	} );
	return grouped;
};

/**
 * Campaign management screen.
 */
const Campaigns = props => {
	const {
		campaignId = DEFAULT_CAMPAIGNS_FILTER,
		campaigns = [],
		manageCampaignGroup,
		segments,
		createCampaignGroup,
		duplicateCampaignGroup,
		deleteCampaignGroup,
		archiveCampaignGroup,
		renameCampaignGroup,
	} = props;

	const modalTextRef = useRef( null );

	const [ popoverVisible, setPopoverVisible ] = useState();
	const [ modalVisible, setModalVisible ] = useState();
	const [ modalType, setModalType ] = useState();
	const [ campaignName, setCampaignName ] = useState();

	const allPrompts = useContext( CampaignsContext );
	const prompts = filterByCampaign( allPrompts, campaignId );
	const hasUnassigned = filterByCampaign( allPrompts, 'unassigned' ).length;

	useEffect( () => {
		if ( modalVisible ) {
			modalTextRef.current.querySelector( 'input' ).focus();
		}
	}, [ modalVisible ] );

	const history = useHistory();

	const submitModal = modalText => {
		if ( MODAL_TYPE_NEW === modalType ) {
			createCampaignGroup( modalText );
		} else if ( MODAL_TYPE_RENAME === modalType ) {
			renameCampaignGroup( campaignId, modalText );
		} else if ( MODAL_TYPE_DUPLICATE === modalType ) {
			duplicateCampaignGroup( campaignId, modalText );
		}
		setModalVisible( false );
	};

	const activeCampaigns = campaigns.filter( ( { status } ) => 'archive' !== status );
	const archivedCampaigns = campaigns.filter( ( { status } ) => 'archive' === status );
	const campaignData = dataForCampaignId( campaignId, campaigns );

	const campaignsSelectOptions = [
		{
			key: DEFAULT_CAMPAIGNS_FILTER,
			name: __( 'Active Prompts', 'newspack' ),
		},
		{
			key: 'all',
			name: __( 'All Prompts', 'newspack' ),
		},
		...( hasUnassigned
			? [
					{
						key: 'unassigned',
						name: __( 'Unassigned Prompts', 'newspack' ),
					},
			  ]
			: [] ),
		...( activeCampaigns.length
			? [
					{
						key: 'header-campaigns',
						name: __( 'Campaigns', 'newspack' ),
						className: 'is-header',
					},
			  ]
			: [] ),
		...activeCampaigns.map( ( { term_id: id, name } ) => ( {
			key: String( id ),
			name,
			className: 'newspack-campaigns__campaign-group__select-control-group-item',
		} ) ),
		...( archivedCampaigns.length
			? [
					{
						key: 'header-archived-campaigns',
						name: __( 'Archived Campaigns', 'newspack' ),
						className: 'is-header',
					},
			  ]
			: [] ),
		...archivedCampaigns.map( ( { term_id: id, name } ) => ( {
			key: String( id ),
			name: name + ' ' + __( '(archived)', 'newspack' ),
			className: 'newspack-campaigns__campaign-group__select-control-group-item',
		} ) ),
	];

	return (
		<Fragment>
			<Card headerActions noBorder>
				<div className="newspack-campaigns__campaign-group__filter-group-actions">
					<CustomSelectControl
						label={ __( 'Campaigns', 'newspack' ) }
						options={ campaignsSelectOptions.map( option => ( {
							...option,
							className: classnames( option.className, {
								'is-selected': option.key === campaignId,
							} ),
						} ) ) }
						onChange={ ( { selectedItem: { key } } ) =>
							DEFAULT_CAMPAIGNS_FILTER === key
								? history.push( '/campaigns' )
								: history.push( `/campaigns/${ key }` )
						}
						value={ find( campaignsSelectOptions, [
							'key',
							campaignId || DEFAULT_CAMPAIGNS_FILTER,
						] ) }
						hideLabelFromVision={ true }
					/>
					{ campaignData && (
						<div className="newspack-campaigns__campaign-group__filter-group-actions__button">
							<Button
								isQuaternary
								isSmall
								className={ popoverVisible && 'popover-active' }
								onClick={ () => setPopoverVisible( ! popoverVisible ) }
								icon={ moreVertical }
								label={ __( 'Actions', 'newspack' ) }
								tooltipPosition="bottom center"
							/>
							{ popoverVisible && (
								<CampaignManagementPopover
									dismiss={ () => setPopoverVisible( false ) }
									isArchive={ campaignData && 'archive' === campaignData.status }
									onActivate={ () => manageCampaignGroup( prompts ) }
									onArchive={ () => archiveCampaignGroup( campaignId, true ) }
									onDeactivate={ () => manageCampaignGroup( prompts, 'DELETE' ) }
									onDelete={ () => deleteCampaignGroup( campaignId ) }
									onDuplicate={ () => {
										setModalVisible( true );
										setCampaignName( '' );
										setModalType( MODAL_TYPE_DUPLICATE );
									} }
									onRename={ () => {
										setCampaignName( campaignData.name );
										setModalVisible( true );
										setModalType( MODAL_TYPE_RENAME );
									} }
									onUnarchive={ () => archiveCampaignGroup( campaignId, false ) }
									hasPrompts={ prompts.length > 0 }
									hasPublished={ prompts.some( ( { status } ) => 'publish' === status ) }
								/>
							) }
						</div>
					) }
				</div>
				<div className="newspack-campaigns__campaign-group__add-new-button">
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
							onRequestClose={ () => {
								setModalVisible( false );
							} }
						>
							<div ref={ modalTextRef }>
								<TextControl
									placeholder={ __( 'Campaign Name', 'newspack' ) }
									onChange={ setCampaignName }
									label={ __( 'Campaign Name', 'newspack' ) }
									hideLabelFromVision={ true }
									value={ campaignName }
									onKeyDown={ event => {
										if ( ENTER === event.keyCode && '' !== campaignName ) {
											event.preventDefault();
											submitModal( campaignName );
										}
									} }
								/>
							</div>
							<Card buttonsCard noBorder className="justify-end">
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
									disabled={ ! campaignName }
									onClick={ () => submitModal( campaignName ) }
								>
									{ modalButton( modalType ) }
								</Button>
							</Card>
						</Modal>
					) }
				</div>
			</Card>
			{ groupBySegment( segments, prompts ).map( ( segment, index ) => (
				<SegmentGroup
					key={ index }
					segment={ segment }
					campaignId={ campaignId }
					campaignData={ campaignData }
					{ ...props }
				/>
			) ) }
		</Fragment>
	);
};
export default withWizardScreen( Campaigns );

/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { useEffect, useState, Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ENTER, ESCAPE } from '@wordpress/keycodes';
import { Icon, moreVertical } from '@wordpress/icons';

/**
 * External dependencies.
 */
import { find } from 'lodash';
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ActionCard,
	Button,
	Popover,
	Router,
	SelectControl,
	TextControl,
	ToggleControl,
} from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import CampaignGroup from '../../components/campaign-group';
import { getCardClassName, isOverlay } from '../../utils';
import './style.scss';

const { useParams } = Router;

/**
 * Popup group screen
 */
const PopupGroup = props => {
	const {
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
		refetch,
		segments = [],
		wizardApiFetch,
	} = props;
	const [ campaignGroup, setCampaignGroup ] = useState( -1 );
	const [ campaignGroups, setCampaignGroups ] = useState( -1 );
	const [ segmentId, setSegmentId ] = useState();
	const [ showUnpublished, setShowUnpublished ] = useState( false );
	const [ previewPopoverIsVisible, setPreviewPopoverIsVisible ] = useState();
	const [ addNewGroupPopoverIsVisible, setAddNewGroupPopoverIsVisible ] = useState();
	const [ newGroupName, setNewGroupName ] = useState( '' );
	const [ error, setError ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );

	const { group } = useParams();

	const createTerm = term => {
		setAddNewGroupPopoverIsVisible( false );
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

	const deleteTerm = id => {
		setInFlight( true );
		setError( false );
		wizardApiFetch( {
			path: `/wp/v2/newspack_popups_taxonomy/${ id }?force=true`,
			method: 'DELETE',
			quiet: true,
		} )
			.then( () => {
				setInFlight( false );
				refetch();
			} )
			.catch( e => {
				const message =
					e.message || __( 'An error occurred when deleting this group.', 'newspack' );
				setError( message );
				setInFlight( false );
			} );
	};

	const campaignsByGroup = groups.map( ( { name: groupName, term_id: groupId } ) => {
		const allCampaigns = items.filter(
			( { campaign_groups: campaignAssignedGroups } ) =>
				campaignAssignedGroups &&
				campaignAssignedGroups.some( ( { term_id: termId } ) => termId === groupId )
		);

		const segmentsWithAll = [ ...segments, { id: '', name: 'All users' } ];

		return {
			allCampaigns,
			label: groupName,
			id: groupId,
			isActive:
				allCampaigns.length > 0 && allCampaigns.every( ( { status } ) => 'publish' === status ),
			activeCount: allCampaigns.reduce(
				( acc, { status } ) => ( 'publish' === status ? acc + 1 : acc ),
				0
			),
			segments: segmentsWithAll
				.map( ( { name: segmentName, id: segmentId } ) => ( {
					label: segmentName,
					id: segmentId,
					allCampaigns,
					campaigns: allCampaigns.filter( campaign => {
						const {
							options: { selected_segment_id: assignedSegment },
						} = campaign;
						return segmentId === assignedSegment;
					} ),
				} ) )
				.filter( ( { id, campaigns } ) => id.length > 0 || campaigns.length ), // Exclude the All User group if empty
		};
	} );

	// Move active group to the top.
	const campaignsByGroupSorted = [
		...campaignsByGroup.filter( group => !! group.isActive ),
		...campaignsByGroup.filter( group => ! group.isActive ),
	];

	const unassigned = items.filter(
		( { campaign_groups: campaignAssignedGroups } ) =>
			! campaignAssignedGroups || campaignAssignedGroups.length === 0
	);

	console.log( campaignsByGroup );

	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__add-new-button">
				<Button
					isPrimary
					isSmall
					onClick={ () => setAddNewGroupPopoverIsVisible( ! addNewGroupPopoverIsVisible ) }
				>
					{ __( 'Add New Campaign', 'newspack' ) }
				</Button>
				{ addNewGroupPopoverIsVisible && (
					<Popover
						position="bottom left"
						onFocusOutside={ () => setAddNewGroupPopoverIsVisible( false ) }
						onKeyDown={ event =>
							ESCAPE === event.keyCode && setAddNewGroupPopoverIsVisible( false )
						}
					>
						<MenuItem
							onClick={ () => setAddNewGroupPopoverIsVisible( false ) }
							className="screen-reader-text"
						>
							{ __( 'Close Popover', 'newspack' ) }
						</MenuItem>
						<TextControl
							placeholder={ __( 'Campaign Group Name', 'newspack' ) }
							onChange={ setNewGroupName }
							label={ __( 'Campaign Group Name', 'newspack' ) }
							hideLabelFromVision={ true }
							value={ newGroupName }
							disabled={ !! inFlight }
							onKeyDown={ event =>
								ENTER === event.keyCode && '' !== newGroupName && createTerm( newGroupName )
							}
						/>
						<Button
							isLink
							disabled={ inFlight || ! newGroupName }
							onClick={ () => {
								createTerm( newGroupName );
								setAddNewGroupPopoverIsVisible( false );
							} }
						>
							{ __( 'Add', 'newspack' ) }
						</Button>
					</Popover>
				) }
			</div>
			{ campaignsByGroupSorted.map( group => (
				<CampaignGroup { ...props } group={ group } deleteTerm={ deleteTerm } />
			) ) }
			{ unassigned.length > 0 && (
				<Fragment>
					<h2>{ __( 'Unassigned Prompts', 'newspack' ) }</h2>
					{ unassigned.map( campaign => (
						<PopupActionCard
							key={ campaign.id }
							className={ getCardClassName( campaign ) }
							deletePopup={ deletePopup }
							key={ campaign.id }
							popup={ campaign }
							previewPopup={ previewPopup }
							segments={ segments }
							setTermsForPopup={ setTermsForPopup }
							setSitewideDefaultPopup={ setSitewideDefaultPopup }
							updatePopup={ updatePopup }
							publishPopup={ publishPopup }
							unpublishPopup={ unpublishPopup }
						/>
					) ) }
				</Fragment>
			) }

			{ items.length < 1 === campaignGroup && (
				<p>{ __( 'No Campaigns have been created yet.', 'newspack' ) }</p>
			) }
		</Fragment>
	);
};
export default withWizardScreen( PopupGroup );

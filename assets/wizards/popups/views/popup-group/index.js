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
import { Icon } from '@wordpress/icons';

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
	Modal,
	Popover,
	Router,
	SelectControl,
	TextControl,
	ToggleControl,
} from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';
import SegmentationPreview from '../../components/segmentation-preview';
import { isOverlay } from '../../utils';
import './style.scss';

const { useParams } = Router;

const descriptionForPopup = (
	{ categories, sitewide_default: sitewideDefault, options },
	segments
) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const descriptionMessages = [];
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

const getCardClassName = ( { options, sitewide_default: sitewideDefault, status } ) => {
	if ( 'draft' === status ) {
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
				{ items.length > 0 ? (
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
				) : null }
			</h3>
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
} ) => {
	const [ campaignGroup, setCampaignGroup ] = useState( 'active' );
	const [ segmentId, setSegmentId ] = useState();
	const [ showUnpublished, setShowUnpublished ] = useState( false );
	const [ previewPopoverIsVisible, setPreviewPopoverIsVisible ] = useState();
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState();
	const [ newGroupName, setNewGroupName ] = useState( '' );
	const [ error, setError ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );

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
	const groupBySegment = ( segments, itemsToGroup ) =>
		segments.map( ( { name: label, id } ) => ( {
			label,
			id,
			items: itemsToGroup.filter(
				( { options: { selected_segment_id: segment } } ) => segment === id
			),
		} ) );

	const allPrompts = filterByGroup( items );
	const campaignsToDisplay = groupBySegment( segments, allPrompts );
	let pageTitle;
	console.log( groups, campaignGroup );
	if ( 'active' === campaignGroup ) {
		pageTitle = __( 'All currently active prompts', 'newspack' );
	} else if ( 'unassigned' === campaignGroup ) {
		pageTitle = __( 'All unassigned prompts', 'newspack' );
	} else {
		const groupName = groups.reduce(
			( acc, { name, term_id: id } ) => ( +id === +campaignGroup ? name : acc ),
			''
		);
		pageTitle = __( 'Campaign: ', 'newspack' ) + groupName;
	}
	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__filter-group-wrapper">
				<div className="newspack-campaigns__popup-group__filter-group-actions">
					<SelectControl
						options={ [
							{ value: 'active', label: __( 'Active Prompts', 'newspack' ) },
							...groups.map( ( { term_id: id, name } ) => ( {
								value: id,
								label: name,
							} ) ),
							{ value: 'unassigned', label: __( 'Unassigned Prompts', 'newspack' ) },
						] }
						value={ campaignGroup }
						onChange={ value => setCampaignGroup( value ) }
						label={ __( 'Groups', 'newspack' ) }
						hideLabelFromVision={ true }
					/>
					{ parseInt( campaignGroup ) > 0 && (
						<Fragment>
							{ allPrompts.some( ( { status } ) => 'publish' !== status ) && (
								<Button isSecondary isSmall onClick={ () => manageCampaignGroup( allPrompts ) }>
									{ __( 'Activate', 'newspack' ) }
								</Button>
							) }
							{ allPrompts.some( ( { status } ) => 'publish' === status ) && (
								<Button
									isSecondary
									isSmall
									onClick={ () => manageCampaignGroup( allPrompts, 'DELETE' ) }
								>
									{ __( 'Deactivate', 'newspack' ) }
								</Button>
							) }
						</Fragment>
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
			<h2>{ pageTitle }</h2>
			{ campaignsToDisplay.map( segment => (
				<Segment
					key={ segment.id }
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

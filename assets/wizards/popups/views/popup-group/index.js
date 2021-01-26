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
		<Fragment>
			<h2 className="newspack-campaigns__popup-group__subhead">
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
			</h2>
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
									isTertiary
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&group=${ campaignGroup }&segment=${ id }` }
								>
									{ __( 'Inline', 'newspack' ) }
								</Button>
								<Button
									isTertiary
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-center&group=${ campaignGroup }&segment=${ id }` }
								>
									{ __( 'Center Overlay', 'newspack' ) }
								</Button>
								<Button
									isTertiary
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-top&group=${ campaignGroup }&segment=${ id }` }
								>
									{ __( 'Top Overlay', 'newspack' ) }
								</Button>
								<Button
									isTertiary
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=overlay-bottom&group=${ campaignGroup }&segment=${ id }` }
								>
									{ __( 'Bottom Overlay', 'newspack' ) }
								</Button>
								<Button
									isTertiary
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=above-header&group=${ campaignGroup }&segment=${ id }` }
								>
									{ __( 'Above Header', 'newspack' ) }
								</Button>
								<Button
									isTertiary
									href={ `/wp-admin/post-new.php?post_type=newspack_popups_cpt&placement=manual&group=${ campaignGroup }&segment=${ id }` }
								>
									{ __( 'Manual Placement', 'newspack' ) }
								</Button>
							</Card>
						</Modal>
					) }
				</div>
			) }
		</Fragment>
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
	return (
		<Fragment>
			<div className="newspack-campaigns__popup-group__filter-group-wrapper">
				<div className="newspack-campaigns__popup-group__filter-group-actions">
					<SelectControl
						options={ [
							{ value: 'active', label: __( 'Active', 'newspack' ) },
							...groups.map( ( { term_id: id, name } ) => ( {
								value: id,
								label: name,
							} ) ),
							{ value: 'unassigned', label: __( 'Unassigned', 'newspack' ) },
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
									onClick={ () => { setAddNewPopoverIsVisible( false ); } }
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
